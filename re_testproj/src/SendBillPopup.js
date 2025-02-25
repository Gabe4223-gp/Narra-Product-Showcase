// src/SendBillPopup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendBillPopup.css';

function SendBillPopup({ onClose, tenantEmail, propertyId, landlordId }) {
  console.log("the landlordid", landlordId);
  const [subject, setSubject] = useState('');
  const [rentalAmount, setRentalAmount] = useState('');
  const [utilityFees, setUtilityFees] = useState([{ name: '', amount: '' }]);
  const [otherFees, setOtherFees] = useState([{ name: '', amount: '' }]);
  const [taxRate, setTaxRate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const rental = parseFloat(rentalAmount) || 0;
    const utilities = utilityFees.reduce(
      (sum, fee) => sum + (parseFloat(fee.amount) || 0),
      0
    );
    const others = otherFees.reduce(
      (sum, fee) => sum + (parseFloat(fee.amount) || 0),
      0
    );
    const taxMultiplier = (parseFloat(taxRate) || 0) / 100;
    const subtotal = rental + utilities + others;
    const tax = subtotal * taxMultiplier;
    setTotalAmount(subtotal + tax);
  }, [rentalAmount, utilityFees, otherFees, taxRate]);

  const validateFields = () => {
    const newErrors = {};
    if (!tenantEmail) {
      newErrors.tenantEmail = 'Tenant email is required.';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Please provide a subject.';
    }
    if (!deadline) {
      newErrors.deadline = 'A payment deadline is required.';
    }
    if (!rentalAmount || parseFloat(rentalAmount) <= 0) {
      newErrors.rentalAmount = 'Please enter a valid rental amount.';
    }
    const parsedTax = parseFloat(taxRate);
    if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      console.log("Validation failed", errors);
      return;
    }
    const billData = {
      tenantEmail,
      propertyId,
      landlordId,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      totalAmount,
    };

    console.log("Sending billData:", billData);
    try {
      const res = await axios.post('/api/sendBill/generate', billData);
      console.log("API response:", res.data);
      alert(res.data.message || 'Bill generated successfully.');
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to send the bill. Please try again.');
    }
    onClose();
  };

  return (
    <div className="send-bill-popup">
      <div className="popup-content">
        <h2>Send Bill</h2>
        <label>
          Subject:
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter bill subject"
          />
          {errors.subject && <span className="error">{errors.subject}</span>}
        </label>
        <label>
          Rental Amount (PHP):
          <input
            type="number"
            value={rentalAmount}
            onChange={(e) => setRentalAmount(e.target.value)}
            placeholder="100.00"
          />
          {errors.rentalAmount && <span className="error">{errors.rentalAmount}</span>}
        </label>
        <div className="dynamic-fields">
          <h3>Utility Fees</h3>
          {utilityFees.map((fee, index) => (
            <div key={index} className="fee-row">
              <input
                type="text"
                placeholder="e.g., Water"
                value={fee.name}
                onChange={(e) => {
                  const updated = [...utilityFees];
                  updated[index].name = e.target.value;
                  setUtilityFees(updated);
                }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => {
                  const updated = [...utilityFees];
                  updated[index].amount = e.target.value;
                  setUtilityFees(updated);
                }}
              />
            </div>
          ))}
          <button onClick={() => setUtilityFees([...utilityFees, { name: '', amount: '' }])}>
            Add Utility Fee
          </button>
        </div>
        <div className="dynamic-fields">
          <h3>Other Fees</h3>
          {otherFees.map((fee, index) => (
            <div key={index} className="fee-row">
              <input
                type="text"
                placeholder="e.g., Repairs"
                value={fee.name}
                onChange={(e) => {
                  const updated = [...otherFees];
                  updated[index].name = e.target.value;
                  setOtherFees(updated);
                }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => {
                  const updated = [...otherFees];
                  updated[index].amount = e.target.value;
                  setOtherFees(updated);
                }}
              />
            </div>
          ))}
          <button onClick={() => setOtherFees([...otherFees, { name: '', amount: '' }])}>
            Add Other Fee
          </button>
        </div>
        <label>
          Tax Rate (%):
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="0-100"
          />
          {errors.taxRate && <span className="error">{errors.taxRate}</span>}
        </label>
        <label>
          Deadline:
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          {errors.deadline && <span className="error">{errors.deadline}</span>}
        </label>
        <div className="total-amount">
          <h3>Total Amount: PHP {totalAmount.toFixed(2)}</h3>
        </div>
        <div className="popup-actions">
          <button onClick={onClose} className="cancel-button">Cancel</button>
          <button onClick={handleSubmit} className="send-button">Send</button>
        </div>
      </div>
    </div>
  );
}

export default SendBillPopup;
