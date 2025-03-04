import React, { useState, useEffect } from "react";
import "./Lease.css";
import { v4 as uuidv4 } from 'uuid';
import { useUserProfile } from "./UserProfileContext";




function Lease ({tenantDetails, onFetchTenant, onFetchLeases, onloadLeaseDoc, onSetForPreview, leaseDocs}) {
    // Generate last 10 years for selection
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [signed, setSigned] = useState(false);
    const [subject, setSubject] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showRenewLease, setshowRenewLease] = useState(false);
    const [previewLease, setPreviewLease] = useState(null);
    const [selectedDocIds, setSelectedDocIds] = useState(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const {userProfile} = useUserProfile();
   
    //Lease Generation const
    const [leaseStartDate, setLeaseStartDate] = useState('');
    const [leaseEndDate, setLeaseEndDate] = useState('');
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    //Lease upload

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

            const uuidid = uuidv4();

            console.log("UserProfile", userProfile.email);
   
            const reader = new FileReader();
            reader.onload = () => {
                const newDoc = {
                    id: uuidid,
                    fileName: uuidid,
                    url: `http://localhost:5000/lease_bills/${encodeURIComponent(uuidid)}`,
                    fileContent: reader.result,
                    landlordId: userProfile.id,
                    tenantEmail: tenantDetails.email,
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

    const handleConfirmLeaseDoc = async () => {

        try {
           
            const response = await fetch('/tenants/upload-lease', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedDoc.id,
                    fileName: selectedDoc.fileName,
                    url: selectedDoc.url,
                    fileType: selectedDoc.fileType,
                    fileContent: selectedDoc.fileContent,
                    landlordId: selectedDoc.landlordId,
                    tenantEmail: selectedDoc.tenantEmail,
                    tenantId: tenantDetails.id,
                    leaseStartDate: leaseStartDate,
                    leaseEndDate: leaseEndDate,
                    signed: signed,
                    subject: subject,
                    propertyId: tenantDetails.propertyId,
                    user_id: tenantDetails.user_id,
                }),
            });

            console.log("Selected doc:", selectedDoc);
    
            const data = await response.json();
            if (response.ok) {
                console.log("Lease uploaded successfully:", data.url);
                if (signed !== true) {
                    alert("Lease has been sent for signing");
                }
            } else {
                console.error("Upload failed:", data.message);
            }

            setSigned(false);
        } catch (error) {
            console.error("Error uploading lease:", error);
        }

        onFetchTenant();
        onFetchLeases();
        setSelectedDoc(null);
        setshowRenewLease(false);
    };

    const handleViewLease = async (tenantId, fileName) => {
        
        try {
            // Use query parameters instead of body
            const response = await fetch(`/tenants/get-lease?tenantId=${tenantId}&fileName=${fileName}`, {
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
            console.log("Here's the cleanedBased", cleanedBase64);

            const loadedDoc = {
                fileContent: `data:${data.fileType};base64,${cleanedBase64}`,  // Convert to data URL format
                fileName: fileName,  
                fileType: data.fileType,
            };

            console.log("Here's the loadedDoc", loadedDoc);
  
            onloadLeaseDoc(loadedDoc);
    
        } catch (error) {
            console.error("Error retrieving lease:", error);
        }
    };

    const handleCheckboxChange = (DocId) => {
        const updatedSelectedDocIds = new Set(selectedDocIds);
        if (updatedSelectedDocIds.has(DocId)) {
          updatedSelectedDocIds.delete(DocId); // Deselect
        } else {
          updatedSelectedDocIds.add(DocId); // Select
        }
        setSelectedDocIds(updatedSelectedDocIds);
    };

    const handleDeleteLeases = async () => {
        // Check if any leases are selected
        if (selectedDocIds.size === 0) {
            console.error("No leases selected for deletion.");
            return;
        }
        
        try {
            // Make a DELETE request to the backend
            const response = await fetch(`/leases/delete-all`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                docIds: Array.from(selectedDocIds), // Convert Set to Array
                tenantId: tenantDetails?.id, // Optional chaining to avoid errors
            }),
            });
        
            // Check if the request was successful
            if (!response.ok) {
            throw new Error(`Failed to delete lease docs: ${response.statusText}`);
            }
        
            // Handle the backend response
            const data = await response.json();
            console.log("Docs deleted successfully:", data);
        
            // Refresh the leases list
            onFetchLeases();
            // Clear the selected document IDs
            setSelectedDocIds(new Set()); // Reset the Set to empty
            // Close the delete confirmation modal
            setShowDeleteModal(false);
            
        } catch (error) {
            console.error("Error deleting leases:", error);
        }
    };


    return (
        <div className="lease-table">

            
            <div className="lease-table-header" style={{display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
                <h5>Leases</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                <button className="upload-lease-button"
                    onClick={() => setshowRenewLease(true)}>
                    Send New Lease
                </button>
            </div>

            

            <table>
                <thead>
                    <tr>
                        <th style={{ width: "5%" }}> </th>
                        <th>Uploaded At</th>
                        <th>Subject</th>
                        <th style={{ width: "10%" }}>Signed</th>
                        <th style={{ width: "10%" }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {leaseDocs && leaseDocs.length > 0 ? (
                        leaseDocs
                            .filter((doc) => new Date(doc.uploadedAt).getFullYear() === selectedYear) 
                            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
                            .map((doc) => (
                                <tr key={doc.id}>
                                    <td style={{ width: "5%" }}>
                                        <input
                                        type="checkbox"
                                        checked={selectedDocIds.has(doc.id)}
                                        onChange={() => handleCheckboxChange(doc.id)}
                                        />
                                    </td>
                                    <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                                    <td>{doc.subject}</td>
                                    <td style={{ width: "10%" }}>{doc.signed ? 'Signed' : 'Not Signed'}</td>
                                    <td style={{ width: "10%" }}>
                                        <button onClick={() => handleViewLease(tenantDetails?.id, doc.fileName)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="text-center py-2">
                                No lease documents available.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div>
                <button className="delete-leases" onClick={() => setShowDeleteModal(true)}>Delete Selected</button>
            </div>

            {showDeleteModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete these tenants?
                        </div>
                        <button onClick={handleDeleteLeases}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
            

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


            {showRenewLease && (
                <div className="lease-input-modal-overlay">
                    <div className="modal-container">
                        <h3 className="modal-header">Lease Details</h3>
                        <form>

                            <label>
                                Subject:
                                <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                />
                            </label>

                            <label className="input-datetime-lease">
                                Lease Start Date:
                                <input
                                type="datetime-local"
                                value={leaseStartDate}
                                onChange={(e) => setLeaseStartDate(e.target.value)}
                                />
                            </label>
                           
                            <label className="input-datetime-lease">
                                Lease End Date:
                                <input
                                type="datetime-local"
                                value={leaseEndDate}
                                onChange={(e) => setLeaseEndDate(e.target.value)}
                                />
                            </label>

                            <label>
                                Lease Has Been Signed:
                                <input
                                    type="checkbox"
                                    checked={signed}
                                    onChange={(e) => setSigned(e.target.checked)}  // This will update the 'signed' state
                                />
                            </label>
                        </form>
                        <div className="modal-actions">
                            {selectedDoc ? (
                                <>
                                <button onClick={() => setPreviewLease(selectedDoc)}>
                                Preview Lease
                                </button>
                                <button onClick={handleConfirmLeaseDoc}>
                                Confirm
                                </button>
                                <button onClick={() => setshowRenewLease(false)}>
                                    Cancel
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
                                    <button onClick={() => setshowRenewLease(false)}>
                                    Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>


    )
   
   
};


export default Lease;
