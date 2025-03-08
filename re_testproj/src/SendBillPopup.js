// src/SendBillPopup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendBillPopup.css';

function SendBillPopup({ onClose, tenantEmail, propertyId, landlordId, landlordEmail }) {
  console.log("the landlordid", landlordId);
  const [subject, setSubject] = useState('');
  const [rentalAmount, setRentalAmount] = useState('');
  const [utilityFees, setUtilityFees] = useState([{ name: '', amount: '' }]);
  const [otherFees, setOtherFees] = useState([{ name: '', amount: '' }]);
  const [taxRate, setTaxRate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [landlordBankId, setLandlordBankId] = useState(null);
  const [bankName, setBankName] = useState(null);
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);
  const [landlordBankDetails, setLandlordBankDetails] = useState(null);

  useEffect(() => {
    const fetchLandlordBankDetails = async () => {
      try {
        const res = await axios.get(`/api/sendBill/get-landlord-payment/${landlordId}`);
        if (res.data) {
          setLandlordBankId(res.data.landlordBankId);
          setBankName(res.data.bankName);
          setLandlordBankDetails(res.data.landlordBankDetails || null);
        } else {
          setLandlordBankId(null);
          setBankName(null);
          setLandlordBankDetails(null);
        }
      } catch (error) {
        console.error('Error fetching landlord payment details:', error);
        setLandlordBankId(null);
        setBankName(null);
        setLandlordBankDetails(null);
      } finally {
        setLoadingBankInfo(false);
      }
    };

    if (landlordId) fetchLandlordBankDetails();

    const rental = parseFloat(rentalAmount) || 0;
    const utilities = utilityFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const others = otherFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const taxMultiplier = (parseFloat(taxRate) || 0) / 100;
    const subtotal = rental + utilities + others;
    const tax = subtotal * taxMultiplier;
    setTotalAmount(subtotal + tax);
  }, [rentalAmount, utilityFees, otherFees, taxRate, landlordId]);

  const validateFields = () => {
    const newErrors = {};
    if (!tenantEmail) newErrors.tenantEmail = 'Tenant email is required.';
    if (!subject.trim()) newErrors.subject = 'Please provide a subject.';
    if (!deadline) newErrors.deadline = 'A payment deadline is required.';
    if (!rentalAmount || parseFloat(rentalAmount) <= 0) newErrors.rentalAmount = 'Please enter a valid rental amount.';
    if (isNaN(parseFloat(taxRate)) || parseFloat(taxRate) < 0 || parseFloat(taxRate) > 100) newErrors.taxRate = 'Tax rate must be between 0 and 100.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      console.log("Validation failed", errors);
      return;
    }

    if (!landlordBankId) {
      alert("Landlord has not set up their bank account. Please ask them to update it in Settings.");
      return;
    }

    if (!landlordBankDetails) {
      alert("Landlord has not set up their Bank Details. Please ask them to update it in Settings.");
      return;
    }

    const billData = {
      tenantEmail,
      propertyId,
      landlordId,
      landlordEmail,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      totalAmount,
      landlordBankId
    };

    console.log("Sending billData:", billData);
    try {
      await axios.post('/api/sendBill/generate', billData);
      alert('Bill sent successfully.');
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to send the bill.');
    }
    onClose();
  };

  return (
    <div className="send-bill-popup">
      <div className="popup-content">
        <h2>Send Bill</h2>

        {!loadingBankInfo && !landlordBankId && !landlordBankDetails && (
          <div className="error-banner">
            ⚠️ No Bank Details Found. Landlord must set up their bank account in "Settings".
          </div>
        )}

        <label>
          Subject:
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter bill subject" />
          {errors.subject && <span className="error">{errors.subject}</span>}
        </label>
        <label>
          Rental Amount (PHP):
          <input type="number" value={rentalAmount} onChange={(e) => setRentalAmount(e.target.value)} placeholder="100.00" />
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
                  setUtilityFees(prevFees => {
                    const updated = [...prevFees];
                    updated[index] = { ...updated[index], name: e.target.value };
                    return updated;
                  });
                }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => {
                  setUtilityFees(prevFees => {
                    const updated = [...prevFees];
                    updated[index] = { ...updated[index], amount: e.target.value };
                    return updated;
                  });
                }}
              />
              <button onClick={() => setUtilityFees(prevFees => prevFees.filter((_, i) => i !== index))}>
                ❌
              </button>
            </div>
          ))}
          <button onClick={() => setUtilityFees(prevFees => [...prevFees, { name: '', amount: '' }])}>
            ➕ Add Utility Fee
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
                  setOtherFees(prevFees => {
                    const updated = [...prevFees];
                    updated[index] = { ...updated[index], name: e.target.value };
                    return updated;
                  });
                }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => {
                  setOtherFees(prevFees => {
                    const updated = [...prevFees];
                    updated[index] = { ...updated[index], amount: e.target.value };
                    return updated;
                  });
                }}
              />
              <button onClick={() => setOtherFees(prevFees => prevFees.filter((_, i) => i !== index))}>
                ❌
              </button>
            </div>
          ))}
          <button onClick={() => setOtherFees(prevFees => [...prevFees, { name: '', amount: '' }])}>
            ➕ Add Other Fee
          </button>
        </div>
        <label>
          Tax Rate (%):
          <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0-100" />
          {errors.taxRate && <span className="error">{errors.taxRate}</span>}
        </label>

        <label>
          Deadline:
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          {errors.deadline && <span className="error">{errors.deadline}</span>}
        </label>

        <h4>Your Bank: {bankName || '❌ Not Registered'}</h4>
        <div className="total-amount">
          <h3>Total Amount: PHP {isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2)}</h3>
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
