import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DocBuilder from './DocBuilder';
import './Docs.css';

const Docs = () => {
  const [docs, setDocs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [showDocBuilder, setShowDocBuilder] = useState(false);

  // Fetch docs from the backend
  const fetchDocs = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/docs`, {
        params: { page: currentPage, limit: itemsPerPage },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token for auth
        },
      });
      setDocs(data.docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  // Fetch docs on component mount and page change
  useEffect(() => {
    fetchDocs();
  }, [currentPage]);

  // View document (opens in a new tab)
  const handleView = (doc) => {
    if (!doc.filePath) {
      alert('No file available for viewing.');
      return;
    }
    window.open(`${process.env.REACT_APP_BASE_URL}/uploads/${doc.filePath}`, '_blank');
  };

  // Download document
  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/docs/${id}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download the document.');
    }
  };

  // Delete document
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/docs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Document deleted successfully.');
      fetchDocs(); // Refresh the document list
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete the document.');
    }
  };

  const paginatedDocs = docs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="docs-container">
      <div className="top-bar">
        <h3>Docs</h3>
      </div>

      <div className="docs-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocs.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.name}</td>
                <td>
                  <button className="view-btn" onClick={() => handleView(doc)}>
                    View
                  </button>
                  <button className="download-btn" onClick={() => handleDownload(doc.id)}>
                    Download
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(doc.id)}>
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: Math.ceil(docs.length / itemsPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="add-new">
        <button className="add-new-btn" onClick={() => setShowDocBuilder(true)}>
          Add New
        </button>
      </div>

      {showDocBuilder && (
        <DocBuilder
          onClose={() => {
            setShowDocBuilder(false);
            fetchDocs(); // Refresh docs after adding a new one
          }}
        />
      )}
    </div>
  );
};

export default Docs;
