// src/Pay.js
import React, { useState } from 'react';
import { useUserProfile } from '../UserProfileContext';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const Pay = ({ bill, onClose }) => {
  const { userProfile } = useUserProfile();
  const stripe = useStripe();
  const elements = useElements();

  // Payment methods: "Credit/Debit", "GCash", "Bank Transfer"
  const [paymentMethod, setPaymentMethod] = useState('Credit/Debit');
  // Pre-calculate remaining amount (as float string)
  const remainingAmount = (bill.totalAmount - bill.paid).toFixed(2);
  const [amountPaid, setAmountPaid] = useState(remainingAmount);
  const [proofFile, setProofFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Required fields per payment method from userProfile
  const requiredFields = {
    'Credit/Debit': ['cardholderName', 'billingAddress', 'cardNumber', 'expiryDate', 'cvv', 'billingZipCode'],
    'GCash': ['gcashMobileNumber'],
    'Bank Transfer': ['bank', 'accountNumber', 'accountName']
  };

  // Check that required payment details exist in userProfile
  const checkPaymentSetup = () => {
    const fields = requiredFields[paymentMethod];
    for (let field of fields) {
      if (!userProfile[field]) {
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!checkPaymentSetup()) {
      alert("Payment not yet set up");
      return;
    }
    setProcessing(true);
    setError('');

    // Prepare common form data for payment processing
    const formData = new FormData();
    formData.append('billId', bill.id);
    formData.append('paymentMethod', paymentMethod);
    formData.append('amountPaid', amountPaid);
    if (proofFile) {
      formData.append('proofFile', proofFile);
    }
    // Payment details pulled from the userProfile
    const paymentDetails = requiredFields[paymentMethod].reduce((acc, field) => {
      acc[field] = userProfile[field];
      return acc;
    }, {});
    formData.append('paymentDetails', JSON.stringify(paymentDetails));

    try {
      if (paymentMethod === 'Credit/Debit') {
        // For credit/debit, use Stripe. Amount in centavos.
        const stripeResponse = await axios.post('/tenant/billing/pay/stripe', {
          amount: Math.round(parseFloat(amountPaid) * 100),
          billId: bill.id,
          paymentDetails,
        });
        const { clientSecret } = stripeResponse.data;
        // Confirm the card payment with the CardElement
        const payload = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: elements.getElement(CardElement) },
        });
        if (payload.error) {
          setError(`Payment failed: ${payload.error.message}`);
          setProcessing(false);
          return;
        }
      } else if (paymentMethod === 'GCash') {
        // Call the GCash payment endpoint with formData
        await axios.post('/tenant/billing/pay/gcash', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (paymentMethod === 'Bank Transfer') {
        // Call the Bank Transfer payment endpoint with formData
        await axios.post('/tenant/billing/pay/bank', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Send Notification to the landlord via fetch
      const response = await fetch('/api/notify-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: bill.landlordId,  // Assuming landlordId is in the bill object
          totalAmount: amountPaid,
          deadline: bill.deadline,  // Assuming there's a dueDate field in the bill object
          tenantEmail: bill.tenantEmail,
        }),
      });

      const notification = await response.json();
      if (!response.ok) {
        throw new Error(notification.error || 'Failed to send notification');
      }

      // On success, you may update the bill's "paid" amount in your backend.
      alert('Payment processed successfully!');
      onClose();
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
        <div className="payment-methods">
          <label>
            <input
              type="radio"
              value="Credit/Debit"
              checked={paymentMethod === 'Credit/Debit'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Credit/Debit
          </label>
          <label>
            <input
              type="radio"
              value="GCash"
              checked={paymentMethod === 'GCash'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            GCash
          </label>
          <label>
            <input
              type="radio"
              value="Bank Transfer"
              checked={paymentMethod === 'Bank Transfer'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Bank Transfer
          </label>
        </div>
        <div className="amount-section">
          <label>Amount Paid (PHP):</label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>
        {paymentMethod === 'Credit/Debit' && (
          <div className="card-section">
            <label>Card Details:</label>
            <CardElement id="card-element" />
          </div>
        )}
        <div className="proof-section">
          <label>Upload Proof of Payment:</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button onClick={handleSend} disabled={processing}>
          {processing ? 'Processing...' : 'Send'}
        </button>
        <button onClick={onClose}>Exit</button>
      </div>
    </div>
  );
};

export default Pay;
