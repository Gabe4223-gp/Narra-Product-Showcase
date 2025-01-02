// PaymentForm.js
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth0 } from '@auth0/auth0-react';
import './PaymentForm.css';

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { getAccessTokenSilently } = useAuth0();
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState('');
  const [disabled, setDisabled] = useState(true);

  const amount = 2000; // Amount in cents

  const handleChange = async (event) => {
    //Listen for changes in the CardElement and display any errors
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const BaseURL = process.env.REACT_APP_API_URL;
  console.log('API Base URL:', BaseURL);
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);
  
    try {
      //Retrieve access token from Auth0
      const token = await getAccessTokenSilently();
  

    // Replace with your backend endpoint, since on development it is currently on local host port 5000 
    // change to http://api.yourapp.com/create-payment-intent
    const response = await fetch(`${BaseURL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }), //Dynamic amount
    });

    const data = await response.json();
  
    const payload = await stripe.confirmCardPayment(data.clientSecret, {
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
    //Optionally, triggr invoice generation
    await fetch(`${BaseURL}/api/generate-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentId: payload.paymentIntent.id }),
  });
}} catch (err) {
  setError('Payment processing error');
  setProcessing(false);
  console.error('Payment Error:', err);
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
    {/* Success message upon completion */}
    {succeeded && (
      <p className="result-message">
        Payment success! Thank you for your purchase.
      </p>
    )}
  </form>
);
}

export default PaymentForm;
