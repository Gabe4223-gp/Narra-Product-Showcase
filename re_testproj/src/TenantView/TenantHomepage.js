// src/TenantHomepage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TenantHomepage.css';
import ManageBilling from './ManageBilling';
import ManagePaymentMethods from './ManagePaymentMethods';
import ManageLease from './ManageLease';
import RenewLease from './RenewLease';
import { useUserProfile } from '../UserProfileContext.js';
import { useSearchParams} from 'react-router-dom';

const TenantHomepage = () => {
  const { userProfile, refreshUserProfile } = useUserProfile();
  const [searchParams] = useSearchParams();
  const redirected = searchParams.get("redirected");

  const [leaseData, setLeaseData] = useState({
      leaseStarted: null,
      leaseExpiry: null,
      currentLeaseDoc: null,
    });

  // Fetch user profile once on mount (no dependency)
  useEffect(() => {
    if (redirected) {
      refreshUserProfile();
    }

    const fetchProfileAndLease = async () => {
      await refreshUserProfile(); // Wait for profile to load
    };
    fetchProfileAndLease();
  }, [redirected]); // Empty dependency to run only once

  // fetchLeaseData accesses userProfile internally
  const fetchLeaseData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/current-lease/${userProfile.id}`);
      const data = await res.json();
      console.log('Lease data:', data);
      setLeaseData(data);
    } catch (err) {
      console.error('Error fetching lease data:', err);
    }
  }, [userProfile?.id]);

  // Fetch lease data once userProfile is available
  useEffect(() => {
    if (userProfile?.id) {
      fetchLeaseData();
    }
  }, [userProfile?.id, fetchLeaseData]);
  

  // Wait until the profile is loaded
  if (!userProfile) {
    return <div>Loading your profile...</div>;
  }
  
  const tenantEmail = userProfile.email;

  return (
    <div className="tenant-homepage">
      <header className="top-bar">
        <h5>Tenant Dashboard</h5>
      </header>
      {/* You can let ManageBilling fetch files; no need for duplicate fetch here */}
      <div className="additional-containers" style={{display:"flex",flexDirection:'column', gap:'15px'}}>
        <ManageBilling tenantEmail={tenantEmail} />
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
