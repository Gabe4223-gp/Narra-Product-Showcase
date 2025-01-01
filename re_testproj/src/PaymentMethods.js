// components/PaymentMethods.js
import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import PayPalButtonsComponent from './PayPalButtonsComponent';
import './PaymentMethods.css';

function PaymentMethods() {
  const [message, setMessage] = useState('');

  const handlePayPalSuccess = (details, name) => {
    alert(`Transaction completed by ${name}!`);
    // Optionally, update payment history in your backend here
  };

  const handlePayPalError = (error) => {
    alert('PayPal Checkout encountered an error. Please try again.');
    console.error('PayPal Checkout Error:', error);
  };

  const handleStripeSuccess = () => {
    setMessage('Payment succeeded! Thank you for your purchase.');
  };

  const handleStripeError = (error) => {
    setMessage(`Payment failed: ${error}`);
    console.error('Stripe Payment Error:', error);
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

        {/* PayPal Payment Buttons */}
        <div className="payment-option">
          <h3>Pay with PayPal</h3>
          <PayPalButtonsComponent
            amount="20.00" // Replace with dynamic amount as needed
            onSuccess={handlePayPalSuccess}
            onError={handlePayPalError}
          />
        </div>
      </div>
      {message && <div className="payment-message">{message}</div>}
    </div>
  );
}

export default PaymentMethods;
