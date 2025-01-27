import React, { useState } from 'react';
import axios from 'axios';
import './Docs.css';

const DocBuilder = ({ onClose }) => {
  const [docData, setDocData] = useState({
    name: '',
    type: 'Lease Contract',
    content: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocData({ ...docData, [name]: value });
  };

  const handleSave = async () => {
    if (!docData.name || !docData.content) {
      alert('Name and content are required.');
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/docs`,
        {
          name: docData.name,
          type: docData.type,
          content: docData.content,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token for authentication
          },
        }
      );
      alert('Document saved successfully!');
      onClose(); // Close the popup after saving
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Failed to save document.');
    }
  };

  return (
    <div className="doc-builder-popup">
      <div className="doc-builder-header">
        <h3>Doc Builder</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>

      <div className="doc-builder-body">
        <div className="form-section">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={docData.name}
            onChange={handleInputChange}
            placeholder="Enter document name"
          />
        </div>

        <div className="form-section">
          <label>Type:</label>
          <select
            name="type"
            value={docData.type}
            onChange={handleInputChange}
          >
            <option value="Lease Contract">Lease Contract</option>
          </select>
        </div>

        <div className="form-section">
          <label>Content:</label>
          <textarea
            name="content"
            value={docData.content}
            onChange={handleInputChange}
            placeholder="Type your document here..."
            style={{ height: '150px', resize: 'none' }}
          />
        </div>
      </div>

      <div className="doc-builder-footer">
        <button onClick={onClose} className="cancel-btn">Cancel</button>
        <button onClick={handleSave} className="save-btn">Save</button>
      </div>
    </div>
  );
};

export default DocBuilder;
