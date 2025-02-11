// src/ManageLease.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageLease = ({ leaseData, userId }) => {
  const [billingDeadline, setBillingDeadline] = useState(null);
  const handleViewLease = () => {
    window.open(leaseData.leaseAgreementUrl, '_blank');
  };

  useEffect(() => {
    async function fetchBillingDeadline() {
      try {
        const response = await axios.get(`/tenant/${userId}/billingDeadline`);
        setBillingDeadline(response.data.billingDeadline);
      } catch (error) {
        console.error('Error fetching billing deadline:', error);
        setBillingDeadline(null);
      }
    }
    fetchBillingDeadline();
  }, [userId]);

  const handleRequestEndLease = () => {
    // Send a request to end the lease
    fetch('http://localhost:5000/tenant/lease/end-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: 1, leaseId: leaseData.id }),
    })
      .then((res) => res.json())
      .then((data) => alert('End lease request sent'))
      .catch((err) => alert('Error sending request'));
  };

  return (
    <div>
      <h3>Manage Lease</h3>
      <p>
        <strong>Lease Start:</strong> {leaseData.leaseStart}
      </p>
      <p>
        <strong>Lease End:</strong> {leaseData.leaseEnd}
      </p>
      <p>
        <strong>Monthly Rent:</strong> PHP {leaseData.monthlyRent}
      </p>
      <p>
        <strong>Billing Deadline:</strong> {billingDeadline ? new Date(billingDeadline).toLocaleDateString()
         : "No bills yet"}
      </p>
      <button onClick={handleViewLease}>View Lease</button>
      <button onClick={handleRequestEndLease}>Request to End Lease</button>
    </div>
  );
};

export default ManageLease;
