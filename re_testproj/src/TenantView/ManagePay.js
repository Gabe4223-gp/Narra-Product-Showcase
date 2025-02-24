// src/ManagePay.js
import React, { useState } from "react";

function ManagePay({ onSave, onClose, initialData, availableTypes }) {
  const [selectedType, setSelectedType] = useState(initialData.type || (availableTypes.length > 0 ? availableTypes[0] : ""));
  const [formData, setFormData] = useState({
    cardholderName: initialData.cardholderName || "",
    billingAddress: initialData.billingAddress || "",
    cardNumber: initialData.cardNumber || "",
    expiryDate: initialData.expiryDate || "",
    cvv: initialData.cvv || "",
    billingZipCode: initialData.billingZipCode || "",
    bank: initialData.bank || "",
    accountNumber: initialData.accountNumber || "",
    accountName: initialData.accountName || "",
    gcashMobileNumber: initialData.gcashMobileNumber || "",
  });

  // Update fields as user types
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { type: selectedType };

    if (selectedType === "Debit/Credit Card") {
      data.cardholderName = formData.cardholderName;
      data.billingAddress = formData.billingAddress;
      data.cardNumber = formData.cardNumber;
      data.expiryDate = formData.expiryDate; // ideally "MM-YYYY"
      data.cvv = formData.cvv;
      data.billingZipCode = formData.billingZipCode;
    } else if (selectedType === "Bank Transfer") {
      data.bank = formData.bank;
      data.accountNumber = formData.accountNumber;
      data.accountName = formData.accountName;
    } else if (selectedType === "GCash") {
      data.gcashMobileNumber = formData.gcashMobileNumber;
    }
    onSave(data);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Manage Pay</h3>
        <form onSubmit={handleSubmit}>
          {/* Payment Method Selection */}
          <div className="form-group">
            <label>Select Payment Method:</label>
            <div className="radio-options">
              {availableTypes.map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    value={type}
                    checked={selectedType === type}
                    onChange={(e) => setSelectedType(e.target.value)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Conditional fields */}
          {selectedType === "Debit/Credit Card" && (
            <div className="payment-fields">
              <label>Name on Card:</label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleChange}
              />
              <label>Billing Address:</label>
              <input
                type="text"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleChange}
              />
              <label>Card Number (16 digits):</label>
              <input
                type="text"
                name="cardNumber"
                placeholder="####-####-####-####"
                value={formData.cardNumber}
                onChange={handleChange}
              />
              <label>Expiry Date (MM-YYYY):</label>
              <input
                type="text"
                name="expiryDate"
                placeholder="MM-YYYY"
                value={formData.expiryDate}
                onChange={handleChange}
              />
              <label>CVV:</label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
              />
              <label>Zip Code:</label>
              <input
                type="text"
                name="billingZipCode"
                value={formData.billingZipCode}
                onChange={handleChange}
              />
            </div>
          )}

          {selectedType === "Bank Transfer" && (
            <div className="payment-fields">
              <label>Your Bank:</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleChange}
              />
              <label>Account Number:</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
              />
              <label>Account Name:</label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
              />
            </div>
          )}

          {selectedType === "GCash" && (
            <div className="payment-fields">
              <label>GCash Mobile Number:</label>
              <input
                type="text"
                name="gcashMobileNumber"
                placeholder="+63 ### ### ####"
                value={formData.gcashMobileNumber}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManagePay;
