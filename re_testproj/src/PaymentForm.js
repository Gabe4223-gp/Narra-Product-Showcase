/*import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth0 } from '@auth0/auth0-react';
import './PaymentForm.css';

function PaymentForm() {
  const elements = useElements();
  const { user, getAccessTokenSilently } = useAuth0();
  const [amount, setAmount] = useState(''); // Allow custom input for amount
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (isNaN(value) || parseFloat(value) < 50) {
      setError('Minimum amount is PHP 50.');
    } else {
      setError('');
    }
    setAmount(value);
  };

  const handleCardChange = (event) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const BaseURL = process.env.REACT_APP_API_URL;
  console.log('API Base URL:', BaseURL);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setProcessing(true);

    if (!amount || parseFloat(amount) < 50) {
      setError('Please enter a valid amount above PHP 50.');
      setProcessing(false);
      return;
    }

    try {
      const token = await getAccessTokenSilently({
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: 'openid read:payments write:payments offline_access',
      });

      const response = await fetch(`${BaseURL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Math.round(parseFloat(amount) * 100) }), // Convert to centavos
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from backend:', errorText);
        throw new Error('Payment processing error');
      }

      const data = await response.json();
      const payload = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (payload.error) {
        setError(`Payment failed: ${payload.error.message}`);
        setProcessing(false);
        return;
      }

      setError(null);
      setSucceeded(true);
      setProcessing(false);

      // Optionally save payment history
      await fetch(`${BaseURL}/save-payment-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: user.sub,
          name: user.name || 'Anonymous User',
          amountPaid: Math.round(parseFloat(amount) * 100),
          totalAmount: Math.round(parseFloat(amount) * 100),
          dateOfPayment: new Date().toISOString(),
          subject: 'Custom Payment',
          invoiceUrl: `http://localhost:5000/invoices/invoice-${Date.now()}.pdf`,
        }),
      });
    } catch (err) {
      setError(err.message || 'Payment processing error');
      setProcessing(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="payment-form">
      <label>
        Enter Amount (PHP):
        <input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount (e.g., 100)"
          className="amount-input"
        />
      </label>
      {error && <p className="error-message">{error}</p>}

      <CardElement id="card-element" onChange={handleCardChange} />
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

      {succeeded && (
        <p className="result-message">
          Payment success! Thank you for your purchase.
        </p>
      )}
    </form>
  );
}

export default PaymentForm;*/
