import React, { useState} from 'react';
import './IssueProfile.css';
import DocumentViewer from './DocumentViewer';

function IssueProfile({ issue, onBack, onMarkAsResolved }) {
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showModal, setShowModal] = useState(false); // Modal visibility state
    const [isResolved, setIsResolved] = useState(issue.resolved); // Keep track of resolved status

    // Function to handle document click (opens document viewer)
    const handleViewDocument = (doc) => {
        if (doc.fileUrl) {
            setSelectedDoc(doc);
        } else {
            alert("Invalid file type. Only PDFs and images are allowed.");
        }
    };

    const handleBack = () => {
        setSelectedDoc(null);
    };

    const handleMarkResolved = () => {
        setShowModal(true); // Show confirmation modal
    };

    const handleConfirmResolved = () => {
        // Update the resolved status and hide modal
        setIsResolved(true);
        setShowModal(false);
        onMarkAsResolved(issue.id); // Notify the parent component of the resolved change
    };

    const handleCancelModal = () => {
        setShowModal(false); // Hide the modal without marking as resolved
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
                        <h6>ID: {issue.id}</h6>
                    </div>
                    <div className="issue-row">
                        <div className="left-issue-details">
                            <p>Unit: {issue.unit}</p>
                            <p>Tenant Raised: {issue.tenantRaised}</p>
                            <p>Type: {issue.type}</p>
                        </div>
                        <div className="right-issue-details">
                            <p>Date Raised: {issue.dateRaised.toLocaleDateString()}</p>
                            <p>Resolved: {isResolved ? "Yes" : "No"}</p>
                            <p>Date Resolved: {issue.dateResolved ? issue.dateResolved.toLocaleDateString() : "NA"}</p>
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
                    <div className="issue-row">
                        {issue.documents && issue.documents.length > 0 ? (
                            issue.documents.map((doc, index) => (
                                <div key={index} className="document-item" style={{ cursor: "pointer" }}>
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleViewDocument(doc)}
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
                    <button>Delete Issue</button>
                    <button onClick={handleMarkResolved}>Mark Issue as Resolved</button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h4>Confirm Resolution</h4>
                        <p>Are you sure you want to mark this issue as resolved?</p>
                        <button onClick={handleConfirmResolved}>Yes</button>
                        <button onClick={handleCancelModal}>No</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IssueProfile;