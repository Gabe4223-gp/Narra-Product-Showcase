// src/ManageLease.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageLease.css';
import { useUserProfile } from "../UserProfileContext";

const ManageLease = ({ leaseData }) => {
  const { userProfile } = useUserProfile();
  const [previewLease, setPreviewLease] = useState(null);
  const [leaseError, setLeaseError] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [endingLease, setEndingLease] = useState(false);
  const [endRequestMessage, setEndRequestMessage] = useState("");

  // Optional: this renders before the profile resolves on a cold load.
  const tenantId = userProfile?.id;

  // Fetch lease agreement information from the backend
  /*useEffect(() => {
    async function fetchLeaseData() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/leaseAgreement/${encodeURIComponent(tenantEmail)}`);
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

  const leaseDoc = leaseData?.currentLeaseDoc;
  const hasLeaseDoc = Boolean(leaseDoc?.fileName);

  const fetchLeaseDocument = async () => {
    // currentLeaseDoc is null until a lease exists. The optional chain used to
    // stop at leaseData, so `.currentLeaseDoc.fileName` still threw
    // "Cannot read properties of undefined (reading 'fileName')".
    if (!hasLeaseDoc) {
      setLeaseError("There is no lease document to view yet.");
      return;
    }
    if (!tenantId) {
      setLeaseError("We could not identify your tenant record.");
      return;
    }

    setLoadingDoc(true);
    setLeaseError("");

    try {
      // /tenants/get-lease, not /tenants/get-id -- the latter serves government
      // ID uploads. Both take the same parameters, so the mix-up returned the
      // wrong document rather than an obvious error.
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/tenants/get-lease?tenantId=${encodeURIComponent(tenantId)}&fileName=${encodeURIComponent(leaseDoc.fileName)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Retrieval failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data?.fileContent) {
        throw new Error('The document came back empty.');
      }

      // The server returns bare base64; strip a data-URI prefix only if one is
      // present. The previous pattern was missing its ':' and ';' and so never
      // matched anything.
      const cleanedBase64 = String(data.fileContent).replace(/^data:[^;]+;base64,/, '');

      setPreviewLease({
        fileContent: `data:${data.fileType};base64,${cleanedBase64}`,
        fileName: leaseDoc.fileName,
        fileType: data.fileType,
      });
    } catch (error) {
      console.error("Error retrieving lease:", error);
      setLeaseError("We could not open that lease document. Please try again.");
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleRequestEndLease = async () => {
    if (!tenantId) {
      setLeaseError("We could not identify your tenant record.");
      return;
    }
    // The tenant is signed in, so asking them to retype their email served no
    // purpose. The server resolves the tenancy from the session's profile.
    if (!window.confirm("Send a request to your landlord to end this lease?")) {
      return;
    }

    const reason = window.prompt("Add a note for your landlord (optional):") || "";

    setEndingLease(true);
    setLeaseError("");
    setEndRequestMessage("");

    try {
      // /api/tenant/lease/end-request -- the old path (/api/leaseAgreement/...)
      // was never mounted, so this always 404'd.
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tenant/lease/end-request`,
        { tenantId, reason }
      );
      setEndRequestMessage(res.data?.message || "Your request has been sent.");
    } catch (err) {
      console.error("Error sending lease end request:", err);
      setLeaseError(
        err?.response?.data?.message || "We could not send your request. Please try again."
      );
    } finally {
      setEndingLease(false);
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
        {leaseDoc?.subject ? leaseDoc.subject : "—"}
      </p>

      {hasLeaseDoc && (
        <p className="manage-lease-status">
          {leaseDoc.signed
            ? "This lease has been signed."
            : "Awaiting your signature."}
        </p>
      )}
      <div className="manage-lease-actions">
        <button onClick={fetchLeaseDocument} disabled={!hasLeaseDoc || loadingDoc}>
          {loadingDoc ? 'Opening...' : 'View Lease'}
        </button>
        {!hasLeaseDoc && (
          <span className="manage-lease-hint">No lease document uploaded yet.</span>
        )}

        <button
          className="end-lease-btn"
          onClick={handleRequestEndLease}
          disabled={endingLease}
        >
          {endingLease ? "Sending..." : "Request to End Lease"}
        </button>
      </div>

      {endRequestMessage && <p className="manage-lease-success">{endRequestMessage}</p>}

      {leaseError && <p className="manage-lease-error">{leaseError}</p>}
      
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