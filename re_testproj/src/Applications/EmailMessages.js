import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WriteEmailPopup from './WriteEmailPopup';
import './EmailMessages.css';

const EmailMessages = () => {
  const [emails, setEmails] = useState([
    {
      id: 999, // Unique ID for mock data
      email: 'mockemail@example.com',
      message: 'This is a mock email message.',
      status: 'pending',
    },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchEmails();
  }, [currentPage]);

  const fetchEmails = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_BASE_URL}/emails`, {
        params: { page: currentPage, limit: itemsPerPage },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Add token from localStorage
        },
      });

      // Combine mock data with fetched data
      const combinedEmails = [
        ...emails.filter((email) => email.id === 999), // Keep the mock email
        ...data.emails,
      ];

      setEmails(combinedEmails);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      console.error('Error fetching emails:', err);
    }
  };

  const handleAccept = (email) => {
    setSelectedEmail(email);
    setShowPopup(true); // Open the popup for writing an email
  };

  const handleDecline = async (email) => {
    try {
      // Send decline request to backend
      const emailToDecline = emails.find((e) => e.email === email);
      await axios.post(`${process.env.REACT_APP_BASE_URL}/emails/${emailToDecline.id}/decline`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Add token from localStorage
        },
      });

      alert(`Automated message sent to ${email} with subject: Narra: Your message has been declined.`);
      setEmails(emails.filter((e) => e.email !== email)); // Remove the declined email from the list
    } catch (err) {
      console.error('Error declining email:', err);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEmail(null); // Clear selected email on popup close
  };

  // Paginate emails
  const paginatedEmails = emails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="email-messages">
      <div className="top-bar">
        <h3>Email Messages</h3>
      </div>

      <div className="email-list">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmails.map((email) => (
              <tr key={email.id}>
                <td>{email.email}</td>
                <td>
                  <button onClick={() => handleAccept(email.email)} className="accept-btn">
                    Accept
                  </button>
                  <button onClick={() => handleDecline(email.email)} className="decline-btn">
                    Decline
                  </button>
                </td>
              </tr>
            ))}
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

      {showPopup && (
        <WriteEmailPopup
          email={selectedEmail} // Email address to send to
          onClose={closePopup}  // Close handler
        />
      )}
    </div>
  );
};

export default EmailMessages;
