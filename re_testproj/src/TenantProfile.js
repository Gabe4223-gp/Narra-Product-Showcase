import React, { useState, useEffect} from 'react';
import "./TenantProfile.css";
import DocumentViewer from './DocumentViewer.js';
import { PDFDocument, rgb } from 'pdf-lib';

class AuthorizedOccupant {
    constructor(name = "", email = "", phone = "", governmentID = null) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.governmentID = governmentID;
    }
}

function TenantProfile({ tenant, onBack, onUpdateAuthorizedOccupants, onUpdateLeaseDocs, onEditTenantDetails}) {
    
    const [image, setImage] = useState(tenant.image);
    const [showEditTenantDetails, setshowEditTenantDetails] = useState(false);
    const [editedTenant, setEditedTenant] = useState({
        id: tenant.id,
        name: tenant.Name,
        unit: tenant.Unit,
        phone: tenant.Phone,
        email: tenant.Email,
        leaseStarted: tenant.LeaseStarted,
        leaseExpiry: tenant.LeaseExpiry,
        billingDeadline: tenant.BillingDeadline,
        nationality: tenant.Nationality,
        occupation: tenant.Occupation,
        authorizedOccupants: tenant.AuthorizedOccupants,
        eWalletName: tenant.EWalletName,
        eWalletReferenceNo: tenant.EWalletReferenceNo,
        bankName: tenant.BankName,
        bankReferenceNo: tenant.BankReferenceNo,
        creditcardName: tenant.CreditCardName,
        creditcardNo: tenant.CreditCardNo,
        creditcardDate: tenant.CreditCardDate,

    });
    const [showAuthorizedModal, setShowAuthorizedModal] = useState(false);
    const [showLeaseDocument, setshowLeaseDocument] = useState(false);
    const [newAuthorizedOccupant, setNewAuthorizedOccupant] = useState(new AuthorizedOccupant());
    const [showAddOccupantInputs, setShowAddOccupantInputs] = useState(false);
    const [authorizedOccupants, setAuthorizedOccupants] = useState(tenant.authorizedOccupants || []);
    const [leaseDocs, setLeaseDocs] = useState(tenant.leaseDoc || []);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showRenewLease, setshowRenewLease] = useState(false);

    //Lease Generation const
    const storedFormData = JSON.parse(localStorage.getItem('leaseFormData')) || {};
    const [leaseStartDate, setLeaseStartDate] = useState(storedFormData.leaseStartDate || '');
    const [leaseEndDate, setLeaseEndDate] = useState(storedFormData.leaseEndDate || '');
    const [leaseEndTime, setLeaseEndTime] = useState(storedFormData.leaseEndTime || '');
    const [unitNumber, setUnitNumber] = useState(storedFormData.unitNumber || '');
    const [monthlyRent, setMonthlyRent] = useState(storedFormData.monthlyRent || '');
    const [rentDeposit, setRentDeposit] = useState(storedFormData.rentDeposit || '');
    const [equivalentMonths, setEquivalentMonths] = useState(storedFormData.equivalentMonths || '');
    const [utilitiesDeposit, setUtilitiesDeposit] = useState(storedFormData.utilitiesDeposit || '');
    const [petDeposit, setPetDeposit] = useState(storedFormData.petDeposit || '');
    const [signers, setSigners] = useState(storedFormData.signers || []);
    const [forPreview, setForPreview] = useState(false);

    //Form date for lease generation
    const formData = {
        startDate: leaseStartDate,
        endDate: leaseEndDate,
        endTime: leaseEndTime,
        unitNo: unitNumber,
        monthlyRent: monthlyRent,
        rentDeposit: rentDeposit,
        utilitiesDeposit: utilitiesDeposit,
        petDeposit: petDeposit,
        equivalentMonths: equivalentMonths,
        signers: signers
      };

    //Edit tenant
    const handleEditTenantChange = (field, value) => {
        
        setEditedTenant((prevTenant) => ({
            ...prevTenant,
            [field]: value,
        }));
    };

    // Set editable tenant whenever the prop changes
    useEffect(() => {
        setEditedTenant(tenant);
    }, [tenant]); // Only re-run if the tenant prop changes

    const saveEditTenant = () => {
        if (
            editedTenant.name &&
            editedTenant.email &&
            editedTenant.phone &&
            editedTenant.occupation &&
            editedTenant.nationality 
        ) {
            // Call the callback to update the parent component (Tenant.js)
            onEditTenantDetails(editedTenant);
            setshowEditTenantDetails(false);
        } else {
            alert("Please fill in all fields.");
        }
    };

    // File validation utility
    const handleEmptyField = (value) => 
        (typeof value === "string" && value.trim() === "") || value == null ? "NA" : value;

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
        }
    };

    const handleLeaseUpload = (event) => {
        const files = event.target.files;
        if (files.length > 1) {
            alert('Please upload only one file.');
            return;
        }
    
        const selectedFile = files[0];
        if (selectedFile) {
            handleLeaseChange(selectedFile, tenant);  // Pass tenant along with the file
        }
    };

    // Trigger file input click programmatically
    const handleUploadClick = () => {
        document.getElementById('fileInput').click();  // Trigger file input click
    };

    const handleLeaseChange = (file) => {
        const allowedTypes = [
            'application/pdf',          // PDF
            'image/jpeg',               // JPEG image
            'image/png',                // PNG image
        ];
    
        if (file && allowedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = () => {
                const newDoc = {
                    fileUrl: reader.result,
                    dateUploaded: new Date().toISOString(),
                    fileType: file.type,
                };

                setLeaseDocs([...leaseDocs, newDoc]);

                // Call the callback to update the parent component (Tenant.js)
                onUpdateLeaseDocs(newDoc);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Invalid file type. Please upload a PDF or image.');
        }
    };

    // Function to handle document click (opens document viewer)
    const handleViewDocument = (doc) => {

        const allowedTypes = [
            'application/pdf',        // PDF
            'image/jpeg',             // JPEG image
            'image/png',              // PNG image
        ];
    
        // Check if the file has a valid MIME type
        if (doc.fileUrl && allowedTypes.includes(doc.fileType)) {
            setSelectedDoc(doc);
        } else {
            alert("Invalid file type. Only PDFs and images are allowed.");
        }
    };

    const handleBack = async () => {
        setSelectedDoc(null); // Set selectedDoc to null to hide DocumentViewer and go back
    };

    const handleInputChange = (field, value) => {
        setNewAuthorizedOccupant({ ...newAuthorizedOccupant, [field]: value });
    };

    const handleFileChange = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (file && allowedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = () => {
                const updateGovernmentID = {
                    fileUrl: reader.result,
                    dateUploaded: new Date().toISOString(),
                    fileType: file.type,
                };

                setNewAuthorizedOccupant((prev) => ({
                    ...prev,
                    governmentID: updateGovernmentID, 
                }));
            };
            reader.readAsDataURL(file);
        } else {
            alert('Invalid file type. Please upload an image or PDF.');
        }
    };

    const handleAddAuthorizedOccupant = () => {
        if (
            newAuthorizedOccupant.name &&
            newAuthorizedOccupant.email &&
            newAuthorizedOccupant.phone &&
            newAuthorizedOccupant.governmentID
        ) {
            const updatedAuthorizedOccupants = [
                ...authorizedOccupants,
                newAuthorizedOccupant,
            ];
            setAuthorizedOccupants(updatedAuthorizedOccupants);

            // Call the callback to update the parent component (Tenant.js)
            onUpdateAuthorizedOccupants(updatedAuthorizedOccupants);

            // Reset the form and close inputs
            setNewAuthorizedOccupant({ name: "", email: "", phone: "", governmentID: null });
            setShowAddOccupantInputs(false);
        } else {
            alert("Please fill in all fields.");
        }
    };

    const handleRemoveAuthorizedOccupant = (index) => {
        const updatedAuthorizedOccupants = authorizedOccupants.filter((_, i) => i !== index);
        setAuthorizedOccupants(updatedAuthorizedOccupants);

        // Call the callback to update the parent component (Tenant.js)
        onUpdateAuthorizedOccupants(updatedAuthorizedOccupants);
    };

    const renderAuthorizedOccupant = (occupant, index) => (
        <tr key={index}>
            <td>{occupant.name}</td>
            <td>{occupant.email}</td>
            <td>{occupant.phone}</td>
            <td>
                {occupant.governmentID ? (
                    <a href="#" onClick={() => handleViewDocument(occupant.governmentID)}>
                        View ID
                    </a>
                ) : (
                    "Not Uploaded"
                )}
            </td>
            <td>
                <button onClick={() => handleRemoveAuthorizedOccupant(index)}>Remove</button>
            </td>
        </tr>
    );

    //Lease Signor functions
    // Add new signer
    const addSigner = () => {
        setSigners([...signers, { name: '' }]);
    };

    // Handle signer name change
    const handleSignerChange = (index, value) => {
        const newSigners = [...signers];
        newSigners[index].name = value;
        setSigners(newSigners);
    };

    // Remove signer
    const removeSigner = (index) => {
        const newSigners = signers.filter((_, i) => i !== index);
        setSigners(newSigners);
    };

    
    // Renew Lease Generator
    const generatePDF = async () => {
        // Generate the PDF and get the Blob URL
        const pdfBlobUrl = await generatePDFWithTemplate(formData);

        // Store form data in localStorage for future use
        localStorage.setItem('leaseFormData', JSON.stringify(formData));
      
        // You can use the pdfBlobUrl to pass it to your DocumentViewer component
        setSelectedDoc({
          fileUrl: pdfBlobUrl,
          fileType: 'application/pdf',  // PDF type
        });

        setForPreview(true); //Sets the lease signing function as true
      };

    const generatePDFWithTemplate = async (formData) => {
        const existingPdfBytes = await fetch("/template1.pdf").then((res) =>
          res.arrayBuffer()
        );
      
        // Load the existing PDF
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const page = pages[0]; // Assume we are editing the first page
      
        // Define the coordinates for each field
        const coordinates = {
          startDate: { x: 50, y: 600 },  // Lease Start Date
          endDate: { x: 50, y: 580 },    // Lease End Date
          unitNo: { x: 50, y: 560 },     // Unit No
          monthlyRent: { x: 50, y: 540 }, // Monthly Rent
          rentDeposit: { x: 50, y: 520 }, // Rent Deposit
          utilitiesDeposit: { x: 50, y: 500 }, // Utilities Deposit
          petDeposit: { x: 50, y: 480 }, // Pet Deposit
          endTime: { x: 50, y: 460 },    // End Time
          equivalentMonths: { x: 50, y: 440 }, // Equivalent Months
          signers: { x: 50, y: 420 } // Starting Y for Lease Signers
        };
      
        // Place form data at the blank line coordinates
        page.drawText(formData.startDate || "", {
          x: coordinates.startDate.x,
          y: coordinates.startDate.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.endDate || "", {
          x: coordinates.endDate.x,
          y: coordinates.endDate.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.unitNo || "", {
          x: coordinates.unitNo.x,
          y: coordinates.unitNo.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.monthlyRent || "", {
          x: coordinates.monthlyRent.x,
          y: coordinates.monthlyRent.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.rentDeposit || "", {
          x: coordinates.rentDeposit.x,
          y: coordinates.rentDeposit.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.utilitiesDeposit || "", {
          x: coordinates.utilitiesDeposit.x,
          y: coordinates.utilitiesDeposit.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.petDeposit || "", {
          x: coordinates.petDeposit.x,
          y: coordinates.petDeposit.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.endTime || "", {
          x: coordinates.endTime.x,
          y: coordinates.endTime.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        page.drawText(formData.equivalentMonths || "", {
          x: coordinates.equivalentMonths.x,
          y: coordinates.equivalentMonths.y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      
        // Place the Lease Signers' names dynamically
        formData.signers.forEach((signer, index) => {
          const signerY = coordinates.signers.y - (index * 20);  // Adjust Y position for each signer
          page.drawText(signer.name || "", {
            x: coordinates.signers.x,
            y: signerY,
            size: 12,
            color: rgb(0, 0, 0),
          });
        });
      
        // Save the updated PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
        return URL.createObjectURL(pdfBlob);  // Return Blob URL
      };

      useEffect(() => {
        // On component mount, load the current lease from localStorage
        const currentLeaseId = localStorage.getItem('currentLeaseId');
        if (currentLeaseId) {
            setLeaseDocs(prevDocs => prevDocs.map(doc => {
                if (doc.id === currentLeaseId) {
                    doc.isCurrentLease = true;
                } else {
                    doc.isCurrentLease = false;
                }
                return doc;
            }));
        }
    }, []);

    const handleSetCurrentLease = (newCurrentDoc) => {
        // Save the new current lease ID in localStorage
        localStorage.setItem('currentLeaseId', newCurrentDoc.id);

        // Update the leaseDocs state to mark the current lease
        setLeaseDocs(prevDocs => {
            return prevDocs.map(doc => {
                if (doc.id === newCurrentDoc.id) {
                    doc.isCurrentLease = true; // Mark as current lease
                } else {
                    doc.isCurrentLease = false; // Unmark other documents
                }
                return doc;
            });
        });
    };

    if (selectedDoc !== null) {
        return (
          <DocumentViewer
            onBack={handleBack}
            selectedDoc={selectedDoc}
            isPreview={forPreview}
            tenant={tenant}
          />
        );
      }

    return (
        <div className="tenant-profile">
            <button onClick={onBack}>Back</button>
            <div className="tenant-top-section">
                <div className="tenant-image-container">
                    <img src={image} alt="Tenant" className="tenant-image" />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="tenant-image-upload"
                    />
                </div>
                <div className="tenant-personal-details">
                    <div className='tenant-header'style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} >
                        <h5>Personal Details</h5>
                        <button onClick={() => setshowEditTenantDetails(true)}>Edit</button>
                    </div>
                    <div className="tenant-row">
                        <div className="left-tenant-details">
                            <p>Name:  {editedTenant.name}</p>
                            <p>Unit Number:  {editedTenant.unit}</p>
                            <p>Email:  {editedTenant.email}</p>
                            <p>Phone number:  {editedTenant.phone}</p>
                        </div>
                        <div className="right-tenant-details">
                            <p>Nationality:  {editedTenant.nationality}</p>
                            <p>Occupation:  {editedTenant.occupation}</p>
                            <p>Lease Started:  {editedTenant.leaseStarted}</p>
                            <p>Lease Expiry:  {editedTenant.leaseExpiry}</p>
                            <button
                                className="authorized-occupants"
                                onClick={() => setShowAuthorizedModal(true)}
                            >
                                View Authorized Occupants
                            </button>
                        </div>
                    </div>

                </div>
                <div className="tenant-billing-details">
                    <h5>Billing Details</h5>
                    <div className='billing-details-row'>
                        <div className='left-billing-details'>
                            <p>eWallet Name:  {handleEmptyField(tenant.eWalletName)}</p>
                            <p>eWallet Reference no:  {handleEmptyField(tenant.eWalletReferenceNo)}</p>
                            <p>Bank Name:  {handleEmptyField(tenant.bankName)}</p>
                            <p>Bank Account No:  {handleEmptyField(tenant.bankReferenceNo)}</p>
                        </div>
                        <div className='right-billing-details'>
                            <p>Credit Card Name:  {handleEmptyField(tenant.creditcardName)}</p>
                            <p>Credit Card Number:  {handleEmptyField(tenant.creditcardNo)}</p>
                            <p>Credit Card Expiry Date:  {handleEmptyField(tenant.creditcardDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='tenant-mid-section'>
                
                <div className="tenant-lease-decision">
                    <h5>Lease Decision</h5>

                    {leaseDocs && leaseDocs.length > 0 ? (
                        <div>
                            <button onClick={() => setshowLeaseDocument(true)} className='tenant-lease-view'>
                                View Lease</button> 
                            <button onClick={() => setshowRenewLease(true)} className="tenant-renew-lease"> Renew Lease </button>
                        </div>
                    ) : (
                        <div>
                            <button
                            onClick={handleUploadClick}
                            className="tenant-lease-upload">
                            Upload Lease</button>
                            <input
                                type="file"
                                id="fileInput"
                                style={{ display: 'none' }} // Hide the input element
                                onChange={(event) => handleLeaseUpload(event, tenant)} // Handle file change
                            />
                            
                            <button onClick={() => setshowRenewLease(true)} className="tenant-renew-lease"> Create Lease </button>
                        

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
                                    <div className='end-date-time'>
                                        <label>
                                            Lease End Date:
                                        <input 
                                        type="date" 
                                        value={leaseEndDate}
                                        onChange={(e) => setLeaseEndDate(e.target.value)}
                                        />
                                        </label>
                                        <label>
                                            End Time:
                                            <input 
                                            type="time" 
                                            value={leaseEndTime}
                                            onChange={(e) => setLeaseEndTime(e.target.value)}
                                            />
                                        </label>
                                    </div>
                                    <label>
                                        Unit No:
                                        <input 
                                        type="number" 
                                        value={unitNumber}
                                        onChange={(e) => setUnitNumber(e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Monthly Rent:
                                        <input 
                                        type="number" 
                                        value={monthlyRent}
                                        onChange={(e) => setMonthlyRent(e.target.value)}
                                        />
                                    </label>
                                    <div>
                                        <label className='rent-deposit'>
                                            Rent Deposit:
                                            <input 
                                            type="number" 
                                            value={rentDeposit}
                                            onChange={(e) => setRentDeposit(e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            Equivalent Months:
                                            <input type="number"
                                            value={equivalentMonths}
                                            onChange={(e) => setEquivalentMonths(e.target.value)}
                                            />
                                        </label>
                                    </div>
                                    <label>
                                        Utilities Deposit:
                                        <input type="number"
                                        value={utilitiesDeposit}
                                        onChange={(e) => setUtilitiesDeposit(e.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Pet Deposit:
                                        <input type="number"
                                        value={petDeposit}
                                        onChange={(e) => setPetDeposit(e.target.value)}
                                        />
                                    </label>
                                    <div>
                                        <h3>Lease Signers</h3>
                                        {signers.map((signer, index) => (
                                            <div key={index}>
                                                <input
                                                    type="text"
                                                    value={signer.name}
                                                    onChange={(e) => handleSignerChange(index, e.target.value)}
                                                    placeholder="Enter signer name"
                                                />
                                                {index > 0 && (
                                                    <button type="button" onClick={() => removeSigner(index)}>Remove Signer</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={addSigner}>Add Signer</button>
                                    </div>
                                </form>
                                <div className="modal-actions">
                                    <button 
                                    type="button" 
                                    onClick={() => generatePDF({
                                        startDate: leaseStartDate,
                                        endDate: leaseEndDate,
                                        endTime: leaseEndTime,
                                        unitNo: unitNumber,
                                        monthlyRent: monthlyRent,
                                        rentDeposit: rentDeposit,
                                        equivalentMonths: equivalentMonths,
                                        utilitiesDeposit: utilitiesDeposit,
                                        petDeposit: petDeposit,
                                        signers: signers,
                                    })}>
                                        Preview Lease
                                    </button>
                                    <button className="cancel" onClick={() => setshowRenewLease(false)}>Cancel</button>
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
                                    .map((doc, index) => {
                                        return (
                                            <tr key={doc.id}>
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
                                        );
                                    })}
                                    </tbody>
                                    </table>
                                    
                                </div>
                            </div>
                        </div>
                    )};
                </div>

                <div className="tenant-billing-activity">
                    <h5>Billing Activity</h5>
                </div>
            </div>

            <div className="tenant-actions">
                <h5>Actions</h5>
                <button>Upload Lease</button>
                <button>Renew Lease</button>
                <button>Create Bill</button>
                <button>Delete Tenant</button>
            </div>

            {showEditTenantDetails && (
                    
                    <div className="edit-tenant-modal">
                        <h3>Edit Tenant</h3>
                        <form>
                        <label>
                            Name:
                            <input
                            type="text"
                            value={editedTenant.name || ''}
                            onChange={(e) => handleEditTenantChange("name", e.target.value)}
                            />
                        </label>
                        <label>
                            Unit Number:
                            <input
                            type="text"
                            value={editedTenant.unit || ''}
                            onChange={(e) => handleEditTenantChange("unit", e.target.value)}
                            />
                        </label>
                        <label>
                            Phone Number:
                            <input
                            type="text"
                            value={editedTenant.phone || ''}
                            onChange={(e) => handleEditTenantChange("phone", e.target.value)}
                            />
                        </label>
                        <label>
                            Email:
                            <input
                            type="email"
                            value={editedTenant.email || ''}
                            onChange={(e) => handleEditTenantChange("email", e.target.value)}
                            />
                        </label>
                        <label>
                            Nationality:
                            <input
                            type="text"
                            value={editedTenant.nationality || ''}
                            onChange={(e) =>
                                handleEditTenantChange("nationality", e.target.value)
                            }
                            />
                        </label>
                        <label>
                            Occupation:
                            <input
                            type="text"
                            value={editedTenant.occupation || ''}
                            onChange={(e) =>
                                handleEditTenantChange("occupation", e.target.value)
                            }
                            />
                        </label>
                        </form>
                        <div>
                        <button onClick={saveEditTenant}>Save</button>
                        <button onClick={() => setshowEditTenantDetails(false)}>Cancel</button>
                        </div>
                    </div>
     
                )};

            {showAuthorizedModal && (
                <div className="authorized-modal-overlay">
                    <div className="authorized-modal-box">
                    <h5>Authorized Occupants</h5>
                    <button onClick={() => setShowAuthorizedModal(false)} className="close-btn">Close</button>
                    <div className="authorized-occupants-container">
                        <table className="authorized-occupants-table">
                        <thead>
                            <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Government ID</th>
                            <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {authorizedOccupants.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                                No authorized occupants
                                </td>
                            </tr>
                            ) : (
                            authorizedOccupants.map(renderAuthorizedOccupant)
                            )}
                            {showAddOccupantInputs && (
                            <tr>
                                <td>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newAuthorizedOccupant.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                />
                                </td>
                                <td>
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newAuthorizedOccupant.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                />
                                </td>
                                <td>
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={newAuthorizedOccupant.phone}
                                    onChange={(e) => handleInputChange("phone", e.target.value)}
                                />
                                </td>
                                <td>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => handleFileChange(e.target.files[0])}
                                />
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    <button
                        onClick={() => setShowAddOccupantInputs(!showAddOccupantInputs)}
                        className="add-btn"
                    >
                        {showAddOccupantInputs ? "Cancel" : "Add"}
                    </button>
                    {showAddOccupantInputs && (
                        <button onClick={handleAddAuthorizedOccupant} className="save-btn">Save</button>
                    )}
                    </div>
                </div>
                )};
        </div>
    );
}

export default TenantProfile;