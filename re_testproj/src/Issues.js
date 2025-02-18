import React, { useState, useEffect } from 'react';
import './Issues.css';
import IssueProfile from "./IssueProfile";
import { v4 as uuidv4 } from 'uuid';

function Issues () {
    // Generate last 10 years for selection
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // Generate months for selection
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

    // State for month and year selection
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [properties, setProperties] = useState([]); // Handle property list
    const [issues, setIssues] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isAddingIssues, setIsAddingIssues] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
        console.log("Selected Property", localStorage.getItem('selectedPropertyIDIssue'));
        return localStorage.getItem('selectedPropertyIDIssue') || "";
      });
    const [newIssue, setNewIssue] = useState({
          id: null, 
          type: null, 
          subject: null, 
          description: null, 
          unit: null, 
          resolved: false,
          dateRaised: new Date(),
          dateResolved: null, 
          documents: [],
        });
    const [filteredIssues, setFilteredIssues] = useState([]);

    useEffect(() => {
        const filtered = issues.filter(issue => {
            if (!issue.dateResolved) return false;
            const resolvedDate = new Date(issue.dateResolved);
            return resolvedDate.getMonth() === selectedMonth && resolvedDate.getFullYear() === selectedYear;
        });
        setFilteredIssues(filtered);
    }, [issues, selectedMonth, selectedYear]);

    const fetchProperties = async () => {

        try {
            const response = await fetch('/properties', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            });
    
            if (!response.ok) {
            throw new Error('Failed to fetch properties');
            }
            const data = await response.json();

            // Check if the user previously had zero properties
            const savedPropertyId = localStorage.getItem('selectedPropertyIDIssue');

            if (!savedPropertyId && data.length > 0) {
                // Only set selectedPropertyID if there was no previous selection
                setSelectedPropertyID(data[0].id);
                localStorage.setItem('selectedPropertyIDIssue', data[0].id);
                console.log("Setting selected property to first property:", data[0].id);
            }
    
            setProperties(data); // Set tenants fetched from the database
    
        } catch (error) {
            console.error('Error fetching properties:', error);
            alert('Failed to load properties. Please try again.');
        }
    };

    const fetchIssues = async (unitIds) => {

        if (unitIds.length === 0) {
            console.log("No unit IDs provided, exiting fetch.");
            setIssues([]);
            return;  // Exit the function early if unitIds is empty
        }
    
        try {
     
          const response = await fetch('/issues/byIds', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unitIds }),
          });
     
          if (!response.ok) {
            throw new Error('Failed to fetch issues');
          }
     
          const issuesData = await response.json();
          setIssues(issuesData); 
    
        } catch (error) {
          console.error('Error fetching issues:', error);
          alert('Failed to load issues. Please try again.');
        }
    };
    
    const handlePropertyChange = (event) => {
        const propertyId = event.target.value; // Get selected property's ID
        setSelectedPropertyID(propertyId); // Update selectedPropertyID state

        // Store the selected property ID in localStorage
        localStorage.setItem('selectedPropertyIDIssue', propertyId);
    };

    // Fetch properties only once or when the component mounts
    useEffect(() => {
        fetchProperties(); // Fetch properties when component mounts or properties change
    }, []); // Empty dependency array ensures it only runs once

    // Fetch issues when selectedPropertyID changes
    useEffect(() => {
    if (selectedPropertyID) {
        const selectedProperty = properties.find(
        (property) => property.id === selectedPropertyID
        );

        if (selectedProperty) {
        fetchIssues(selectedProperty.units); // Fetch tenants based on the selected property’s tenants
        }
    }
    }, [selectedPropertyID, properties]);

    const handleAddIssueChange = (field, value) => {
        setNewIssue({ ...newIssue, [field]: value });
    };
    
    const saveNewIssue = async () => {
        try {
            // Generate UUID for the issue
            const issueWithUUID = {
                ...newIssue,
                id: uuidv4(), // Ensure unique ID
            };
    
            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    issue: issueWithUUID, // Issue object
                    propertyId: selectedPropertyID, // Property ID
                }),
            });
    
            if (!response.ok) {
                const errorMsg = await response.text();
                console.error('Backend error:', errorMsg);
                alert(`Failed to create issue: ${errorMsg}`);
                return; // Exit function if issue creation fails
            }
    
            console.log("Issue created successfully:", issueWithUUID.id);
    
            // Upload documents only if issue creation succeeds
            if (documents.length > 0) {
                const uploadPromises = documents.map(async (doc) => {
                    const response = await fetch('/issues/upload-issue-doc', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fileName: doc.fileName,
                            fileType: doc.fileType,
                            fileContent: doc.fileContent,
                            issueId: issueWithUUID.id, // Use the correct issue ID
                        }),
                    });
    
                    const data = await response.json();
    
                    if (response.ok) {
                        console.log(`Document ${doc.fileName} uploaded successfully:`, data.url);
                        return { success: true, doc, url: data.url };
                    } else {
                        console.error(`Upload failed for ${doc.fileName}:`, data.message);
                        return { success: false, doc, message: data.message };
                    }
                });
    
                // Wait for all uploads to complete
                const docResults = await Promise.all(uploadPromises);
            }
    
            // Clear the form
            setNewIssue({
                id: null,
                type: null,
                subject: null,
                description: null,
                unit: null,
                resolved: false,
                dateRaised: new Date(),
                dateResolved: null,
                documents: [],
            });
    
            // Refresh issues after successful creation
            const selectedProperty = properties.find(
                (property) => property.id === selectedPropertyID
            );
    
            fetchIssues(selectedProperty.units);

            //Update properties state, specifically the units within the selected property
            setProperties((prevProperties) =>
                prevProperties.map((property) =>
                    property.id === selectedPropertyID
                        ? {
                            ...property,
                            units: property.units.map((unit) =>
                                unit.id === issueWithUUID.unit
                                    ? {
                                            ...unit,
                                            issues: [...(unit.issues || []), issueWithUUID.id],
                                        }
                                    : unit
                            ),
                        }
                        : property
                )
            );
    
            setDocuments([]); // Clear uploaded documents
            setIsAddingIssues(false); // Close the add issue form
    
        } catch (error) {
            console.error('Error creating issue:', error);
            alert(`Failed to save issue. Error: ${error.message}`);
        }
    };
    

    const markSelectedAsResolved = async (selectedIssueIds) => {

        try {
            const issueIdsArray = Array.from(selectedIssueIds); // Convert Set to an array
            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('/issues/resolve', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                issueIds: issueIdsArray, // Issue object
                }),
            });
        
            if (!response.ok) {
                const errorMsg = await response.text();
                console.error('Backend error:', errorMsg);
                throw new Error('Failed to mark issues as resolved');
            }
        
            const selectedProperty = properties.find(
                (property) => property.id === selectedPropertyID);
          
            fetchIssues(selectedProperty.units); // Fetch issues based on the selected property’s issues
        
        } catch (error) {
            console.error('Error marking issues as resolved:', error);
            alert(`Failed to mark issues as resolved. Error: ${error.message}`);
        }
    
        setSelectedIssueIds(new Set()); //clear selected items

    };

    const markSelectedAsUnresolved = async () => {

        try {
            const issueIdsArray = Array.from(selectedIssueIds); // Convert Set to an array
            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('/issues/unresolve', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                issueIds: issueIdsArray, // Issue object
                }),
            });
        
            if (!response.ok) {
                const errorMsg = await response.text();
                console.error('Backend error:', errorMsg);
                throw new Error('Failed to mark issues as resolved');
            }
        
            const selectedProperty = properties.find(
                (property) => property.id === selectedPropertyID);
          
            fetchIssues(selectedProperty.units); // Fetch issues based on the selected property’s issues
        
        } catch (error) {
            console.error('Error marking issues as resolved:', error);
            alert(`Failed to mark issues as resolved. Error: ${error.message}`);
        }
    
        setSelectedIssueIds(new Set()); //clear selected items
    };
    
    const handleViewIssue = (issue) => {
        setSelectedIssue(issue);
    };

    const handleBackToList = () => {
        const selectedProperty = properties.find(
            (property) => property.id === selectedPropertyID
          );
          fetchProperties(selectedProperty.units);
        setSelectedIssue(null);
    };

    //Upload file
    const handleFileUpload = (event) => {
        const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
        const files = event.target.files;
    
        if (files.length === 0) return; // If no file is selected, exit
    
        if (documents.length >= 5) {
            alert("You can only upload up to 5 documents.");
            event.target.value = ""; // Reset input
            return;
        }
    
        const file = files[0];
    
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Please upload a PDF or image.");
            event.target.value = ""; // Reset input
            return;
        }
    
        const reader = new FileReader();
        reader.onload = () => {
            const newDoc = {
                fileName: uuidv4(), 
                fileContent: reader.result, // Base64 encoded
                dateUploaded: new Date().toISOString(),
                fileType: file.type,
            };
    
            setDocuments((prevDocs) => {
                if (prevDocs.length >= 5) return prevDocs; // Prevent exceeding 5 files
                return [...prevDocs, newDoc];
            });
    
            event.target.value = ""; // Reset input field
        };
    
        reader.readAsDataURL(file);
    };

    //Remove file
    const handleRemoveFile = (index) => {
        setDocuments((prevDocs) => prevDocs.filter((_, i) => i !== index));
    };

    //Cancel modal
    const handleCancelModal = () => {
        setIsAddingIssues(false);
        setDocuments([]);

    };

    const handleDeleteIssues = async () => {

        if (selectedIssueIds.size === 0) {
          console.error("No units selected for deletion.");
          return;
        
        }
        try {
            // Make a DELETE request to the backend with the propertyId
            const response = await fetch(`/issues/delete-all`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ issueIds: Array.from(selectedIssueIds), propertyId: selectedPropertyID}), // Send the propertyId in the request body
            });
    
            if (!response.ok) {
                console.error("Failed to delete issue:", response.statusText);
                return;
            }
    
            // Optionally handle the backend response
            const data = await response.json();
            console.log("Issue deleted successfully:", data);
    
            fetchIssues(data.updatedUnitIds); //fetchIssues takes in a set of unit ids

            // Update properties state by removing deleted issues from the selected property
            setProperties((prevProperties) =>
                prevProperties.map((property) =>
                    property.id === selectedPropertyID
                        ? {
                            ...property,
                            units: property.units.map((unit) =>
                                unit.issues
                                    ? {
                                            ...unit,
                                            issues: unit.issues.filter(
                                                (issueId) => !selectedIssueIds.has(issueId)
                                            ),
                                        }
                                    : unit
                            ),
                        }
                        : property
                )
            );
            
            setShowDeleteModal(false);
    
        } catch (error) {
            console.error("Error deleting issues:", error);
        }
      };

    //Non-database
    const handleCheckboxChange = (issueId) => {
        const updatedSelectedIssueIds = new Set(selectedIssueIds);
        if (updatedSelectedIssueIds.has(issueId)) {
          updatedSelectedIssueIds.delete(issueId); // Deselect
        } else {
          updatedSelectedIssueIds.add(issueId); // Select
        }
        setSelectedIssueIds(updatedSelectedIssueIds);
      };
    
    const handleDeselectAll = () => {
        setSelectedIssueIds(new Set()); // Deselect all issues
    };
    
    const handleSelectAllResvolved = () => {
        // Filter the issues to only include resolved issues
        const resolvedIssueIds = new Set(issues.filter((issue) => issue.resolved).map((issue) => issue.id));
        setSelectedIssueIds(resolvedIssueIds); // Select only the resolved issues
    };

    const handleSelectAllUnResolved = () => {
        // Filter the issues to only include resolved issues
        const resolvedIssueIds = new Set(issues.filter((issue) => !issue.resolved).map((issue) => issue.id));
        setSelectedIssueIds(resolvedIssueIds); // Select only the resolved issues
    };


    if (selectedIssue !== null) {
        return (
          <IssueProfile
          issue={selectedIssue}
          onBack={handleBackToList}
          onMarkasResolved={markSelectedAsResolved}
          />
        );
      }

    return (
        <div>
            <div className='issue-list-top'>
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
            <div className="unresolved-issues">
                <div className="issue-list">
                    <h5>Unresolved Issues</h5>
                    <table>     
                        <thead>
                        <tr>
                            <th> </th>
                            <th>ID</th>
                            <th>Date Raised</th>
                            <th>Unit</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                            {issues.filter(issue => !issue.resolved).length > 0 ? (  // Filter unresolved issues
                                issues.filter(issue => !issue.resolved).map((issue, index) => (
                                <tr key={index}>
                                    <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIssueIds.has(issue.id)}
                                        onChange={() => handleCheckboxChange(issue.id)}
                                    />
                                    </td>
                                    <td>{issue.id.substring(0, 4)}</td>
                                    <td>{issue.dateRaised}</td>
                                    <td>{issue.unit}</td>
                                    <td>{issue.type}</td>
                                    <td>{issue.subject}</td>
                                    <td>
                                    <button onClick={() => handleViewIssue(issue)}>View</button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                                    No issues.
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="actions">
                    <button className="addIssue" onClick={() => setIsAddingIssues(true)}>
                        Add Issue
                    </button>
                    <button onClick={handleSelectAllUnResolved}>Select All</button>
                    <button onClick={handleDeselectAll}>Unselect All</button>
                    <button onClick={() => markSelectedAsResolved(selectedIssueIds)}>Mark Selected as Resolved</button>
                </div>
            
            </div>

            
        
            {isAddingIssues && (
                <div className='overlay'>
                     <div className="modal">
                        <h3>Add New Issue</h3>
                        <form>
                        <label>
                            Unit
                            <input
                            type="number"
                            value={newIssue.unit}
                            onChange={(e) => handleAddIssueChange("unit", e.target.value)}
                            />
                        </label>
                        <label>
                            Type:
                            <select
                                value={newIssue.type}
                                onChange={(e) => handleAddIssueChange("type", e.target.value)}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="need repair">Need Repair</option>
                                <option value="complaint">Complaint</option>
                                <option value="violation">Violation</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label>
                            Subject:
                            <input
                            type="text"
                            value={newIssue.subject}
                            required
                            onChange={(e) => handleAddIssueChange("subject", e.target.value)}
                            />
                        </label>
                        <label>
                        Description:
                        <textarea
                            value={newIssue.description}
                            onChange={(e) =>
                                handleAddIssueChange("description", e.target.value)
                            }
                            rows="4"
                            cols="50"
                            placeholder="Enter description..."
                            />
                        </label>

                        <div>
                            <label>
                                Relevant Documents:
                                <input
                                    type="file"
                                    onChange={(e) => {handleFileUpload(e)}}
                                />
                            </label>
                            <div>
                                {documents.map((doc, index) => (
                                    <div className='issue-doc' key={index} style={{ marginTop: "10px" }}>
                                        <span style={{ fontSize: "11px" }}>Document {index + 1}</span> {/* Corrected template literal */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            style={{
                                                fontSize: "11px",
                                                marginLeft: "10px",
                                                color: "red",
                                                cursor: "pointer",
                                                background: "none",
                                                border: "none",
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    
                        </form>
                        <div>
                        <button onClick={saveNewIssue}>Save</button>
                        <button onClick={handleCancelModal}>Cancel</button>
                        </div>
                    </div>
                </div>
           
            )}

            <div className="resolved-issues">
                <div className="issue-list">
                    <div className='resolved-issues-header' style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h5>Resolved Issues</h5>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span>Select Month:</span>
                                <select
                                    style={{ fontSize: "12px", padding: "2px 4px" }}
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                                >
                                    {months.map((month, index) => (
                                        <option key={index} value={index}>{month}</option>
                                    ))}
                                </select>
                            </label>
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
                                <th></th>
                                <th>ID</th>
                                <th>Date Resolved</th>
                                <th>Unit</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIssues
                                .filter(issue => {
                                    const issueDate = new Date(issue.dateResolved);
                                    return issueDate.getFullYear() === selectedYear && issueDate.getMonth() === selectedMonth;
                                })
                                .length > 0 ? (
                                filteredIssues
                                    .filter(issue => {
                                        const issueDate = new Date(issue.dateResolved);
                                        return issueDate.getFullYear() === selectedYear && issueDate.getMonth() === selectedMonth;
                                    })
                                    .map((issue, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIssueIds.has(issue.id)}
                                                    onChange={() => handleCheckboxChange(issue.id)}
                                                />
                                            </td>
                                            <td>{issue.id.substring(0, 4)}</td>
                                            <td>{issue.dateResolved}</td>
                                            <td>{issue.unit}</td>
                                            <td>{issue.type}</td>
                                            <td>{issue.subject}</td>
                                            <td>
                                                <button onClick={() => handleViewIssue(issue)}>View</button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                        No resolved issues for the selected month and year.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="actions">
                    <button onClick={handleSelectAllResvolved}>Select All</button>
                    <button onClick={handleDeselectAll}>Unselect All</button>
                    <button onClick={() => markSelectedAsUnresolved()}>Mark as Unresolved</button>
                </div>
            </div>

            <div>
                <button onClick={() => setShowDeleteModal(true)}>Delete Selected</button>
            </div>

            {showDeleteModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete these tenants?
                        </div>
                        <button onClick={handleDeleteIssues}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

        </div>

        
    );
    
}

export default Issues;

    