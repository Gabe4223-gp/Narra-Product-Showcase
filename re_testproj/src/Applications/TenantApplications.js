import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TenantApplications.css';

const TenantApplications = () => {
  const [applications, setApplications] = useState([
    {
    id: 999,
    date: '01/20/2025',
    contact: 'a@example.com',
    form: 'Mock Form',
    file: 'a.pdf',
    status: 'pending',
    },
    /* Mock data for tenant applications
        { id: 1, date: '10/01/2024', contact: 'josh@gmail.com', form: 'Form 1', file: 'file1.pdf' },
        { id: 2, date: '10/02/2024', contact: 'anna@gmail.com', form: 'Complaint', file: 'file2.pdf' },
        { id: 3, date: '11/03/2024', contact: 'john@gmail.com', form: 'Form 1', file: 'file3.pdf' },
        { id: 4, date: '11/05/2024', contact: 'emma@gmail.com', form: 'Form 1', file: 'file4.pdf' },
        { id: 5, date: '10/10/2024', contact: 'lucas@gmail.com', form: 'Complaint', file: 'file5.pdf' },
        { id: 6, date: '11/12/2024', contact: 'mike@gmail.com', form: 'Form 1', file: 'file6.pdf' },
        Add more sample data as needed
    */
  ]);
  const [dateFilter, setDateFilter] = useState('10/2024'); // Default date filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchApplications();
  }, [dateFilter, currentPage]);

  // Fetch applications from the backend
  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/applications`, {
        params: { date: dateFilter, page: currentPage, limit: itemsPerPage },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      //Mock data DELETE
      const combinedApplications = [
      ...applications.filter(app => app.id === 999), // Keep the mock application
      ...data.applications,
    ];


      setApplications(combinedApplications); //REPLACE WITH combinedApplications with data.applications 
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  // Accept Application
  const handleAccept = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/applications/${id}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Your Application has been Accepted');
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error accepting application:', error);
    }
  };

  // Decline Application
  const handleDecline = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/applications/${id}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Application has been Declined');
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error declining application:', error);
    }
  };

  // Change Date Filter
  const handleChangeDate = () => {
    const newMonth = prompt('Enter month (mm):', dateFilter.split('/')[0]);
    const newYear = prompt('Enter year (yyyy):', dateFilter.split('/')[1]);

    if (newMonth && newYear) {
      setDateFilter(`${newMonth.padStart(2, '0')}/${newYear}`);
      setCurrentPage(1); // Reset to first page
    }
  };

  return (
    <div className="tenant-applications">
      <div className="top-bar">
        <h3>Tenant Applications</h3>
        <div className="date-filter">
          <span>
            {dateFilter} <button onClick={handleChangeDate} className="change-btn">change</button>
          </span>
        </div>
      </div>

      <div className="application-list">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Contact</th>
              <th>Form</th>
              <th>Submission File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app.id}>
                  <td>{new Date(app.date).toLocaleDateString()}</td>
                  <td>{app.contact}</td>
                  <td>{app.form}</td>
                  <td>
                    {app.file ? (
                      <a href={`/${app.file}`} target="_blank" rel="noopener noreferrer">
                        {app.file}
                      </a>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <button onClick={() => handleAccept(app.id)} className="accept-btn">
                      accept
                    </button>
                    <button onClick={() => handleDecline(app.id)} className="decline-btn">
                      decline
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  No applications found for the selected date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TenantApplications;
