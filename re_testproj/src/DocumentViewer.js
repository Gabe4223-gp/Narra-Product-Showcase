import React from "react";


function DocumentViewer({ onBack, selectedDoc, forPreview }) {
  console.log("salsdkjf", selectedDoc);
  if (!selectedDoc) {
    return <div>No document selected</div>;
  }

  // Extract fileType from selectedDoc (passed as a prop)
  const fileType = selectedDoc?.fileType || '';

  // Check if the file is an image
  const isImageFile = ['image/jpeg', 'image/png', 'image/gif'].includes(fileType);

  const handleSendForSigning = () => {

    if (forPreview === true) {
        // Add logic for sending lease for signing
      console.log('Sending lease for signing...');
    }
  };

  return (
    <div className="document-container">
      <div>
        <button onClick={onBack}>Back</button>
      </div>

      {/* Display the document based on its file type */}
      {selectedDoc?.fileContent ? (
        isImageFile ? (
          <img
            id="imageViewer"
            src={selectedDoc.fileContent}
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
            src={selectedDoc.fileContent}
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



