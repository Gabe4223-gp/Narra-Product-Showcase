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
  const tenantId = userProfile.id;

  const [leaseData, setLeaseData] = useState({
      leaseStarted: null,
      leaseExpiry: null,
      currentLeaseDoc: null,
    });

  const fetchLeaseData = async () => {
    
      try {
        const res = await fetch(`/current-lease/${tenantId}`);
        const data = await res.json();
        console.log("data ha", data);
        setLeaseData(data);
      } catch (err) {
        console.error("Error fetching lease data:", err);
      } 
  }
  
  useEffect(() => {
      
    fetchLeaseData();
    
  }, []);

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
      <div className="additional-containers" style={{display:"flex",flexDirection:'column', gap:'15px'}}>
        <ManageLease 
          leaseData={leaseData}
        />
        <RenewLease 
          onUploadSignedLease={fetchLeaseData}
        />
        <ManagePaymentMethods />
      </div>
    </div>
  );
};

export default TenantHomepage;
