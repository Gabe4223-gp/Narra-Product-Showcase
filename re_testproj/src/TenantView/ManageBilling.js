// src/ManageBilling.js
import React, { useState, useEffect } from 'react';
import Pay from './Pay';
import axios from 'axios';
import './ManageBilling.css';

const ManageBilling = ({ tenantEmail }) => {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;

  useEffect(() => {
    async function fetchFiles() {
      try {
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
    } else {
      setLoadingFiles(false);
    }
  }, [tenantEmail]);

  // Pagination calculations
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

  // Pay modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const handlePayClick = (bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedBill(null);
  };

  return (
    <div className="manage-billing">
      <h3>Manage Billing</h3>
      {loadingFiles ? (
        <p>Loading files...</p>
      ) : error ? (
        <div className="error-banner" style={{ color: 'red' }}>
          {error}. Displaying fallback layout.
        </div>
      ) : files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <>
          <ul>
            {currentFiles.map((file) => (
              <li key={file.id}>
                <a href={file.url} target="_blank" rel="noreferrer">
                  {file.filename}
                </a>{' '}
                - Uploaded on {new Date(file.uploaded_at).toLocaleDateString()}
                <button onClick={() => handlePayClick(file)}>Pay</button>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Additional containers can be rendered here if needed */}
      <div className="additional-billing-container">
        {/* For instance, other billing summary components */}
      </div>

      {showPayModal && <Pay bill={selectedBill} onClose={closePayModal} />}
    </div>
  );
};

export default ManageBilling;
