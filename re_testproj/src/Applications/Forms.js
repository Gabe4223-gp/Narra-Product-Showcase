import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FormBuilder from './FormBuilder';
import './Forms.css';

const Form = () => {
  const [forms, setForms] = useState([
      {
        id: 999, // Unique ID
        name: 'Mock User',
        type: 'Form 1',
        content: 'This is a mock form for demonstration.',
        filePath: null,
      },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchForms();
  }, [currentPage]);

  const fetchForms = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/forms`, {
        params: { page: currentPage, limit: itemsPerPage },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const combinedForms = [
        ...forms.filter((form) => form.id === 999), // Keep the mock form
        ...data.forms,
      ];

      setForms(data.forms);
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
  };

  // Paginate forms
  const paginatedForms = forms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/forms/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert('Form deleted successfully.');
      fetchForms();
    } catch (err) {
      console.error('Error deleting form:', err);
      alert('Failed to delete the form.');
    }
  };

  const handleView = (filePath) => {
    if (!filePath) {
      alert('No file available for viewing.');
      return;
    }
    window.open(`${process.env.REACT_APP_BASE_URL}/uploads/${filePath}`, '_blank');
  };

  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/forms/${id}/download`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading form:', err);
      alert('Failed to download the form.');
    }
  };

  return (
    <div className="form-container">
      <div className="top-bar">
        <h3>Forms</h3>
      </div>

      <div className="form-list">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedForms.map((form) => (
              <tr key={form.id}>
                <td>{form.type}</td>
                <td>
                  <button onClick={() => handleView(form.filePath)} className="view-btn">
                    View
                  </button>
                  <button onClick={() => handleDownload(form.id)} className="download-btn">
                    Copy/Download
                  </button>
                  <button onClick={() => handleDelete(form.id)} className="delete-btn">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: Math.ceil(forms.length / itemsPerPage) }, (_, i) => (
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
        <button className="add-new-btn" onClick={() => setShowFormBuilder(true)}>
          Add New
        </button>
      </div>

      {showFormBuilder && (
        <FormBuilder onClose={() => setShowFormBuilder(false)} />
    )}
    </div>
  );
};

export default Form;
