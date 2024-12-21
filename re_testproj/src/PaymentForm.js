// components/PaymentForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentForm.css';

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');

  // Replace with your backend endpoint
  const createPaymentIntent = async (amount) => {
    const response = await fetch('http://localhost:5000/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const data = await response.json();
    setClientSecret(data.clientSecret);
  };

  // Example: Initialize payment intent when component mounts
  React.useEffect(() => {
    // Example amount: $20.00
    createPaymentIntent(2000); // Amount in cents
  }, []);

  const handleChange = async (event) => {
    // Listen for changes in the CardElement and display any errors
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      setSucceeded(true);
      // Optionally, update payment history in your backend here
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <CardElement id="card-element" onChange={handleChange} />
      <button
        disabled={processing || disabled || succeeded}
        id="submit"
        className="pay-button"
      >
        {processing ? (
          <div className="spinner" id="spinner"></div>
        ) : (
          'Pay Now'
        )}
      </button>
      {/* Show any error that happens when processing the payment */}
      {error && (
        <div className="card-error" role="alert">
          {error}
        </div>
      )}
      {/* Show a success message upon completion */}
      {succeeded && (
        <p className="result-message">
          Payment succeeded! Thank you for your purchase.
        </p>
      )}
    </form>
  );
}

export default PaymentForm;
