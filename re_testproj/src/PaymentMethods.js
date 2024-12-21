// components/PaymentMethods.js
import React from 'react';
import PaymentForm from './PaymentForm';
import PayPalButtonsComponent from './PayPalButtonsComponent';
import './PaymentMethods.css';

function PaymentMethods() {
  const handlePayPalSuccess = (details, name) => {
    alert(`Transaction completed by ${name}!`);
    // Optionally, update payment history in your backend here
  };

  const handlePayPalError = (error) => {
    alert('PayPal Checkout encountered an error. Please try again.');
    console.error('PayPal Checkout Error:', error);
  };

  return (
    <div className="payment-methods">
      <h2>Payment Methods</h2>
      <div className="payment-options">
        {/* Stripe Payment Form */}
        <div className="payment-option">
          <h3>Pay with Credit or Debit Card</h3>
          <PaymentForm />
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
    </div>
  );
}

export default PaymentMethods;
