import React, { useState, useEffect } from 'react';
import './Units.css';
import * as XLSX from 'xlsx';
import UnitProfile from './UnitProfile';
import { v4 as uuidv4 } from 'uuid';
import { useUserProfile } from "./UserProfileContext";

function Units() {
  const [properties, setProperties] = useState([]); // Handle property list
  const [units, setUnits] = useState([]);
  const [isAddingUnits, setIsAddingUnits] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [showSizeUnitModal, setshowSizeUnitModal] = useState(false);
  const [sizeUnits, setsizeUnits] = useState("");
  const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
      console.log("Selected Property", localStorage.getItem('selectedPropertyIDUnit'));
      return localStorage.getItem('selectedPropertyIDUnit') || "";
    });
  const [newUnit, setNewUnit] = useState({
    id: null,
    unitNo: null,
    type: null,
    mode: null,
    sizeValue: null,
    sizeUnit: sizeUnits,
    petsAllowed: false,
    tenants: [], 
    propertyId: null,
    waterLastReading: [],
    waterCurrentReading: [],
    electricityLastReading: [],
    electricityCurrentReading: [],
    issues: [],
    image: "https://via.placeholder.com/150"
  });
  const {userProfile} = useUserProfile();

  const fetchProperties = async () => {
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
  
      // Check if the saved selectedPropertyID exists in the fetched properties
      const savedPropertyId = localStorage.getItem('selectedPropertyIDUnit');
      const propertyExists = data.some((property) => property.id === savedPropertyId);
  
      if (!propertyExists) {
        // If the saved property doesn't exist, reset the selectedPropertyID
        setSelectedPropertyID(data.length > 0 ? data[0].id : "");
        localStorage.setItem('selectedPropertyIDUnit', data.length > 0 ? data[0].id : "");
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

  const fetchUnits = async (unitIds) => {

    console.log("function works sdfh");

    if (unitIds?.length === 0) {
      console.log("No unit IDs provided, exiting fetch.");
      setUnits([]);
      return;  // Exit the function early if unitIds is empty
    }

    try {
 
      const response = await fetch('/units/byIds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unitIds }), // Send tenant IDs to backend
      });
 
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
 
      const unitsData = await response.json();
      setUnits(unitsData); // Update the tenants state


    } catch (error) {
      console.error('Error fetching tenants:', error);
      alert('Failed to load tenants. Please try again.');
    }
  };

  const handlePropertyChange = (event) => {
    const propertyId = event.target.value; // Get selected property's ID
    setSelectedPropertyID(propertyId); // Update selectedPropertyID state

    // Store the selected property ID in localStorage
    localStorage.setItem('selectedPropertyIDUnit', propertyId);
  };

    // Fetch properties only once or when the component mounts
  useEffect(() => {
    fetchProperties(); // Fetch properties when component mounts or properties change
  }, []); // Empty dependency array ensures it only runs once

  useEffect(() => {
    console.log("selectedPropertyID:", selectedPropertyID); // Check the value

    // Proceed only if selectedPropertyID exists
    if (selectedPropertyID) {
      const selectedProperty = properties.find(
        (property) => property.id === selectedPropertyID
      );

      console.log("aoisdfj", selectedProperty);

      if (selectedProperty) {
        console.log("We're here");  // Now this should log
        fetchUnits(selectedProperty.units || []);  // Fetch tenants based on the selected property’s tenants
      }
    }
  }, [selectedPropertyID, properties]); // Ensure selectedPropertyID is being set correctly

  //Adding unit
  const handleAddUnitChange = (field, value) => {
    if (field === 'petsAllowed') {
      setNewUnit({ ...newUnit, [field]: value.target.checked });
    } else {
      setNewUnit({ ...newUnit, [field]: value });
    }
  };

  //Saving unit
  const saveNewUnit = async () => {
  
      try {
        // Generate UUID here directly to ensure it's set correctly
        const unitWithUUID = {
          ...newUnit,
          id: uuidv4(), // Generate UUID for id
          sizeUnit: sizeUnits,
        };
   
        // Send tenant and selectedPropertyID to the backend
        const response = await fetch('/units', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            unit: unitWithUUID, // Tenant object
            propertyId: selectedPropertyID, // Selected property ID
          }),
        });
   
        if (!response.ok) {
          const errorMsg = await response.text();
          console.error('Backend error:', errorMsg);
          throw new Error('Failed to create unit');
        }

        console.log("alsjdfhlaksdhf", sizeUnits);
  
        // Clear the form
        setNewUnit({
          id: null,
          unitNo: null,
          type: null,
          mode: null,
          sizeValue: null,
          sizeUnit: sizeUnits,
          petsAllowed: false,
          tenants: [],
          waterLastReading: [],
          waterCurrentReading: [],
          electricityLastReading: [],
          electricityCurrentReading: [],
          issues: [],
          image: "https://via.placeholder.com/150",
        });
      
        const responseData = await response.json(); // Get the response data
  
        // Optionally: If you have a function that fetches tenants by IDs
        fetchUnits(responseData.units);

        // Update properties to reflect the newly added tenant
        setProperties((prevProperties) =>
          prevProperties.map((property) =>
            property.id === selectedPropertyID
              ? { ...property, units: [...(property.units || []), unitWithUUID.id] }
              : property
          )
        );
   
        setIsAddingUnits(false); // Close the add tenant form
      } catch (error) {
        console.error('Error creating tenant:', error);
        alert(`Failed to save tenant. Error: ${error.message}`);
      }
    };

  const handleSizeUnitChange = (value) => {
    setsizeUnits(value); // Update temporary input value
  };

  const saveSizeUnitChange = async () => {
    console.log("size sldjfhalskdhf", sizeUnits);
    try {
 
      // Send tenant and selectedPropertyID to the backend
      const response = await fetch('/units/size', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: selectedPropertyID,
          sizeUnits: sizeUnits,
        }),
      });
 
      if (!response.ok) {
        const errorMsg = await response.text();
        console.error('Backend error:', errorMsg);
        throw new Error('Failed to create unit');
      }
    
      const responseData = await response.json(); // Get the response data

      // Optionally: If you have a function that fetches tenants by IDs
      fetchUnits(responseData.units);

      setsizeUnits(responseData.sizeUnits);
      console.log("size units", sizeUnits);

      setshowSizeUnitModal(false);
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert(`Failed to save tenant. Error: ${error.message}`);
    }
    
  }; 

  const handleViewUnit = (unit) => {
    setSelectedUnit(unit);
  };

  const handleBackToList = () => {
    const selectedProperty = properties.find(
      (property) => property.id === selectedPropertyID
    );
    console.log("Hey you", selectedProperty);
    fetchProperties(selectedProperty.units);
    setSelectedUnit(null);
  };

  //Import
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
        const importedUnits = jsonData.map((unit) => ({
          id: uuidv4(),
          name: unit.Name,
          unitNo: unit.UnitNo,
          type: unit.Type,
          mode: unit.Mode,
          sizeValue: unit.Size,
          sizeUnit: unit.SizeUnit,
          petsAllowed: unit.PetsAllowed,
        }));
  
        try {
          if (!selectedPropertyID) {
            alert("Please select a property before importing units.");
            return;
          }
  
          // Send the imported units and selected property ID to the backend
          const response = await fetch(`/units/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              units: importedUnits, // Units to import
              propertyId: selectedPropertyID, // Add property ID
            }),
          });
  
          if (!response.ok) {
            throw new Error("Failed to import units to the database.");
          }
  
          const result = await response.json();
  
          alert("Units imported successfully!");

          fetchUnits(result.unitIds || [])

          // Update the properties state to include the newly imported units
          setProperties((prevProperties) =>
            prevProperties.map((property) =>
              property.id === selectedPropertyID
                ? {
                    ...property,
                    units: [
                      ...(property.units || []), // Retain existing units
                      ...importedUnits.map((unit) => unit.id), // Add imported tenants
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

  const handleDeleteUnits = async () => {

    if (selectedUnitIds.size === 0) {
      console.error("No units selected for deletion.");
      return;
    
    }
    try {
        // Make a DELETE request to the backend with the propertyId
        const response = await fetch(`/units/delete-all`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unitIds: Array.from(selectedUnitIds), propertyId: selectedPropertyID}), // Send the propertyId in the request body
        });

        if (!response.ok) {
            console.error("Failed to delete unit:", response.statusText);
            return;
        }

        // Optionally handle the backend response
        const data = await response.json();
        console.log("Unit deleted successfully:", data);

        fetchUnits(data.updatedUnitIds);

        // Update properties state by removing deleted units from the selected property
        setProperties((prevProperties) =>
          prevProperties.map((property) =>
              property.id === selectedPropertyID
                  ? {
                        ...property,
                        units: property.units.filter(
                            (unitId) => !selectedUnitIds.has(unitId)
                        ),
                    }
                  : property
          )
        );
        
        setShowDeleteModal(false);

    } catch (error) {
        console.error("Error deleting unit:", error);
    }
  };

  //Non-database stuff//

  const handleCheckboxChange = (unitId) => {
    const updatedSelectedUnitIds = new Set(selectedUnitIds);
    if (updatedSelectedUnitIds.has(unitId)) {
      updatedSelectedUnitIds.delete(unitId); // Deselect
    } else {
      updatedSelectedUnitIds.add(unitId); // Select
    }
    setSelectedUnitIds(updatedSelectedUnitIds);
  };

  const handleDeselectAll = () => {
    setSelectedUnitIds(new Set()); // Clears all selected unit IDs
  };
  
  const handleSelectAll = () => {
    // Create a new Set to hold all tenant IDs
    const allUnitIds = new Set(units.map((unit) => unit.id));
    
    // Update the selectedTenantIds state to include all tenant IDs
    setSelectedUnitIds(allUnitIds); // Assuming setSelectedTenantIds is the function for updating selected tenants
  };
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIndicator = (key) => {
    return sortConfig.key === key ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : " ▲";
  };

  const sortedUnits = [...units].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting initially
    
    if (sortConfig.key === "unitNo" || sortConfig.key === "sizeValue") {
      return sortConfig.direction === "asc"
        ? Number(a[sortConfig.key]) - Number(b[sortConfig.key])
        : Number(b[sortConfig.key]) - Number(a[sortConfig.key]);
    } else {
      return sortConfig.direction === "asc"
        ? (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "")
        : (b[sortConfig.key] || "").localeCompare(a[sortConfig.key] || "");
    }
  });


  if (selectedUnit !== null) {
    return (
      <UnitProfile
      unitId={selectedUnit.id}
      onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="unit-container">
      <div className='unit-list-top'>
        <h3>Unit List</h3>
        <select
          id="property-select"
          onChange={handlePropertyChange}
          value={selectedPropertyID || ""}
        >
          <option value="" disabled>
            Select a property
          </option>
          {properties.map((property) => (
            <option key={property?.id} value={property?.id}>
              {property.propertyName}
            </option>
          ))}
        </select>
      </div>
      <div className="unit-list">
        <table>
          <thead>
            <tr>
              <th> </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("unitNo")}>No.{getSortIndicator("unitNo")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("type")}>Type{getSortIndicator("type")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("mode")}>Mode{getSortIndicator("mode")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("sizeValue")}>Size{getSortIndicator("sizeValue")}</th>
              <th>   
                <button onClick={() => setshowSizeUnitModal(true)}>unit</button>
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("petsAllowed")}>Pets Allowed{getSortIndicator("petsAllowed")}</th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("tenants")}>Occupants{getSortIndicator("tenants")}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUnits?.length > 0 ? (
              sortedUnits.map((unit, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.has(unit?.id)}
                      onChange={() => handleCheckboxChange(unit?.id)}
                    />
                  </td>
                  <td>{unit.unitNo}</td>
                  <td>{unit.type}</td>
                  <td>{unit.mode}</td>
                  <td>{unit.sizeValue}</td>
                  <td>{unit.sizeUnit}</td>
                  <td>{unit.petsAllowed ? "Yes" : "No"}</td>
                  <td>
                    {unit.tenants && unit.tenants?.length > 0 
                      ? unit.tenants.length
                      : "No tenants"}
                  </td>
                  <td>
                    <button onClick={() => handleViewUnit(unit)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No units added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showSizeUnitModal && (
        <div className='overlay'>
          <div className='modal'>
            <form>
              <label>
                  Size unit:
                  <input
                    type="text"
                    onChange={(e) => handleSizeUnitChange(e.target.value)}
                  />
              </label>
            </form>
            <button onClick={saveSizeUnitChange}>Save</button>
            <button onClick={() => setshowSizeUnitModal(false)}>Cancel</button>
          </div>
        </div>
        
      )}

      <div className="actions">
        <button className="addUnit" onClick={() => setIsAddingUnits(true)}>
          Add Unit
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
          className="importUnits"
        >
          Import From Excel
        </button>
        
        <button onClick={handleSelectAll}>Select All</button>
      
        <button onClick={handleDeselectAll}>Unselect All</button>

        <button onClick={() => setShowDeleteModal(true)}>Delete Selected</button>
      
        
      </div>

      {isAddingUnits && (
        <div className='overlay'>
          <div className="modal">
              <h3>Add New Unit</h3>
              <form>
                <label>
                  No:
                  <input
                    type="number"
                    value={newUnit.unitNo}
                    onChange={(e) => handleAddUnitChange("unitNo", e.target.value)}
                  />
                </label>
                <label>
                  Type:
                  <input
                    type="text"
                    value={newUnit.type}
                    onChange={(e) => handleAddUnitChange("type", e.target.value)}
                  />
                </label>
                <label>
                  Mode:
                  <input
                    type="text"
                    value={newUnit.mode}
                    onChange={(e) => handleAddUnitChange("mode", e.target.value)}
                  />
                </label>
                <label>
                  Size:
                  <input
                    type="number"
                    value={newUnit.sizeValue}
                    onChange={(e) => handleAddUnitChange("sizeValue", e.target.value)}
                  />
                </label>
                <label>
                  Pets Allowed:
                  <input
                    type="checkbox"
                    checked={newUnit.petsAllowed}
                    onChange={(e) =>
                      handleAddUnitChange("petsAllowed", e)
                    }
                  />
                </label>
              </form>
              <div>
                <button onClick={saveNewUnit}>Save</button>
                <button onClick={() => setIsAddingUnits(false)}>Cancel</button>
              </div>
            </div>
        </div>
        
      )}

      {showDeleteModal && (
        <div className='overlay'>
          <div className='modal'>
              <div>
                  Are you sure you want to delete these units?
              </div>
              <button onClick={handleDeleteUnits}>Confirm</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
  
export default Units;