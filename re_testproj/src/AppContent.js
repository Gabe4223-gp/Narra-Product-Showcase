// AppContent.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserProfile } from './UserProfileContext';
import { useTeamContext } from './TeamContext';
import axios from 'axios';

import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications/Applications';
import Tenants from './Tenants';
import Units from './Units';
import Issues from './Issues';
import Settings from './Settings/Settings';
import TenantSettings from './Settings/TenantSettings';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import RoleSelection from './RoleSelection';
import TenantHomepage from './TenantView/TenantHomepage';
import Welcome from './Welcome';

function AppContent() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { userProfile } = useUserProfile();
  
  // Bring in TeamContext
  const {
    teams,
    loadingTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeamMembership
  } = useTeamContext();

  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(() => {
    return localStorage.getItem("userRole") || null;
  });

  function useQuery() {
    return new URLSearchParams(location.search);
  }

  const query = useQuery();
  const redirected = query.get("redirected");

  useEffect(() => {
    if (role) {
      localStorage.setItem("userRole", role);
    }
      console.log('redirected:', redirected);
      
      if (redirected === "true") {
        if (role === "tenant") {
          navigate("/tenant/dashboard", { replace: true });
        } else if (role === "landlord") {
          navigate("/homepage", { replace: true });
        } else {
          navigate("/select-role", { replace: true });  // Fallback if role is missing
        }
      }
      
      if (!isAuthenticated && !isLoading && window.location.pathname !== "/") {
        loginWithRedirect();
      }
    }, [redirected, role, isAuthenticated, isLoading, loginWithRedirect, navigate]);

  // If loading from Auth0 or TeamContext, show loading
  if (isLoading || loadingTeams) {
    return <div>Loading...</div>;
  }

  // If not authenticated, show public routes
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // At this point, TeamContext has loaded. 
  // Because we auto-create a default team if none exists, 
  // user always has at least 1 team by now (unless an error).

  // If there's exactly one team but no activeTeamId, pick it
  if (teams.length === 1 && !activeTeamId) {
    setActiveTeamId(teams[0].id);
  }

  // If user has no role => show role selection
  if (!role) {
    return (
      <Routes>
        <Route path="/select-role" element={
          <ProtectedRoute>
            <RoleSelection setRole={setRole} />
          </ProtectedRoute>
        } />
        <Route path="/welcome" element={
          <ProtectedRoute>
            <Welcome onProfileCreated={(selectedRole) => setRole(selectedRole)} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/select-role" replace />} />
      </Routes>
    );
  }

  // Optional: multi-team switcher if teams.length > 1
  function renderTeamSwitcher() {
    console.log()
    if (teams.length <= 1) return null;
    return (
      <div style={{ padding: '8px', background: '#ddd' }}>
        <label>Active Team:</label>
        <select
          value={activeTeamId || ''}
          onChange={(e) => setActiveTeamId(e.target.value)}
        >
          <option value="">(none)</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.teamName}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <>
      {renderTeamSwitcher()}

      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <Layout role={role} membership={activeTeamMembership} />
          </ProtectedRoute>
        }>
          {role === 'landlord' && (
            <>
              <Route index element={<Homepage />} />
              <Route path="homepage" element={<Homepage />} />
              {activeTeamMembership?.billings && <Route path="billing" element={<Billings />} />}
              {activeTeamMembership?.applications && <Route path="applications" element={<Applications />} />}
              {activeTeamMembership?.tenants && <Route path="tenant" element={<Tenants />} />}
              {activeTeamMembership?.units && <Route path="unit" element={<Units />} />}
              {activeTeamMembership?.issues && <Route path="issues" element={<Issues />} />}
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/homepage" replace />} />
            </>
          )}

          {role === 'tenant' && (
            <>
              <Route path="tenant">
                <Route path="dashboard" element={<TenantHomepage />} />
                <Route path="tenant-settings" element={<TenantSettings />} />
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
            </>
          )}
        </Route>
      </Routes>
    </>
  );
}

export default AppContent;
