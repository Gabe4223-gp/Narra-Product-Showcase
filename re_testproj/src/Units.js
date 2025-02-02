import React, { useState, useEffect } from 'react';
import './Units.css';
import * as XLSX from 'xlsx';
import UnitProfile from './UnitProfile';
import { v4 as uuidv4 } from 'uuid';

function Units() {
  const [properties, setProperties] = useState([]); // Handle property list
  const [units, setUnits] = useState([]);
  const [isAddingUnits, setIsAddingUnits] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [showSizeUnitModal, setshowSizeUnitModal] = useState(false);
  const [sizeUnits, setsizeUnits] = useState("sqft");
  const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
      // Check localStorage for previously selected property ID
      const savedPropertyId = localStorage.getItem('selectedPropertyID');
      return savedPropertyId ? savedPropertyId : null; // Return saved property ID or null
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

  const fetchUnits = async (unitIds) => {


    if (unitIds?.length === 0) {
      console.log("No unit IDs provided, exiting fetch.");
      setUnits([]);
      return;  // Exit the function early if unitIds is empty
    }

    try {
 
      const response = await fetch('http://localhost:5000/units/byIds', {
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

      if (selectedProperty) {
        
        fetchUnits(selectedProperty.units || []); // Fetch tenants based on the selected property’s tenants
      }
    }
  }, [selectedPropertyID, properties]);

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
        };
   
        // Send tenant and selectedPropertyID to the backend
        const response = await fetch('http://localhost:5000/units', {
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
  
        // Clear the form
        setNewUnit({
          id: null,
          unitNo: null,
          type: null,
          mode: null,
          sizeValue: null,
          sizeUnit: "sqft",
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
    try {
 
      // Send tenant and selectedPropertyID to the backend
      const response = await fetch('http://localhost:5000/units/size', {
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
  
  //Export
  const exportToExcel = () => {
    // Filter to export based on selectedUnitIds
    const unitsToExport = units.filter((unit) =>
      selectedUnitIds.has(unit.id) // Assuming each has a unique 'id'
    );

    if (unitsToExport?.length > 0) {
      // Prepare data to export
      const unitsData = unitsToExport.map((unit) => ({
        UnitNo: unit.unitNo,
        Type: unit.type,
        Mode: unit.mode,
        Size: unit.sizeValue,
        SizeUnit: unit.sizeUnit,
        PetsAllowed: unit.petsAllowed ? "Yes" : "No",
      }));
    
      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(unitsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Units");
    
      // Export the workbook to a file
      XLSX.writeFile(wb, "unit_list.xlsx");
    }

    else {
      alert("Please select a unit");
    }
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
          const response = await fetch("http://localhost:5000/units/import", {
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
              <th>No.</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Size</th>
              <th>   
                <button onClick={() => setshowSizeUnitModal(true)}>unit</button>
              </th>
              <th>Pets Allowed</th>
              <th>Occupants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {units?.length > 0 ? (
              units.map((unit, index) => (
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
                  <td>{unit.sizeUnit} </td>
                  <td>{unit.petsAllowed ? "Yes" : "No"}</td>
                  <td>
                  {unit.tenants && unit.tenants?.length > 0 
                    ? unit.tenants.join(', ').length > 50 
                      ? `${unit.tenants.join(', ').slice(0, 50)}...` 
                      : unit.tenants.join(', ') 
                    : 'No tenants'}
                  </td>
                  <td>
                    <button onClick={() => handleViewUnit(unit)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No units added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showSizeUnitModal && (
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
      )}

      <div className="actions">
        <button className="addUnit" onClick={() => setIsAddingUnits(true)}>
          Add Unit
        </button>
        <button onClick={exportToExcel} className="exportUnits">Export Selected</button>
        <div>
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
      
        </div>
      </div>

      {isAddingUnits && (
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
      )}
    </div>
  );
}
  
export default Units;