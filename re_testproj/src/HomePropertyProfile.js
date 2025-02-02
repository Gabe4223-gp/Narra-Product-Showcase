
import React, { useState, useEffect } from 'react';
import './HomePropertyProfile.css';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function HomePropertyProfile({ property, onBack }) {
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [unitCount, setUnitCount] = useState(0);
  const [tenantCount, setTenantCount] = useState(0);
  const [editedProperty, setEditedProperty] = useState({
    ...property,
  });


  const fetchPropertyDetails = async () => {

    const propertyId = property.id;

    try {

      // Make a request to the backend
      const response = await fetch(`http://localhost:5000/properties/${propertyId}`,  {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch property details");
      }

      const data = await response.json();


      setUnitCount(data.unitCount);
      setTenantCount(data.tenantCount);


      setEditedProperty(data.property);



    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
  };


    // Handle input changes for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProperty((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };


  //Save edited property
  const saveEditedProperty = async () => {

    try {


      // Send tenant and selectedPropertyID to the backend
      const response = await fetch('http://localhost:5000/properties/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({
          property: editedProperty}),
      });
 
      if (!response.ok) {
        const errorMsg = await response.text();
        console.error('Backend error:', errorMsg);
        throw new Error('Failed to create property');
      }


      const data = await response.json();


      setUnitCount(data.unitCount);
      setTenantCount(data.tenantCount);


      fetchPropertyDetails();
 
      setShowEditProperty(false);
    } catch (error) {
      console.error('Error creating property:', error);
      alert(`Failed to save property. Error: ${error.message}`);
    }
  };
 
  // UseEffect to fetch tenant details right when the page loads
  useEffect(() => {
      fetchPropertyDetails();
  }, []);


  const fetchTenantLeaseDocs = async () => {

    try {
      if (!editedProperty.tenants || editedProperty.tenants.length === 0) {
        alert("No tenants found for this property.");
        return;
      }
 
      // Send a request to fetch tenants with expiring leases
      const response = await fetch("http://localhost:5000/properties/expiring-leases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantIds: editedProperty.tenants, // Send the list of tenant IDs
        }),
      });
 
      if (!response.ok) {
        const errorMsg = await response.text();
        console.error("Backend error:", errorMsg);
        throw new Error("Failed to fetch expiring leases.");
      }
 
      const data = await response.json();


      console.log("ajkshdf", data);


      setTenants(data);


      if (data.tenants && data.tenants.length > 0) {
        console.log("Tenants with expiring leases:", data.tenants);
        alert(`Found ${data.tenants.length} tenants with expiring leases.`);
      } else {
        alert("No tenants with expiring leases found.");
      }
    } catch (error) {
      console.error("Error fetching tenant lease documents:", error);
      alert(`Error fetching tenant lease documents: ${error.message}`);
    }
  };


  // UseEffect to fetch tenant details right when the page loads
  useEffect(() => {
    fetchTenantLeaseDocs();
  }, []);


  //Upload image
  const handleImageChange = async (event) => {
 
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("propertyId", property.id);


        try {
            const response = await fetch('http://localhost:5000/properties/image', {
                method: 'POST',
                body: formData, // Use FormData to send the file
            });


            if (response.ok) {
                console.log('Image uploaded successfully!');
            } else {
                console.error('Failed to upload image:', await response.json());
            }


            fetchPropertyDetails();


        } catch (error) {
            console.error('Error uploading image:', error);
        }
    } else {
        alert("Please upload a valid image file.");
    }
  };


  const handleDeleteProperty = async () => {

    const propertyId = property.id;
    const tenants = property.tenants;
    const units = property.units

    try {
        // Make a DELETE request to the backend with the propertyId
        const response = await fetch(`http://localhost:5000/properties/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ propertyId, tenantIds: tenants, unitIds: units }), // Send the propertyId in the request body
        });

        if (!response.ok) {
            console.error("Failed to delete property:", response.statusText);
            return;
        }

        // Optionally handle the backend response
        const data = await response.json();
        console.log("Property deleted successfully:", data);

        // Call the onBack function to return to the previous screen
        onBack();

    } catch (error) {
        console.error("Error deleting property:", error);
    }
  };


  return (
    <div>
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="top-container">
        {/* Property details card */}
        <div className="property-profile-card">
          <div className="profile-header">
          {/* Property Name */}
          <h3 className="property-name">{editedProperty?.propertyName ?? ""}</h3>
          {/*edit button*/}
          <button onClick={() => setShowEditProperty(true)} className='edit-button'>Edit</button>
          </div>
          {/* Edit Mode */}
          {showEditProperty ? (
            <div className="edit-controls">
              <input
                type="text"
                name="propertyName"
                value={editedProperty?.propertyName ?? ""}
                onChange={handleInputChange}
                placeholder="Property Name"
              />
              <input
                type="text"
                name="companyName"
                value={editedProperty?.companyName ?? ""}
                onChange={handleInputChange}
                placeholder="Company Name"
              />
              <input
                type="text"
                name="propertyAddress"
                value={editedProperty?.propertyAddress ?? ""}
                onChange={handleInputChange}
                placeholder="Property Address"
              />
              <button onClick={saveEditedProperty}>Save</button>
              <button onClick={() => setShowEditProperty(false)}>Cancel</button>
            </div>
          ) : (
              <div className="property-content">
                {/* Image inside the card, on the left */}
                <img
                  src={editedProperty?.image}
                  alt={editedProperty?.propertyName ?? ""}
                  className="property-image"
                />
                <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="tenant-image-upload"
                    />


                {/* Property details inside the card, on the right */}
                <div className="property-data">
                  <p>Company: {editedProperty?.companyName ?? ""}</p>
                  <p>Address: {editedProperty?.propertyAddress ?? ""}</p>
                  <p>Tenant Count: {tenantCount}</p>
                  <p>Unit Count: {unitCount}</p>
                  <p>Occupancy: {editedProperty?.tenantCount && property?.unitCount
                  ? `${((editedProperty.tenantCount / editedProperty.unitCount) * 100).toFixed(2)}%`
                  : ""}</p>
                </div>
              </div>
          )}
        </div>


        {/*Tenant Leases w/ Lease Contracts ending in 2 months*/}
        <div className='leases-dashboard'>
          <div className='leases-header'>
            <h3 className='leases-title'>Leases ending in less than 2 months</h3>
          </div>
          <table className="leases-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Unit</th>
                <th>Lease End Date</th>
                <th>Days Remaining</th>
                <th>Lease Document</th>
              </tr>
            </thead>
            <tbody>
            {tenants && tenants.length > 0 ? (
              tenants.map((tenant, index) => {
                const currentLeaseDoc = tenant.leaseDocs.find((doc) => doc.isCurrent); // Find the current lease document
                const daysRemaining = Math.ceil(
                  (new Date(tenant.leaseExpiry) - new Date()) / (1000 * 60 * 60 * 24)
                );


                return (
                  <tr key={tenant.id || index}>
                    <td>{tenant.name}</td>
                    <td>{tenant.unit}</td>
                    <td>{new Date(tenant.leaseExpiry).toLocaleDateString()}</td>
                    <td>{daysRemaining}</td>
                    <td>
                      {currentLeaseDoc ? (
                        <a href={currentLeaseDoc.url} target="_blank" rel="noopener noreferrer">
                          View Document
                        </a>
                      ) : (
                        "No current lease document"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No leases ending in less than 2 months.
                </td>
              </tr>
            )}
          </tbody>
          </table>
         
        </div>
      </div>
      {/*Monthly invoices*/}
      <div className='invoices-dashboard'>
        <div className='invoices-header'>
          <h3 className="invoices-title">Invoices for September</h3>
        </div>
      </div>
      <div className='actions'>
        <button className='delete' onClick={() => setShowDeleteModal(true)}>Delete Property</button>
      </div>


      {showDeleteModal && (
        <div className="modal">
          Are you sure you want to delete this property?
          <button onClick={handleDeleteProperty}>Confirm</button>
          <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
        </div>
      )}


    </div>
  );
}


export default HomePropertyProfile;
