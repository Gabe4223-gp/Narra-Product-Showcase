import React, { useState, useEffect} from 'react';
import PaymentMethods from './PaymentMethods.js';
import SendBillPopup from './SendBillPopup.js';
import PaymentHistory from './PaymentHistory.js';
import "./TenantProfile.css";
import DocumentViewer from './DocumentViewer.js';
import Lease from './Lease.js';
import { useAuth0 } from '@auth0/auth0-react';
  


function TenantProfile({tenantId, onBack, propertyId}) {
    const defaultImage = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
    const [tenantDetails, setTenantDetails] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditTenantDetails, setshowEditTenantDetails] = useState(false);
    const [editedTenant, setEditedTenant] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [forPreview, setForPreview] = useState(false);
    const [uploadLeaseDoc, setUploadLeaseDoc] = useState(null);
    const [showSendBillPopup, setShowSendBillPopup] = useState(false);

    useEffect(() => {
        if (tenantDetails) {
            setEditedTenant({
                id: tenantDetails.id,
                name: tenantDetails.name,
                unit_id: tenantDetails.unit_id,
                phone: tenantDetails.phone,
                email: tenantDetails.email,
                leaseStarted: tenantDetails.leaseStarted,
                leaseExpiry: tenantDetails.leaseExpiry,
                leaseDocs: tenantDetails.leaseDocs,
                moveinDate: tenantDetails.moveinDate,
                moveoutDate: tenantDetails.moveoutDate,
                billingDeadline: tenantDetails.billingDeadline,
                nationality: tenantDetails.nationality,
                occupation: tenantDetails.occupation,
                image: tenantDetails.image ?? defaultImage,
                eWalletName: tenantDetails.eWalletName,
                eWalletReferenceNo: tenantDetails.bankReferenceNo,
                bankName: tenantDetails.bankName,
                bankReferenceNo: tenantDetails.bankReferenceNo,
                creditCardName: tenantDetails.creditCardName,
                creditCardNo: tenantDetails.creditCardNo,
                creditCardDate: tenantDetails.creditCardDate,
                primaryPaymentMethod: tenantDetails.primaryPaymentMethod,
            });
        }
    }, [tenantDetails]);


    const fetchTenantDetails = async () => {

        try {
          setTenantDetails(null); // Reset tenant details
   
          if (!tenantId) {
            console.error("Please enter a tenant ID.");
            return;
          }
   
          // Make a request to the backend
          const response = await fetch(`http://localhost:5000/tenants/${tenantId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
   
          if (!response.ok) {
            console.error("Failed to fetch tenant details");
          }
   
          const data = await response.json();
          setTenantDetails(data);


        } catch (error) {
          console.error("Error fetching tenant details:", error);
        }
    };


    // UseEffect to fetch tenant details right when the page loads
    useEffect(() => {
        fetchTenantDetails();
    }, []);


    const handleUploadLeaseDoc = (leaseDocs, leaseEndDate, leaseStartDate) => {


        // Update the editedTenant state
        setEditedTenant((prevState) => {
            const updatedState = {
                ...prevState,
                //leaseDocs: leaseDocs, // Add leaseDocs to the tenantDetails state, the fileUrl is too long and overloads the database//
                leaseExpiry: leaseEndDate ? new Date(leaseEndDate).toISOString().split("T")[0] : null, // Format leaseEndDate
                leaseStarted: leaseStartDate ? new Date(leaseStartDate).toISOString().split("T")[0] : null, // Format leaseStartDate
            };
       
            return updatedState;
        });

        setUploadLeaseDoc(leaseDocs);
    };


    useEffect(() => {
        if (uploadLeaseDoc) {
            saveEditTenant();
        }
    }, [uploadLeaseDoc]);


    //Edit tenant
    const handleEditTenantChange = (field, value) => {  
        setEditedTenant({ ...editedTenant, [field]: value });
    };

    const saveEditTenant = async () => {

        try {
           
            console.log("asjldf", editedTenant);


            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/tenants/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tenant: editedTenant,
                propertyId: propertyId,
               }),
            });
       
            if (!response.ok) {
              const errorMsg = await response.text();
              console.error('Backend error:', errorMsg);
              throw new Error('Failed to create tenant');
            }
     
            // Optionally: If you have a function that fetches tenants by IDs
            fetchTenantDetails();
       
            setshowEditTenantDetails(false);
          } catch (error) {
            console.error('Error creating tenant:', error);
            alert(`Failed to save tenant. Error: ${error.message}`);
          }
    };


    //Upload image
    const handleImageChange = async (event) => {

        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("tenantId", tenantDetails.id);
   
            try {
                const response = await fetch('http://localhost:5000/tenants/image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                      },
                    body: formData, // Use FormData to send the file
                });
   
                if (response.ok) {
                    console.log('Image uploaded successfully!');
                } else {
                    console.error('Failed to upload image:', await response.json());
                }


                fetchTenantDetails();


            } catch (error) {
                console.error('Error uploading image:', error);
            }
        } else {
            alert("Please upload a valid image file.");
        }
    };


    const handleBack = async () => {
        setSelectedDoc(null); // Set selectedDoc to null to hide DocumentViewer and go back
    };

    const handleSetForPreview = () => {
        setForPreview(true);
    }

    // Function to handle Government ID view
    const handleViewDocument = (doc) => {


        setForPreview(false);


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

    const handleLoadLeaseDoc = (doc) => {
        setSelectedDoc(doc);
    }


    const handleDeleteTenant = async () => {

        const tenantId = tenantDetails.id;
   
        try {
            // Make a DELETE request to the backend with the propertyId
            const response = await fetch(`http://localhost:5000/tenants/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tenantId, propertyId}), // Send the propertyId in the request body
            });
   
            if (!response.ok) {
                console.error("Failed to delete tenant:", response.statusText);
                return;
            }
   
            // Optionally handle the backend response
            const data = await response.json();
            console.log("Tenant deleted successfully:", data);
            
            setShowDeleteModal(false);
            // Call the onBack function to return to the previous screen
            onBack();
        } catch (error) {
            console.error("Error deleting tenant:", error);
        }
      };
   
    if (selectedDoc !== null) {
        <DocumentViewer
        onBack={handleBack}
        selectedDoc={selectedDoc}
        forPreview={forPreview}
        />
      }


    return (
        <div className="tenant-profile">
            <button onClick={onBack}>Back</button>
            <div className="tenant-top-section">
                <div className="tenant-image-container">
                    <img src={tenantDetails?.image ?? null} alt="Tenant" className="tenant-image" />
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
                        <button className='edit-button' onClick={() => setshowEditTenantDetails(true)}>Edit</button>
                    </div>
                    <div className="tenant-row">
                        <div className="left-tenant-details">
                            <p>Name:  {tenantDetails?.name ?? ""}</p>
                            <p>Unit Number:  {tenantDetails?.unit ?? ""}</p>
                            <p>Email:  {tenantDetails?.email ?? ""}</p>
                            <p>Phone number:  {tenantDetails?.phone ?? ""}</p>
                            <p>Nationality:  {tenantDetails?.nationality ?? ""}</p>
                        </div>
                        <div className="right-tenant-details">
                            <p>Occupation:  {tenantDetails?.occupation ?? ""}</p>
                            <p>Lease Started:  {tenantDetails?.leaseStarted ?? ""}</p>
                            <p>Lease Expiry:  {tenantDetails?.leaseExpiry ?? ""}</p>
                            <p>Move In Date: {tenantDetails?.moveinDate ?? ""}</p>
                        </div>
                    </div>


                </div>
                <div className="tenant-billing-details">
                    <h5>Billing Details</h5>
                    <div className='billing-details-row'>
                        <div className='left-billing-details'>
                            <p>eWallet Name:  {tenantDetails?.eWalletName ?? ""}</p>
                            <p>Bank Name:  {tenantDetails?.bankName ?? ""}</p>
                            <p>Credit Card Name:  {tenantDetails?.creditcardName ?? ""}</p>
                        </div>
                        <div className='right-billing-details'>
                            <p>Primary Payment Method: {tenantDetails?.primaryPaymentMethod ?? ""}</p>
                        </div>
                    </div>
                </div>
            </div>


            <div className='tenant-mid-section'>
        
                <PaymentHistory />
               
                <div></div>
        
            </div>


            <div className="tenant-bottom-section">
                <Lease
                tenantDetails={tenantDetails}
                onUploadLeaseDoc={handleUploadLeaseDoc}
                onloadLeaseDoc={handleLoadLeaseDoc}
                onSetForPreview={handleSetForPreview}
                />
                <div className='tenant-actions'>
                    <h5>Actions</h5>
                    <div className='action-button'>
                        <button onClick={() => setShowSendBillPopup(true)}>Create Bill</button>
                        <button onClick={() => setShowDeleteModal(true)}>Delete Tenant</button>
                    </div>
                    
                </div>
            </div>  


            {showDeleteModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete this tenant?
                        </div>
                        <button onClick={handleDeleteTenant}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                </div>
            )}


            {showEditTenantDetails && (
                <div className='overlay'>
                    <div className="edit-tenant-modal">
                        <h3>Edit Tenant</h3>
                        <form>
                        <label>
                            Name:
                            <input
                            type="text"
                            value={editedTenant.name}
                            onChange={(e) => handleEditTenantChange("name", e.target.value)}
                            />
                        </label>
                        <label>
                            Unit Number:
                            <input
                            type="text"
                            value={editedTenant.unit_id}
                            onChange={(e) => handleEditTenantChange("unit", e.target.value)}
                            />
                        </label>
                        <label>
                            Phone Number:
                            <input
                            type="text"
                            value={editedTenant.phone}
                            onChange={(e) => handleEditTenantChange("phone", e.target.value)}
                            />
                        </label>
                        <label>
                            Email:
                            <input
                            type="email"
                            value={editedTenant.email}
                            onChange={(e) => handleEditTenantChange("email", e.target.value)}
                            />
                        </label>
                        <label>
                            Nationality:
                            <input
                            type="text"
                            value={editedTenant.nationality}
                            onChange={(e) =>
                                handleEditTenantChange("nationality", e.target.value)
                            }
                            />
                        </label>
                        <label>
                            Occupation:
                            <input
                            type="text"
                            value={editedTenant.occupation}
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

                </div>
                    
     
                )};
        </div>
    );
}


export default TenantProfile;