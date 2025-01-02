import React, { useState } from 'react';
import './Homepage.css';
import HomePropertyProfile from "./HomePropertyProfile";
import { Link } from 'react-router-dom';
import { FaChartBar, FaUsers, FaCog } from 'react-icons/fa';

function HomePage({ onLogout }) {
  const [isModalVisible, setIsModalVisible] = useState(false); // Handle create new property pop-up
  const [properties, setProperties] = useState([]); // Handle property list
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(null); // Track selected property index
  const [uploadedImage, setUploadedImage] = useState(null);
  const defaultImage = "https://via.placeholder.com/150"; // Replace with your preferred default image URL

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file)); // Generate a preview URL
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    // Get input values
    const companyName = document.getElementById("company-name").value;
    const propertyName = document.getElementById("property-name").value;
    const propertyAddress = document.getElementById("property-address").value;

    // Create a new property object
    const newProperty = {
      companyName,
      propertyName,
      propertyAddress,
      image: uploadedImage || defaultImage,
      tenantCount: 0, // default value for tenant count
      unitCount: 0, // default value for unit count
      occupancyRate: 0, // default value for occupancy rate
    };

    // Add the new property to the state
    setProperties([...properties, newProperty]);

    // Hide the modal and reset the form
    setIsModalVisible(false);
    setUploadedImage(null); // Reset the image state
    event.target.reset(); // Reset form fields
  };

  const handleViewProperty = (index) => {
    setSelectedPropertyIndex(index); // Set the selected property index for the profile view
  };

  const handleBack = () => {
    setSelectedPropertyIndex(null); // Go back to the property list
  };

  const updateProperty = (index, updatedProperty) => {
    setProperties((prevProperties) =>
      prevProperties.map((property, i) =>
        i === index ? updatedProperty : property
      )
    );
  };

  if (selectedPropertyIndex !== null) {
    return (
      <HomePropertyProfile
        property={properties[selectedPropertyIndex]}
        onBack={handleBack}
        onUpdate={(updatedProperty) =>
          updateProperty(selectedPropertyIndex, updatedProperty)
        }
      />
    );
  }

  return (
    <div className="homepage">
      <div className="property-list-box">
        <h5>Properties</h5>
        {properties.length === 0 ? (
          <div className="blank-box"></div>
        ) : (
          properties.map((property, index) => (
            <div key={index} className="property-item">
              <button
                id="view-property"
                onClick={() => handleViewProperty(index)}
              >
                {property.propertyName}
              </button>
              <p>Company: {property.companyName}</p>
              <p>Address: {property.propertyAddress}</p>
            </div>
          ))
        )}
        <button id="create-property-btn" onClick={() => setIsModalVisible(true)}>
          Create new property
        </button>
      </div>

      {isModalVisible && (
        <div id="property-modal">
          <div className="modal-content">
            <form id="property-form" onSubmit={handleFormSubmit}>
              <label>
                <h6>Property Name:</h6>
                <input type="text" id="property-name" required />
              </label>
              <label>
                <h6>Company Name:</h6>
                <input type="text" id="company-name" required />
              </label>
              <label>
                <h6>Address:</h6>
                <input type="text" id="property-address" required />
              </label>
              <label>
                <h6>Upload Image:</h6>
                <input
                  type="file"
                  id="property-image"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
              <button type="submit">Save</button>
              <button
                type="button"
                id="close-modal"
                onClick={() => setIsModalVisible(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;