// src/RenewLease.js
import React, { useState } from 'react';

const RenewLease = ({ renewData }) => {
  const [signedFile, setSignedFile] = useState(null);

  const handleFileChange = (e) => {
    setSignedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('tenantId', 1);
    if (signedFile) {
      formData.append('signedLease', signedFile);
    }

    fetch('http://localhost:5000/tenant/renew-lease/upload', {
      headers: { 'Content-Type': 'application/json'
       },
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Signed lease uploaded successfully');
      })
      .catch((err) => {
        alert('Error uploading signed lease');
      });
  };

  return (
    <div>
      <h3>Renew Lease</h3>
      <p>
        Lease Proposal:{' '}
        <a href={renewData.proposalUrl} target="_blank" rel="noreferrer">
          View Proposal PDF
        </a>
      </p>
      <div>
        <label>Upload Signed Lease:</label>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
    </div>
  );
};

export default RenewLease;
