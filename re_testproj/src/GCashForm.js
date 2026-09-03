import React, { useState } from 'react';
import gcashLogo from './images/gcash-logo.png';
import './GCashForm.css';
import useAuthedRequest from './useAuthedRequest';

function GCashForm({ onPaymentSuccess, onPaymentError }) {
  const { authedFetch } = useAuthedRequest();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const BaseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) < 50) {
      setMessage('Amount must be at least PHP 50.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await authedFetch(`${BaseURL}/api/paymongo/gcash-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: Math.round(amount * 100) }), // Convert to centavos
      });

      if (!response.ok) {
        throw new Error('Failed to initiate GCash payment.');
      }

      const data = await response.json();
      setMessage('Payment initiated. Follow the instructions to complete your GCash payment.');
      onPaymentSuccess(data);
    } catch (error) {
      console.error('Error initiating GCash payment:', error);
      setMessage('Error: Unable to initiate payment. Please try again.');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gcash-form">
      <img src={gcashLogo} alt="GCash Logo" className="gcash-logo" />
      <h3>Pay via GCash</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Amount (PHP):
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (min PHP 50)"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </form>
      {message && <p className="gcash-message">{message}</p>}
    </div>
  );
}

export default GCashForm;
