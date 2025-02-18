// src/ManageLease.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageLease.css';

const ManageLease = ({ tenantEmail }) => {
  const [leaseData, setLeaseData] = useState({
    leaseStart: null,
    leaseEnd: null,
    monthlyRent: null,
    billingDeadline: null,
    agreementUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch lease agreement information from the backend
  useEffect(() => {
    async function fetchLeaseData() {
      try {
        const res = await axios.get(`/api/leaseAgreement/${encodeURIComponent(tenantEmail)}`);
        // Expecting leaseData from backend. If not found, backend should send nulls.
        setLeaseData(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching lease data:", err);
        setError("Could not fetch lease data.");
      } finally {
        setLoading(false);
      }
    }
    if (tenantEmail) {
      fetchLeaseData();
    } else {
      setLoading(false);
    }
  }, [tenantEmail]);

  const handleViewLease = () => {
    if (leaseData.agreementUrl) {
      window.open(leaseData.agreementUrl, '_blank');
    } else {
      alert("No Lease Agreement PDF found.");
    }
  };

  const handleRequestEndLease = async () => {
    const inputEmail = window.prompt("Enter your email to request lease end:");
    if (!inputEmail) {
      alert("Email is required to send an end lease request.");
      return;
    }
    try {
      const res = await axios.post('/api/leaseAgreement/end-request', {
        tenantEmail: inputEmail,
        subject: "Tenant wants to end lease",
      });
      alert(res.data.message || "Lease end request sent.");
    } catch (err) {
      console.error("Error sending lease end request:", err);
      alert("Error sending lease end request.");
    }
  };

  return (
    <div className="manage-lease">
      <h3>Manage Lease</h3>
      {loading ? (
        <p>Loading lease information...</p>
      ) : (
        <>
          <p>
            <strong>Lease Start:</strong>{" "}
            {leaseData.leaseStart ? new Date(leaseData.leaseStart).toLocaleDateString() : "No Lease Start Found"}
          </p>
          <p>
            <strong>Lease End:</strong>{" "}
            {leaseData.leaseEnd ? new Date(leaseData.leaseEnd).toLocaleDateString() : "No Lease End Found"}
          </p>
          <p>
            <strong>Monthly Rent:</strong>{" "}
            {leaseData.monthlyRent ? `PHP ${parseFloat(leaseData.monthlyRent).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "No Monthly Rent Found"}
          </p>
          <p>
            <strong>Billing Deadline:</strong>{" "}
            {leaseData.billingDeadline ? new Date(leaseData.billingDeadline).toLocaleDateString() : "No Billing Deadline Found"}
          </p>
          <div className="lease-actions">
            <button onClick={handleViewLease}>View Lease</button>
            <button onClick={handleRequestEndLease}>Request to End Lease</button>
          </div>
          {error && <div className="error-banner">{error}</div>}
        </>
      )}
    </div>
  );
};

export default ManageLease;
