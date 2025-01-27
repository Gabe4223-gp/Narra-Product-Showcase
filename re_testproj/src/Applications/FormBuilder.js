import React, { useState } from 'react';
import axios from 'axios';
import './FormBuilder.css';

const FormBuilder = ({ onClose, fetchForms }) => {
  const [formType, setFormType] = useState('Tenant Application');
  const [billingType, setBillingType] = useState('Credit/Debit Card');
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    dob: '',
    occupation: '',
    phone: '',
    email: '',
    nationality: '',
    message: '',
    cardNumber: '',
    nameOnCard: '',
    billingAddress: '',
    expiryDate: '',
    postalCode: '',
    cvc: '',
    photo: null,
    governmentId: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('type', formType);

    if (formType === 'Tenant Application') {
      formDataToSend.append('personalDetails', JSON.stringify(formData.personalDetails));
      formDataToSend.append('billingDetails', JSON.stringify(formData.billingDetails));
    } else if (formType === 'Complaint') {
      formDataToSend.append('content', formData.complaint);
    }

    if (formData.photo) {
      formDataToSend.append('photo', formData.photo);
    }

    if (formData.governmentId) {
      formDataToSend.append('governmentId', formData.governmentId);
    }

    try {
      await axios.post(`${process.env.REACT_APP_BASE_URL}/forms`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Form saved successfully!');
      fetchForms(); // Refresh the forms list
      onClose(); // Close the popup
    } catch (err) {
      console.error('Error saving form:', err);
      alert('Failed to save form.');
    }
  };
  
  return (
    <div className="form-builder-popup">
      <div className="form-builder-header">
        <h3>Form Builder</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>

      <div className="form-builder-body">
        <div className="form-section">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-section">
          <label>Type:</label>
          <select name="formType" value={formType} onChange={(e) => setFormType(e.target.value)}>
            <option value="Tenant Application">Tenant Application</option>
            <option value="Complaint">Complaint</option>
          </select>
        </div>

        {formType === 'Complaint' && (
            <div className="form-section">
                <label>Complaint:</label>
                <textarea
                name="complaint"
                value={formData.complaint || ''}
                onChange={handleInputChange}
                placeholder="Type your complaint here..."
                style={{ height: '100px', resize: 'none' }}
                />
            </div>
        )}


        {formType === 'Tenant Application' && (
          <>
            <h4>Personal Details</h4>
            <div className="form-row">
              <div className="form-section">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-section">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-section">
              <label>Occupation:</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                placeholder="Enter your occupation"
              />
            </div>
            <div className="form-row">
              <div className="form-section">
                <label>Phone No:</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-section">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="form-section">
              <label>Nationality:</label>
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
              >
                <option value="">Select nationality</option>
                <option value="Filipino">Filipino</option>
                <option value="American">American</option>
                <option value="Chinese">Chinese</option>
                <option value="Indonesian">Indonesian</option>
                <option value="Japanese">Japanese</option>
                <option value="South Korean">South Korean</option>
                <option value="Singaporean">Singaporean</option>
                <option value="Thai">Thai</option>
                <option value="Chinese Taipei">Chinese Taipei</option>
                <option value="Malaysian">Malaysian</option>
                <option value="Vietnamese">Vietnamese</option>
                <option value="German">German</option>
                <option value="British">British</option>
                <option value="Australian">Australian</option>
                <option value="French">French</option>
                <option value="Russian">Russian</option>
                <option value="Spanish">Spanish</option>
                <option value="Italian">Italian</option>
                <option value="Mexican">Mexican</option>
                <option value="Brazilian">Brazilian</option>
                <option value="Dutch">Dutch</option>
                <option value="Canadian">Canadian</option>
                <option value="Indian">Indian</option>
                <option value="Turkish">Turkish</option>
                <option value="Saudi Arabian">Saudi Arabian</option>
                <option value="Other">Other</option>
                {/* Add more nationalities */}
              </select>
            </div>
            <div className="form-section">
              <label>Message (optional):</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Add additional info"
              />
            </div>

            <h4>Billing Details</h4>
            <div className="form-section">
              <label>Billing Type:</label>
              <select
                name="billingType"
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
              >
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="PayMaya">PayMaya</option>
                <option value="GCash">GCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {billingType === 'Credit/Debit Card' && (
                <>
                    <div className="form-section">
                    <label>Billing Address:</label>
                    <input
                        type="text"
                        name="billingAddress"
                        value={formData.billingAddress}
                        onChange={handleInputChange}
                        placeholder="Enter billing address"
                    />
                    </div>
                    <div className="form-row">
                    <div className="form-section">
                    <label>Card Number:</label>
                    <input
                        type="card"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="Enter card number"
                    />
                    </div>
                    <div className="form-section">
                    <label>Name on Card:</label>
                    <input
                        type="text"
                        name="nameOnCard"
                        value={formData.nameOnCard}
                        onChange={handleInputChange}
                        placeholder="Enter name"
                    />
                    </div>
                    </div>
                    <div className="form-row">
                    <div className="form-section">
                        <label>Expiry Date:</label>
                        <input
                        type="month"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-section">
                        <label>Postal Code:</label>
                        <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Enter postal code"
                        />
                    </div>
                    <div className="form-section">
                        <label>CVC:</label>
                        <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={handleInputChange}
                        placeholder="Enter CVC"
                        />
                    </div>
                    </div>
                </>
            )}

            <h4>File Upload</h4>
            <div className="form-row">
              <div className="form-section">
                <label>Photo (optional):</label>
                <input
                  type="file"
                  name="photo"
                  accept=".jpeg,.jpg,.png"
                  onChange={handleFileChange}
                />
              </div>
              <div className="form-section">
                <label>Government ID:</label>
                <input
                  type="file"
                  name="governmentId"
                  accept=".jpeg,.jpg,.png"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="form-builder-footer">
        <button onClick={onClose} className="cancel-btn">Cancel</button>
        <button onClick={handleSave} className="save-btn">Save</button>
      </div>
    </div>
  );
};

export default FormBuilder;
