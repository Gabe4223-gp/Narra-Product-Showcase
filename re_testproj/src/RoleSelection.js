// RoleSelection.js
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RoleSelection.css';

function RoleSelection({ setRole, setPermissions }) {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();

  const handleRoleSelection = async (selectedRole) => {
    const email = user?.email;
    if (!email) {
      alert("No email found. Please log in again.");
      return;
    }
  
    // (Optional) Check if user profile exists
    const res = await axios.get(`/api/user-profile/existing?email=${encodeURIComponent(email)}`);
    const { exists } = res.data;
  
    // If doesn't exist, go to welcome steps
    if (!exists) {
      navigate('/welcome', {
        replace: true,
        state: { authUserInfo: user, chosenRole: selectedRole },
      });
    } else {
      // Just set role and redirect
      setRole(selectedRole);
      localStorage.setItem("userRole", selectedRole);

      if (selectedRole === "tenant") {
        navigate("/tenant/dashboard");
      } else {
        navigate("/manager/dashboard");
      }
    }
  };

  // Logout button
  const handleLogout = () => {
    logout({ returnTo: window.location.origin });
  };

  return (
    <div className="role-selection-container">
      <button className="btn-role" onClick={() => handleRoleSelection('landlord')}>Manager</button>
      <button className="btn-role" onClick={() => handleRoleSelection('tenant')}>Tenant</button>
      <button className="btn-role" onClick={handleLogout}>Back to Login</button>
    </div>
  );
}

export default RoleSelection;
