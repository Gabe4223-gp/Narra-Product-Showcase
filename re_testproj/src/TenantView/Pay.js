// src/Pay.js
import React, { useState } from 'react';

const Pay = ({ bill, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState(bill.fullAmount);
  const [proofFile, setProofFile] = useState(null);

  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  const handleSend = () => {
    // Prepare form data for file upload and other fields.
    const formData = new FormData();
    formData.append('billId', bill.id);
    formData.append('paymentMethod', paymentMethod);
    formData.append('amountPaid', amountPaid);
    if (proofFile) {
      formData.append('proofFile', proofFile);
    }

    fetch('http://localhost:5000/tenant/billing/pay', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Payment information sent successfully');
        onClose();
      })
      .catch((err) => {
        alert('Error sending payment information');
      });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Pay</h3>
        <div>
          <label>
            <input
              type="radio"
              value="Bank Transfer"
              checked={paymentMethod === 'Bank Transfer'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Bank Transfer
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
              value="Credit/Debit"
              checked={paymentMethod === 'Credit/Debit'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Credit/Debit
          </label>
        </div>
        <div>
          <label>Amount Paid:</label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>
        <div>
          <label>Upload Proof of Payment:</label>
          <input
            type="file"
            accept=".pdf, .png, .jpg, .jpeg"
            onChange={handleFileChange}
          />
        </div>
        <button onClick={handleSend}>Send</button>
        <button onClick={onClose}>Exit</button>
      </div>
    </div>
  );
};

export default Pay;
