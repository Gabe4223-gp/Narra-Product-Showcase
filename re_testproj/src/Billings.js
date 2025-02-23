// src/Billings.js
import React, { useState, useEffect } from 'react';
import UnfulfilledBills from './UnfulfilledBills';
import FulfilledBills from './FulfilledBills';
import './Billings.css';
import { useUserProfile } from './UserProfileContext';

function Billings() {
  const { userProfile } = useUserProfile();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyID, setSelectedPropertyID] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [error, setError] = useState(null);

  // Fetch properties for the current landlord
  useEffect(() => {
    async function fetchProperties() {
      if (!userProfile) return;
      try {
        const res = await fetch(`/api/properties?user_id=${userProfile.id}`);
        const data = await res.json();
        setProperties(data);
        if (data.length > 0) {
          setSelectedPropertyID(data[0].id);
          localStorage.setItem('selectedPropertyID', data[0].id);
        }
      } catch (error) {
        console.error(error);
        setError('Failed to load properties.');
      } finally {
        setLoadingProperties(false);
      }
    }
    fetchProperties();
  }, [userProfile]);

  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    setSelectedPropertyID(propertyId);
    localStorage.setItem('selectedPropertyID', propertyId);
  };

  if (loadingProperties) {
    return <div>Loading properties...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="billings-page">
      <div className="property-selector">
        <label>
          Select Property:
          <select value={selectedPropertyID} onChange={handlePropertyChange}>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.propertyName}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default Billings;
