// src/Billings.js
import React, { useState, useEffect } from 'react';
import UnfulfilledBills from './UnfulfilledBills';
import FulfilledBills from './FulfilledBills';
import './Billings.css';
import { useUserProfile } from './UserProfileContext';

function Billings() {
  const { userProfile } = useUserProfile();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
      console.log("Selected Property", localStorage.getItem('selectedPropertyIDBilling'));
      return localStorage.getItem('selectedPropertyIDBilling') || "";
    });
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // Fetch properties for the current landlord
 
  const fetchProperties = async () => {
    if (!userProfile) return;
    try {
      const response = await fetch(`/properties?user_id=${userProfile.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      
      // Check if the saved selectedPropertyID exists in the fetched properties
      const savedPropertyId = localStorage.getItem('selectedPropertyIDBilling');
      const propertyExists = data.some((property) => property.id === savedPropertyId);
  
      if (!propertyExists) {
        // If the saved property doesn't exist, reset the selectedPropertyID
        setSelectedPropertyID(data.length > 0 ? data[0].id : "");
        localStorage.setItem('selectedPropertyIDBilling', data.length > 0 ? data[0].id : "");
      } else {
        // If the saved property exists, keep it as selected
        setSelectedPropertyID(savedPropertyId);
      }


      setProperties(data); // Set tenants fetched from the database

    } catch (error) {
      console.error(error);
      setError('Failed to load properties.');
    } finally {
      setLoadingProperties(false);
    }
  }

  // UseEffect to fetch property
  useEffect(() => {
      fetchProperties();
  }, []);
  
  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    setSelectedPropertyID(propertyId);
    localStorage.setItem('selectedPropertyIDBilling', propertyId);
  };

  if (loadingProperties) {
    return <div>Loading properties...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

   const handleRefresh = () => {
    setRefresh((prev) => !prev);
   }

  return (
    <div className="billings-page">
      <div className="property-selector">
        <label>
          <select value={selectedPropertyID || ""} onChange={handlePropertyChange}>
            <option value="" disabled>
              Select a property
            </option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.propertyName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <UnfulfilledBills
          propertyId={selectedPropertyID}
          onMarkPaid={handleRefresh}
          refresh={refresh}
        />
        <FulfilledBills
          propertyId={selectedPropertyID}
          onMarkUnpaid={handleRefresh}
          refresh={refresh}
        />
      </div>

    </div>
  );
}

export default Billings;
