import React, { useState, useEffect} from 'react';
import "./UnitProfile.css";
import Utilities from './Utilities';
import TenantProfile from './TenantProfile';

function UnitProfile ({unitId, onBack}) {
    const defaultImage = "https://via.placeholder.com/150";
    const [unitDetails, setUnitDetails] = useState(null);
    const [showEditUnitDetails, setshowEditUnitDetails] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenants, setTenants] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editedUnit, setEditedUnit] = useState({
        
    });

    useEffect(() => {
        if (unitDetails) {
            setEditedUnit({
                id: unitDetails.id,
                unitNo: unitDetails.unitNo,
                type: unitDetails.type,
                mode: unitDetails.mode,
                sizeValue: unitDetails.sizeValue,
                sizeUnit: unitDetails.sizeunitDetails,
                petsAllowed: unitDetails.petsAllowed,
                tenants: unitDetails.tenants,
                propertyId: unitDetails.propertyId,
                waterLastReading: unitDetails.waterLastReading,
                waterCurrentReading: unitDetails.waterCurrentReading,
                electricityLastReading: unitDetails.electricityLastReading,
                electricityCurrentReading: unitDetails.electricityCurrentReading,
                issues: unitDetails.issues,
                image: unitDetails.image
            });
        }
    }, [unitDetails]);

    const fetchUnitDetails = async () => {

        try {
          setUnitDetails(null); // Reset unit details
   
          if (!unitId) {
            console.error("Please enter a unit ID.");
            return;
          }
   
          // Make a request to the backend
          const response = await fetch(`http://localhost:5000/units/${unitId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
   
          if (!response.ok) {
            console.error("Failed to fetch unit details");
          }
   
          const data = await response.json();
          setUnitDetails(data.unit);
          setTenants(data.tenants);


        } catch (error) {
          console.error("Error fetching unit details:", error);
        }
    };

    // UseEffect to fetch unit details right when the page loads
    useEffect(() => {
        fetchUnitDetails();
    }, []);

    //Edit unit
    const handleEditUnitChange = (field, value) => {  
        if (field === 'petsAllowed') {
            setEditedUnit({ ...editedUnit, [field]: value.target.checked });
          } else {
            setEditedUnit({ ...editedUnit, [field]: value });
          }
    };

    const saveEditUnit = async () => {

        try {
            console.log("Step 1", editedUnit);

            // Send unit and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/units/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                unit: editedUnit}),
            });
       
            if (!response.ok) {
              const errorMsg = await response.text();
              console.error('Backend error:', errorMsg);
              throw new Error('Failed to create unit');
            }
     
            // Optionally: If you have a function that fetches units by IDs
            fetchUnitDetails();
       
            setshowEditUnitDetails(false);
          } catch (error) {
            console.error('Error creating unit:', error);
            alert(`Failed to save unit. Error: ${error.message}`);
          }
    };

    const handleDeleteUnit = async () => {

        const unitId = unitDetails.id;
   
        try {
            // Make a DELETE request to the backend with the propertyId
            const response = await fetch(`http://localhost:5000/units/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ unitId }), // Send the propertyId in the request body
            });
   
            if (!response.ok) {
                console.error("Failed to delete unit:", response.statusText);
                return;
            }
   
            // Optionally handle the backend response
            const data = await response.json();
            console.log("unit deleted successfully:", data);
            
            setShowDeleteModal(false);
            // Call the onBack function to return to the previous screen
            onBack();
        } catch (error) {
            console.error("Error deleting unit:", error);
        }
      };

    const handleViewProfile = (tenantId) => {
        setSelectedTenant(tenantId);
      };

    const handleBack = () => {
        fetchUnitDetails();
        setSelectedTenant(null);
    };

    if (selectedTenant !== null) {
    <TenantProfile
    onBack={handleBack}
    tenantId={selectedTenant.id}
    />
    }

    return (
        <div className="unit-profile">
            <button onClick={onBack}>Back</button>
            <div className="unit-top-section">

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
                                    {tenants?.length > 0 ? (
                                        <ul>
                                            {tenants.map((tenant, index) => (
                                                <li key={index}>{tenant.name}</li>
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
                                {tenants?.length > 0 ? (
                                    tenants.map((tenant, index) => (
                                    <tr key={index}>
                                        <td>{tenant.name}</td>
                                        <td>{tenant.moveinDate}</td>
                                        <td>{tenant.moveoutDate}</td>
                                        <td>
                                            <button onClick={() => handleViewProfile(tenant.id)}>View</button>
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
                        unit={unitDetails}
                        fetchUnitDetails={fetchUnitDetails}
                    />
                </div>

                <div className="issues-details">
                    
                </div>
            </div>

            <div className="unit-actions">
                <h5>Actions</h5>
                <button onClick={() => setShowDeleteModal(true)}>Delete Unit</button>
            </div>

            {showDeleteModal && (
                <div className='modal'>
                    <div>
                        Are you sure you want to delete this tenant?
                    </div>
                    <button onClick={handleDeleteUnit}>Confirm</button>
                    <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                </div>
            )}

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
                            checked={editedUnit?.petsAllowed}
                            onChange={(e) =>
                            handleEditUnitChange("petsAllowed", e)
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

