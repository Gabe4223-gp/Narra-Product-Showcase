// src/TenantSettings.js
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../UserProfileContext'; // or correct path
import axios from 'axios';
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

  // When userProfile changes, populate formData
  useEffect(() => {
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
  }, [userProfile]);

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
        password: formData.password, // consider hashing
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while saving settings.');
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
      <h3>Account Settings</h3>
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
    </div>
  );
}

export default TenantSettings;
