import React, { useState } from "react";
import "./ManagePay.css";

function ManagePay({ onSave, onClose, initialData }) {
  const [selectedType, setSelectedType] = useState(
    initialData.type || "Bank & Card"
  );

  const [formData, setFormData] = useState({
    bankName: initialData.bankName || "",
    accountName: initialData.accountName || "",
    accountNumber: initialData.accountNumber || "",
    routingNumber: initialData.routingNumber || "",
    cardholderName: initialData.cardholderName || "",
    billingAddress: initialData.billingAddress || "",
    billingZipCode: initialData.billingZipCode || "",
    paymentMethodId: initialData.paymentMethodId || "", // Stores payment method ID
    last4: initialData.last4 || "", // Display only last 4 digits of card
    expiry: initialData.expiry || "", // Display expiry month/year
    gcashMobileNumber: initialData.gcashMobileNumber || "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedType === "Bank & Card") {
      if (!formData.bankName || !formData.accountNumber || !formData.accountName || !formData.routingNumber) {
        alert("Please provide all Bank Transfer details.");
        return;
      }
      if (!formData.cardholderName || !formData.billingAddress || !formData.billingZipCode) {
        alert("Please provide all Cardholder details.");
        return;
      }
    } else if (selectedType === "GCash") {
      if (!formData.gcashMobileNumber) {
        alert("Please provide a GCash Mobile Number.");
        return;
      }
    }

    const data = { type: selectedType, ...formData };
    onSave(data);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <h3>Manage Payment Method</h3>
        <form onSubmit={handleSubmit}>
          {/* Payment Method Selection */}
          <label>Select Payment Method:</label>
          <div className="radio-options">
            {["Bank & Card", "GCash"].map((type) => (
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
  
          {/* Scrollable Bank & Card Section */}
          {selectedType === "Bank & Card" && (
            <div className="scrollable-section">
              <div className="payment-section">
                <h4>🏦 Bank Transfer Information</h4>
                <label>Bank Name:</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
                <label>Account Name:</label>
                <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="As shown in bank" />
                <label>Account Number:</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="As shown in bank" />
                <label>Routing Number:</label>
                <input type="text" name="routingNumber" value={formData.routingNumber} onChange={handleChange} placeholder="As shown in bank" />
              </div>
  
              <div className="payment-section">
                <h4>💳 Credit/Debit Card Information</h4>
                <label>Cardholder Name:</label>
                <input type="text" name="cardholderName" value={formData.cardholderName} onChange={handleChange} />
                <label>Billing Address:</label>
                <input type="text" name="billingAddress" value={formData.billingAddress} onChange={handleChange} />
                <label>Zip Code:</label>
                <input type="text" name="billingZipCode" value={formData.billingZipCode} onChange={handleChange} />
  
                {/* Display Last 4 Digits & Expiry if Card Exists */}
                {formData.last4 && (
                  <p>
                    <strong>Saved Card:</strong> **** **** **** {formData.last4} (Exp: {formData.expiry})
                  </p>
                )}
              </div>
            </div>
          )}
  
          {/* GCash Fields */}
          {selectedType === "GCash" && (
            <div className="payment-section">
              <h4>📱 GCash Information</h4>
              <label>GCash Mobile Number:</label>
              <input type="text" name="gcashMobileNumber" value={formData.gcashMobileNumber} onChange={handleChange} />
            </div>
          )}
  
          {/* Buttons */}
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );  
}

export default ManagePay;
