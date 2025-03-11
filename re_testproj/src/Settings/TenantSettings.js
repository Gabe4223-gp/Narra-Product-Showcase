// src/Settings.js
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../UserProfileContext'; // Adjust path as needed
import axios from 'axios';
import TeamSettings from './TeamSettings';
import './TenantSettings.css';

function TenantSettings() {
  const {
    userProfile,
    loadingProfile,
    error,
    refreshUserProfile,
    updateUserProfile,
  } = useUserProfile();

  // Locally store the form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phoneNumber: '',
    dateofBirth: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  // For the delete confirmation popup
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // When userProfile changes, populate formData
  useEffect(() => {
    if (!userProfile) {
      refreshUserProfile();
    }
    if (userProfile) {
      setFormData({
        id: userProfile.id || '',
        name: userProfile.name || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateofBirth: userProfile.dateofBirth
          ? userProfile.dateofBirth.split('T')[0]
          : '',
        email: userProfile.email || '',
        password: userProfile.password || '',
      });
    }
  }, [userProfile, refreshUserProfile]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // PUT request to update
      const res = await axios.put(`/api/user-profile/${formData.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
        password: formData.password,
      });
      setMessage(res.data.message || 'Settings updated successfully.');

      // Option 1: Re-fetch the profile from backend
      // refreshUserProfile();

      // Option 2: Manually update the context
      updateUserProfile({
        id: formData.id,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
        password: formData.password, // consider hashing in production
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while saving settings.');
    }
  };
  
  // Handle Delete Account (front-end only for now)
  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      // DELETE request to /api/user-profile/:id
      await axios.delete(`/api/user-profile/${formData.id}`);

      // Close the confirmation popup
      setShowDeleteConfirmation(false);

      // For example, redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      // Optionally show a user-friendly error message
    }
  };

  if (loadingProfile) {
    return <div>Loading your profile...</div>;
  }

  if (error) {
    return <div>Error loading profile: {error}</div>;
  }

  return (
    <div className="settings-container">
      <div className='settings-header'>
        <h3>Account Settings</h3>
      </div>
      
      
      {/* Personal Details Section */}
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
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="+63 ### ### ####"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="dateofBirth">Date of Birth</label>
          <input
            type="date"
            id="dateofBirth"
            name="dateofBirth"
            value={formData.dateofBirth}
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
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={!showPassword}
          />
          <button
            type="button"
            className="link-btn"
            onClick={handleChangePassword}
          >
            {showPassword ? 'Hide Password' : 'Change Password'}
          </button>
        </div>

        <button type="submit" className="edit-btn">Save Changes</button>
      </form>

      {message && <p>{message}</p>}

      {/* Language and Currency Section */}
      <h4>Language and Currency</h4>
      <p>
        Default Language: English{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => alert('Change Language feature not yet available')}
        >
          Change Language
        </button>
      </p>
      <p>
        Default Currency: Philippine Peso{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => alert('Change Currency feature not yet available')}
        >
          Change Currency
        </button>
      </p>

      {/* Help Section */}
      <h4>Help</h4>
      <h5>Contact Support</h5>
        <p>Company Email: admin@narra-ph.com</p>

      {/* Delete Account Link */}
      <button
        type="button"
        className="link-btn danger"
        onClick={handleDeleteAccount}
      >
        Delete Account
      </button>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirmation && (
      <div className='overlay'>
        <div className="modal">
          <p>
            Are you sure you want to delete your account?
            <br />
            You will be returned to the login page upon deleting.
          </p>
          <div style={{ marginTop: '10px' }}>
            <button onClick={confirmDeleteAccount} style={{ marginRight: '10px' }}>
              Yes, Delete
            </button>
            <button onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
      
    )}
    </div>
  );
}

export default TenantSettings;
