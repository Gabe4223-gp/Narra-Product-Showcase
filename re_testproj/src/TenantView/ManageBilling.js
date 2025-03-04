// src/ManageBilling.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pay from './Pay';
import axios from 'axios';
import './ManageBilling.css';
import { useUserProfile } from '../UserProfileContext';

const ManageBilling = ({ tenantEmail }) => {
  const { userProfile } = useUserProfile();

  // Generate last 10 years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStatus, setSelectedStatus] = useState('unpaid'); // Default to unpaid bills
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filesPerPage = 5;
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [validPaymentMethod, setValidPaymentMethod] = useState(false);
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const billId = searchParams.get('billId');

  // Fetch stored payment methods for the tenant
  useEffect(() => {
    async function checkPaymentMethod() {
      try {
        const res = await axios.get('/api/user-profile/payment-methods', {
          params: { userProfileId: userProfile.id },
        });
        setValidPaymentMethod(res.data.paymentMethods.length > 0);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    }

    if (userProfile?.id) {
      checkPaymentMethod();
    }
  }, [userProfile]);

  // Fetch valid files (PDFs with URLs)
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await axios.get(`/api/sendBill/tenant/${encodeURIComponent(tenantEmail)}/files`);
        const filteredFiles = res.data.files
          .filter(file => file.fileType === 'pdf' && file.url) // Only PDFs with valid URLs
          .filter(file => new Date(file.createdAt).getFullYear() === selectedYear) // Filter by year
          .filter(file => selectedStatus === 'all' || (selectedStatus === 'unpaid' ? !file.paid : file.paid)); // Filter by paid/unpaid status

        setFiles(filteredFiles);
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
  }, [tenantEmail, selectedYear, selectedStatus]);

  useEffect(() => {
    if (status === "success" && selectedBill) {
      alert(`Payment for bill ${billId} was successful!`);
      setShowPayModal(false);
      setSelectedBill(null);
    } else if (status === "failed") {
      alert(`Payment for bill ${billId} failed. Please try again.`);
    }
  }, [status, billId]);

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
      <div className="manage-billing-header">
        <h5>Manage Billing</h5>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
          {/* Year Selection */}
          <div>
            <label>
              Select Year:
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Status Filter */}
          <div>
            <label>
              Status:
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {loadingFiles ? (
        <p>Loading bills...</p>
      ) : error ? (
        <div className="error-banner">{error}</div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currentFiles.map((file) => {
                const dateBilled = file.createdAt ? new Date(file.createdAt).toLocaleString() : 'N/A';
                return (
                  <tr key={file.id}>
                    <td>{file.paid ? 'Yes' : 'No'}</td>
                    <td>{file.totalAmount?.toFixed(2)}</td>
                    <td>{file.subject}</td>
                    <td>{dateBilled}</td>
                    <td>
                      <a href={file.url} target="_blank" rel="noreferrer">View PDF</a>
                    </td>
                    <td>
                      {!file.paid && validPaymentMethod && (
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
