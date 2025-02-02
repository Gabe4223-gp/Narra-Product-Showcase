import React, { useState, useEffect } from "react";
import "./Lease.css";
import { v4 as uuidv4 } from 'uuid';



function Lease ({tenantDetails, onUploadLeaseDoc, onloadLeaseDoc, onSetForPreview}) {
    const [sentForSigning, setSentForSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const [requestCancel, setRequestCancel] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showRenewLease, setshowRenewLease] = useState(false);
   
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
        console.log("selected doc", selectedDoc);
   
        const updatedDocs = [selectedDoc];


        // Log the updated docs here if needed
        console.log("Updated docs within setLeaseDocs:", updatedDocs);


        // Call onUploadLeaseDoc with the updated docs
        onUploadLeaseDoc(updatedDocs, leaseEndDate, leaseStartDate);


        setSentForSigning(true);


        // No need to log leaseDocs here because it won't be updated immediately
        setSelectedDoc(null);
        setshowRenewLease(false);
    };


    // Function to handle document click (opens document viewer)
    const handleViewDocument = (doc) => {
        if (doc.fileUrl && allowedTypes.includes(doc.fileType)) {
            setSelectedDoc(doc);
            onloadLeaseDoc(doc); // Pass directly the clicked document
        } else {
            alert("Either no Lease has been uploaded or the file type is not a PDF or image");
        }
    };


    return (
        <div className="tenant-lease-decision">
            {console.log("alsk", tenantDetails)}
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
                <div>
                    <button onClick={() => handleViewDocument(tenantDetails?.leaseDocs[0] ?? null)} className='tenant-lease-view'>
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
        </div>


    )
   
   
};


export default Lease;
