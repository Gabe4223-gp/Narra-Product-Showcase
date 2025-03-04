// src/Pay.js
import React, { useState, useEffect } from "react";
import { useUserProfile } from "../UserProfileContext";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Pay = ({ bill, onClose }) => {
  const { userProfile } = useUserProfile();

  // Available Payment Methods
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [tenantBankInfo, setTenantBankInfo] = useState(null);
  const [tenantBankName, setTenantBankName] = useState(null);
  const [tenantGcashNumber, setTenantGcashNumber] = useState(null);
  const [landlordBankInfo, setLandlordBankInfo] = useState(null);
  const [landlordGcashNumber, setLandlordGcashNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missingLandlordGcash, setMissingLandlordGcash] = useState(false);
  const [inputLandlordGcash, setInputLandlordGcash] = useState("");
  const [processing, setProcessing] = useState(false); // Controls button disable state
  const [error, setError] = useState(''); // Stores error messages
  const [amountPaid, setAmountPaid] = useState(bill.totalAmount.toFixed(2)); // Stores payment amount


  // Fetch tenant & landlord payment details
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        if (!userProfile || !bill) return;

        // Fetch Tenant Payment Methods
        const userPaymentRes = await axios.get(`/api/payments/user-payment-methods/${userProfile.id}`);
        const { storedPaymentMethods, gcashMobileNumber, bankName } = userPaymentRes.data;

        setTenantBankInfo(storedPaymentMethods || null);
        setTenantBankName(bankName || null);
        setTenantGcashNumber(gcashMobileNumber || null);

        // Fetch Landlord Payment Details
        const landlordRes = await axios.get(`/api/payments/get-landlord-details/${bill.landlordId}`);
        const { landlordBankId, landlordGcashMobileNumber } = landlordRes.data;

        setLandlordBankInfo(landlordBankId || null);
        setLandlordGcashNumber(landlordGcashMobileNumber || null);

        // Determine available payment methods
        let methods = [];
        if (storedPaymentMethods) methods.push("Bank & Card");
        if (gcashMobileNumber) methods.push("GCash");

        setAvailableMethods(methods);
        setPaymentMethod(methods.length === 1 ? methods[0] : null); // Auto-select if only one available

        // If GCash is selected but landlord has no GCash number, ask tenant to input it
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

  // Define form state
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = async () => {
    if (paymentMethod !== "GCash") return; // Only proceed for GCash payments

    setProcessing(true);
    setError("");

    try {
        console.log("Initiating GCash Payment with Amount:", amountPaid);

        const response = await axios.post("/api/payments/gcash", {
            amount: Math.round(parseFloat(amountPaid) * 100), // Convert PHP to centavos
            billId: bill.id,
            tenantEmail: userProfile.email,
        });

        console.log("GCash Payment Response:", response.data);

        if (response.data.success && response.data.checkoutUrl) {
            const sourceId = response.data.sourceId; // Store sourceId for polling

            console.log("Redirecting user to:", response.data.checkoutUrl);
            window.location.href = response.data.checkoutUrl; // Redirect user to PayMongo

            // Start polling every 10 seconds to check payment status
            const interval = setInterval(async () => {
                try {
                    console.log("Checking payment status for Source ID:", sourceId);

                    const statusResponse = await axios.post("/api/payments/gcash-status", {
                        sourceId,
                    });

                    console.log("Payment Status Response:", statusResponse.data);

                    const paymentStatus = statusResponse.data.status;

                    if (paymentStatus === "chargeable") {
                        clearInterval(interval); // Stop polling
                        alert("Payment successful!");
                        await axios.post("/api/payments/update-status", { billId: bill.id, status: "Paid" });
                        onClose();
                    } else if (paymentStatus === "failed") {
                        clearInterval(interval); // Stop polling
                        alert("Payment failed. Please try again.");
                    }
                } catch (error) {
                    console.error("Error checking payment status:", error);
                }
            }, 10000); // Poll every 10 seconds
        } else {
            setError("Failed to initiate GCash payment.");
        }
    } catch (err) {
        console.error("Error processing GCash payment:", err);
        setError(err.response?.data?.message || "Error processing payment.");
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
            <div className="pay-methods">
              {availableMethods.map((method) => (
                <label key={method}>
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    disabled={availableMethods.length === 1} // Prevent changing payment method
                  />
                  {method}
                </label>
              ))}
            </div>

            {/* Bank & Card Info */}
            {paymentMethod === "Bank & Card" && tenantBankInfo && (
              <div className="pay-bank-section">
                <h4>Your Bank & Card Details</h4>
                <p>
                <p><strong>Bank Name:</strong> {tenantBankName}</p>
                </p>
                <p>
                  <strong>Account Number:</strong> ****{tenantBankInfo.accountNumber.slice(-4)}
                </p>
                <p>
                  <strong>Routing Number:</strong> {tenantBankInfo.routingNumber}
                </p>
                <p>
                <label>Card Number:</label>
                <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} />
                </p>
                <p>
                <label>Expiry Date (MM/YYYY):</label>
                <input type="text" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
                </p>
                <p>
                <label>CVV:</label>
                <input type="text" name="cvv" value={formData.cvv} onChange={handleChange} />
                </p>
              </div>
            )}

            {/* GCash Payment */}
            {paymentMethod === "GCash" && tenantGcashNumber && (
              <div className="pay-gcash-section">
                <h4>Your GCash Details</h4>
                <p>
                  <strong>GCash Mobile Number:</strong> {tenantGcashNumber}
                </p>

                {/* If landlord's GCash is missing, let tenant input it */}
                {missingLandlordGcash && (
                  <div className="pay-landlord-gcash-input">
                    <label>
                      <p>Enter Landlord’s GCash Mobile Number to verify with your landlord:</p>
                      <input
                        type="text"
                        placeholder="+63 XXX XXX XXXX"
                        value={inputLandlordGcash}
                        onChange={(e) => setInputLandlordGcash(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <button className="pay-now-btn" onClick={handleSend}>Pay Now</button>
              </div>
            )}
          </>
        )}

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
