import React, { useState, useTransition } from 'react';
import './Unit.css';
import * as XLSX from 'xlsx';
import UnitProfile from './UnitProfile';

class UnitClass {
    constructor({
      id =  Math.random(),
      unitNo = null,
      type = null,
      mode = null,
      sizeValue = null,
      sizeUnit = "sqft",
      petsAllowed = false,
      tenants = [],
      waterLastReading = [],
      waterCurrentReading = [],
      electricityLastReading = [],
      electricityCurrentReading = [],
      issues = [],
      image = "https://via.placeholder.com/150"
    } = {}) {
      this.id = id;
      this.unitNo = unitNo;
      this.type = type; 
      this.mode = mode;
      this.sizeValue = sizeValue; 
      this.sizeUnit = sizeUnit;
      this.petsAllowed = petsAllowed;
      this.tenants = tenants;
      this.waterLastReading = waterLastReading;
      this.waterCurrentReading = waterCurrentReading;
      this.electricityLastReading = electricityLastReading;
      this.electricityCurrentReading = electricityCurrentReading;
      this.issues = issues;
      this.image = image;
    }
  }

function Unit() {
    const [units, setUnits] = useState([]);
    const [isAddingUnits, setIsAddingUnits] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
    const [showSizeUnitModal, setshowSizeUnitModal] = useState(false);
    const [newSizeUnit, setnewSizeUnit] = useState("");
    const [sizeUnits, setsizeUnits] = useState("");
    const [newUnit, setNewUnit] = useState({
      id: null,
      unitNo: null,
      type: null,
      mode: null,
      sizeValue: null,
      sizeUnit: null,
      petsAllowed: false,
      tenants: [], //connect to server to have access to tenants
      waterLastReading: [],
      waterCurrentReading: [],
      electricityLastReading: [],
      electricityCurrentReading: [],
      issues: [],
      image: "https://via.placeholder.com/150"
    });
  
    const handleEditUnitDetails = (editedUnit) => {
      const updatedUnits = units.map((unit) =>
          unit.id === editedUnit.id ? { ...unit, ...editedUnit } : unit
      );
      setUnits(updatedUnits); // Update the tenants array in state
    };
  
    const handleAddUnitChange = (field, value) => {
      setNewUnit({ ...newUnit, [field]: value });
    };
  
    const saveNewUnit = () => {
      const unit = new UnitClass(newUnit); // Default sizeUnit is set in the class
      setUnits([...units, unit]); // Add the new unit object to the state
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
      setIsAddingUnits(false);
    };
  
    const handleViewUnit = (unit) => {
      setSelectedUnit(unit);
    };
  
    const handleBackToList = () => {
      setSelectedUnit(null);
    };
  
    const exportToExcel = () => {
      // Filter tenants to export based on selectedTenantIds
      const unitsToExport = units.filter((unit) =>
        selectedUnitIds.has(unit.id) // Assuming each tenant has a unique 'id'
      );
  
      if (unitsToExport.length > 0) {
        // Prepare data to export
        const unitsData = unitsToExport.map((unit) => ({
          UnitNo: unit.unitNo,
          Type: unit.type,
          Mode: unit.mode,
          Size: unit.sizeValue,
          SizeUnit: unit.sizeUnit,
          PetsAllowed: unit.petsAllowed,
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
  
    // Define the required columns and their format
    const requiredColumns = [
      "UnitNo",
      "Type",
      "Mode",
      "Size",
      "Size Unit",
      "Pets Allowed",
    ];
  
    // Import from Excel
    const importFromExcel = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
          // Validate required columns
          const missingColumns = requiredColumns.filter(
            (column) => !(column in jsonData[0])
          );
    
          if (missingColumns.length > 0) {
            alert(
              `The following required columns are missing: ${missingColumns.join(
                ", "
              )}`
            );
            return;
          }
    
          // Map data if validation passes
          const importedUnits = jsonData.map((unit) => new UnitClass({
            id: unit.id,
            unitNo: unit.unitNo,
            type: unit.type,
            mode: unit.mode,
            sizeValue: unit.sizeValue,
            sizeUnit: unit.sizeUnit,
            petsAllowed: unit.petsAllowed,
          }));
    
          // Append new tenants to state
          setUnits((prevUnits) => [...prevUnits, ...importedUnits]);
        };
    
        reader.readAsBinaryString(file);
    
        // Reset file input
        event.target.value = "";
      }
    };
  
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

    const handleSizeUnitChange = (value) => {
      setnewSizeUnit(value); // Update temporary input value
    };

    const saveSizeUnitChange = () => {
      setUnits(units.map(unit => ({ ...unit, sizeUnit: newSizeUnit })));
      setsizeUnits(newSizeUnit);
      setshowSizeUnitModal(false);
    }; 
  
    if (selectedUnit !== null) {
      return (
        <UnitProfile
        unit={selectedUnit}
        onBack={handleBackToList}
        onEditUnitDetails={handleEditUnitDetails}
        />
      );
    }
  
    return (
      <div className="unit-container">
        <div className='unit-list-top'>
          <h3>Tenant List</h3>
          <button className='unit-list-switch-property'>View: </button> 
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
              {units.length > 0 ? (
                units.map((unit, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUnitIds.has(unit.id)}
                        onChange={() => handleCheckboxChange(unit.id)}
                      />
                    </td>
                    <td>{unit.unitNo}</td>
                    <td>{unit.type}</td>
                    <td>{unit.mode}</td>
                    <td>{unit.sizeValue}</td>
                    <td>{unit.sizeUnit} </td>
                    <td>{unit.petsAllowed ? "Yes" : "No"}</td>
                    <td>
                      {unit.tenants.length > 0 
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
                  value={newUnit.petsAllowed}
                  onChange={(e) =>
                    handleAddUnitChange("petsAllowed", e.target.value)
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
  
export default Unit;