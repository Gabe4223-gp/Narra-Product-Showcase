import React, { useState, useEffect } from "react";
import "./Lease.css";
import { v4 as uuidv4 } from 'uuid';
import DocumentViewer from "./DocumentViewer";



function Lease ({tenantDetails, onFetchTenant, onloadLeaseDoc, onSetForPreview}) {
    const [sentForSigning, setSentForSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const [requestCancel, setRequestCancel] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showRenewLease, setshowRenewLease] = useState(false);
    const [previewLease, setPreviewLease] = useState(null);
   
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
   
            const reader = new FileReader();
            reader.onload = () => {
                const newDoc = {
                    fileName: uuidv4(),
                    fileContent: reader.result,
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

    const handleConfirmLeaseDoc = async () => {

        try {
           
            const response = await fetch('http://localhost:5000/tenants/upload-lease', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: selectedDoc.fileName,
                    fileType: selectedDoc.fileType,
                    fileContent: selectedDoc.fileContent,
                    tenantId: tenantDetails.id,
                    leaseStartDate: leaseStartDate,
                    leaseEndDate: leaseEndDate,
                }),
            });

            console.log("Selected doc:", selectedDoc);
    
            const data = await response.json();
            if (response.ok) {
                console.log("Lease uploaded successfully:", data.url);
                setSentForSigning(true); // Only set after successful upload
            } else {
                console.error("Upload failed:", data.message);
            }
        } catch (error) {
            console.error("Error uploading lease:", error);
        }

        onFetchTenant();
        setSelectedDoc(null);
        setshowRenewLease(false);
    };

    const handleViewCurrentLease = async (tenantId, fileName) => {
        
        try {
            // Use query parameters instead of body
            const response = await fetch(`http://localhost:5000/tenants/get-lease?tenantId=${tenantId}&fileName=${fileName}`, {
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


    return (
        <div className="tenant-lease-decision">

            <h5>Lease Decision</h5>


            <p>Current Lease</p>
            <p>Date Uploaded: {new Date(tenantDetails?.leaseDocs[0]?.dateUploaded).toLocaleDateString() ?? ""}</p>


            {signed ? (
                <p>Lease Signed</p>
            ) : sentForSigning ? (
                <p>Lease Sent For Signing</p>
            ) : null}
            {requestCancel ?? (
                <p>Tenant requested not to renew lease</p>
            )}
           
            {tenantDetails?.leaseDocs && tenantDetails.leaseDocs.length > 0 ? (
                <div className="lease-actions">
                    <button 
                        onClick={() => {
                            const lastLeaseDoc = tenantDetails?.leaseDocs?.length 
                                ? tenantDetails.leaseDocs[tenantDetails.leaseDocs.length - 1] 
                                : null;
                            handleViewCurrentLease(tenantDetails.id, lastLeaseDoc);
                        }} 
                        className='tenant-lease-view'
                    >
                        View Lease
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
