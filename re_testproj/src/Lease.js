import React, { useState } from "react";
import "./Lease.css";
import { v4 as uuidv4 } from 'uuid';


function Lease ({tenant, onUpdateLeaseDocs, onloadLeaseDoc, onSetForPreview}) {
    const [showLeaseDocument, setshowLeaseDocument] = useState(false);
    const [leaseDocs, setLeaseDocs] = useState(tenant.leaseDoc);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showRenewLease, setshowRenewLease] = useState(false);
    
    //Lease Generation const
    const [leaseStartDate, setLeaseStartDate] = useState('');
    const [leaseEndDate, setLeaseEndDate] = useState('');
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const handleLeaseUpload = (event, forPreview) => {
        const files = event.target.files;
    
        if (files.length > 1) {
            alert('Please upload only one file.');
            return;
        }
    
        const file = files[0];
    
        if (file) {
            if (!allowedTypes.includes(file.type)) {
                alert('Invalid file type. Please upload a PDF or image.');
                return;
            }
    
            const reader = new FileReader();
            reader.onload = () => {
                const newDoc = {
                    fileID: uuidv4(),
                    fileUrl: reader.result,
                    dateUploaded: new Date().toISOString(),
                    fileType: file.type,
                };
    
                setSelectedDoc(newDoc);

                if (forPreview === true) {
                    onSetForPreview();
                }
            };
    
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmLeaseDoc = () => {
        onUpdateLeaseDocs(selectedDoc, leaseStartDate, leaseEndDate);
        setshowRenewLease(false);
    
        setLeaseDocs((prevDocs) => {
            const updatedDocs = [...prevDocs, selectedDoc];
            handleSetCurrentLease(updatedDocs[updatedDocs.length - 1]);
            return updatedDocs;
        });
    
        // Ensure the button text updates by setting selectedDoc here
        setSelectedDoc(null);  // Clear the selectedDoc to trigger the render update
    };

    const handleSetCurrentLease = (newCurrentDoc) => {
        // Save the new current lease in localStorage
        localStorage.setItem('currentLeaseId', newCurrentDoc.fileID);

        // Update the leaseDocs state to mark the current lease
        setLeaseDocs(prevDocs => {
            return prevDocs.map(doc => {
                if (doc.fileID === newCurrentDoc.fileID) {
                    doc.isCurrentLease = true; // Mark as current lease
                } else {
                    doc.isCurrentLease = false; // Unmark other documents
                }
                return doc;
            });
        });
    };

    // Function to handle document click (opens document viewer)
    const handleViewDocument = (doc) => {
        if (doc.fileUrl && allowedTypes.includes(doc.fileType)) {
            setSelectedDoc(doc);
            onloadLeaseDoc(doc); // Pass directly the clicked document
        } else {
            alert("Invalid file type. Only PDFs and images are allowed.");
        }
    };

    return (
        <div className="tenant-lease-decision">
            <h5>Lease Decision</h5>

            {leaseDocs && leaseDocs.length > 0 ? (
                <div>
                    <button onClick={() => setshowLeaseDocument(true)} className='tenant-lease-view'>
                        View Leases
                    </button> 
                    <button onClick={() => setshowRenewLease(true)} className="tenant-renew-lease">
                        Renew Current Lease
                    </button>
                </div>
            ) : (
                <div>
                    <button
                    onClick={() => setshowRenewLease(true)}
                    className="tenant-lease-upload">
                    Upload Lease
                    </button>
                </div>  
            )}

            {showRenewLease && (
                <div className="lease-input-modal-overlay">
                    <div className="modal-container">
                        <h3 className="modal-header">Lease Details</h3>
                        <form>
                            <label>
                                Lease Start Date:
                                <input 
                                type="date" 
                                value={leaseStartDate}
                                onChange={(e) => setLeaseStartDate(e.target.value)}
                                />
                            </label>
                           
                            <label>
                            Lease End Date:
                            <input 
                            type="date" 
                            value={leaseEndDate}
                            onChange={(e) => setLeaseEndDate(e.target.value)}
                            />
                            </label>
                        </form>
                        <div className="modal-actions">
                            {selectedDoc ? (
                                <>
                                <button type="button" onClick={() => handleViewDocument(selectedDoc)}>
                                Preview Lease
                                </button>
                                <button className="cancel" onClick={handleConfirmLeaseDoc}>
                                    Confirm
                                </button>
                                </>
                            ) : (
                                <>
                                    <label htmlFor="lease-upload" style={{ cursor: "pointer" }}>
                                        Upload Lease
                                    </label>
                                    <input
                                        id="lease-upload"
                                        type="file"
                                        onChange={(e) => handleLeaseUpload(e, true)}
                                        style={{ display: "none" }} // Hide the input
                                    />
                                    <button className="cancel" onClick={() => setshowRenewLease(false)}>
                                    Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Lease Modal */}
            {showLeaseDocument && (
                <div className="lease-modal-overlay">
                    <div className="lease-modal-box">
                        <h4>Lease Documents</h4>
                        <button onClick={() => setshowLeaseDocument(false)} className="close-btn">Close</button>
                        <div className="lease-docs-container">
                            <table className="lease-docs-table">
                            <thead>
                                <tr>
                                <th>Document</th>
                                <th>Upload Date</th>
                                <th>Current Lease</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaseDocs && leaseDocs
                                .sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded)) // Sort by dateUploaded
                                .map((doc, index) => (
                                    <tr key={doc.fileID}>
                                        <td>
                                            <a
                                                href="#"
                                                onClick={() => handleViewDocument(doc)}
                                                style={{ color: "#4CAF50", textDecoration: "underline" }}
                                            >
                                                Lease {index + 1}
                                            </a>
                                        </td>
                                        <td>{new Date(doc.dateUploaded).toLocaleDateString()}</td>
                                        <td>
                                            {doc.isCurrentLease ? (
                                                <span>Current Lease</span> // Show if it's marked as current
                                            ) : (
                                                <button 
                                                    onClick={() => handleSetCurrentLease(doc)} 
                                                    style={{ background: "none", border: "none", color: "#007BFF", cursor: "pointer" }}
                                                >
                                                    Set as Current Lease
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                            
                        </div>
                    </div>
                </div>
            )};
        </div>

    )
    
    
};

export default Lease;