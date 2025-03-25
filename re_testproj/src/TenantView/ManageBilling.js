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
  const paymentStatus = searchParams.get("paymentStatus"); // Get payment status from URL
  const [statusMessage, setStatusMessage] = useState(null);

  // New state for proof of payment
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState("");
  const [proofStatus, setProofStatus] = useState({});

  // Returns true if any file in the files array for the given billId has "proof of payment" in its subject.
  const proofExists = (invoice) => {
    const invoiceSubject = invoice.subject.toLowerCase().trim();
    return files.some(file => {
      const subject = file.subject.toLowerCase().trim();
      return subject.includes(invoiceSubject) && subject.includes("proof of payment");
    });
  };  

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/sendBill/tenant/${encodeURIComponent(tenantEmail)}/files`);
      const filteredFiles = res.data.files
        .filter(file => file.url && (file.fileType === 'pdf' || file.subject.toLowerCase().includes("proof of payment")))
        .filter(file => {
          if (file.subject.toLowerCase().includes("proof of payment")) {
            return true;
          }
          return new Date(file.createdAt).getFullYear() === selectedYear;
        })        
        .filter(file => selectedStatus === 'all' || (selectedStatus === 'unpaid' ? !file.paid : file.paid));

      setFiles(filteredFiles);
      console.log("Fetched file subjects:", filteredFiles.map(f => f.subject));
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Error fetching bills from server.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Fetch stored payment methods for the tenant
  useEffect(() => {
    async function checkPaymentMethod() {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user-profile/payment-methods`, {
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
    if (tenantEmail) {
      setLoadingFiles(true);
      fetchFiles();
    } else {
      setLoadingFiles(false);
    }
  }, [tenantEmail, selectedYear, selectedStatus]);

  //Show payment status message
  useEffect(() => {
    if (paymentStatus) {
      if (paymentStatus === "success") {
        setStatusMessage("Payment successful!");
      } else if (paymentStatus === "failed") {
        setStatusMessage("Payment failed. Please try again.");
      }

      // Remove the status message after 5 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    }
  }, [paymentStatus]);

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

  // Handler when the "Proof of Pay" button is clicked
  const handleProofClick = (file) => {
    setSelectedBill(file);
    setShowProofUpload(true);
  };

  // Handler when a file is selected
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(selected.type)) {
        setProofError("Invalid file type. Please upload JPG, JPEG, PNG, or PDF.");
        return;
      }
      setProofFile(selected);
      setProofError("");
    }
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedBill(null);
  };

  // Handler to submit the proof of payment
  const handleProofSubmit = async () => {
    if (!proofFile) {
      setProofError("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", proofFile);
    formData.append("fileName", selectedBill.subject);
    formData.append("fileType", proofFile.name.split('.').pop());
    formData.append("subject", selectedBill.subject + " - Proof of Payment");
    formData.append("billId", selectedBill.id);
    formData.append("landlordEmail", selectedBill.landlordEmail);
    formData.append("tenantEmail", tenantEmail);
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/payments/upload-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("Proof of payment uploaded successfully!");
        // Update proofStatus for this bill
        setProofStatus(prev => ({ ...prev, [selectedBill.id]: true }));
        await fetchFiles(); // Optional: re-fetch files if needed
      } else {
        setProofError("Failed to upload proof of payment.");
      }
    } catch (error) {
      console.error("Error uploading proof of payment:", error);
      setProofError("Error uploading proof of payment.");
    } finally {
      setShowProofUpload(false);
      setProofFile(null);
    }
  };    

  return (
    <div className="manage-billing">
      {statusMessage && <div className="payment-status">{statusMessage}</div>}
      <div className="manage-billing-header">
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
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", margin:"0" }}>
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
      </div>
  
      {loadingFiles ? (
        <p>Loading bills...</p>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <>
          <table className="billing-table">
            <thead>
              <tr>
                <th>Paid</th>
                <th>Full Amount</th>
                <th>Subject</th>
                <th>Date Billed</th>
                <th>Deadline</th>
                <th>Invoice</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentFiles
                .filter((file) => {
                  const dateBilled = new Date(file.createdAt);
                  return dateBilled.getFullYear() === selectedYear;
                })
                .length > 0 ? (
                currentFiles
                  .filter((file) => {
                    const dateBilled = new Date(file.createdAt);
                    return dateBilled.getFullYear() === selectedYear;
                  })
                  .map((file) => {
                    const dateBilled = file.createdAt
                      ? new Date(file.createdAt).toLocaleString()
                      : 'N/A';
                    return (
                      <tr key={file.id}>
                        <td>{file.paid ? 'Yes' : 'No'}</td>
                        <td>{file.totalAmount?.toFixed(2)}</td>
                        <td>{file.subject}</td>
                        <td>{dateBilled}</td>
                        <td>{file.deadline ? new Date(file.deadline).toLocaleDateString() : ""}</td>
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
                  })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                    No bills found for the selected year.
                  </td>
                </tr>
              )}
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
  
      {/* Proof of Payment Modal */}
      {showProofUpload && (
        <div className="proof-upload-modal">
          <h4>Upload Proof of Payment</h4>
          {proofError && <p style={{ color: "red" }}>{proofError}</p>}
          <input 
            type="file" 
            accept=".jpg,.jpeg,.png,.pdf" 
            onChange={handleFileChange}
          />
          <div className="proof-upload-actions">
            <button onClick={handleProofSubmit}>Submit Proof</button>
            <button onClick={() => setShowProofUpload(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );  
}

export default ManageBilling;
