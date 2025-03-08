// src/Pay.js
import React, { useState, useEffect } from "react";
import { useUserProfile } from "../UserProfileContext";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

// We'll still load Stripe but won't use card payments right now
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Pay = ({ bill, onClose }) => {
  const { userProfile } = useUserProfile();

  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);

  // Tenant Payment Info
  const [tenantBankInfo, setTenantBankInfo] = useState(null);
  const [tenantBankName, setTenantBankName] = useState(null);
  const [tenantGcashNumber, setTenantGcashNumber] = useState(null);

  // For GCash
  const [landlordGcashNumber, setLandlordGcashNumber] = useState(null);
  const [missingLandlordGcash, setMissingLandlordGcash] = useState(false);
  const [inputLandlordGcash, setInputLandlordGcash] = useState("");

  // Landlord's Bank Info from the Files table (for Wise)
  const [landlordBankDetails, setLandlordBankDetails] = useState(null);

  // UI / Error states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Payment amount
  const [amountPaid, setAmountPaid] = useState(bill.totalAmount.toFixed(2));

  // We'll disable card for now
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // -----------------------------
  // 1) Fetch Tenant & Basic Landlord Data (for GCash)
  // -----------------------------
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        if (!userProfile || !bill) return;

        // Tenant Payment Methods
        const userPaymentRes = await axios.get(
          `/api/payments/user-payment-methods/${userProfile.id}`
        );
        const {
          storedPaymentMethods,
          gcashMobileNumber,
          bankName
        } = userPaymentRes.data || {};

        setTenantBankInfo(storedPaymentMethods || null);
        setTenantBankName(bankName || null);
        setTenantGcashNumber(gcashMobileNumber || null);

        // Landlord GCash from get-landlord-details
        const landlordRes = await axios.get(
          `/api/payments/get-landlord-details/${bill.landlordId}`
        );
        const {
          landlordBankId,
          landlordGcashMobileNumber
        } = landlordRes.data || {};

        setLandlordGcashNumber(landlordGcashMobileNumber || null);

        // Determine available methods for user
        let methods = [];
        // "Bank & Card" => we do Wise (and potentially card in future)
        if (storedPaymentMethods) methods.push("Bank & Card");
        // If user has GCash, push GCash
        if (gcashMobileNumber) methods.push("GCash");

        setAvailableMethods(methods);
        if (methods.length === 1) {
          setPaymentMethod(methods[0]);
        }

        // If GCash is possible but landlord no GCash => missingLandlordGcash
        if (methods.includes("GCash") && !landlordGcashMobileNumber) {
          setMissingLandlordGcash(true);
        }
      } catch (err) {
        console.error("Error fetching payment data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [userProfile, bill]);

  // -----------------------------
  // 2) If PaymentMethod = "Bank & Card", fetch landlord bank from Files
  // -----------------------------
  useEffect(() => {
    const fetchLandlordBank = async () => {
      try {
        const response = await axios.get(`/api/payments/get-landlord-bank/${bill.id}`);
        if (response.data && response.data.success) {
          setLandlordBankDetails(response.data.bankDetails);
        } else {
          setLandlordBankDetails(null);
        }
      } catch (err) {
        console.error("Error fetching landlord bank from Files:", err);
        setLandlordBankDetails(null);
      }
    };

    if (paymentMethod === "Bank & Card") {
      fetchLandlordBank();
    }
  }, [paymentMethod, bill.id]);

  // Helper for card fields if we re-enable them later
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // -----------------------------
  // 3) Main "Send" button
  // -----------------------------
  const handleSend = async () => {
    setProcessing(true);
    setError("");

    try {
      // GCash Flow
      if (paymentMethod === "GCash") {
        console.log("Initiating GCash Payment with Amount:", amountPaid);
        const response = await axios.post("/api/payments/gcash", {
          amount: Math.round(parseFloat(amountPaid) * 100),
          billId: bill.id,
          tenantEmail: userProfile.email
        });

        if (response.data.success && response.data.checkoutUrl) {
          const sourceId = response.data.sourceId;
          window.location.href = response.data.checkoutUrl;

          // Poll
          const interval = setInterval(async () => {
            try {
              const statusResp = await axios.post("/api/payments/gcash-status", {
                sourceId
              });
              const paymentStatus = statusResp.data.status;
              if (paymentStatus === "chargeable") {
                clearInterval(interval);
                alert("Payment successful!");
                await axios.post("/api/payments/update-status", {
                  billId: bill.id,
                  status: "Paid"
                });
                onClose();
              } else if (paymentStatus === "failed") {
                clearInterval(interval);
                alert("Payment failed. Please try again.");
              }
            } catch (error) {
              console.error("Error checking payment status:", error);
            }
          }, 10000);
        } else {
          setError("Failed to initiate GCash payment.");
        }
      }

      // Wise Flow => "Bank & Card"
      else if (paymentMethod === "Bank & Card") {
        if (!tenantBankInfo) {
          setError("You have no stored bank info. Please update Payment Settings.");
          return;
        }
        if (!landlordBankDetails) {
          setError("Landlord has not set up their Bank Info. Please check with them.");
          return;
        }

        // 1) Create Wise recipient
        const recipientRes = await axios.post("/api/payments/wise-create-recipient", {
          bankName: landlordBankDetails.bankName,
          accountNumber: landlordBankDetails.accountNumber,
          accountName: landlordBankDetails.accountName || "Landlord Name",
          routingNumber: landlordBankDetails.routingNumber || "",
          currency: "PHP",
        });
        if (!recipientRes.data.success) {
          setError("Failed to create recipient on Wise: " + recipientRes.data.message);
          return;
        }

        // 2) Perform the Transfer
        const wiseRes = await axios.post("/api/payments/wise-transfer", {
          amount: bill.totalAmount,
          currency: "PHP",
          recipientId: recipientRes.data.recipientId,
        });

        if (wiseRes.data.success) {
          alert("Wise bank transfer processed successfully!");
          await axios.post("/api/payments/update-status", {
            billId: bill.id,
            status: "Paid"
          });
          onClose();
        } else {
          setError("Wise bank transfer failed: " + (wiseRes.data.message || ""));
        }
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      setError(err.message || "Error processing payment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="pay-overlay">
      <div className="pay-modal">
        <h3>Pay</h3>

        {loading ? (
          <p>Loading payment options...</p>
        ) : availableMethods.length === 0 ? (
          <p>No payment methods set up. Please add one in Payment Settings.</p>
        ) : (
          <>
            {/* Payment Method Radio */}
            <div className="pay-methods">
              {availableMethods.map((method) => (
                <label key={method}>
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    disabled={availableMethods.length === 1}
                  />
                  {method}
                </label>
              ))}
            </div>

            {/* GCash */}
            {paymentMethod === "GCash" && tenantGcashNumber && (
              <div className="pay-gcash-section">
                <h4>Your GCash:</h4>
                <p>
                  <strong>Mobile Number:</strong> {tenantGcashNumber}
                </p>

                {missingLandlordGcash && (
                  <div className="pay-landlord-gcash-input">
                    <label>
                      <p>Enter Landlord’s GCash Number:</p>
                      <input
                        type="text"
                        placeholder="+63 XXX XXX XXXX"
                        value={inputLandlordGcash}
                        onChange={(e) => setInputLandlordGcash(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <button className="pay-now-btn" onClick={handleSend}>
                  {processing ? "Processing..." : "Pay Now"}
                </button>
              </div>
            )}

            {/* Bank & Card => Actually only Wise for now */}
            {paymentMethod === "Bank & Card" && (
              <div className="pay-wise-section">
                <h4>Wise Bank Transfer</h4>
                <p>
                  Once you confirm, we will initiate a Wise transfer to
                  the landlord’s bank account on file (from the Bill).
                </p>
                <button
                  className="pay-submit"
                  onClick={handleSend}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Confirm & Pay via Wise"}
                </button>
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button className="pay-exit" onClick={onClose}>
          Exit
        </button>
      </div>
    </div>
  );
};

const WrappedPay = (props) => (
  <Elements stripe={stripePromise}>
    <Pay {...props} />
  </Elements>
);

export default WrappedPay;
