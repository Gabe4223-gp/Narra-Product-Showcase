import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [editPersonalDetails, setEditPersonalDetails] = useState(false);
  const [editBillingDetails, setEditBillingDetails] = useState(false);

  return (
    <div className="settings-container">
      <h3>Account Settings</h3>

      {/* Personal Details */}
      <div className="section">
        <h4>Personal Details</h4>
        <div className="fields">
          <label>Name:</label>
          <input type="text" disabled={!editPersonalDetails} placeholder="Enter your name" />
          <label>Phone no.:</label>
          <input type="text" disabled={!editPersonalDetails} placeholder="Enter phone number" />
        </div>
        <div className="fields">
          <label>Date of Birth:</label>
          <input type="date" disabled={!editPersonalDetails} />
          <label>Email:</label>
          <input type="email" disabled={!editPersonalDetails} placeholder="Enter email address" />
          <label>Password:</label>
          <button className="link-btn">Change Password</button>
        </div>
        <button
          className="edit-btn"
          onClick={() => setEditPersonalDetails(!editPersonalDetails)}
        >
          {editPersonalDetails ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Billing Details */}
      <div className="section">
        <h4>Billing Details</h4>
        <div className="billing-options">
          <span className="active">Credit Card</span>
          <span>GCash</span>
          <span>Bank transfer</span>
        </div>
        <div className="fields">
          <label>Card no.:</label>
          <input
            type="text"
            disabled={!editBillingDetails}
            placeholder="Enter card number"
          />
          <label>Name on Card:</label>
          <input
            type="text"
            disabled={!editBillingDetails}
            placeholder="Enter name on card"
          />
        </div>
        <div className="fields">
          <label>Billing Address:</label>
          <input
            type="text"
            disabled={!editBillingDetails}
            placeholder="Enter billing address"
          />
        </div>
        <div className="fields">
          <label>Expiry Date:</label>
          <input type="text" disabled={!editBillingDetails} placeholder="MM/YY" />
          <label>Postal Code:</label>
          <input
            type="text"
            disabled={!editBillingDetails}
            placeholder="Enter postal code"
          />
          <label>CVC:</label>
          <input type="text" disabled={!editBillingDetails} placeholder="Enter CVC" />
        </div>
        <button
          className="edit-btn"
          onClick={() => setEditBillingDetails(!editBillingDetails)}
        >
          {editBillingDetails ? 'Save' : 'Edit'}
        </button>
      </div>

      {/* Subscription Plan */}

      {/* Language and Currency */}
      <div className="section">
        <h4>Language and Currency</h4>
        <div className="fields">
          <span>English</span>
          <button className="link-btn">Change Language</button>
          <span>PHP</span>
          <button className="link-btn">Change Currency</button>
        </div>
      </div>

      {/* Help and Team Settings */}
      <div className="section">
        <h4>Team Settings</h4>
        <button className="link-btn">View Team</button>
      </div>
      <div className="section">
        <h4>Help</h4>
        <button className="link-btn danger">Delete Account</button>
      </div>
    </div>
  );
};

export default Settings;
