// src/TenantHomepage.js
import React, { useState, useEffect } from 'react';
import ManageLease from './ManageLease';
import ManageBilling from './ManageBilling';
import ManagePaymentMethods from './ManagePaymentMethods';
import RenewLease from './RenewLease';
import './TenantHomepage.css';

const TenantHomepage = () => {
  // Initialize state with fallback data so the layout has something to render
  const [dashboardData, setDashboardData] = useState({
    lease: {
      leaseStart: "N/A",
      leaseEnd: "N/A",
      monthlyRent: "N/A",
      leaseAgreementUrl: "#",
    },
    billing: [],
    paymentMethods: [],
    renewLease: {
      proposalUrl: "#",
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tenantId = 1; // Fixed tenant id for local testing

  useEffect(() => {
    fetch(`http://localhost:5000/tenant/dashboard?tenantId=${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
        setLoading(false);
        // We keep the fallback data in dashboardData so that the layout still shows.
      });
  }, [tenantId]);

  return (
    <div className="tenant-applications">
      <div className="top-bar">
        <h2>Tenant Dashboard</h2>
        {/* Display an error banner if the fetch failed */}
        {error && (
          <div className="error-banner" style={{ color: 'red' }}>
            Error: {error}. Displaying fallback layout.
          </div>
        )}
      </div>

      {loading ? (
        <div>Loading Dashboard...</div>
      ) : (
        <div className="application-list">
          <div className="top-section">
            <div className="dashboard-container">
              <ManageLease leaseData={dashboardData.lease} />
            </div>
            <div className="dashboard-container">
              <RenewLease renewData={dashboardData.renewLease} />
            </div>
          </div>
          <div className="bottom-section">
            <div className="dashboard-container">
              <ManageBilling billingData={dashboardData.billing} />
            </div>
            <div className="dashboard-container">
              <ManagePaymentMethods paymentMethods={dashboardData.paymentMethods} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantHomepage;
