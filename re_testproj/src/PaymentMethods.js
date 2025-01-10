// components/PaymentMethods.js
import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import BankTransferForm from './BankTransferForm';
import GCashForm from './GCashForm';
import './PaymentMethods.css';

function PaymentMethods() {
  const [message, setMessage] = useState('');

  const handleStripeSuccess = () => {
    setMessage('Payment succeeded! Thank you for your purchase.');
  };

  const handleStripeError = (error) => {
    setMessage(`Payment failed: ${error}`);
    console.error('Stripe Payment Error:', error);
  };

  const handlePaymentSuccess = (data) => {
    console.log('Payment successful:', data);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="payment-methods">
      <h2>Payment Methods</h2>
      <div className="payment-options">
        {/* Stripe Payment Form */}
        <div className="payment-option">
          <h3>Pay with Credit or Debit Card</h3>
          <PaymentForm onSuccess={handleStripeSuccess} onError={handleStripeError} />
        </div>

        {/* Bank Transfer Form */}
        <div className="payment-option">
          <BankTransferForm />
        </div>

        {/* GCash Payment Form */}
        <div className="payment-option">
          <GCashForm
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
      {message && <div className="payment-message">{message}</div>}
    </div>
  );
}

export default PaymentMethods;
