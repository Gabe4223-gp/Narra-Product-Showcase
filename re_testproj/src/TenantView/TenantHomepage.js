// src/TenantHomepage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TenantHomepage.css';
import ManageBilling from './ManageBilling';
import ManagePaymentMethods from './ManagePaymentMethods';
import ManageLease from './ManageLease';
import RenewLease from './RenewLease';
import { useUserProfile } from '../UserProfileContext.js';

const TenantHomepage = () => {
  const { userProfile } = useUserProfile();

  // Wait until the profile is loaded
  if (!userProfile) {
    return <div>Loading your profile...</div>;
  }
  
  const tenantEmail = userProfile.email;

  return (
    <div className="tenant-homepage">
      <header className="top-bar">
        <h2>Tenant Dashboard</h2>
      </header>
      {/* You can let ManageBilling fetch files; no need for duplicate fetch here */}
      <ManageBilling tenantEmail={tenantEmail} />
      <div className="additional-containers">
        <RenewLease />
        <ManageLease />
        <ManagePaymentMethods />
      </div>
    </div>
  );
};

export default TenantHomepage;
