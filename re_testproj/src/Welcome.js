// src/Welcome.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserProfile } from './UserProfileContext';
import './Welcome.css';

function Welcome({ onProfileCreated }) {
  const navigate = useNavigate();
  const { refreshUserProfile } = useUserProfile();
  const location = useLocation();
  const authUserInfo = location.state?.authUserInfo;
  const chosenRole = location.state?.chosenRole;

  // Prefill from authUserInfo if available
  const [name, setName] = useState(authUserInfo?.name || '');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState(authUserInfo?.email || '');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({});

  // Field validation
  const validateFields = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!dob) newErrors.dob = 'Date of birth is required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = 'A valid email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUseAuthInfo = () => {
    if (authUserInfo) {
      setName(authUserInfo.name || '');
      setEmail(authUserInfo.email || '');
    }
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/user-profile/welcome`, {
        name,
        phoneNumber: phone,
        dateofBirth: dob,
        email,
        password,
      });
      // Pull the new profile into context before navigating. Routing treats a
      // resolved-but-empty profile as "needs onboarding", so without this the
      // user is bounced straight back to Role Selection having just filled the
      // form in.
      await refreshUserProfile();

      onProfileCreated(chosenRole);
      navigate(chosenRole === 'tenant' ? '/tenant/dashboard' : '/homepage', { replace: true });
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  // Handle back navigation to RoleSelection
  const handleBack = () => {
    navigate('/select-role', {
      replace: true,
      state: {
        authUserInfo,
      },
    });
  };

  return (
    <div className="welcome-container">
      <h2>Welcome to Narra</h2>
      <p>Set up your profile</p>

      {authUserInfo && (
        <div>
          <button className="btn-role" onClick={handleUseAuthInfo}>
            Use My Login Info
          </button>
        </div>
      )}

      <div className="form-group">
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </label>
      </div>

      <div className="form-group">
        <label>
          Phone Number:
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </label>
      </div>

      <div className="form-group">
        <label>
          Date of Birth:
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          {errors.dob && <span className="error">{errors.dob}</span>}
        </label>
      </div>

      <div className="form-group">
        <label>
          Email:
          {/* Read-only when it comes from the login. Profiles are looked up by
              the signed-in Auth0 email, so editing this would create a profile
              the app can never find again. */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={Boolean(authUserInfo?.email)}
          />
          {authUserInfo?.email && (
            <span className="field-hint">This is the email you signed in with.</span>
          )}
          {errors.email && <span className="error">{errors.email}</span>}
        </label>
      </div>

      <div className="form-group">
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </label>
      </div>

      <div className="welcome-actions">
        <button type="button" className="btn-role" onClick={handleSave}>
          Save
        </button>
        <button type="button" className="btn-role back-btn" onClick={handleBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default Welcome;
