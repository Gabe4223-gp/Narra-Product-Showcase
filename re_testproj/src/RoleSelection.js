// RoleSelection.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

function RoleSelection({ setRole, setPermissions }) {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();

  const handleRoleSelection = async (selectedRole) => {
    try {
      const email = user?.email;
      if (!email) {
        alert("No email found. Please log in again.");
        return;
      }
  
      // Step 1: Check if the user's profile is complete
      const res = await axios.get(`/api/user-profile/existing?email=${encodeURIComponent(email)}`);
      const { exists } = res.data;
  
      // Step 2: Attempt to fetch and apply pending Teams data from Files
      try {
        await axios.get(`/api/team/move-teams/${encodeURIComponent(email)}`);
      } catch (err) {
        console.warn(`No pending teams data for ${email}. Continuing...`);  // Debugging log
      }
  
      // Fetch team permissions
      try {
        const teamRes = await axios.get(`/api/team/permissions?email=${encodeURIComponent(email)}`);
        setPermissions(teamRes.data); // Store permissions for Sidebar use
      } catch (err) {
        console.warn("No team data found, defaulting to no permissions.");
        setPermissions({});
      }

      if (exists) {
        // Step 3: If profile is complete, navigate accordingly
        setRole(selectedRole);
        if (selectedRole === 'tenant') {
          navigate('/tenant/dashboard', { replace: true });
        } else {
          navigate('/homepage', { replace: true });
        }
      } else {
        // Step 4: If profile is incomplete, go to Welcome page
        navigate('/welcome', {
          replace: true,
          state: {
            authUserInfo: user, 
            chosenRole: selectedRole,
          },
        });
      }
    } catch (error) {
      console.error("Error checking profile or transferring teams data:", error);
      alert("An error occurred. Please try again later.");
    }
  };
  
  // Logout button
  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  return (
    <div className="role-selection-container">
      <button
        className="btn-role"
        onClick={() => handleRoleSelection('landlord')}
      >
        Manager
      </button>
      <button className="btn-role" onClick={() => handleRoleSelection('tenant')}>
        Tenant
      </button>
      <button className="btn-role" onClick={handleLogout}>
        back to Login
      </button>
 
      
    </div>
  );
}

export default RoleSelection;
