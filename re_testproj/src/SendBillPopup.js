// src/SendBillPopup.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendBillPopup.css';

function SendBillPopup({ onClose, onRefreshPayments, tenantEmail, user_id, propertyId, landlordId, landlordEmail }) {
  console.log("the landlordid", landlordId);
  const [subject, setSubject] = useState('');
  const [rentalAmount, setRentalAmount] = useState('');
  const [utilityFees, setUtilityFees] = useState([{ date: '', name: '', amount: '' }]);
  const [otherFees, setOtherFees] = useState([{ date: '', name: '', amount: '' }]);
  const [taxRate, setTaxRate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [landlordBankId, setLandlordBankId] = useState(null);
  const [bankName, setBankName] = useState(null);
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);
  const [landlordBankDetails, setLandlordBankDetails] = useState(null);
  const [personalAddressInfo, setPersonalAddressInfo] = useState(null);
  const [bankInfoErrors, setBankInfoErrors] = useState([]);

  useEffect(() => {
    const fetchLandlordBankDetails = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/sendBill/get-landlord-payment/${landlordId}`);
        if (res.data) {
          setLandlordBankId(res.data.landlordBankId);
          setBankName(res.data.bankName);
          setLandlordBankDetails(res.data.landlordBankDetails);
          setPersonalAddressInfo(res.data.personalAddressInfo);
        } else {
          setLandlordBankId(null);
          setBankName(null);
          setLandlordBankDetails(null);
          setPersonalAddressInfo(null);
        }
      } catch (error) {
        console.error('Error fetching landlord payment details:', error);
        setLandlordBankId(null);
        setBankName(null);
        setLandlordBankDetails(null);
        setPersonalAddressInfo(null);
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

  const validateLandlordInfo = () => {
    const errors = [];
    if (!landlordBankId) {
      errors.push("No Bank Found. Please set up your bank account in 'Settings'.");
    }
    if (!bankName) {
      errors.push("No Bank Name Found. Please set up your bank account in 'Settings'.");
    }
    console.log("personalAddressInfo", personalAddressInfo);
    if (!personalAddressInfo) {
      errors.push("No Address Found. Please set up your address in 'Settings'.");
    }
    if (!landlordBankDetails) {
      errors.push("No Bank Account Info Found. Please set up your bank account in 'Settings'.");
    } else {
      // Define required fields in landlordBankDetails (customize as needed)
      const requiredFields = ['accountNumber', 'accountName', 'accountType', 'routingNumber', 'swiftBicCode'];
      const missingFields = requiredFields.filter(field => {
        return (
          !landlordBankDetails[field] ||
          landlordBankDetails[field].toString().trim() === ""
        );
      });
      if (missingFields.length > 0) {
        errors.push(`No ${missingFields.join(", ")} found in Bank Details. Please set up your bank account in 'Settings'.`);
      }
      // Special check for currency inside landlordBankDetails
      if (!landlordBankDetails.currency || landlordBankDetails.currency.toString().trim() === "") {
        errors.push("No Currency found in Bank Details. Please set up your bank account in 'Settings'.");
      }
    }
    setBankInfoErrors(errors);
    return errors.length === 0;
  };

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

    if (!validateLandlordInfo()) {
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
      user_id,
      notes,
      landlordBankDetails,
    };

    console.log("Sending billData:", billData);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/sendBill/generate`, billData);
      alert('Bill sent successfully.');
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to send the bill.');
    }
    onClose();
    onRefreshPayments();
  };

  return (
    <div className="send-bill-popup">
      <div className="popup-content">
        <h2>Send Bill</h2>
        <p>
         ⚠️ If you represent a business, please register your business in the settings page before sending a bill.
        </p>

        {/* Display bank info error banners if present */}
        {!loadingBankInfo && bankInfoErrors.length > 0 && bankInfoErrors.map((error, index) => (
          <div key={index} className="error-banner">
            ⚠️ {error}
          </div>
        ))}

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
                type="date"
                placeholder="Bill Date"
                value={fee.date}
                onChange={(e) => {
                  const updated = [...utilityFees];
                  updated[index].date = e.target.value;
                  setUtilityFees(updated);
                }}
              />
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
                type="date"
                placeholder="Bill date"
                value={fee.name}
                onChange={(e) => {
                  const updated = [...otherFees];
                  updated[index].date = e.target.value;
                  setOtherFees(updated);
                }}
              />
              <input
                type="text"
                placeholder="e.g., Parking"
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
        <label>
          Notes:
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4} // Adjust rows as needed
            cols={50} // Adjust cols as needed
            style={{ width: "100%" }} // Ensures full width
          />
        </label>
        <div className="total-amount">
          <h3>Total Amount: PHP {isNaN(totalAmount) ? '0.00' : totalAmount.toFixed(2)}</h3>
          <h7 style={{fontWeight:'normal', fontSize:'9px', color:'black'}}>Note: Minimum bill is P21.0</h7>
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
