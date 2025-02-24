// RoleSelection.js
import React from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

function RoleSelection({ setRole }) {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();

  const handleRoleSelection = async (selectedRole) => {
    try {
      const email = user?.email;
      if (!email) {
        alert("No email found. Please log in again.");
        return;
      }
      // Check if the user's profile is complete
      const res = await axios.get(
        `/api/user-profile/existing?email=${encodeURIComponent(email)}`
      );
      const { exists } = res.data;

      if (exists) {
        // If profile is complete, set the role and navigate
        setRole(selectedRole);
        if (selectedRole === 'tenant') {
          navigate('/tenant/dashboard', { replace: true });
        } else {
          navigate('/homepage', { replace: true });
        }
      } else {
        // Profile incomplete => route to Welcome
        navigate('/welcome', {
          replace: true,
          state: {
            authUserInfo: user, // pass Auth0 user info to prefill fields
            chosenRole: selectedRole,
          },
        });
      }
    } catch (error) {
      console.error("Error checking profile:", error);
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
