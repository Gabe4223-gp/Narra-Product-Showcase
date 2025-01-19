import React, { useState, useTransition } from 'react';
import './Issues.css';
import IssueProfile from "./IssueProfile"

class IssueClass {
    constructor({
      id = Math.random(),
      type = "", 
      subject = "", 
      description = "", 
      unit = "", 
      tenantRaised = "", 
      resolved = false,
      dateRaised = new Date(),
      dateResolved = null, 
      documents = []
    } = {}) {
      this.id = id;
      this.type = type;
      this.subject = subject;
      this.description = description;
      this.unit = unit;
      this.tenantRaised = tenantRaised;
      this.resolved = resolved;
      this.dateRaised = dateRaised;
      this.dateResolved = dateResolved;
      this.documents = documents;
    }
}

function Issues () {

    const [issues, setIssues] = useState([]);
    const [selectedIssueIds, setSelectedIssueIds] = useState(new Set());
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isAddingIssues, setIsAddingIssues] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [newIssue, setNewIssue] = useState({
          id: null, 
          type: "", 
          subject: "", 
          description: "", 
          unit: "", 
          tenantRaised: "", 
          resolved: false,
          dateRaised: new Date(),
          dateResolved: null, 
          documents: [],
        });

    const handleAddIssueChange = (field, value) => {
        setNewIssue({ ...newIssue, [field]: value });
      };

    const saveNewIssue = () => {
        // Generate a random ID with a maximum of 5 digits
        const randomId = Math.floor(Math.random() * 100000);  // Random number between 0 and 99999

        const issue = new IssueClass({
            ...newIssue,  // Spread the newIssue object
            id: randomId, // Assign the random ID
            dateRaised: new Date(),
            documents: documents
        });

        setDocuments([]);

        setIssues([...issues, issue]); // Add the new issue to the state
        setNewIssue({
            id: null,
            type: "",
            subject: "",
            description: "",
            unit: "",
            tenantRaised: "",
            resolved: false,
            dateRaised: new Date(),
            dateResolved: null,
            documents: [],
        });
        setIsAddingIssues(false);
    };
    
    const handleViewIssue = (issue) => {
        setSelectedIssue(issue);
    };

    const handleBackToList = () => {
        setSelectedIssue(null);
    };

    const markSelectedAsResolved = () => {
        setIssues((prevIssues) =>
            prevIssues.map((issue) =>
                selectedIssueIds.has(issue.id)
                    ? { ...issue, resolved: true }
                    : issue
            )
        );
        setSelectedIssueIds(new Set()); // Optionally clear selected items
    };

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

    const handleRemoveFile = (index) => {
        setDocuments((prevDocs) => prevDocs.filter((_, i) => i !== index));
    };

    const handleCancelModal = () => {
        setIsAddingIssues(false);
        setDocuments([]);

    };

    const handleMarkAsResolved = (issueId) => {
        setIssues((prevIssues) =>
            prevIssues.map((issue) =>
                issue.id === issueId
                    ? { ...issue, resolved: true, dateResolved: new Date() }
                    : issue
            )
        );
    };

    if (selectedIssue !== null) {
        return (
          <IssueProfile
          issue={selectedIssue}
          onBack={handleBackToList}
          onMarkAsResolved={handleMarkAsResolved}
          />
        );
      }

    return (
        <div>
            <div className='issue-list-top'>
                    <button className='issue-list-switch-property'>View: </button> 
            </div>
            <div className="unresolved-issues">
                <div className="issue-list">
                <h3>Unresolved Issues</h3>
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
                                <td>{issue.id}</td>
                                <td>{issue.dateRaised.toLocaleDateString()}</td>
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
                    <button onClick={() => markSelectedAsResolved()}>Mark Selected as Resolved</button>
            </div>
        
            {isAddingIssues && (
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
            )}

            <div className="resolved-issues">
                <div className="issue-list">
                    <h3>Resolved Issues</h3>
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
                                    <td>{issue.id}</td>
                                    <td>{issue.dateResolved ? issue.dateResolved.toLocaleDateString() : " "}</td>
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
            </div>

        </div>

        
    );
    
}

export default Issues;

    