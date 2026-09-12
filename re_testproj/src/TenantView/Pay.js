// src/Pay.js
import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useUserProfile } from "../UserProfileContext";
import useAuthedRequest from "../useAuthedRequest";
import axios from "axios";
import "./Pay.css";

// Stripe is provided by the <Elements> wrapper in index.js, so the hooks below
// pick it up without loading it again here.

// Wise moves real money and is off unless explicitly enabled. Mirrors
// WISE_ENABLED on the server, which refuses the request regardless.
const WISE_ENABLED = process.env.REACT_APP_WISE_ENABLED === "true";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#32325d",
      fontFamily: "inherit",
      "::placeholder": { color: "#aab7c4" },
    },
    invalid: { color: "#e5424d" },
  },
};

const Pay = ({ bill, onClose, landlordData }) => {
  const { userProfile } = useUserProfile();
  const stripe = useStripe();
  const elements = useElements();
  const { getToken } = useAuthedRequest();
  const [cardReady, setCardReady] = useState(false);

  // Payment Method States: "Transfer", "Credit/Debit", "GCash"
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);

  // Tenant Payment Info: should include Wise account info in tenantBankInfo.wiseAccountId
  const [tenantBankInfo, setTenantBankInfo] = useState(null);
  const [tenantBankName, setTenantBankName] = useState(null);
  const [tenantGcashNumber, setTenantGcashNumber] = useState(null);

  // For GCash
  const [landlordGcashNumber, setLandlordGcashNumber] = useState(null);
  const [missingLandlordGcash, setMissingLandlordGcash] = useState(false);
  const [inputLandlordGcash, setInputLandlordGcash] = useState("");

  // Enhanced Wise states
  const [transferStep, setTransferStep] = useState(1); // 1: initial view, 2: confirmation view
  const [transferDetails, setTransferDetails] = useState(null);
  const [balanceChecked, setBalanceChecked] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);

  // NEW: Transfer Type Selection (for Wise transfers)
  const [selectedTransferType, setSelectedTransferType] = useState("BankTransfer");

  // UI / Error states
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Payment amount
  const [amountPaid, setAmountPaid] = useState(bill.totalAmount.toFixed(2));

  // Payment method form data for Credit/Debit (if implemented later)
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const formatCurrency = (amount) => {
    // For production (PHP formatting)
    if (process.env.NODE_ENV === "production") {
      return `₱${amount.toFixed(2)}`;
    }
    // For sandbox (USD formatting)
    return `$${amount.toFixed(2)}`;
  };

  // -----------------------------
  // 1) Fetch Tenant & Basic Landlord Data (for GCash & Transfer)
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

        // Fetch landlord basic details for GCash
        const landlordRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/get-landlord-details/${bill.landlordId}`);
        const { landlordBankId, landlordGcashMobileNumber } = landlordRes.data || {};
        setLandlordGcashNumber(landlordGcashMobileNumber || null);

        // Determine available payment methods.
        let methods = [];
        if (WISE_ENABLED && storedPaymentMethods) methods.push("Transfer");
        methods.push("Credit/Debit");
        if (gcashMobileNumber) methods.push("GCash");

        setAvailableMethods(methods);
        if (methods.length === 1) {
          setPaymentMethod(methods[0]);
        }
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
  // 2) Main "Send" Button Handler - Payment Processing
  // -----------------------------
  const handleSend = async () => {
    setProcessing(true);
    setError("");

    try {
      // --- GCash Flow (unchanged) ---
      if (paymentMethod === "GCash") {
        console.log("Initiating GCash Payment with Amount:", amountPaid);
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/gcash`, {
          amount: Math.round(parseFloat(amountPaid) * 100),
          billId: bill.id,
          tenantEmail: userProfile.email,
          returnUrl: `${window.location.origin}/tenant/dashboard?redirected=true`
        });

        if (response.data.success && response.data.checkoutUrl) {
          const sourceId = response.data.sourceId;
          window.location.href = response.data.checkoutUrl;

          // Poll for payment status
          const interval = setInterval(async () => {
            try {
              const statusResp = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/gcash-status`, { sourceId });
              const paymentStatus = statusResp.data.status;
              if (paymentStatus === "chargeable") {
                clearInterval(interval);
                alert("Payment successful!");
                await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/update-status`, { billId: bill.id, status: "Paid" });
                window.location.href = `/tenant/dashboard?redirected=true&status=success`;
              } else if (paymentStatus === "failed") {
                clearInterval(interval);
                alert("Payment failed. Please try again.");
                window.location.href = `/tenant/dashboard?redirected=true&status=failed`;
              }
            } catch (error) {
              console.error("Error checking payment status:", error);
            }
          }, 10000);
        } else {
          setError("Failed to initiate GCash payment.");
        }
      }
      // In the Transfer branch:
      if (paymentMethod === "Transfer") {
        // Check for tenant Wise account (for testing, we use a placeholder if not set)
        let tenantWiseAccountId = userProfile.landlordBankDetails?.wiseAccountId;
        if (!tenantWiseAccountId) {
          console.warn("Tenant Wise account not set up. Using placeholder account id for testing.");
          tenantWiseAccountId = "placeholder-wise-id";
        }

        // Check Wise balance before proceeding
        try {
          const balanceRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/payments/wise-balance?tenantId=${userProfile.id}`);
          const tenantWiseBalance = balanceRes.data.balance;
          // Temporarily bypassing the insufficient funds check:
          // if (tenantWiseBalance < bill.totalAmount) {
          //   setError("Insufficient funds in your Wise account.");
          //   return;
          // }
          console.log("Tenant Wise balance (bypassed):", tenantWiseBalance);
        } catch (balanceError) {
          console.warn("Could not retrieve Wise balance, proceeding for testing purposes.", balanceError);
        }

        // Build recipient payload from landlordData (business vs. personal)
        let recipientPayload = {};
        let usingBusiness = false;
        if (
          landlordData.businessBankInfo &&
          landlordData.businessDetails &&
          landlordData.businessAddressInfo
        ) {
          usingBusiness = true;
          const businessBase = {
            bankName: landlordData.businessBankInfo.bankName,
            accountName: landlordData.businessDetails.companyName,
            currency: landlordData.businessBankInfo.currency || "Philippine Peso",
            country: landlordData.businessAddressInfo.country || "PH",
            address: {
              firstLine: landlordData.businessAddressInfo.companyAddress || "123 Ayala Ave",
              city: landlordData.businessAddressInfo.city || "Manila",
              state: 'NY', //Placeholder for testing
              postCode: landlordData.businessAddressInfo.zipCode || "10001",
              country: landlordData.businessAddressInfo.country || "PH"
            }
          };

          switch (selectedTransferType) {
            case "SWIFT":
            case "Wire":
              recipientPayload = {
                ...businessBase,
                swiftCode: landlordData.businessBankInfo.swiftBicCode,
                accountNumber: landlordData.businessBankInfo.accountNumber,
                routingNumber: landlordData.businessBankInfo.routingNumber,
                institutionNumber: landlordData.businessBankInfo.institutionNumber
              };
              break;
            case "BankTransfer":
              recipientPayload = {
                ...businessBase,
                accountNumber: landlordData.businessBankInfo.accountNumber,
                routingNumber: landlordData.businessBankInfo.routingNumber,
                transitNumber: landlordData.businessBankInfo.transitNumber
              };
              break;
            case "WiseBalance":
              recipientPayload = {
                wiseAccountId: landlordData.landlordBankDetails.wiseAccountId,
                currency: landlordData.businessBankInfo.currency
              };
              break;
            default:
              break;
          }
        } else {
          // Personal account handling
          const personalBase = {
            bankName: landlordData.bankName,
            accountName: landlordData.name,
            currency: landlordData.landlordBankDetails?.currency || "Philippine Peso",
            country: landlordData.personalAddressInfo?.country || "PH",
            address: {
              firstLine: landlordData.personalAddressInfo?.streetAddress || "123 Ayala Ave",
              city: landlordData.personalAddressInfo?.city || "Manila",
              state: 'NY', //Placeholder for testing
              postCode: landlordData.personalAddressInfo?.zipCode || "10001",
              country: landlordData.personalAddressInfo?.country || "PH"
            }
          };

          switch (selectedTransferType) {
            case "SWIFT":
            case "Wire":
              recipientPayload = {
                ...personalBase,
                swiftCode: landlordData.landlordBankDetails?.swiftBicCode,
                accountNumber: landlordData.landlordBankDetails?.accountNumber,
                routingNumber: landlordData.landlordBankDetails?.routingNumber
              };
              break;
            case "BankTransfer":
              recipientPayload = {
                ...personalBase,
                accountNumber: landlordData.landlordBankDetails?.accountNumber,
                routingNumber: landlordData.landlordBankDetails?.routingNumber,
                transitNumber: landlordData.landlordBankDetails?.transitNumber
              };
              break;
            case "WiseBalance":
              recipientPayload = {
                wiseAccountId: landlordData.landlordBankDetails?.wiseAccountId,
                currency: landlordData.landlordBankDetails?.currency
              };
              break;
            default:
              break;
          }
        }

        // Add additional fields required by your backend logic
        const finalPayload = {
          ...recipientPayload,
          legalType: usingBusiness ? "BUSINESS" : "PRIVATE",
          transferType: selectedTransferType
        };

        // Remove state if not needed (for non-US addresses)
        if (finalPayload.address && finalPayload.address.country !== "US") {
          delete finalPayload.address.state;
        }

        // Sandbox overrides: force currency to USD and use test credentials for BankTransfer
        if (process.env.NODE_ENV !== "production") {
          finalPayload.currency = "USD";
          if (selectedTransferType === "BankTransfer") {
            finalPayload.routingNumber = "084009519"; // Wise sandbox ABA routing number
            finalPayload.accountNumber = "123456789"; // Wise sandbox test account number
          }
          // Remove transitNumber if it exists
          if (finalPayload.transitNumber) {
            delete finalPayload.transitNumber;
          }
          // Override address to ensure it includes the required state field.
          finalPayload.address = {
            firstLine: "456 Sandbox Ave",
            city: "New York",
            state: "NY",  // Explicitly include the state
            postCode: "10001",
            country: "US"
          };
          console.log("Sandbox finalPayload.address:", finalPayload.address);
        }                 

        console.log("Final Wise Recipient Payload:", finalPayload);

        // Create recipient via Wise API endpoint
        const recipientRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/wise-create-recipient`, {
          ...finalPayload,
          transferType: selectedTransferType
        });
        if (!recipientRes.data.success) {
          setError("Failed to create recipient on Wise: " + recipientRes.data.message);
          return;
        }

        // Create the transfer (which includes quote creation, transfer creation, and funding in sandbox)
        const wiseRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/wise-transfer`, {
          amount: bill.totalAmount,
          currency: "Philippine Peso", // In sandbox, this is mapped to USD; in production, PHP will be used.
          recipientId: recipientRes.data.recipientId
        });

        if (wiseRes.data.success) {
          // In sandbox mode, the transfer is auto-funded via simulation.
          // In production, you would provide the sender with funding instructions (bank account details, reference codes, etc.)
          alert("Wise bank transfer processed successfully!");
          await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/update-status`, { billId: bill.id, status: "Paid" });
          onClose();
        } else {
          setError("Wise bank transfer failed: " + (wiseRes.data.message || ""));
        }
      }
      // --- Credit/Debit Flow (Stripe) ---
      else if (paymentMethod === "Credit/Debit") {
        if (!stripe || !elements) {
          setError("Card payments are still loading. Please try again in a moment.");
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError("Please enter your card details.");
          return;
        }

        // The payment intent endpoint is authenticated: it reads the Auth0
        // subject from the token to tag the charge.
        const token = await getToken();

        const intentRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/create-payment-intent`,
          { amount: Math.round(parseFloat(amountPaid) * 100) },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const clientSecret = intentRes.data?.clientSecret;
        if (!clientSecret) {
          setError("Could not start the card payment. Please try again.");
          return;
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: userProfile?.name || undefined,
              email: userProfile?.email || undefined,
            },
          },
        });

        if (result.error) {
          setError(result.error.message || "Your card could not be charged.");
          return;
        }

        if (result.paymentIntent?.status === "succeeded") {
          // Same completion path as GCash, so the bill is settled identically
          // however it was paid.
          await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/update-status`, {
            billId: bill.id,
            status: "Paid",
          });
          alert("Payment successful!");
          window.location.href = `/tenant/dashboard?redirected=true&status=success`;
        } else {
          setError(`Payment did not complete (${result.paymentIntent?.status || "unknown"}).`);
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
            {/* Payment Method Selection */}
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

            {/* GCash Section */}
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

            {/* Transfer Section (Wise) */}
            {paymentMethod === "Transfer" && transferStep === 1 && (
              <div className="pay-transfer-section">
                <h4>Wise Bank Transfer</h4>
                
                {/* Transfer Type Selector - add radio buttons or dropdown for selecting transfer type if desired */}
                {process.env.NODE_ENV !== "production" && (
                  <div className="sandbox-notice">
                    Sandbox Mode: USD transfers only, using test credentials
                  </div>
                )}

                {selectedTransferType !== "WiseBalance" && (
                  <div className="landlord-data-summary">
                    <h5>Recipient Information:</h5>
                    {landlordData ? (
                      <>
                        {landlordData.businessDetails ? (
                          <>
                            <p><strong>Business:</strong> {landlordData.businessDetails.companyName}</p>
                            <p><strong>Bank:</strong> {landlordData.businessBankInfo?.bankName}</p>
                            <p><strong>Account:</strong> {landlordData.businessBankInfo?.accountNumber}</p>
                          </>
                        ) : (
                          <>
                            <p><strong>Name:</strong> {landlordData.name}</p>
                            <p><strong>Bank:</strong> {landlordData.bankName}</p>
                            <p><strong>Account:</strong> {landlordData.landlordBankDetails?.accountNumber}</p>
                          </>
                        )}
                        {selectedTransferType === "SWIFT" && (
                          <p><strong>SWIFT/BIC:</strong> {landlordData.businessBankInfo?.swiftBicCode || landlordData.landlordBankDetails?.swiftBicCode}</p>
                        )}
                      </>
                    ) : (
                      <p>No recipient data available</p>
                    )}
                  </div>
                )}

                {error && <div className="error-banner">{error}</div>}

                <button 
                  className="pay-submit" 
                  onClick={handleSend} 
                  disabled={processing || !landlordData}
                >
                  {processing ? "Processing..." : `Pay ${formatCurrency(bill.totalAmount)} via Wise`}
                </button>
              </div>
            )}

            {paymentMethod === "Transfer" && transferStep === 2 && transferDetails && (
              <div className="transfer-confirmation">
                <h4>Transfer Confirmation</h4>
                <p>Your transfer has been initiated successfully.</p>
                <p><strong>Transfer ID:</strong> {transferDetails.transferId}</p>
                <p><strong>Amount:</strong> {formatCurrency(transferDetails.amount)}</p>
                <p><strong>Fee:</strong> {formatCurrency(transferDetails.fee)}</p>
                <p><strong>Exchange Rate:</strong> {transferDetails.rate}</p>
                {process.env.NODE_ENV === "production" && (
                  <p>Please follow the instructions provided by Wise to complete funding the transfer.</p>
                )}
                <button className="pay-exit" onClick={onClose}>Close</button>
              </div>
            )}

            {/* Credit/Debit Section (Placeholder) */}
            {paymentMethod === "Credit/Debit" && (
              <div className="pay-credit-debit-section">
                <h4>Card Payment</h4>
                <div className="card-element-wrapper">
                  <CardElement
                    options={CARD_ELEMENT_OPTIONS}
                    onChange={(e) => {
                      setCardReady(e.complete);
                      setError(e.error ? e.error.message : "");
                    }}
                  />
                </div>
                <p className="card-test-hint">
                  Test mode: use card 4242 4242 4242 4242, any future expiry and
                  any CVC.
                </p>
                <button
                  onClick={handleSend}
                  disabled={!stripe || !cardReady || processing}
                >
                  {processing ? "Processing..." : `Pay ₱${amountPaid}`}
                </button>
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button className="pay-exit" onClick={onClose}>Exit</button>
      </div>
    </div>
  );
};

export default Pay;
