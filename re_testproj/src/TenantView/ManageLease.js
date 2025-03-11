// src/ManageLease.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageLease.css';
import { useUserProfile } from "../UserProfileContext";

const ManageLease = ({ leaseData }) => {
  const { userProfile } = useUserProfile();
  const [previewLease, setPreviewLease] = useState(null);
  const [isFetched, setIsFetched] = useState(false); // Prevents repeated fetching

  const tenantId = userProfile.id;

  // Fetch lease agreement information from the backend
  /*useEffect(() => {
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
  }, [tenantEmail]);*/

  useEffect(() => {
    console.log("ManageLease received new leaseData:", leaseData); // Debugging line
  }, [leaseData]);

  /*useEffect(() => {
    if (!isFetched && leaseData?.currentLeaseDoc) {
      fetchLeaseDocument();
      setIsFetched(true);
    }
  }, [isFetched, leaseData]);*/

  const fetchLeaseDocument = async () => {
    try {
      console.log("Fetching lease document...");
      const response = await fetch(`/tenants/get-id?tenantId=${tenantId}&fileName=${leaseData?.currentLeaseDoc.fileName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Retrieval failed: ${response.statusText}`);
      }

      const data = await response.json();
      const cleanedBase64 = data.fileContent.replace(/^dataapplication\/pdfbase64/, ""); 
      
      console.log("Here's the doc", data);

      const loadedDoc = {
        fileContent: `data:${data.fileType};base64,${cleanedBase64}`,
        fileName: leaseData.currentLeaseDoc.fileName,
        fileType: data.fileType,
      };

      console.log("Here's the loadedDoc", loadedDoc);
      setPreviewLease(loadedDoc);

    } catch (error) {
      console.error("Error retrieving lease:", error);
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
      <div className="manage-lease-header">
        <h5>Manage Lease</h5>
      </div>
    
      <div className="manage-lease-dates">
        <p>
          <h6>Lease Started:</h6>{" "}
          {leaseData?.leaseStarted ? new Date(leaseData?.leaseStarted).toLocaleDateString() : "No Lease Start Found"}
        </p>
        <p>
          <h6>Lease Expiry:</h6>{" "}
          {leaseData?.leaseExpiry ? new Date(leaseData?.leaseExpiry).toLocaleDateString() : "No Lease End Found"}
        </p>
      </div>
      <p>
        <h6>Subject:</h6>{" "}
        {leaseData?.currentLeaseDoc?.subject ? leaseData?.currentLeaseDoc?.subject : " "}
      </p>
      <div className="manage-lease-actions">
        <button onClick={fetchLeaseDocument}>View Lease</button>
      </div>
      
      {previewLease && (
        <div className='preview-lease-overlay'>
            <div className='preview-lease-modal'>
                {previewLease?.fileContent ? (
                    (previewLease?.fileType === 'image/png' || 
                        previewLease?.fileType === 'image/jpeg' || 
                        previewLease?.fileType === 'image/jpg') ? (
                        <img
                            id="imageViewer"
                            src={previewLease?.fileContent}
                            alt="Selected"
                            style={{
                                width: "100%",
                                height: "auto",
                                border: "1px solid #ccc",
                            }}
                        />
                    ) : previewLease?.fileType === 'application/pdf' ? (
                        <iframe
                            id="pdfViewer"
                            src={previewLease?.fileContent}
                            style={{
                                width: "100%",
                                height: "600px",
                                border: "1px solid #ccc",
                            }}
                        ></iframe>
                    ) : (
                        <p>Unsupported file type</p>
                    )
                ) : (
                    <p>No document selected</p>
                )}
                <div>
                    <button onClick={() => setPreviewLease(null)}>Back</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageLease;