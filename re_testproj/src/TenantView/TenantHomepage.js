import React, { useState, useEffect, useCallback } from 'react';
import './TenantHomepage.css';
import ManageBilling from './ManageBilling';
import ManagePaymentMethods from './ManagePaymentMethods';
import ManageLease from './ManageLease';
import RenewLease from './RenewLease';
import { useUserProfile } from '../UserProfileContext.js';
import { useLocation } from 'react-router-dom';

const TenantHomepage = () => {
  const { userProfile, refreshUserProfile } = useUserProfile();
  const location = useLocation();

  const [leaseData, setLeaseData] = useState({
    leaseStarted: null,
    leaseExpiry: null,
    currentLeaseDoc: null,
  });

  // Fetch user profile once on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirected = params.get("redirected");

    console.log("Checking for redirected:", redirected);

    if (redirected === "true") {
      refreshUserProfile();
    }

    const fetchProfileAndLease = async () => {
      await refreshUserProfile();
    };

    fetchProfileAndLease();
  }, [location.search]);

  // fetchLeaseData accesses userProfile internally
  const fetchLeaseData = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const res = await fetch(`/current-lease/${userProfile.id}`);
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

      <div className="additional-containers" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* ManageBilling will now handle success/failure messages */}
        <ManageBilling tenantEmail={tenantEmail} key={location.search} />
        <ManageLease leaseData={leaseData} />
        <RenewLease onUploadSignedLease={fetchLeaseData} />
        <ManagePaymentMethods />
      </div>
    </div>
  );
};

export default TenantHomepage;
