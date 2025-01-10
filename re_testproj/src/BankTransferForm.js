// components/BankTransferForm.js
import React, { useState } from 'react';
import './BankTransferForm.css';

function BankTransferForm() {
  const BaseURL = process.env.REACT_APP_API_URL;
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const initiateBankTransfer = async () => {
    if (!amount || parseFloat(amount) < 50) {
      setMessage('Please enter a valid amount (minimum PHP 50).');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${BaseURL}/api/paymongo/bank-transfer-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) * 100 }), // Convert to centavos
      });

      if (!response.ok) {
        throw new Error('Failed to create bank transfer intent.');
      }

      const data = await response.json();
      setReferenceNumber(data.reference_number);
      setMessage('Bank transfer payment intent created. Use the reference number provided.');
    } catch (error) {
      console.error('Error initiating bank transfer:', error);
      setMessage('Failed to create bank transfer intent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-transfer-form">
      <h3>Pay via Bank Transfer</h3>
      <label>
        Enter Amount (PHP):
        <input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount (e.g., 100)"
          disabled={loading}
        />
      </label>
      <button onClick={initiateBankTransfer} disabled={loading}>
        {loading ? 'Processing...' : 'Generate Reference Number'}
      </button>
      {referenceNumber && (
        <div className="reference-details">
          <p>Reference Number:</p>
          <p className="reference-number">{referenceNumber}</p>
        </div>
      )}
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

export default BankTransferForm;
