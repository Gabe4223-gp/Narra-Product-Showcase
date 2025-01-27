import React, { useState } from 'react';
import './WriteEmailPopup.css';

const WriteEmailPopup = ({ email, onClose }) => {
  const [draft, setDraft] = useState(''); // Stores the saved draft
  const [message, setMessage] = useState(''); // Stores the current message input

  // Handle saving the draft
  const handleSaveDraft = () => {
    setDraft(message);
    alert('Draft saved!');
  };

  // Handle sending the email
  const handleSendEmail = () => {
    // Replace this alert with actual API call logic when backend integration is done
    if (message.trim() === '') {
      alert('Message cannot be empty!');
      return;
    }
    
    alert(`Email sent to ${email} with subject: "Landlord has accepted your Email! You are now connected."`);
    onClose(); // Close the popup after sending the email
  };

  return (
    <div className="write-email-popup">
      <div className="popup-header">
        <h3>Write Email</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>
      <div className="popup-body">
        <label htmlFor="email">To:</label>
        <p id="email">{email}</p>
        <textarea
          placeholder="Write your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="message-input"
        />
      </div>
      <div className="popup-footer">
        <button onClick={handleSaveDraft} className="draft-btn">Save Draft</button>
        <button onClick={handleSendEmail} className="send-btn">Accept Email</button>
      </div>
    </div>
  );
};

export default WriteEmailPopup;
