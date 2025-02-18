// src/RenewLease.js
import React, { useState } from 'react';
import './RenewLease.css';

function RenewLease({ tenantId }) {
  const [signedFile, setSignedFile] = useState(null);

  const handleFileChange = (e) => {
    setSignedFile(e.target.files[0]);
  };

  // call GET /api/lease-proposal/:tenantId/view to open the proposal
  const handleViewProposal = async () => {
    try {
      const res = await fetch(`/api/lease-proposal/${tenantId}/view`);
      if (res.status === 404) {
        alert("No Proposal Found");
        return;
      }
      // If local: we might get the PDF directly. 
      // If AWS: we might get { proposalUrl: "..."}
      // So let's handle both:
      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.proposalUrl) {
          window.open(data.proposalUrl, '_blank');
        } else {
          alert(data.message || 'No Proposal Found');
        }
      } else {
        // This means it's probably a direct PDF from local approach
        // We can open it in a new window if we can convert to blob
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch (err) {
      alert("Error retrieving proposal PDF");
    }
  };

  const handleUpload = async () => {
    if (!signedFile) {
      alert("Please choose a PDF file before uploading.");
      return;
    }
    const formData = new FormData();
    formData.append('signedLease', signedFile);

    try {
      const res = await fetch(`/api/lease-proposal/${tenantId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Error uploading signed lease');
        return;
      }
      alert(data.message || 'Signed lease uploaded successfully');
    } catch (err) {
      alert('Error uploading signed lease');
    }
  };

  return (
    <div className="renew-lease">
      <h3>Renew Lease</h3>
      <button onClick={handleViewProposal}>View Lease Proposal</button>
      <div>
        <label>Upload Signed Lease:</label>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );  
}

export default RenewLease;
