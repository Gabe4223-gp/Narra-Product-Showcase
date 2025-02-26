import React, { useState, useEffect, useCallback} from 'react';
import './Homepage.css';
import HomePropertyProfile from "./HomePropertyProfile";
import { v4 as uuidv4 } from 'uuid';
import { useUserProfile } from "./UserProfileContext";

function HomePage({ onLogout }) {
  const [isModalVisible, setIsModalVisible] = useState(false); // Handle create new property pop-up
  const [properties, setProperties] = useState([]); // Handle property list
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(null); // Track selected property index
  const [uploadedImage, setUploadedImage] = useState(null);
  const {userProfile, refreshUserProfile} = useUserProfile();

  // ✅ Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      await refreshUserProfile();
    };
    fetchProfile();
  }, []);

  // ✅ Fetch properties once userProfile is available
  const fetchProperties = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const response = await fetch(`/properties?user_id=${userProfile.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      alert('Failed to load properties. Please try again.');
    }
  }, [userProfile?.id]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchProperties();
    }
  }, [userProfile?.id, fetchProperties]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file)); // Generate a preview URL
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    console.log("User profile in form submit:", userProfile);

    if (!userProfile || !userProfile.id) {
      alert("User profile not loaded. Please try again.");
      return;
    }
  
    // Get input values
    const companyName = document.getElementById("company-name").value;
    const propertyName = document.getElementById("property-name").value;
    const propertyAddress = document.getElementById("property-address").value;
    const owner = document.getElementById("owner").value;
 
    // Default image if no image uploaded
    const defaultImage = "https://img.icons8.com/ios-filled/100/000000/building.png";
    const propertyImage = uploadedImage || defaultImage;
 
    // Create a new property object
    const newProperty = {
      id: uuidv4(),
      user_id: userProfile?.id,
      companyName,
      propertyName,
      address: propertyAddress,
      image: propertyImage,
      owner,
      tenants: [],
      units: [],
    };
    
    try {
      // Make a POST request to the backend
      const response = await fetch(`/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProperty),
      });
 
      if (!response.ok) {
        throw new Error("Failed to create property. Please try again.");
      }
 
      const createdProperty = await response.json();
 
      // Update the frontend state with the new property
      setProperties((prevProperties) => [...prevProperties, createdProperty]);
 
      // Hide the modal and reset the form
      setIsModalVisible(false);
      setUploadedImage(null); // Reset the image state
      event.target.reset(); // Reset form fields
    } catch (error) {
      console.error("Error creating property:", error.message);
      alert("There was an error creating the property. Please try again.");
    }
  };


  const handleViewProperty = (index) => {
    setSelectedPropertyIndex(index); // Set the selected property index for the profile view
  };


  const handleBack = () => {
    fetchProperties();
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
              <p>Address: {property.address}</p>
              <p>Owner: {property.owner}</p>
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
                <h6>Owner:</h6>
                <input type="text" id="owner" required />
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
