import React, { useState, useEffect} from 'react';
import "./UnitProfile.css";
import Utilities from './Utilities';
import TenantProfile from './TenantProfile';

function UnitProfile ({unitId, onBack}) {
    const [unitDetails, setUnitDetails] = useState(null);
    const [showEditUnitDetails, setshowEditUnitDetails] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenants, setTenants] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editedUnit, setEditedUnit] = useState({});
    const [activeTab, setActiveTab] = useState('Details');

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
          const response = await fetch(`${process.env.REACT_APP_API_URL}/units/${unitId}`, {
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
          console.log("Step 999", data.unit);

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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/units/update`, {
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
   
        try {
            // Make a DELETE request to the backend with the propertyId
            const response = await fetch(`${process.env.REACT_APP_API_URL}/units/delete`, {
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

    const handleViewProfile = (tenant) => {
        setSelectedTenant(tenant);
      };

    const handleBack = () => {
        fetchUnitDetails();
        setSelectedTenant(null);
    };

    if (selectedTenant !== null) {
        return (
            <TenantProfile
                tenantId={selectedTenant.id}
                onBack={handleBack}
            />
        );
    }

    return (
        <div className="unit-profile">
            <div className="unit-profile-header">
                <button onClick={onBack} className="back-button">Back</button>
                <div className="unit-tab-bar">
                {['Details', 'Tenants', 'Utilities', 'Actions'].map((tab) => (
                    <button
                    key={tab}
                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    >
                    {tab}
                    </button>
                ))}
                </div>
            </div>

            {/* SINGLE tab content container */}
            <div className="unit-tab-content">
                {activeTab === 'Details' && (
                    <div className="unit-details full-width">
                        <div className="unit-header">
                        <h5>Unit Details</h5>
                        <button className="unit-edit-button" onClick={() => setshowEditUnitDetails(true)}>Edit</button>
                        </div>

                        <div className="unit-info-grid">
                        <div className="unit-info-item">
                            <label>No.:</label>
                            <span>{editedUnit.unitNo}</span>
                        </div>
                        <div className="unit-info-item">
                            <label>Pets Allowed:</label>
                            <span>{editedUnit.petsAllowed ? "Yes" : "No"}</span>
                        </div>
                        <div className="unit-info-item">
                            <label>Type:</label>
                            <span>{editedUnit.type}</span>
                        </div>
                        <div className="unit-info-item">
                            <label>Occupants:</label>
                            <span>{tenants?.length > 0 ? tenants.length : "NA"}</span>
                        </div>
                        <div className="unit-info-item">
                            <label>Mode:</label>
                            <span>{editedUnit.mode}</span>
                        </div>
                        <div className="unit-info-item">
                            <label>Size:</label>
                            <span>{editedUnit.sizeValue} {editedUnit.sizeUnit}</span>
                        </div>
                        </div>
                    </div>
                    )}

                {activeTab === 'Tenants' && (
                <div className="unit-tenants full-width">
                    <h5 className="tab-section-title">Tenants</h5>
                    <div className="tenant-history">
                    <table className="tenant-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Lease Start Date</th>
                            <th>Lease End Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tenants?.length > 0 ? (
                            tenants.map((tenant, index) => (
                            <tr key={index}>
                                <td>{tenant.name}</td>
                                <td>{tenant.phone}</td>
                                <td>{tenant.leaseStarted ? new Date(tenant.leaseStarted).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</td>
                                <td>{tenant.leaseExpiry ? new Date(tenant.leaseExpiry).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</td>
                                <td>
                                <button className="view-button" onClick={() => handleViewProfile(tenant)}>View</button>
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td colSpan="5" className="no-tenant-msg">No tenant history</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}

                {activeTab === 'Utilities' && (
                <div className="utility-details full-width">
                    <Utilities unit={unitDetails} fetchUnitDetails={fetchUnitDetails} />
                </div>
                )}

                {activeTab === 'Actions' && (
                <div className="unit-actions full-width">
                    <h5 className="tab-section-title">Unit Actions</h5>
                    <div className="action-buttons">
                    <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
                        Delete Unit
                    </button>
                    </div>
                </div>
                )}
            </div>

            {showDeleteModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete this tenant?
                        </div>
                        <button onClick={handleDeleteUnit}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>

                </div>
                
            )}

            {showEditUnitDetails && (
                <div className='overlay'> 
                    <div className="modal">
                        <h3>Edit Unit</h3>
                        <form>
                        <label>
                            No.:
                            <input
                            type="text"//$$$
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
                </div>
            )}
        </div>
    );

}

export default UnitProfile

