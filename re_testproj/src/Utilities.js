import React, { useState, useEffect} from 'react';
import './Utilities.css';

function Utilities({ unit, fetchUnitDetails }) {
    const [showWaterReadingModal, setShowWaterReadingModal] = useState(false);
    const [showElectricityReadingModal, setShowElectricityReadingModal] = useState(false);
    const [tempReading, setTempReading] = useState({ last: '', current: '' }); // Temporary storage
    const [editedUnit, setEditedUnit] = useState(unit);
    const [editingIndex, setEditingIndex] = useState(null)
    const [showModal, setShowModal] = useState(false); // Manage modal visibility
    const [modalType, setModalType] = useState(''); // 'water' or 'electricity'

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

        console.log("Step 1", lastReading);
        console.log("Step 2", editedUnit);

        if (isNaN(lastReading) || isNaN(currentReading)) {
            alert('Please enter valid readings.');
            return;
        }

        // Update the editedUnit state
        const updatedUnit = {
            ...editedUnit,
            [`${type}LastReading`]: [
                ...editedUnit[`${type}LastReading`],
                { reading: lastReading, date: new Date() },
            ],
            [`${type}CurrentReading`]: [
                ...editedUnit[`${type}CurrentReading`],
                { reading: currentReading, date: new Date() },
            ],
        };

        console.log("Step 2", updatedUnit);

        try {

            // Send unit and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/units/update', {
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

    const openEditModal = (type, index) => {
        setModalType(type);
        setEditingIndex(index);

        const lastReading = editedUnit[`${type}LastReading`]?.[index]?.reading || '';
        const currentReading = editedUnit[`${type}CurrentReading`]?.[index]?.reading || '';
        setTempReading({ last: lastReading, current: currentReading });

        setShowModal(true);
    };

    const saveEditedReading = async () => {
        
        const lastReading = parseFloat(tempReading.last);
        const currentReading = parseFloat(tempReading.current);

        if (isNaN(lastReading) || isNaN(currentReading)) {
            alert('Please enter valid readings.');
            return;
        }

        const updatedLastReadings = [...editedUnit[`${modalType}LastReading`]];
        const updatedCurrentReadings = [...editedUnit[`${modalType}CurrentReading`]];

        updatedLastReadings[editingIndex] = { reading: lastReading, date: new Date() };
        updatedCurrentReadings[editingIndex] = { reading: currentReading, date: new Date() };

        console.log("Step 1", updatedCurrentReadings);

        const updatedUnit = {
            ...editedUnit,
            [`${modalType}LastReading`]: updatedLastReadings,
            [`${modalType}CurrentReading`]: updatedCurrentReadings,
        };

        console.log("Step 2", updatedUnit);

        try {

            // Send unit and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/units/update', {
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
        setTempReading({ last: '', current: '' });
        setEditingIndex(null);
    };

    return (
        <div className="unit-readings">

            {/* Modal for Editing Readings */}
            {showModal && (
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
                            Current Reading
                            <input
                                type="number"
                                value={tempReading.current}
                                onChange={(e) => handleReadingChange('current', e.target.value)}
                            />
                        </label>
                    </form>
                    <div>
                        <button type="button" onClick={saveEditedReading}>Save</button>
                        <button onClick={() => setShowModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Water Reading Modal */}
            {showWaterReadingModal && (
                <div className="modal">
                    <h3>Add Water Reading</h3>
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
                            Current Reading
                            <input
                                type="number"
                                value={tempReading.current}
                                onChange={(e) => handleReadingChange('current', e.target.value)}
                            />
                        </label>
                    </form>
                    <div>
                        <button type="button" onClick={() => saveReading('water')}>Save</button>
                        <button onClick={() => setShowWaterReadingModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Electricity Reading Modal */}
            {showElectricityReadingModal && (
                <div className="modal">
                    <h3>Add Electricity Reading</h3>
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
                            Current Reading
                            <input
                                type="number"
                                value={tempReading.current}
                                onChange={(e) => handleReadingChange('current', e.target.value)}
                            />
                        </label>
                    </form>
                    <div>
                        <button type="button" onClick={() => saveReading('electricity')}>Save</button>
                        <button onClick={() => setShowElectricityReadingModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

           {/* Water Readings */}
            <div className="reading-table">
                <div className="reading-header">
                    <h3>Water Readings</h3>
                    <button onClick={() => setShowWaterReadingModal(true)}>Add</button>
                </div>
                
                <table>
                    <thead>
                        <tr>
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
                            unit.waterLastReading.map((item, index) => {
                                const currentReadingItem = unit.waterCurrentReading ? unit.waterCurrentReading[index] : null;
                                const readingDifference = currentReadingItem?.reading && item?.reading 
                                    ? currentReadingItem.reading - item.reading 
                                    : "N/A";

                                return (
                                    <tr key={index}>
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
            </div>

            {/* Electricity Readings */}
            <div className="reading-table">
                <div className="reading-header">
                    <h3>Electricity Readings</h3>
                    <button onClick={() => setShowElectricityReadingModal(true)}>Add</button>
                </div>
                
                <table>
                    <thead>
                        <tr>
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
                            unit.electricityLastReading.map((item, index) => {
                                const currentReadingItem = unit.electricityCurrentReading ? unit.electricityCurrentReading[index] : null;
                                const readingDifference = currentReadingItem?.reading && item?.reading 
                                    ? currentReadingItem.reading - item.reading 
                                    : "N/A";

                                return (
                                    <tr key={index}>
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
            </div>
        </div>
    );
}

export default Utilities;