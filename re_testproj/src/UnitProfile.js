import React, { useState, useEffect} from 'react';
import "./UnitProfile.css";
import Utilities from './Utilities';

function UnitProfile ({unit, onBack, onEditUnitDetails}) {

    const [image, setImage] = useState(unit.image);
    const [showEditUnitDetails, setshowEditUnitDetails] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [editedUnit, setEditedUnit] = useState({
        id: unit.id,
        unitNo: unit.unitNo,
        type: unit.type,
        mode: unit.mode,
        sizeValue: unit.sizeValue,
        sizeUnit: unit.sizeUnit,
        petsAllowed: unit.petsAllowed,
        tenants: unit.tenants,
        waterLastReading: unit.waterLastReading,
        waterCurrentReading: unit.waterCurrentReading,
        electricityLastReading: unit.electricityLastReading,
        electricityCurrentReading: unit.electricityCurrentReading,
        issues: unit.issues,
        image: unit.image
    });

    const handleViewProfile = (tenant) => {
        setSelectedTenant(tenant);
      };

    //Edit tenant
    const handleEditUnitChange = (field, value) => {
        
        setEditedUnit((prevUnit) => ({
            ...prevUnit,
            [field]: value,
        }));
    };

    // Set editable tenant whenever the prop changes
    useEffect(() => {
        setEditedUnit(unit);
    }, [unit]); // Only re-run if the tenant prop changes

    const saveEditUnit = () => {
        if (
            editedUnit.unitNo &&
            editedUnit.type &&
            editedUnit.mode &&
            editedUnit.sizeValue
        ) {
            // Call the callback to update the parent component (Unit.js)
            onEditUnitDetails(editedUnit);
            setshowEditUnitDetails(false);
        } else {
            alert("Please fill in all fields.");
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid image file.");
        }
    };

    const handleEditUnitUtilities = (editedUnit) => {
        onEditUnitDetails(editedUnit)
    };

    const handleEditUnitIssues = (editedUnit) => {
        onEditUnitDetails(editedUnit)
    };

    return (
        <div className="unit-profile">
            <button onClick={onBack}>Back</button>
            <div className="unit-top-section">
                <div className="unit-image-container">
                    <img src={image} alt="Unit" className="unit-image" />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="unit-image-upload"
                    />
                </div>

                <div className="unit-details">
                        <div className='unit-header'>
                            <h5>Unit Details</h5>
                            <button onClick={() => setshowEditUnitDetails(true)}>Edit</button>
                        </div>
                        <div className="unit-row">
                            <div className="left-unit-details">
                                <p>No.:  {editedUnit.unitNo}</p>
                                <p>Type:  {editedUnit.type}</p>
                                <p>Mode:  {editedUnit.mode}</p>
                                <p>Size:  {editedUnit.sizeValue} {editedUnit.sizeUnit}</p>
                            </div>
                            <div className="right-unit-details">
                                <p>Pets Allowed:  {editedUnit.petsAllowed ? "Yes" : "No"}</p>
                                <p>
                                    Occupants: 
                                    {editedUnit.tenants && editedUnit.tenants.length > 0 ? (
                                        <ul>
                                            {editedUnit.tenants.map((tenant, index) => (
                                                <li key={index}>{tenant}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span> No occupants</span>
                                    )}
                                </p>
                            </div>
                        </div>

                </div>

                <div className='unit-tenants'>
                    <h5>Tenant History</h5>
                    <div className='tenant-history'>
                        <table>
                            <thead>
                                <tr> 
                                    <th>Name</th>
                                    <th>Move-in Date</th>
                                    <th>Move-out Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editedUnit.tenants.length > 0 ? (
                                    editedUnit.tenants.map((tenant, index) => (
                                    <tr key={index}>
                                        <td>{tenant.name}</td>
                                        <td>{tenant.moveinDate}</td>
                                        <td>{tenant.moveoutDate}</td>
                                        <td>
                                            <button onClick={() => handleViewProfile(tenant)}>View</button>
                                        </td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                                            No tenant history
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
            </div>

            <div className='unit-mid-section'>

                <div className="utility-details">
                    <Utilities
                    unit={editedUnit}
                    onAddReading={handleEditUnitUtilities}
                    />
                </div>

                <div className="issues-details">
                    
                </div>
                
                
            </div>

            <div className="unit-actions">
                <h5>Actions</h5>
                <button>Delete Unit</button>
            </div>

            {showEditUnitDetails && (
                
                <div className="modal">
                    <h3>Edit Unit</h3>
                    <form>
                    <label>
                        No.:
                        <input
                        type="number"
                        value={editedUnit.unitNo || ''}
                        onChange={(e) => handleEditUnitChange("unitNo", e.target.value)}
                        />
                    </label>
                    <label>
                        Type:
                        <input
                        type="text"
                        value={editedUnit.type || ''}
                        onChange={(e) => handleEditUnitChange("type", e.target.value)}
                        />
                    </label>
                    <label>
                        Mode:
                        <input
                        type="text"
                        value={editedUnit.mode || ''}
                        onChange={(e) => handleEditUnitChange("mode", e.target.value)}
                        />
                    </label>
                    <label>
                        Size
                        <input
                        type="number"
                        value={editedUnit.sizeValue || ''}
                        onChange={(e) => handleEditUnitChange("sizeValue", e.target.value)}
                        />
                    </label>
                    <label>
                        Pets Allowed
                        <input
                        type="checkbox"
                        checked={!!editedUnit.petsAllowed} 
                        onChange={(e) =>
                            handleEditUnitChange("petsAllowed", e.target.checked)
                        }
                        />
                    </label>
                    </form>
                    <div>
                    <button onClick={saveEditUnit}>Save</button>
                    <button onClick={() => setshowEditUnitDetails(false)}>Cancel</button>
                    </div>
                </div>
    
            )};
        </div>
    );

}

export default UnitProfile

