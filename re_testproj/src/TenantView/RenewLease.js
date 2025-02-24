// src/RenewLease.js
import React, { useState, useEffect } from 'react';
import './RenewLease.css';
import { useUserProfile } from "../UserProfileContext";
import { ROWLOCK } from 'sequelize/lib/table-hints';

function RenewLease({onUploadSignedLease}) {
  // Generate last 10 years for selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [signedFile, setSignedFile] = useState(null);
  const [unsignedFiles, setUnsignedFiles] = useState(null);
  const [previewLease, setPreviewLease] = useState(null);
  const [uploadLease, setUploadLeaseModal] = useState(null);
  const {userProfile} = useUserProfile();

  const tenantId = userProfile.id;

  const handleFileChange = (e) => {
    setSignedFile(e.target.files[0]);
  };
 
  const fetchUnsignedLeases = async () => {
    try {
      const response = await fetch(`/unsigned-leases/${tenantId}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log("leases", data);

      setUnsignedFiles(data);
    } catch (err) {
      console.error(err, 'Error fetching unsigned leases.');
    } 
  }

  useEffect(() => {
    fetchUnsignedLeases();
  }, []);

  const handleViewLease = async (doc) => {
    try {
      // Use query parameters instead of body
      const response = await fetch(`/tenants/get-id?tenantId=${tenantId}&fileName=${doc.fileName}`, {
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
          fileName: doc.fileName,  
          fileType: data.fileType,
      };

      console.log("Here's the loadedDoc", loadedDoc);

      setPreviewLease(loadedDoc);

    } catch (error) {
        console.error("Error retrieving lease:", error);
    }
    
  }

  const handleUploadSignedLease = async (unsignedFile) => {

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];  // Example allowed types


    if (signedFile) {
      if (!allowedTypes.includes(signedFile.type)) {
          alert('Invalid file type. Please upload a PDF or image.');
          return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
          // Only send the fileContent to the backend for update
          const fileContent = reader.result;  // Base64 content of the file

          try {
              const response = await fetch('/tenants/update-lease', {
                  method: 'PUT',  // Use PUT for updating the document
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      id: unsignedFile.id,
                      fileName: unsignedFile.id,  // This is the existing file's key (id in your case)
                      fileContent: fileContent,  // New content to update in S3
                      fileType: signedFile.type,  // Content type (PDF, image, etc.)
                      tenantId: userProfile.id,
                      tenantEmail: userProfile.email,
                  }),
              });

              const data = await response.json();
              if (response.ok) {
                console.log("Lease document content updated successfully:", data.url);
                setUploadLeaseModal(null);
                setSignedFile(null);
                onUploadSignedLease();
                  
              } else {
                  console.error("Update failed:", data.message);
              }
          } catch (error) {
              console.error("Error updating lease document:", error);
          }

      };

      reader.readAsDataURL(signedFile);  // Convert the signedFile to base64 content
      
    }
  };

  return (
    <div className="renew-lease">
      <div className='renew-lease-header'>
        <h5>Unsigned Leases</h5>
        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", margin:"0" }}>
                      <span>Select Year:</span>
                      <select
                          style={{ fontSize: "12px"}}
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
        </div>
      </div>
      
      {console.log(unsignedFiles)}

      

      <table>
          <thead>
              <tr>
                  <th> </th>
                  <th style={{width:'30%', textAlign: 'left'}}>Uploaded At</th>
                  <th style={{width:'40%', textAlign: 'left'}}>Subject</th>
                  <th style={{width:'15%', textAlign: 'left'}}> </th>
                  <th style={{width:'15%', textAlign: 'left'}}> </th>
              </tr>
          </thead>
          <tbody>
              {unsignedFiles && unsignedFiles?.length > 0 ? (
                  unsignedFiles
                      .filter((doc) => new Date(doc.uploadedAt).getFullYear() === selectedYear) 
                      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
                      .map((doc) => (
                          <tr key={doc.id}>
                              <td style={{width:'30%'}}>{new Date(doc.uploadedAt).toLocaleString()}</td>
                              <td style={{width:'40%', textAlign: 'left'}}>{doc.subject}</td>
                              <td style={{width:'15%'}}>
                                  <button onClick={() => handleViewLease(doc)}>
                                      View
                                  </button>
                              </td>
                              <td style={{width:'15%'}}>
                                  <button onClick={() => setUploadLeaseModal(doc)}>
                                      Upload Signed
                                  </button>
                              </td>
                          </tr>
                      ))
              ) : (
                  <tr>
                      <td colSpan="3" className="text-center py-2">
                          No lease documents available.
                      </td>
                  </tr>
              )}
          </tbody>
      </table>
      
      {uploadLease && (
            <div className="overlay">
              <div className="modal">
                <label>Upload Signed Lease:</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} />
                <button onClick={() => handleUploadSignedLease(uploadLease)}>Upload</button>
                <button onClick={() => setUploadLeaseModal(null)}>Cancel</button>
              </div>
            </div>
          )}

      {previewLease && (
        <div className='preview-lease-overlay'>
            <div className='preview-lease-modal'>
                {previewLease?.fileContent ? (
                    (previewLease?.fileType === 'image/png' || 
                        previewLease?.fileType === 'image/jpeg' || 
                        previewLease?.fileType === 'image/jpg') ? (
                        <img
                            id="imageViewer"
                            src={previewLease?.fileContent}
                            alt="Selected"
                            style={{
                                width: "100%",
                                height: "auto",
                                border: "1px solid #ccc",
                            }}
                        />
                    ) : previewLease?.fileType === 'application/pdf' ? (
                        <iframe
                            id="pdfViewer"
                            src={previewLease?.fileContent}
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
                <div>
                    <button onClick={() => setPreviewLease(null)}>Back</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );  
}

export default RenewLease;
