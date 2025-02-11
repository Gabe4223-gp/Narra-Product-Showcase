import React, { useState} from 'react';
import './IssueProfile.css';
import DocumentViewer from './DocumentViewer';

function IssueProfile({ issue, onBack, onMarkasResolved }) {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showModal, setShowModal] = useState(false); // Modal visibility state

    // Function to handle document click (opens document viewer)
    const handleViewDocument = async (issueId, fileName) => {
        
        try {
            // Use query parameters instead of body
            const response = await fetch(`http://localhost:5000/issues/get-doc?issueId=${issueId}&fileName=${fileName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (!response.ok) {
                throw new Error(`Retrieval failed: ${response.statusText}`);
            }
    
            const data = await response.json();
            
            const cleanedBase64 = data.fileContent.replace(/^dataapplication\/pdfbase64/, ""); 
            console.log("Here's the doc", data);
            console.log("Here's the cleanedBased", cleanedBase64);

            const loadedDoc = {
                fileContent: `data:${data.fileType};base64,${cleanedBase64}`,  // Convert to data URL format
                fileName: fileName,  
                fileType: data.fileType,
            };

            console.log("Here's the loadedDoc", loadedDoc);
  
            setSelectedDoc(loadedDoc);
    
        } catch (error) {
            console.error("Error retrieving lease:", error);
        }
    };


    //Back from Doc view
    const handleBack = () => {
        setSelectedDoc(null);
    };

    const handleConfirmResolved = () => {
        onMarkasResolved(new Set([issue.id]))
        setShowModal(false);
        onBack();
    };

    const handleDeleteIssue = async () => {

        const issueId = issue.id;
   
        try {
            // Make a DELETE request to the backend with the propertyId
            const response = await fetch(`http://localhost:5000/issues/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ issueId }), // Send the propertyId in the request body
            });
   
            if (!response.ok) {
                console.error("Failed to delete issue:", response.statusText);
                return;
            }
   
            // Optionally handle the backend response
            const data = await response.json();
            console.log("Issue deleted successfully:", data);
            
            setShowDeleteModal(false);
            // Call the onBack function to return to the previous screen
            onBack();
        } catch (error) {
            console.error("Error deleting issue:", error);
        }
      };

    if (selectedDoc !== null) {
        return (
            <DocumentViewer
                onBack={handleBack}
                selectedDoc={selectedDoc}
                isPreview={false}
            />
        );
    }

    return (
        <div className="issue-profile">
            <button onClick={onBack}>Back</button>
            <div className="issue-top-section">
                <div className="issue-details">
                    <div className="issue-header">
                        <h5>Issue Details</h5>
                        <h6>ID: {issue.id.substring(0, 4)} </h6>
                    </div>
                    <div className="issue-row">
                        <div className="left-issue-details">
                            <p>Unit: {issue.unit}</p>
                            <p>Tenant Raised: {issue.tenantRaised}</p>
                            <p>Type: {issue.type}</p>
                        </div>
                        <div className="right-issue-details">
                            <p>Date Raised: {issue.dateRaised}</p>
                            <p>Resolved: {issue.resolved ? "Yes" : "No"}</p>
                            <p>Date Resolved: {issue.dateResolved ? issue.dateResolved : "NA"}</p>
                        </div>
                    </div>
                </div>
                <div className="issue-description">
                    <div className="issue-header">
                        <h5>Subject: {issue.subject}</h5>
                    </div>
                    <div className="issue-row">
                        <div className="description-box">
                            {issue.description || "No description provided."}
                        </div>
                    </div>
                </div>
            </div>

            <div className="issue-mid-section">
                <div className="issue-documents">
                    <div className="issue-header">
                        <h5>Relevant Documents:</h5>
                    </div>
                    <div className="issue-doc-row">
                        {issue.documents && issue.documents.length > 0 ? (
                            issue.documents.map((doc, index) => (
                                <div key={index} className="document-item" style={{ cursor: "pointer" }}>
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleViewDocument(issue.id, doc)}
                                        style={{ textDecoration: "underline", color: "blue" }}
                                    >
                                        {`Document ${index + 1}`}
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>No documents available.</p>
                        )}
                    </div>
                </div>

                <div className="issue-actions">
                    <div className="issue-header">
                        <h5>Actions</h5>
                    </div>
                    <div className='edit-buttons'>
                        <button onClick={() => setShowDeleteModal(true)}>Delete Issue</button>
                        {!issue.resolved && 
                        (<button onClick={() => setShowModal(true)}>Mark Issue as Resolved</button>)
                        }
                    </div>
                    
                </div>
            </div>
                
            {showDeleteModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div>
                            Are you sure you want to delete this tenant?
                        </div>
                        <button onClick={handleDeleteIssue}>Confirm</button>
                        <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                    </div>
                </div>
                
            )}

            {/* Confirmation Modal */}
            {showModal && (
                <div className='overlay'>
                    <div className="modal">
                        <h4>Confirm Resolution</h4>
                        <p>Are you sure you want to mark this issue as resolved?</p>
                        <button onClick={handleConfirmResolved}>Yes</button>
                        <button onClick={() => setShowModal(false)}>No</button>
                    </div>
                </div>
                
            )}
        </div>
    );
}

export default IssueProfile;