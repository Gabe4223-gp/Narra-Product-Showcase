// RoleSelection.js
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RoleSelection.css';

function RoleSelection({ setRole, setPermissions }) {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL;
  console.log("This is the URL", apiUrl);
  

  const handleRoleSelection = async (selectedRole) => {
    const email = user?.email;
    if (!email) {
      setError("We could not read your email address. Please sign in again.");
      return;
    }

    setBusy(true);
    setError(null);

    let exists;
    try {
      // This can be the first call to a sleeping server, so it may take
      // around a minute. Previously an failure here threw silently and the
      // button simply did nothing.
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/user-profile/existing?email=${encodeURIComponent(email)}`
      );
      exists = res.data.exists;
    } catch (err) {
      console.error('Could not check for an existing profile:', err);
      setBusy(false);
      setError("The server did not respond. It may still be starting up - please try again in a moment.");
      return;
    }
  
    // If doesn't exist, go to welcome steps
    if (!exists) {
      console.log("the welcome page should load", exists);
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
    // Clear local state first: logout() navigates away immediately, so
    // anything after it may never run.
    localStorage.setItem("userRole", JSON.stringify(null));

    // returnTo must be explicit. Without it Auth0 falls back to the first
    // entry in the application's Allowed Logout URLs, which sends deployed
    // users to localhost.
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="role-selection-container">
      <button
        className="btn-role"
        onClick={() => handleRoleSelection('landlord')}
        disabled={busy}
      >
        {busy ? 'Please wait...' : 'Manager'}
      </button>
      <button
        className="btn-role"
        onClick={() => handleRoleSelection('tenant')}
        disabled={busy}
      >
        {busy ? 'Please wait...' : 'Tenant'}
      </button>
      <button className="btn-role" onClick={handleLogout} disabled={busy}>
        Back to Login
      </button>

      {busy && (
        <p className="role-hint" role="status" aria-live="polite">
          Starting the server. On free hosting this can take up to a minute
          the first time.
        </p>
      )}

      {error && (
        <p className="role-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default RoleSelection;
