// src/RoleSelection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

const RoleSelection = ({ setRole }) => {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    // Set the role
    setRole(role);
    // Immediately navigate to the appropriate dashboard
    navigate(role === 'tenant' ? '/tenant/dashboard' : '/homepage', { replace: true });
  };

  return (
    <div className="role-selection-container">
      <h2>Select Your Role</h2>
      <p>Please choose your role:</p>
      <button className="btn-role" onClick={() => handleRoleSelection('tenant')}>
        I'm a Tenant
      </button>
      <button className="btn-role" onClick={() => handleRoleSelection('landlord')}>
        I'm a Landlord
      </button>
    </div>
  );
};

export default RoleSelection;
