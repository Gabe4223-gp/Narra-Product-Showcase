// src/Pay.js
import React, { useState, useEffect } from "react";
import { useUserProfile } from "../UserProfileContext";
import axios from "axios";

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

   // Landlord bank details (for Wise) are fetched from Files.landlordBankDetails.
  // We also allow manual editing if some fields are missing.
  const [landlordBankDetails, setLandlordBankDetails] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: ""
  });
  const [originalBankDetails, setOriginalBankDetails] = useState(null);
  const [editingBankDetails, setEditingBankDetails] = useState(null);
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);

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

        // Fetch tenant payment methods
        const userPaymentRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/payments/user-payment-methods/${userProfile.id}`
        );
        const { storedPaymentMethods, gcashMobileNumber, bankName } = userPaymentRes.data || {};

        setTenantBankInfo(storedPaymentMethods || null);
        setTenantBankName(bankName || null);
        setTenantGcashNumber(gcashMobileNumber || null);

        // Fetch landlord basic details (for GCash)
        const landlordRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/get-landlord-details/${bill.landlordId}`);
        const { landlordBankId, landlordGcashMobileNumber } = landlordRes.data || {};
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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/get-landlord-bank/${bill.id}`);
        if (response.data && response.data.success) {
          // Store fetched details in all three states
          setLandlordBankDetails(response.data.bankDetails);
          setOriginalBankDetails(response.data.bankDetails);
          setEditingBankDetails(response.data.bankDetails);
        } else {
          const emptyDetails = { bankName: "", accountName: "", accountNumber: "", routingNumber: "", swiftCode: "" };
          setLandlordBankDetails(emptyDetails);
          setOriginalBankDetails(emptyDetails);
          setEditingBankDetails(emptyDetails);
        }
      } catch (err) {
        console.error("Error fetching landlord bank from Files:", err);
        const emptyDetails = { bankName: "", accountName: "", accountNumber: "", routingNumber: "", swiftCode: "" };
        setLandlordBankDetails(emptyDetails);
        setOriginalBankDetails(emptyDetails);
        setEditingBankDetails(emptyDetails);
      }
    };
  
    if (paymentMethod === "Bank & Card") {
      fetchLandlordBank();
    }
  }, [paymentMethod, bill.id]);

  // Handler for toggling manual edit of bank details
  const toggleEditBankDetails = () => {
    setIsEditingBankDetails(!isEditingBankDetails);
  };

  const startEditing = () => {
    setIsEditingBankDetails(true);
  };
  
  const handleSaveBankDetails = () => {
    // Update the displayed bank details with the edited values
    setLandlordBankDetails(editingBankDetails);
    setOriginalBankDetails(editingBankDetails);
    setIsEditingBankDetails(false);
  };
  
  const handleCancelEdit = () => {
    // Revert editing copy to the original values
    setEditingBankDetails(originalBankDetails);
    setIsEditingBankDetails(false);
  };  

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
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/gcash`, {
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
              const statusResp = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/gcash-status`, {
                sourceId
              });
              const paymentStatus = statusResp.data.status;
              if (paymentStatus === "chargeable") {
                clearInterval(interval);
                alert("Payment successful!");
                await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/update-status`, {
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
        // For Wise, we require tenantBankInfo to exist (for the tenant's own info)
        if (!tenantBankInfo) {
          setError("You have no stored bank info. Please update Payment Settings.");
          return;
        }
        // Ensure that landlordBankDetails is complete – if any field is missing, prompt for manual input.
        const requiredFields = ["bankName", "accountName", "accountNumber", "routingNumber", "swiftCode"];
        const missingFields = requiredFields.filter(field => !landlordBankDetails[field]);
        if (missingFields.length > 0) {
          setError(`Landlord bank details missing: ${missingFields.join(", ")}. Please enter them manually.`);
          return;
        }

        // Prepare recipient payload based on available fields:
        let recipientPayload = {};
        if (landlordBankDetails.swiftCode) {
          // Use swift code if available
          recipientPayload = {
            bankName: landlordBankDetails.bankName,
            accountNumber: landlordBankDetails.accountNumber,
            accountName: landlordBankDetails.accountName || "Landlord Name",
            routingNumber: landlordBankDetails.routingNumber || "",
            swiftCode: landlordBankDetails.swiftCode,
            currency: "PHP",
            country: "PH",
          };
        } else {
          // Otherwise, use routingNumber (sort code)
          recipientPayload = {
            bankName: landlordBankDetails.bankName,
            accountNumber: landlordBankDetails.accountNumber,
            accountName: landlordBankDetails.accountName || "Landlord Name",
            routingNumber: landlordBankDetails.routingNumber || "",
            currency: "PHP",
            country: "PH",
          };
        }

        console.log("Creating Wise recipient with payload:", recipientPayload);

        // 1) Create Wise recipient
        const recipientRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/wise-create-recipient`, recipientPayload);
        if (!recipientRes.data.success) {
          setError("Failed to create recipient on Wise: " + recipientRes.data.message);
          return;
        }

        // 2) Perform the Transfer
        const wiseRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/wise-transfer`, {
          amount: bill.totalAmount,
          currency: "PHP",
          recipientId: recipientRes.data.recipientId,
        });

        if (wiseRes.data.success) {
          alert("Wise bank transfer processed successfully!");
          await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/update-status`, { billId: bill.id, status: "Paid" });
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
    <div className="overlay">
      <div className="modal">
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
                  <strong>Landlord Bank Details:</strong>
                </p>
                {isEditingBankDetails ? (
                  <div className="bank-details-edit">
                    <div className="bank-detail-field">
                      <label>Bank Name:</label>
                      <input
                        type="text"
                        value={editingBankDetails.bankName}
                        placeholder="Full bank Name"
                        onChange={(e) =>
                          setEditingBankDetails({ ...editingBankDetails, bankName: e.target.value })
                        }
                      />
                    </div>
                    <div className="bank-detail-field">
                      <label>Account Name:</label>
                      <input
                        type="text"
                        value={editingBankDetails.accountName}
                        placeholder={"Landlord's Full Name"}
                        onChange={(e) =>
                          setEditingBankDetails({ ...editingBankDetails, accountName: e.target.value })
                        }
                      />
                    </div>
                    <div className="bank-detail-field">
                      <label>Account Number:</label>
                      <input
                        type="text"
                        value={editingBankDetails.accountNumber}
                        onChange={(e) =>
                          setEditingBankDetails({ ...editingBankDetails, accountNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="bank-detail-field">
                      <label>Routing Number:</label>
                      <input
                        type="text"
                        value={editingBankDetails.routingNumber}
                        onChange={(e) =>
                          setEditingBankDetails({ ...editingBankDetails, routingNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="bank-detail-field">
                      <label>SWIFT Code:</label>
                      <input
                        type="text"
                        value={editingBankDetails.swiftCode}
                        onChange={(e) =>
                          setEditingBankDetails({ ...editingBankDetails, swiftCode: e.target.value })
                        }
                      />
                    </div>
                    <button onClick={handleSaveBankDetails}>Save</button>
                    <button onClick={handleCancelEdit}>Cancel Edit</button>
                  </div>
                ) : (
                  <div className="bank-details-view">
                    <div className="bank-detail-field">
                      <span>Bank Name: </span>
                      <span>{landlordBankDetails.bankName || "No info. Please input manually and verify with your landlord."}</span>
                    </div>
                    <div className="bank-detail-field">
                      <span>Account Name: </span>
                      <span>{landlordBankDetails.accountName || "No info. Please input manually and verify with your landlord."}</span>
                    </div>
                    <div className="bank-detail-field">
                      <span>Account Number: </span>
                      <span>{landlordBankDetails.accountNumber || "No info. Please input manually and verify with your landlord."}</span>
                    </div>
                    <div className="bank-detail-field">
                      <span>Routing Number: </span>
                      <span>{landlordBankDetails.routingNumber || "No info. Please input manually and verify with your landlord."}</span>
                    </div>
                    <div className="bank-detail-field">
                      <span>SWIFT Code: </span>
                      <span>{landlordBankDetails.swiftCode || "No info. Please input manually and verify with your landlord."}</span>
                    </div>
                    <button onClick={startEditing}>Edit Bank Details</button>
                  </div>
                )}
                <button className="pay-submit" onClick={handleSend} disabled={processing}>
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

export default Pay;
