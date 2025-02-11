// src/ManagePay.js
import React, { useState } from "react";

function ManagePay({ onSave, onClose, initialData, availableTypes }) {
  // Set the initial payment method type.
  const [selectedType, setSelectedType] = useState(
    initialData.type || (availableTypes.length > 0 ? availableTypes[0] : "")
  );
  const [formData, setFormData] = useState({
    // For Debit/Credit Card
    cardholderName: initialData.cardholderName || "",
    billingAddress: initialData.billingAddress || "",
    cardNumber: initialData.cardNumber || "",
    expiryDate: initialData.expiryDate
      ? initialData.expiryDate.split("T")[0]
      : "",
    cvv: initialData.cvv || "",
    billingZipCode: initialData.billingZipCode || "",
    // For Bank Transfer
    bank: initialData.bank || "",
    accountNumber: initialData.accountNumber || "",
    accountName: initialData.accountName || "",
    // For GCash
    gcashMobileNumber: initialData.gcashMobileNumber || "",
  });

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
      data.expiryDate = formData.expiryDate;
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
    <div className="modal-overlay">
      <div className="modal">
        <h3>Manage Pay</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Payment Method:</label>
            <div>
              {availableTypes.map((type) => (
                <label key={type} className="radio-label">
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

          {selectedType === "Debit/Credit Card" && (
            <div className="payment-fields">
              <div className="form-group">
                <label>Name on Card:</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Billing Address:</label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Card Number:</label>
                <input
                  type="number"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Expiry Date:</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>CVV:</label>
                <input
                  type="number"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Zip Code:</label>
                <input
                  type="text"
                  name="billingZipCode"
                  value={formData.billingZipCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {selectedType === "Bank Transfer" && (
            <div className="payment-fields">
              <div className="form-group">
                <label>Your Bank:</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Account Number:</label>
                <input
                  type="number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Account Name:</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {selectedType === "GCash" && (
            <div className="payment-fields">
              <div className="form-group">
                <label>GCash Mobile Number:</label>
                <input
                  type="number"
                  name="gcashMobileNumber"
                  value={formData.gcashMobileNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={onClose}>
              Exit
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManagePay;
