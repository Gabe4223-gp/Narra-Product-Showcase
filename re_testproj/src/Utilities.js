import React, { useState, useEffect} from 'react';
import './Utilities.css';
import { v4 as uuidv4 } from 'uuid';

function Utilities({ unit, fetchUnitDetails }) {
    // Generate last 10 years for selection
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
    const [showWaterReadingModal, setShowWaterReadingModal] = useState(false);
    const [showElectricityReadingModal, setShowElectricityReadingModal] = useState(false);
    const [tempReading, setTempReading] = useState({ id1: null, last: '', lastDate: '', id2: '', current: '', currentDate: '' }); // Temporary storage
    const [editedUnit, setEditedUnit] = useState(unit);
    const [editingIndex, setEditingIndex] = useState(null)
    const [showModal, setShowModal] = useState(false); // Manage modal visibility
    const [modalType, setModalType] = useState(''); // 'water' or 'electricity'
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedYear2, setSelectedYear2] = useState(currentYear);
    const [selectedReadingIds, setSelectedReadingIds] = useState(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    

    useEffect(() => {
        if (unit) {
            setEditedUnit({
                id: unit.id,
                unitNo: unit.unitNo,
                type: unit.type,
                mode: unit.mode,
                sizeValue: unit.sizeValue,
                sizeUnit: unit.sizeunit,
                petsAllowed: unit.petsAllowed,
                tenants: unit.tenants,
                propertyId: unit.propertyId,
                waterLastReading: unit.waterLastReading,
                waterCurrentReading: unit.waterCurrentReading,
                electricityLastReading: unit.electricityLastReading,
                electricityCurrentReading: unit.electricityCurrentReading,
                issues: unit.issues,
                image: unit.image
            });
        }
    }, [unit]);

    const handleReadingChange = (field, value) => {
        setTempReading((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveReading = async (type) => {
        const lastReading = parseFloat(tempReading.last);
        const currentReading = parseFloat(tempReading.current);
        const lastReadingDate = new Date(tempReading.lastDate + "T00:00:00").toISOString().split("T")[0];
        const currentReadingDate = new Date(tempReading.currentDate + "T00:00:00").toISOString().split("T")[0];

        console.log("dfasdfasdf", currentReadingDate);

        if (isNaN(lastReading) || isNaN(currentReading)) {
            alert('Please enter valid readings.');
            return;
        }

        // Update the editedUnit state
        const updatedUnit = {
            ...editedUnit,
            [`${type}LastReading`]: [
                ...editedUnit[`${type}LastReading`],
                { id: uuidv4(), reading: lastReading, date: lastReadingDate },
            ],
            [`${type}CurrentReading`]: [
                ...editedUnit[`${type}CurrentReading`],
                { id: uuidv4(), reading: currentReading, date: currentReadingDate },
            ],
        };

        console.log("Step 2", updatedUnit);

        try {

            // Send unit and selectedPropertyID to the backend
            const response = await fetch('/units/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                unit: updatedUnit}),
            });
       
            if (!response.ok) {
              const errorMsg = await response.text();
              console.error('Backend error:', errorMsg);
              throw new Error('Failed to create unit');
            }
     
            // Optionally: If you have a function that fetches units by IDs
            fetchUnitDetails();
       
            setShowModal(false);
          } catch (error) {
            console.error('Error creating unit:', error);
            alert(`Failed to save unit. Error: ${error.message}`);
          }

        // Update the main unit and pass it to the onAddReading callback
        setEditedUnit(updatedUnit);

        // Reset modal state and close
        setTempReading({ last: '', current: '' });
        if (type === 'water') setShowWaterReadingModal(false);
        if (type === 'electricity') setShowElectricityReadingModal(false);
    };

    const openEditModal = (type, index, id) => {
        setModalType(type);
        setEditingIndex(index);
        const lastID = editedUnit[`${type}LastReading`]?.[index]?.id || '';
        const currentID = editedUnit[`${type}CurrentReading`]?.[index]?.id || '';
        const lastReading = editedUnit[`${type}LastReading`]?.[index]?.reading || '';
        const currentReading = editedUnit[`${type}CurrentReading`]?.[index]?.reading || '';
        const lastReadingDate = editedUnit[`${type}LastReading`]?.[index]?.date || '';
        const currentReadingDate = editedUnit[`${type}CurrentReading`]?.[index]?.date || '';
    
        setTempReading({ 
            id1: lastID,
            id2: currentID,
            last: lastReading, 
            lastDate: lastReadingDate, 
            current: currentReading, 
            currentDate: currentReadingDate 
        });
    
        setShowModal(true);
    };
    

    const saveEditedReading = async () => {
        

        const lastReading = parseFloat(tempReading.last);
        const currentReading = parseFloat(tempReading.current);
        const lastReadingDate = new Date(tempReading.lastDate + "T00:00:00").toISOString().split("T")[0];
        const currentReadingDate = new Date(tempReading.currentDate + "T00:00:00").toISOString().split("T")[0];

        if (isNaN(lastReading) || isNaN(currentReading)) {
            alert('Please enter valid readings.');
            return;
        }

        const updatedLastReadings = [...editedUnit[`${modalType}LastReading`]];
        const updatedCurrentReadings = [...editedUnit[`${modalType}CurrentReading`]];

        updatedLastReadings[editingIndex] = { id: tempReading.id1, reading: lastReading, date: lastReadingDate };
        updatedCurrentReadings[editingIndex] = { id: tempReading.id2, reading: currentReading, date: currentReadingDate };

        console.log("Step 1", updatedCurrentReadings);

        const updatedUnit = {
            ...editedUnit,
            [`${modalType}LastReading`]: updatedLastReadings,
            [`${modalType}CurrentReading`]: updatedCurrentReadings,
        };

        console.log("Step 2", updatedUnit);

        try {

            // Send unit and selectedPropertyID to the backend
            const response = await fetch('/units/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                unit: updatedUnit}),
            });
       
            if (!response.ok) {
              const errorMsg = await response.text();
              console.error('Backend error:', errorMsg);
              throw new Error('Failed to create unit');
            }
     
            // Optionally: If you have a function that fetches units by IDs
            fetchUnitDetails();
       
            setShowModal(false);
          } catch (error) {
            console.error('Error creating unit:', error);
            alert(`Failed to save unit. Error: ${error.message}`);
        }

        setEditedUnit(updatedUnit);

        setShowModal(false);
        setTempReading({ id1: null, last: '', lastDate: '', id2: '', current: '', currentDate: '' });
        setEditingIndex(null);
    };

    const handleCheckboxChange = (id1, id2) => {
        const updatedSelectedReadingIds = new Set(selectedReadingIds);
    
        // Check if either id1 or id2 is already selected
        if (updatedSelectedReadingIds.has(id1) || updatedSelectedReadingIds.has(id2)) {
            // Deselect the ids if they are already selected
            updatedSelectedReadingIds.delete(id1);
            updatedSelectedReadingIds.delete(id2);
        } else {
            // Select the ids if they are not already selected
            updatedSelectedReadingIds.add(id1);
            updatedSelectedReadingIds.add(id2);
        }
    
        setSelectedReadingIds(updatedSelectedReadingIds);
    };
    
    const handleDeleteReadings = async () => {

        if (selectedReadingIds.size === 0) {
          console.error("No readings selected for deletion.");
          return;
        
        }
        try {
            // Make a DELETE request to the backend with the selected reading IDs
            const response = await fetch(`/readings/delete-all`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    readingIds: Array.from(selectedReadingIds), 
                    unitId: unit.id, 
                }),
            });

            // Optionally handle the backend response
            const data = await response.json();
            console.log("Readings deleted successfully:", data);

            if (!response.ok) {
                console.error("Failed to delete readings:", response.statusText);
                return;
            }

            fetchUnitDetails();
    
            setShowDeleteModal(false);
    
        } catch (error) {
            console.error("Error deleting unit:", error);
        }
      };

    return (
        <div className="unit-readings">

            {/* Modal for Editing Readings */}
            {showModal && (
                <div className='overlay'>
                    <div className="modal">
                        <h3>Edit {modalType.charAt(0).toUpperCase() + modalType.slice(1)} Reading</h3>
                        <form>
                            <label>
                                Last Reading
                                <input
                                    type="number"
                                    value={tempReading.last}
                                    onChange={(e) => handleReadingChange('last', e.target.value)}
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.lastDate}
                                    onChange={(e) => handleReadingChange('lastDate', e.target.value)}
                                />
                            </label>
                            <label>
                                Current Reading
                                <input
                                    type="number"
                                    value={tempReading.current}
                                    onChange={(e) => handleReadingChange('current', e.target.value)}
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.currentDate}
                                    onChange={(e) => handleReadingChange('currentDate', e.target.value)}
                                />
                            </label>
                        </form>
                        <div>
                            <button type="button" onClick={saveEditedReading}>Save</button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
                
            )}

            {/* Water Reading Modal */}
            {showWaterReadingModal && (
                <div className='overlay'>
                    <div className="modal">
                        <h3>Add Water Reading</h3>
                        <form>
                            <label>
                                Last Reading
                                <input
                                    type="number"
                                    value={tempReading.last}
                                    onChange={(e) => handleReadingChange('last', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.lastDate}
                                    onChange={(e) => handleReadingChange('lastDate', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Current Reading
                                <input
                                    type="number"
                                    value={tempReading.current}
                                    onChange={(e) => handleReadingChange('current', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.currentDate}
                                    onChange={(e) => handleReadingChange('currentDate', e.target.value)}
                                    required
                                />
                            </label>
                        </form>
                        <div>
                            <button type="button" onClick={() => saveReading('water')}>Save</button>
                            <button onClick={() => setShowWaterReadingModal(false)}>Cancel</button>
                        </div>
                    </div>

                </div>
                
            )}

            {/* Electricity Reading Modal */}
            {showElectricityReadingModal && (
                <div className='overlay'>
                    <div className="modal">
                        <h3>Add Electricity Reading</h3>
                        <form>
                            <label>
                                Last Reading
                                <input
                                    type="number"
                                    value={tempReading.last}
                                    onChange={(e) => handleReadingChange('last', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.lastDate}
                                    onChange={(e) => handleReadingChange('lastDate', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Current Reading
                                <input
                                    type="number"
                                    value={tempReading.current}
                                    onChange={(e) => handleReadingChange('current', e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Date of Reading
                                <input
                                    type="date"
                                    value={tempReading.currentDate}
                                    onChange={(e) => handleReadingChange('currentDate', e.target.value)}
                                    required
                                />
                            </label>
                        </form>
                        <div>
                            <button type="button" onClick={() => saveReading('electricity')}>Save</button>
                            <button onClick={() => setShowElectricityReadingModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
                
            )}

            {/* Water Readings */}
            <div className="reading-table">
                <div className="reading-header">
                    <h5>Water Readings</h5>
                    <button className="reading-button" onClick={() => setShowWaterReadingModal(true)}>Add</button>

                    {/* Year Selection Dropdown */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>Select Year:</span>
                            <select
                                style={{ fontSize: "12px", padding: "2px 4px" }}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th> </th>
                            <th>Last Reading</th>
                            <th>Date</th>
                            <th>Current Reading</th>
                            <th>Date</th>
                            <th>Consumption</th>
                            <th> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {unit?.waterLastReading?.length > 0 ? (
                            unit.waterLastReading
                                ?.filter(item => {
                                    const itemDate = new Date(item.date);
                                    return itemDate.getFullYear() === selectedYear;
                                })
                                .map((item, index) => {
                                    const currentReadingItem = unit.waterCurrentReading ? unit.waterCurrentReading[index] : null;
                                    const readingDifference = currentReadingItem?.reading && item?.reading 
                                        ? currentReadingItem.reading - item.reading 
                                        : "N/A";

                                    return (
                                        <tr key={index}>
                                            <td style={{ width: "5%" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReadingIds.has(item.id)}
                                                    onChange={() => handleCheckboxChange(item.id, currentReadingItem.id)}
                                                />
                                            </td>
                                            <td>{item.reading || "No Readings"}</td>
                                            <td>{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                                            <td>{currentReadingItem?.reading || "No Readings"}</td>
                                            <td>{currentReadingItem?.date ? new Date(currentReadingItem.date).toLocaleDateString() : "N/A"}</td>
                                            <td>{readingDifference}</td>
                                            <td>
                                                <button onClick={() => openEditModal('water', index)}>Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                    No Water Readings
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div>
                    <button onClick={() => setShowDeleteModal(true)} disabled={selectedReadingIds.size === 0}>Delete Selected Readings</button>
                </div>
            </div>

            {/* Electricity Readings */}
            <div className="reading-table">
                <div className="reading-header">
                    <h5>Electricity Readings</h5>
                    <button className="reading-button" onClick={() => setShowElectricityReadingModal(true)}>Add</button>
                    
                    {/* Year Selection Dropdown */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>Select Year:</span>
                            <select
                                style={{ fontSize: "12px", padding: "2px 4px" }}
                                value={selectedYear2}
                                onChange={(e) => setSelectedYear2(parseInt(e.target.value, 10))}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th> </th>
                            <th>Last Reading</th>
                            <th>Date</th>
                            <th>Current Reading</th>
                            <th>Date</th>
                            <th>Consumption</th>
                            <th> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {unit?.electricityLastReading?.length > 0 ? (
                            unit.electricityLastReading
                                .filter(item => {
                                    const itemDate = new Date(item.date);
                                    return itemDate.getFullYear() === selectedYear2;
                                })
                                .map((item, index) => {
                                    const currentReadingItem = unit.electricityCurrentReading ? unit.electricityCurrentReading[index] : null;
                                    const readingDifference = currentReadingItem?.reading && item?.reading 
                                        ? currentReadingItem.reading - item.reading 
                                        : "N/A";

                                    return (
                                        <tr key={index}>
                                            <td style={{ width: "5%" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReadingIds.has(item.id)}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                />
                                            </td>
                                            <td>{item.reading || "No Readings"}</td>
                                            <td>{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                                            <td>{currentReadingItem?.reading || "No Readings"}</td>
                                            <td>{currentReadingItem?.date ? new Date(currentReadingItem.date).toLocaleDateString() : "N/A"}</td>
                                            <td>{readingDifference}</td>
                                            <td>
                                                <button onClick={() => openEditModal('electricity', index)}>Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                    No Electricity Readings
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div>
                <button onClick={() => setShowDeleteModal(true)} disabled={selectedReadingIds.size === 0}>Delete Selected Readings</button>
                </div>


                {showDeleteModal && (
                    <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete these readings?
                        </div>
                        <button onClick={handleDeleteReadings}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Utilities;