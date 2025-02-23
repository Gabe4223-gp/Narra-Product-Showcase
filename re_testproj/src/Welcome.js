// src/Welcome.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Welcome.css';

function Welcome({ onProfileCreated }) {
  const navigate = useNavigate();
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
      await axios.post('/api/user-profile/welcome', {
        name,
        phoneNumber: phone,
        dateofBirth: dob,
        email,
        password,
      });
      alert("Profile created successfully!");
      onProfileCreated(chosenRole);
      navigate('/');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  return (
    <div className="welcome-container">
      <h2>Welcome to Narra!</h2>
      <p>Let's set up your profile</p>

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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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

      <button className="btn-role" onClick={handleSave}>
        Save
      </button>
    </div>
  );
}

export default Welcome;
