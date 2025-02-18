// src/TenantHomepage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TenantHomepage.css';
import ManageBilling from './ManageBilling'; //Passing tenantemail to ManageBilling
import ManagePaymentMethods from './ManagePaymentMethods';
import ManageLease from './ManageLease';
import RenewLease from './RenewLease';

const TenantHomepage = ({ tenantEmail }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;

  useEffect(() => {
    async function fetchFiles() {
      try {
        // Updated endpoint to match the route: /tenant/:tenantemail/files
        const res = await axios.get(`/tenant/${encodeURIComponent(tenantEmail)}/files`);
        setFiles(res.data.files || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Error fetching files.");
      } finally {
        setLoadingFiles(false);
      }
    }
    if (tenantEmail) {
      fetchFiles();
    }
  }, [tenantEmail]);

  // Pagination: calculate indices for current page
  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = files.slice(indexOfFirstFile, indexOfLastFile);
  const totalPages = Math.ceil(files.length / filesPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="tenant-homepage">
      <header className="top-bar">
        <h2>Tenant Dashboard</h2>
      </header>
      {loadingFiles ? (
        <p>Loading files...</p>
      ) : error ? (
        <div className="error-banner" style={{ color: 'red' }}>
          {error} Displaying fallback layout.
        </div>
      ) : (
        <>
          {files.length === 0 ? (
            <p>No files found.</p>
          ) : (
            <div className="files-container">
              <ul>
                {currentFiles.map((file) => (
                  <li key={file.id}>
                    <a href={file.url} target="_blank" rel="noreferrer">
                      {file.filename}
                    </a>{' '}
                    - Uploaded on {new Date(file.uploaded_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={prevPage} disabled={currentPage === 1}>
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button onClick={nextPage} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <ManageBilling tenantEmail={tenantEmail} />
      <div className="additional-containers">
        <RenewLease />
        <ManageLease />
        <ManagePaymentMethods />
      </div>
    </div>
  );
};

export default TenantHomepage;
