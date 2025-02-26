// src/ManageBilling.js
import React, { useState, useEffect } from 'react';
import Pay from './Pay';
import axios from 'axios';
import './ManageBilling.css';

const ManageBilling = ({ tenantEmail }) => {
  // Generate last 10 years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await axios.get(`/api/sendBill/tenant/${encodeURIComponent(tenantEmail)}/files`);
        setFiles(res.data.files || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Error fetching bills from server.');
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
      <div className='manage-billing-header'>
        <h5>Manage Billing</h5>
        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", margin:"0" }}>
                      <span>Select Year:</span>
                      <select
                          style={{ fontSize: "12px"}}
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                      >
                          {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                          ))}
                      </select>
                  </label>
              </div>
          </div>
        </div>
      </div>
      
      {loadingFiles ? (
        <p>Loading bills...</p>
      ) : error ? (
        <div className="error-banner" style={{ color: 'red' }}>{error}</div>
      ) : files.length === 0 ? (
        <p>No bills found.</p>
      ) : (
        <>
          <table className="billing-table">
            <thead>
              <tr>
                <th>Paid</th>
                <th>Full Amount</th>
                <th>Subject</th>
                <th>Date Billed</th>
                <th>Invoice</th>
                <th> </th>
              </tr>
            </thead>
            <tbody>
              {currentFiles.map((file) => {
                const dateBilled = file.createdAt
                  ? new Date(file.createdAt).toLocaleString()
                  : 'N/A';
                return (
                  <tr key={file.id}>
                    <td>{file.paid ? 'Yes' : 'No'}</td>
                    <td>{file.totalAmount?.toFixed(2)}</td>
                    <td>{file.subject}</td>
                    <td>{dateBilled}</td>
                    <td>
                      <a href={file.url} target="_blank" rel="noreferrer">
                        View PDF
                      </a>
                    </td>
                    <td>
                      {!file.paid && (
                        <button onClick={() => handlePayClick(file)}>Pay</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}

      {showPayModal && <Pay bill={selectedBill} onClose={closePayModal} />}
    </div>
  );
};

export default ManageBilling;
