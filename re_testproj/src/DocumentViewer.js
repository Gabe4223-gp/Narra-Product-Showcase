import React from "react";

function DocumentViewer ({onBack, selectedDoc, isPreview, tenant}) {

     // Extract fileType from selectedDoc (passed as a prop)
    const fileType = selectedDoc?.fileType || '';
    
    // Check if the file is an image
    const isImageFile = ['image/jpeg', 'image/png', 'image/gif'].includes(fileType);

    const handleSendForSigning = () => {
        /*const emailData = {
            front_email: userEmail,
            tenantEmail: tenant.email,  // Use the tenantEmail passed as a prop
            leaseDocumentName: `Lease for ${tenant.name} - ${new Date().getYear()}`,
            leaseUrl: selectedDoc.fileUrl,  // Link to the lease PDF
        };

        //Send the email using EmailJS
        emailjs.send('your_service_id', 'template_hxioczn', emailData, 'your_user_id')
            .then((response) => {
                alert('Lease sent for signing successfully!');
            })
            .catch((error) => {
                console.error('Error sending lease email:', error);
                alert('Failed to send lease email');
            });
            
            Need to figure out best way to allow users to send emails to tenants. 
            */
    };

    return (
        <div className="document-container">
            <div>
                <button onClick={onBack}>Back</button>
                
                {/* Conditionally render the "Send Lease for Signing" button when isPreview is true */}
                {isPreview && (
                    <button 
                        onClick={handleSendForSigning} 
                    >
                        Send Lease For Signing
                    </button>
                )}
            </div>
            
            {selectedDoc?.fileUrl ? (
                isImageFile ? (
                    <img
                        id="imageViewer"
                        src={selectedDoc.fileUrl}
                        alt="Selected"
                        style={{
                            width: "100%",
                            height: "auto",
                            border: "1px solid #ccc",
                        }}
                    />
                ) : fileType === 'application/pdf' ? (
                    <iframe
                        id="pdfViewer"
                        src={selectedDoc.fileUrl}
                        style={{
                            width: "100%",
                            height: "600px",
                            border: "1px solid #ccc",
                        }}
                    ></iframe>
                ) : (
                    <p>Unsupported file type</p>
                )
            ) : (
                <p>No document selected</p>
            )}
        </div>
    );
}

export default DocumentViewer;