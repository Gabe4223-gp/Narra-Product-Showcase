import React, { useState } from 'react';
import './HomePropertyProfile.css';
import { Link } from 'react-router-dom';
import { FaChartBar, FaUsers, FaCog } from 'react-icons/fa';

function HomePropertyProfile({ property, onBack }) {
  const [editableProperty, setEditableProperty] = useState({
    ...property,
    isEditing: false, // Track if we are in editing mode
  });

  // Handle input changes for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProperty((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableProperty((prevState) => ({
          ...prevState,
          image: reader.result, // Update image with the base64 data URL
        }));
      };
      reader.readAsDataURL(file); // Convert file to base64 data URL
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditableProperty((prevState) => ({
      ...prevState,
      isEditing: !prevState.isEditing,
    }));
  };

  return (
    <div>
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="top-container">
        {/* Property details card */}
        <div className="property-profile-card">
          <div className="profile-header">
          {/* Property Name */}
          <h3 className="property-name">{editableProperty.propertyName}</h3>
          {/*edit button*/}
          <button onClick={toggleEditMode} className='edit-button'>Edit</button>
          </div>
          {/* Edit Mode */}
          {editableProperty.isEditing ? (
            <div className="edit-controls">
              <input
                type="text"
                name="propertyName"
                value={editableProperty.propertyName}
                onChange={handleInputChange}
                placeholder="Property Name"
              />
              <input
                type="text"
                name="companyName"
                value={editableProperty.companyName}
                onChange={handleInputChange}
                placeholder="Company Name"
              />
              <input
                type="text"
                name="propertyAddress"
                value={editableProperty.propertyAddress}
                onChange={handleInputChange}
                placeholder="Property Address"
              />
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <button onClick={toggleEditMode}>Save</button>
            </div>
          ) : (
              <div className="property-content">
                {/* Image inside the card, on the left */}
                <img
                  src={editableProperty.image}
                  alt={editableProperty.propertyName}
                  className="property-image"
                />

                {/* Property details inside the card, on the right */}
                <div className="property-data">
                  <p>Company: {editableProperty.companyName}</p>
                  <p>Address: {editableProperty.propertyAddress}</p>
                  <p>Tenant Count: {editableProperty.tenantCount}</p>
                  <p>Unit Count: {editableProperty.unitCount}</p>
                  <p>Occupancy: {editableProperty.occupancyRate}</p>
                </div>
              </div>
          )}
        </div>

        {/*Tenant Leases w/ Lease Contracts ending in 2 months*/}
        <div className='leases-dashboard'>
            <div className='leases-header'>
              <h3 className='leases-title'>Leases ending in less than 2 months</h3>
            </div>
        </div>
      </div>
      {/*Monthly invoices*/}
      <div className='invoices-dashboard'>
        <div className='invoices-header'>
          <h3 className="invoices-title">Invoices for September</h3>
        </div>
      </div>
    </div>
  );
}

export default HomePropertyProfile;