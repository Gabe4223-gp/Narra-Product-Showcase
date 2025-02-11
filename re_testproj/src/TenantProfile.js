import React, { useState, useEffect} from 'react';
import ManagePaymentMethods from './TenantView/ManagePaymentMethods';
import SendBillPopup from './SendBillPopup.js';
import PaymentHistory from './PaymentHistory.js';
import "./TenantProfile.css";
import DocumentViewer from './DocumentViewer.js';
import Lease from './Lease.js';

class AuthorizedOccupant {
    constructor(name = "", email = "", phone = "", governmentID = null) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.governmentID = governmentID;
    }
}

function TenantProfile({ tenant, onBack, onUpdateAuthorizedOccupants, onUpdateLeaseDocs, onEditTenantDetails}) {

    // Generate a temporary tenant id if one is not provided
    const generateTenantId = () => Math.floor(Math.random() * 1000000);

    // Initialize editedTenant with a generated id if tenant.id is null/undefined
    const initialTenant = tenant.id ? tenant : { ...tenant, id: generateTenantId() };
    
    const [editedTenant, setEditedTenant] = useState(initialTenant);
    const [image, setImage] = useState(tenant.image);
    const [showEditTenantDetails, setShowEditTenantDetails] = useState(false);
    const [showAuthorizedModal, setShowAuthorizedModal] = useState(false);
    const [newAuthorizedOccupant, setNewAuthorizedOccupant] = useState(new AuthorizedOccupant());
    const [showAddOccupantInputs, setShowAddOccupantInputs] = useState(false);
    const [authorizedOccupants, setAuthorizedOccupants] = useState(tenant.authorizedOccupants || []);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [forPreview, setForPreview] = useState(false);
    const [showSendBillPopup, setShowSendBillPopup] = useState(false);
  
    console.log("Tenant prop:", tenant);
    console.log("Edited tenant:", editedTenant);

    // If the tenant prop changes, update editedTenant, generating an id if needed
    useEffect(() => {
    if (!tenant.id) {
      setEditedTenant({ ...tenant, id: generateTenantId() });
    } else {
      setEditedTenant(tenant);
    }
    }, [tenant]);

    const saveEditTenant = () => {
        if (
            editedTenant.name &&
            editedTenant.email &&
            editedTenant.phone &&
            editedTenant.occupation &&
            editedTenant.nationality &&
            editedTenant.moveinDate &&
            editedTenant.moveoutDate
        ) {
            // Call the callback to update the parent component (Tenant.js)
            onEditTenantDetails(editedTenant);
            setShowEditTenantDetails(false);
        } else {
            alert("Please fill in all fields.");
        }
    };

    // Example handler for editing tenant details
    const handleEditTenantChange = (field, value) => {
        setEditedTenant((prevTenant) => ({
          ...prevTenant,
          [field]: value,
        }));
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

    const handleMarkasMovedOut = () => {
        setEditedTenant((prevTenant) => ({
            ...prevTenant,
            moveoutDate: new Date(),
        }));

        // Call the callback to update the parent component (Tenant.js)
        onEditTenantDetails(editedTenant);
    };

    const handleSetForPreview = () => {
        setForPreview(true);
    }

    const handleLoadLeaseDoc = (doc) => {
        setSelectedDoc(doc);
    }
    
    if (selectedDoc !== null) {
        return (
          <DocumentViewer
            onBack={handleBack}
            selectedDoc={selectedDoc}
            forPreview={forPreview}
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
                        <button onClick={() => setShowEditTenantDetails(true)}>Edit</button>
                    </div>
                    <div className="tenant-row">
                        <div className="left-tenant-details">
                            <p>Name:  {editedTenant.name}</p>
                            <p>Unit Number:  {editedTenant.unit}</p>
                            <p>Email:  {editedTenant.email}</p>
                            <p>Phone number:  {editedTenant.phone}</p>
                            <p>Nationality:  {editedTenant.nationality}</p>
                        </div>
                        <div className="right-tenant-details">
                            <p>Occupation:  {editedTenant.occupation}</p>
                            <p>Lease Started:  {editedTenant.leaseStarted ? editedTenant.leaseStarted : ""}</p>
                            <p>Lease Expiry:  {editedTenant.leaseExpiry ? editedTenant.leaseExpiry : ""}</p>
                            <p>Move In Date: {editedTenant.moveinDate}</p>
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
                            <p>Bank Name:  {handleEmptyField(tenant.bankName)}</p>
                            <p>Credit Card Name:  {handleEmptyField(tenant.creditcardName)}</p>
                        </div>
                        <div className='right-billing-details'>
                            <p>Primary Payment Method: {handleEmptyField(tenant.primaryPaymentMethod)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='tenant-mid-section'>
              
                <Lease
                tenant={tenant}
                onUpdateLeaseDocs={onUpdateLeaseDocs}
                onloadLeaseDoc={handleLoadLeaseDoc}
                onSetForPreview={handleSetForPreview}
                />
            

                <div className="tenant-billing-activity">
                    <PaymentHistory />
                </div>
                <div className="tenant-billing-account">
                    <ManagePaymentMethods />
                </div>
            </div>

            <div className="tenant-actions">
                <h5>Actions</h5>
                <button onClick={() => setShowSendBillPopup(true)}>Create Bill</button>
                <button onClick={handleMarkasMovedOut}>Mark as Moved Out</button>
                <button>Delete Tenant</button>
            </div>
            {showSendBillPopup && (
                <SendBillPopup onClose={() => setShowSendBillPopup(false)}
                tenantId={editedTenant.id}
                />
            )}

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
                        <button onClick={() => setShowEditTenantDetails(false)}>Cancel</button>
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