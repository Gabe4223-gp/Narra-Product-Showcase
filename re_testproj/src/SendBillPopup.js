// src/SendBillPopup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendBillPopup.css';

function SendBillPopup({ onClose, tenantemail, landlordemail }) {
  const [subject, setSubject] = useState('');
  const [rentalAmount, setRentalAmount] = useState('');
  const [utilityFees, setUtilityFees] = useState([{ name: '', amount: '' }]);
  const [otherFees, setOtherFees] = useState([{ name: '', amount: '' }]);
  const [taxRate, setTaxRate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [email, setEmail] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});

  const handleAddUtility = () => {
    setUtilityFees([...utilityFees, { name: '', amount: '' }]);
  };

  const handleUtilityChange = (index, field, value) => {
    const updated = [...utilityFees];
    updated[index][field] = value;
    setUtilityFees(updated);
  };

  const handleAddOtherFee = () => {
    setOtherFees([...otherFees, { name: '', amount: '' }]);
  };

  const handleOtherFeeChange = (index, field, value) => {
    const updated = [...otherFees];
    updated[index][field] = value;
    setOtherFees(updated);
  };

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
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!rentalAmount || parseFloat(rentalAmount) <= 0) {
      newErrors.rentalAmount = 'Please enter a valid amount (e.g., PHP 100.00).';
    }
    if (!taxRate || parseFloat(taxRate) < 0 || parseFloat(taxRate) > 100) {
      newErrors.taxRate = 'Tax rate must be between 0% and 100%.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!tenantemail || !landlordemail) {
      console.error("Missing tenantemail or landlordemail");
      return;
    }
    
    if (!deadline) {
      alert("Please add a deadline");
      return;
    }
    if (!validateFields()) return;

    const billData = {
      tenantemail,
      landlordemail,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      email,
      totalAmount,
    };

    console.log("Sending billData:", billData);
  try {
    const res = await axios.post('/api/sendBill/generate', billData);
    console.log("Sending bill data to /generate:", {
      tenantemail,
      landlordemail,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      email,
      totalAmount,
    })
    alert(res.data.message);
  } catch (error) {
    console.error("Error sending bill:", error);
    alert("Failed to send the bill. Please try again.");
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
            placeholder="Enter bill description"
          />
        </label>
        <label>
          Rental Amount (PHP):
          <input
            type="number"
            value={rentalAmount}
            onChange={(e) => setRentalAmount(e.target.value)}
            placeholder="PHP 100.00"
          />
          {errors.rentalAmount && <span className="error">{errors.rentalAmount}</span>}
        </label>

        <div className="dynamic-fields">
          <h3>Utility Fees</h3>
          {utilityFees.map((fee, index) => (
            <div key={index} className="fee-row">
              <input
                type="text"
                placeholder="Utility (e.g., Water)"
                value={fee.name}
                onChange={(e) => handleUtilityChange(index, 'name', e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => handleUtilityChange(index, 'amount', e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleAddUtility}>Add Utility Fee</button>
        </div>

        <div className="dynamic-fields">
          <h3>Other Fees</h3>
          {otherFees.map((fee, index) => (
            <div key={index} className="fee-row">
              <input
                type="text"
                placeholder="Other Fee (e.g., Repairs)"
                value={fee.name}
                onChange={(e) => handleOtherFeeChange(index, 'name', e.target.value)}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => handleOtherFeeChange(index, 'amount', e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleAddOtherFee}>Add Other Fee</button>
        </div>

        <label>
          Tax Rate (VAT %):
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
        </label>
        <label>
          Send To (Email):
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter recipient's email address"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </label>
        <div className="total-amount">
          <h3>Total Amount: PHP {totalAmount.toFixed(2)}</h3>
        </div>

        <div className="popup-actions">
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleSubmit} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default SendBillPopup;
