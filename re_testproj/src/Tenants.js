import React, { useState, useEffect} from 'react';
import './Tenants.css';
import TenantProfile from './TenantProfile';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from "./UserProfileContext";

function Tenants() {
  const defaultImage = "https://via.placeholder.com/150";
  const [tenants, setTenants] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
    console.log("Selected Property", localStorage.getItem('selectedPropertyID'));
    return localStorage.getItem('selectedPropertyID') || "";
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
    govid: [],
  });
  const {userProfile} = useUserProfile();

  //
  //Handle database changes
  //
  const fetchProperties = async () => {
    
    try {

      const response = await fetch(`${process.env.REACT_APP_API_URL}/properties?user_id=${userProfile.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();

      // Check if the saved selectedPropertyID exists in the fetched properties
      const savedPropertyId = localStorage.getItem('selectedPropertyID');
      const propertyExists = data.some((property) => property.id === savedPropertyId);
  
      if (!propertyExists) {
        // If the saved property doesn't exist, reset the selectedPropertyID
        setSelectedPropertyID(data.length > 0 ? data[0].id : "");
        localStorage.setItem('selectedPropertyID', data.length > 0 ? data[0].id : "");
      } else {
        // If the saved property exists, keep it as selected
        setSelectedPropertyID(savedPropertyId);
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

    console.log("Tenants", tenantIds);

    if (tenantIds.length === 0) {
      console.log("No tenant IDs provided, exiting fetch.");
      setTenants([]);
      return;  // Exit the function early if unitIds is empty
    }

    try {
 
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tenants/byIds`, {
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
      return tenantIds;


    } catch (error) {
      console.error('Error fetching tenants:', error);
      alert('Failed to load tenants. Please try again.');
      return [];
    }
  };

  const handlePropertyChange = (event) => {
    const propertyId = event.target.value;
    setSelectedPropertyID(propertyId);
    localStorage.setItem('selectedPropertyID', propertyId);
    console.log("Selected Property 12", localStorage.getItem('selectedPropertyID'));
  };

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

  const fetchAndUpdateTenantEmails = async (tenantIds, userProfile) => {
    try {
      // Log tenantIds to verify it's an array
      console.log("fetchAndUpdateTenantEmails - tenantIds:", tenantIds);
      if (!Array.isArray(tenantIds)) {
        console.error("tenantIds is not an array:", tenantIds);
        return;
      }
      
      // Call the /emails-by-ids endpoint to get emails for the given tenant IDs
      const response = await fetch(`${process.env.REACT_APP_API_URL}/emails-by-ids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantIds: tenantIds, // now sending tenantIds
        }),
      });
  
      if (!response.ok) {
        const errMsg = await response.text();
        console.error("Failed to fetch tenant emails:", response.statusText, errMsg);
        return;
      }
  
      const data = await response.json();
      console.log("Received data from /emails-by-ids:", data);
      
      if (data.success) {
        // data.emails is expected to be an array of tenant emails
        const emails = data.emails;
  
        // Update the userProfile.tenants field via your existing API endpoint
        const updateResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/tenants`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tenants: emails }),
        });
        
        const updateData = await updateResponse.json();
        if (!updateData.success) {
          console.error("Failed to update userProfile.tenants:", updateData.message);
        }
      } else {
        console.error("Failed to fetch tenant emails:", data.message);
      }
    } catch (error) {
      console.error("Error updating tenant emails:", error);
    }
  };  

  const saveNewTenant = async () => {

    try {
      // Generate UUID here directly to ensure it's set correctly
      const tenantWithUUID = {
        ...newTenant,
        id: uuidv4(), // Generate UUID for id
      };
 
      // Send tenant and selectedPropertyID to the backend
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tenants`, {
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
        govid: [],
      });


     
      const responseData = await response.json(); // Get the response data

      // Optionally: If you have a function that fetches tenants by IDs
      const updatedTenantIds = await fetchTenants(responseData.tenants);

      // Update properties to reflect the newly added tenant
      setProperties((prevProperties) =>
        prevProperties.map((property) =>
          property.id === selectedPropertyID
            ? { ...property, tenants: [...(property.tenants || []), tenantWithUUID.id] }
            : property
        )
      );

      // Call helper function to fetch emails based on updated tenant IDs
    // responseData.tenants should be an array of tenant IDs
    console.log("Updated tenant IDs:", updatedTenantIds);
    fetchAndUpdateTenantEmails(updatedTenantIds, userProfile);
 
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
          const response = await fetch(`${process.env.REACT_APP_API_URL}/tenants/import`, {
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

          // Update the properties state to include the newly imported tenants
          setProperties((prevProperties) =>
            prevProperties.map((property) =>
              property.id === selectedPropertyID
                ? {
                    ...property,
                    tenants: [
                      ...(property.tenants || []), // Retain existing tenants
                      ...importedTenants.map((tenant) => tenant.id), // Add imported tenants
                    ],
                  }
                : property
            )
          );
 
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

  const handleDeleteTenants = async () => {

    if (selectedTenantIds.size === 0) {
      console.error("No tenants selected for deletion.");
      return;
    
    }
    try {
        // Make a DELETE request to the backend with the propertyId
        const response = await fetch(`${process.env.REACT_APP_API_URL}/tenants/delete-all`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tenantIds: Array.from(selectedTenantIds), propertyId: selectedPropertyID}), // Send the propertyId in the request body
        });

        if (!response.ok) {
            console.error("Failed to delete tenant:", response.statusText);
            return;
        }

        // Optionally handle the backend response
        const data = await response.json();
        console.log("Tenant deleted successfully:", data);

        const updatedTenantIds = await fetchTenants(data.updatedTenantIds);

        // Update properties state by removing deleted tenants from the selected property
        setProperties((prevProperties) =>
          prevProperties.map((property) =>
              property.id === selectedPropertyID
                  ? {
                        ...property,
                        tenants: property.tenants.filter(
                            (tenantId) => !selectedTenantIds.has(tenantId)
                        ),
                    }
                  : property
          )
        );

        // Call helper function to fetch updated tenant emails and update userProfile.tenants
        // Pass in the updated tenant IDs along with the userProfile (assuming userProfile is available)
        console.log("Updated tenant IDs:", updatedTenantIds);
        fetchAndUpdateTenantEmails(updatedTenantIds, userProfile);
        
        setShowDeleteModal(false);

    } catch (error) {
        console.error("Error deleting tenant:", error);
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


  const [sortConfig, setSortConfig] = useState({ key: "unit", direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIndicator = (key) => {
    return sortConfig.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : " ▲";
  };

  const sortedTenants = [...tenants].sort((a, b) => {
    if (sortConfig.key === "unit" || sortConfig.key === "leaseStarted" || sortConfig.key === "leaseExpiry") {
      return sortConfig.direction === "asc"
        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
    } else {
      return sortConfig.direction === "asc"
        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
        : b[sortConfig.key].localeCompare(a[sortConfig.key]);
    }
  });


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
        <a 
          className='tenant-download'
          href="https://amzn-s3-narra-bucket.s3.us-east-2.amazonaws.com/tenant+list+test.xlsx"
          download="tenant.xlsx"
        >
          Download import template
        </a>
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
              <th style={{ width: "5%" }}></th>
              <th style={{ width: "10%", cursor: "pointer" }} onClick={() => handleSort("name")}>
                Name{getSortIndicator("name")}
              </th>
              <th style={{ width: "10%", cursor: "pointer" }} onClick={() => handleSort("unit")}>
                Unit No.{getSortIndicator("unit")}
              </th>
              <th style={{ width: "20%", cursor: "pointer" }} onClick={() => handleSort("email")}>
                Email{getSortIndicator("email")}
              </th>
              <th style={{ width: "15%" }}>Phone No.</th>
              <th style={{ width: "15%", cursor: "pointer" }} onClick={() => handleSort("leaseStarted")}>
                Lease Started{getSortIndicator("leaseStarted")}
              </th>
              <th style={{ width: "15%", cursor: "pointer" }} onClick={() => handleSort("leaseExpiry")}>
                Lease Expiry{getSortIndicator("leaseExpiry")}
              </th>
              <th style={{ width: "10%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTenants.length > 0 ? (
              sortedTenants.map((tenant, index) => (
                <tr key={index}>
                  <td style={{ width: "5%" }}>
                    <input
                      type="checkbox"
                      checked={selectedTenantIds.has(tenant.id)}
                      onChange={() => handleCheckboxChange(tenant.id)}
                    />
                  </td>
                  <td style={{ width: "10%" }}>{tenant.name}</td>
                  <td style={{ width: "10%" }}>{tenant.unit}</td>
                  <td style={{ width: "20%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tenant.email}
                  </td>
                  <td style={{ width: "15%" }}>{tenant.phone}</td>
                  <td style={{ width: "15%" }}>{tenant.leaseStarted ? new Date(tenant.leaseStarted).toLocaleDateString() : ""}</td>
                  <td style={{ width: "15%" }}>{tenant.leaseExpiry ? new Date(tenant.leaseExpiry).toLocaleDateString() : ""}</td>
                  <td style={{ width: "10%" }}>
                    <button onClick={() => handleViewProfile(tenant)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>No tenants added yet.</td>
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
        <button onClick={handleSelectAll} >Select All</button>
        <button onClick={handleDeselectAll} disabled={selectedTenantIds.size === 0}>Unselect All</button>
        <button onClick={() => setShowDeleteModal(true)} disabled={selectedTenantIds.size === 0}>Delete Selected</button>
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

      {showDeleteModal && (
        <div className='overlay'>
          <div className='modal'>
              <div>
                  Are you sure you want to delete these tenants?
              </div>
              <button onClick={handleDeleteTenants}>Confirm</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default Tenants;