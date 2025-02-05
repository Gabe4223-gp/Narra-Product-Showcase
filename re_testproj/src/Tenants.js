import React, { useState, useEffect} from 'react';
import './Tenants.css';
import TenantProfile from './TenantProfile';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { useAuth0 } from '@auth0/auth0-react';

function Tenants() {
  const defaultImage = "https://via.placeholder.com/150";
  const [tenants, setTenants] = useState([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
    // Check localStorage for previously selected property ID
    const savedPropertyId = localStorage.getItem('selectedPropertyID');
    return savedPropertyId ? savedPropertyId : null; // Return saved property ID or null
  });
  const [properties, setProperties] = useState([]); // Handle property list
  const [selectedTenantIds, setSelectedTenantIds] = useState(new Set());
  const [newTenant, setNewTenant] = useState({
    id: null,
    name: null,
    unit: null,
    phone: null,
    email: null,
    leaseStarted: null,
    leaseExpiry: null,
    leaseDoc: [],
    moveinDate: null,
    moveoutDate: null,
    billingDeadline: null,
    nationality: null,
    occupation: null,
    image: defaultImage,
    eWalletName: null,
    eWalletReferenceNo: null,
    bankName: null,
    bankReferenceNo: null,
    creditCardName: null,
    creditCardNo: null,
    creditCardDate: null,
    primaryPaymentMethod: null,
  });

  //
  //Handle database changes
  //
  const fetchProperties = async () => {
    
    try {

      const response = await fetch('http://localhost:5000/properties', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();

      if (data.length > 0) {
        setSelectedPropertyID(data[0].id); // Select the first property's ID
        console.log("Selected First Property ID:", data[0].id);
      } else {
          console.log("No properties found.");
      }


      setProperties(data); // Set tenants fetched from the database


    } catch (error) {
      console.error('Error fetching properties:', error);
      alert('Failed to load properties. Please try again.');
    }
  };


  useEffect(() => {
  }, [properties]);


  const fetchTenants = async (tenantIds) => {

    if (tenantIds.length === 0) {
      console.log("No tenant IDs provided, exiting fetch.");
      setTenants([]);
      return;  // Exit the function early if unitIds is empty
    }

    try {
 
      const response = await fetch('http://localhost:5000/tenants/byIds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ tenantIds }), // Send tenant IDs to backend
      });
 
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
 
      const tenantsData = await response.json();
      setTenants(tenantsData); // Update the tenants state


    } catch (error) {
      console.error('Error fetching tenants:', error);
      alert('Failed to load tenants. Please try again.');
    }
  };


  const handlePropertyChange = (event) => {
    const propertyId = event.target.value; // Get selected property's ID
    setSelectedPropertyID(propertyId); // Update selectedPropertyID state


    // Store the selected property ID in localStorage
    localStorage.setItem('selectedPropertyID', propertyId);
  };


  useEffect(() => {
    // Get the selected property ID from localStorage (if any)
    const savedPropertyId = localStorage.getItem('selectedPropertyID');
   
    // If there's a saved property ID, set it as the default
    if (savedPropertyId) {
      setSelectedPropertyID(savedPropertyId);
    }
  }, []);
 
  // This useEffect will log the updated value of selectedPropertyID
  useEffect(() => {
  }, [selectedPropertyID]); // Runs whenever selectedPropertyID changes


    // Fetch properties only once or when the component mounts
  useEffect(() => {
    fetchProperties(); // Fetch properties when component mounts or properties change
  }, []); // Empty dependency array ensures it only runs once

  // Fetch tenants when selectedPropertyID changes
  useEffect(() => {
    if (selectedPropertyID) {
      const selectedProperty = properties.find(
        (property) => property.id === selectedPropertyID
      );

      console.log("Step 1", selectedProperty);

      if (selectedProperty) {
        fetchTenants(selectedProperty.tenants || []); // Fetch tenants based on the selected property’s tenants
      }
    }
  }, [selectedPropertyID, properties]);


  const handleAddTenantChange = (field, value) => {
    setNewTenant({ ...newTenant, [field]: value });
  };

  const saveNewTenant = async () => {

    try {
      // Generate UUID here directly to ensure it's set correctly
      const tenantWithUUID = {
        ...newTenant,
        id: uuidv4(), // Generate UUID for id
      };
 
      // Send tenant and selectedPropertyID to the backend
      const response = await fetch('http://localhost:5000/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant: tenantWithUUID, // Tenant object
          propertyId: selectedPropertyID, // Selected property ID
        }),
      });
 
      if (!response.ok) {
        const errorMsg = await response.text();
        console.error('Backend error:', errorMsg);
        throw new Error('Failed to create tenant');
      }


      // Clear the form
      setNewTenant({
        id: null,
        name: null,
        unit: null,
        phone: null,
        email: null,
        leaseStarted: null,
        leaseExpiry: null,
        leaseDoc: [],
        moveinDate: null,
        moveoutDate: null,
        billingDeadline: null,
        nationality: null,
        occupation: null,
        image: defaultImage,
        eWalletName: null,
        eWalletReferenceNo: null,
        bankName: null,
        bankReferenceNo: null,
        creditCardName: null,
        creditCardNo: null,
        creditCardDate: null,
        primaryPaymentMethod: null,
      });


     
      const responseData = await response.json(); // Get the response data

      // Optionally: If you have a function that fetches tenants by IDs
      fetchTenants(responseData.tenants);
 
      setIsAddingTenant(false); // Close the add tenant form
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert(`Failed to save tenant. Error: ${error.message}`);
    }
  };


  const handleViewProfile = (tenant) => {
    setSelectedTenant(tenant);
  };


  const handleBackToList = () => {
    const selectedProperty = properties.find(
      (property) => property.id === selectedPropertyID
    );
    console.log("Hey you", selectedProperty);
    fetchProperties(selectedProperty.tenants);
    setSelectedTenant(null);

  };


  const importFromExcel = async (event) => {

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
 
        // Map and prepare data for database storage
        const importedTenants = jsonData.map((tenant) => ({
          id: uuidv4(),
          name: tenant.Name,
          unit: tenant.Unit,
          phone: tenant.Phone,
          email: tenant.Email,
          nationality: tenant.Nationality,
          occupation: tenant.Occupation,
        }));
 
        try {
          if (!selectedPropertyID) {
            alert("Please select a property before importing tenants.");
            return;
          }
 
          // Send the imported tenants and selected property ID to the backend
          const response = await fetch("http://localhost:5000/tenants/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tenants: importedTenants, // Tenants to import
              propertyId: selectedPropertyID, // Add property ID
            }),
          });
 
          if (!response.ok) {
            throw new Error("Failed to import tenants to the database.");
          }
 
          const result = await response.json();
 
          alert("Tenants imported successfully!");


          fetchTenants(result.tenantIds || [])
 
        } catch (error) {
          console.error("Error importing tenants:", error);
          alert("Failed to import tenants. Please try again.");
        }
      };
 
      reader.readAsBinaryString(file);
 
      // Reset file input
      event.target.value = "";
    }
  };


  //
  //Non data base stuff
  //


  const handleCheckboxChange = (tenantId) => {
    const updatedSelectedTenantIds = new Set(selectedTenantIds);
    if (updatedSelectedTenantIds.has(tenantId)) {
      updatedSelectedTenantIds.delete(tenantId); // Deselect
    } else {
      updatedSelectedTenantIds.add(tenantId); // Select
    }
    setSelectedTenantIds(updatedSelectedTenantIds);
  };


  const handleDeselectAll = () => {
    setSelectedTenantIds(new Set()); // Clears all selected tenant IDs
  };
 
  const handleSelectAll = () => {
    // Create a new Set to hold all tenant IDs
    const allTenantIds = new Set(tenants.map((tenant) => tenant.id));
   
    // Update the selectedTenantIds state to include all tenant IDs
    setSelectedTenantIds(allTenantIds); // Assuming setSelectedTenantIds is the function for updating selected tenants
  };


 


  if (selectedTenant !== null) {
    {console.log("Property Id", selectedPropertyID)}
    return (
      <TenantProfile
        tenantId={selectedTenant.id}
        onBack={handleBackToList}
        propertyId={selectedPropertyID}
      />
    );
  }


  return (
    <div className="tenant-container">
      <div className='tenant-list-top'>
        <h3>Tenant List</h3>
        <select
          id="property-select"
          onChange={handlePropertyChange}
          value={selectedPropertyID || ""}
        >
          <option value="" disabled>
            Select a property
          </option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.propertyName}
            </option>
          ))}
        </select>
      </div>
      <div className="tenant-list">
        <table>
          <thead>
            <tr>
              <th> </th>
              <th>Name</th>
              <th>Unit Number</th>
              <th>Email</th>
              <th>Lease Started</th>
              <th>Lease Expiry</th>
              <th>Billing Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length > 0 ? (
              tenants.map((tenant, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.has(tenant.id)}
                      onChange={() => handleCheckboxChange(tenant.id)}
                    />
                  </td>
                  <td>{tenant.name}</td>
                  <td>{tenant.unit}</td>
                  <td>{tenant.email}</td>
                  <td>{tenant.leaseStarted ? tenant.leaseStarted : ""}</td>
                  <td>{tenant.leaseExpiry ? tenant.leaseExpiry : ""}</td>
                  <td>{tenant.billingDeadline}</td>
                  <td>
                    <button onClick={() => handleViewProfile(tenant)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                  No tenants added yet.
                </td>
              </tr>
            )}
          </tbody>

          
        </table>
      </div>


      <div className="actions">
        <button className="addTenant" onClick={() => setIsAddingTenant(true)}>
          Add Tenant
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={importFromExcel}
          style={{ display: "none" }}
          id="file-upload"
        />
        <button
          onClick={() => document.getElementById("file-upload").click()}
          className="importTenants"
        >
          Import From Excel
        </button>
        <button onClick={handleSelectAll}>Select All</button>
        <button onClick={handleDeselectAll}>Unselect All</button>
      </div>


      {isAddingTenant && (
        <div className='overlay'>
          <div className="modal">
            <h3>Add New Tenant</h3>
            <form>
              <label>
                Name:
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => handleAddTenantChange("name", e.target.value)}
                />
              </label>
              <label>
                Unit Number:
                <input
                  type="text"
                  value={newTenant.unit}
                  onChange={(e) => handleAddTenantChange("unit", e.target.value)}
                />
              </label>
              <label>
                Phone Number:
                <input
                  type="text"
                  value={newTenant.phone}
                  onChange={(e) => handleAddTenantChange("phone", e.target.value)}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => handleAddTenantChange("email", e.target.value)}
                />
              </label>
              <label>
                Nationality:
                <input
                  type="text"
                  value={newTenant.nationality}
                  onChange={(e) =>
                    handleAddTenantChange("nationality", e.target.value)
                  }
                />
              </label>
              <label>
                Occupation:
                <input
                  type="text"
                  value={newTenant.occupation}
                  onChange={(e) =>
                    handleAddTenantChange("occupation", e.target.value)
                  }
                />
              </label>
              <label>
                Move-In Date:
                <input
                  type="date"
                  value={newTenant.moveinDate}
                  onChange={(e) =>
                    handleAddTenantChange("moveinDate", e.target.value)
                  }
                />
              </label>
            </form>
            <div>
              <button onClick={saveNewTenant}>Save</button>
              <button onClick={() => setIsAddingTenant(false)}>Cancel</button>
            </div>
          </div>
        </div>
        
      )}
    </div>
  );
}


export default Tenants;