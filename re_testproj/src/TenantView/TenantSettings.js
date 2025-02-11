// src/TenantSettings.js
import React, { useState } from 'react';
import './TenantSettings.css';

const TenantSettings = () => {
  const [formData, setFormData] = useState({
    id: 1, // For testing purposes, set a fixed tenant id (or get it from auth context)
    name: 'Lebron James',
    phone: '123-456-7890',
    dob: '1990-01-01',
    email: 'nigga@example.com',
    password: '', // This field is disabled for now.
  });
  
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage('Settings updated successfully.');
        console.log('Response:', result);
      } else {
        setMessage(result.error || 'An error occurred.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('Server error.');
    }
  };

  const handleChangePassword = async () => {
    // This function would similarly make an API call to change the password.
    try {
      const response = await fetch('http://localhost:5000/tenant/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formData.id, newPassword: 'newPassword123' }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage('Password updated successfully.');
      } else {
        setMessage(result.error || 'Error updating password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('Server error.');
    }
  };

  return (
    <div className="settings-container">
      <h3>Account Settings</h3>
      <h4>Personal Details</h4>
      <form onSubmit={handleSubmit}>
        <div className="fields">
          <label htmlFor="name">Name</label>
          <input 
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="phone">Phone Number</label>
          <input 
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="dob">Date of Birth</label>
          <input 
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="email">Email</label>
          <input 
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="password">Password</label>
          <input 
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled
          />
          <button type="button" className="link-btn" onClick={handleChangePassword}>
            Change Password
          </button>
        </div>
        <button type="submit" className="edit-btn">Save Changes</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default TenantSettings;
