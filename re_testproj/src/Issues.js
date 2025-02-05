import React, { useState, useEffect } from 'react';
import './Issues.css';
import IssueProfile from "./IssueProfile";
import { v4 as uuidv4 } from 'uuid';

function Issues () {

    const [properties, setProperties] = useState([]); // Handle property list
    const [issues, setIssues] = useState([]);
    const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isAddingIssues, setIsAddingIssues] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [selectedPropertyID, setSelectedPropertyID] = useState(() => {
        // Check localStorage for previously selected property ID
        const savedPropertyId = localStorage.getItem('selectedPropertyID');
        return savedPropertyId ? savedPropertyId : null; // Return saved property ID or null
    });
    const [newIssue, setNewIssue] = useState({
          id: null, 
          type: null, 
          subject: null, 
          description: null, 
          unit: null, 
          tenantRaised: null, 
          resolved: false,
          dateRaised: new Date(),
          dateResolved: null, 
          documents: [],
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

    const fetchIssues = async (unitIds) => {

        if (unitIds.length === 0) {
            console.log("No unit IDs provided, exiting fetch.");
            setIssues([]);
            return;  // Exit the function early if unitIds is empty
        }
    
        try {
     
          const response = await fetch('http://localhost:5000/issues/byIds', {
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
            // Generate UUID here directly to ensure it's set correctly
            const issueWithUUID = {
                ...newIssue,
                id: uuidv4(), // Generate UUID for id
            };
        
            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/issues', {
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
                throw new Error('Failed to create issue');
            }
        
            // Clear the form
            setNewIssue({
                id: null,
                type: null,
                subject: null,
                description: null,
                unit: null,
                tenantRaised: null,
                resolved: false,
                dateRaised: new Date(),
                dateResolved: null,
                documents: [],
            });
         
            const selectedProperty = properties.find(
                (property) => property.id === selectedPropertyID);
          
            fetchIssues(selectedProperty.units); // Fetch issues based on the selected property’s issues
                
            setIsAddingIssues(false); // Close the add issue form
            } catch (error) {
            console.error('Error creating issue:', error);
            alert(`Failed to save issue. Error: ${error.message}`);
        }

        setDocuments([]);

        setIsAddingIssues(false);
    };

    const markSelectedAsResolved = async (selectedIssueIds) => {

        try {
            const issueIdsArray = Array.from(selectedIssueIds); // Convert Set to an array
            // Send tenant and selectedPropertyID to the backend
            const response = await fetch('http://localhost:5000/issues/resolve', {
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
            const response = await fetch('http://localhost:5000/issues/unresolve', {
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

    //Upload file
    const handleFileUpload = (file) => {

        // Allowed file types
        const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

        if (!allowedFileTypes.includes(file.type)) {
            alert("Only PDF or image files (JPEG, PNG) are allowed.");
            return;
        }

        const newDocument = {
            fileUrl: URL.createObjectURL(file), // Create a temporary URL for the file
            fileType: file.type,               // MIME type of the file
        };

        setDocuments((prevDocs) => [...prevDocs, newDocument]);
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
                        <th>Tenant Raised</th>
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
                                <td>{issue.tenantRaised}</td>
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
            
            </div>

            <div className="actions">
                    <button className="addIssue" onClick={() => setIsAddingIssues(true)}>
                        Add Issue
                    </button>
                    <button onClick={handleSelectAllUnResolved}>Select All</button>
                    <button onClick={handleDeselectAll}>Unselect All</button>
                    <button onClick={() => markSelectedAsResolved(selectedIssueIds)}>Mark Selected as Resolved</button>
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
                            Tenant
                            <input
                            type="text"
                            value={newIssue.tenantRaised}
                            onChange={(e) => handleAddIssueChange("tenantRaised", e.target.value)}
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
                                    onChange={(e) => {
                                        if (e.target.files[0]) {
                                            handleFileUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                            <div>
                                {documents.map((doc, index) => (
                                    <div key={index} style={{ marginTop: "10px" }}>
                                        <span>Document {index + 1}</span> {/* Corrected template literal */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            style={{
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
                    <h5>Resolved Issues</h5>
                    <table>     
                        <thead>
                            <tr>
                                <th> </th>
                                <th>ID</th>
                                <th>Date Resolved</th>
                                <th>Unit</th>
                                <th>Tenant Raised</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issues.filter(issue => issue.resolved).length > 0 ? (  // Filter resolved issues
                                issues.filter(issue => issue.resolved).map((issue, index) => (
                                <tr key={index}>
                                    <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIssueIds.has(issue.id)}
                                        onChange={() => handleCheckboxChange(issue.id)}
                                    />
                                    </td>
                                    <td>{issue.id.substring(0, 4)}</td>
                                    <td>{issue.dateResolved ? issue.dateResolved : " "}</td>
                                    <td>{issue.unit}</td>
                                    <td>{issue.tenantRaised}</td>
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
                                    No resolved issues.
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            
            </div>

            <div className="actions">
                    <button onClick={handleSelectAllResvolved}>Select All</button>
                    <button onClick={handleDeselectAll}>Unselect All</button>
                    <button onClick={() => markSelectedAsUnresolved()}>Mark as Unresolved</button>
            </div>

        </div>

        
    );
    
}

export default Issues;

    