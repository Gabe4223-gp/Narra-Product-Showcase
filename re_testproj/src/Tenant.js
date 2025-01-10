import React, { useEffect, useState } from 'react';
import PaymentMethods from './PaymentMethods';
import PaymentHistory from './PaymentHistory'; // Modularized Payment History Component
import SendBillPopup from './SendBillPopup'; // Modularized Send Bill Popup Component
import { useAuth0 } from '@auth0/auth0-react';
import './Tenant.css';

function TenantsPage({ onLogout }) {
  const BaseURL = process.env.REACT_APP_API_URL;
  const { user } = useAuth0();
  const [showPopup, setShowPopup] = useState(false);

  if (!user) {
    return <p>Please log in to view tenant details.</p>;
  }

  const handleSendBill = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSendBillData = (billData) => {
    console.log('Bill Data:', billData);
    // TODO: Integrate with backend
  };

  return (
    <div className="tenants">
      <h1>Tenants/Units</h1>
      <div className="tenants-container">
        {/* Left Column: Profile and Billing Account */}
        <div className="left-column">
          <div className="profile-container">
            <img
              src="https://via.placeholder.com/150"
              alt="Tenant Profile"
              className="profile-picture"
            />
            <div className="profile-actions">
              <a href="/download" className="profile-link">download</a>
              <a href="/upload" className="profile-link">upload</a>
            </div>
          </div>

          <div className="billing-account-container">
            <h2>Billing Account</h2>
            <PaymentMethods /> {/* Reusable Payment Methods Component */}
          </div>

          <div className="lease-decisions-container">
            <h2>Lease Decisions Made by Tenant</h2>
            <p>Requested to Cancel Lease</p>
          </div>
        </div>

        {/* Right Column: Billing Activity and Actions */}
        <div className="right-column">
          <div className="billing-activity-container">
            <PaymentHistory BaseURL={BaseURL} /> {/* Reusable Payment History Component */}
          </div>
          <div className="actions-container">
            <h2>Actions</h2>
            <button onClick={handleSendBill}>Send Bill</button>
            {showPopup && (
              <SendBillPopup onClose={handleClosePopup} onSend={handleSendBillData} />
            )}
            <div className="actions-buttons">
              <span>...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantsPage;

