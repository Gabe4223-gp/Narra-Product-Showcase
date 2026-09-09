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
import BackendWaking, { clearWaitTimer } from './BackendWaking';
import TaxFiling from './TaxFiling';
import Accounting from './Accounting';
import ProfitLoss from './ProfitLoss';
import Ledger from './generalLedger';

function AppContent() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { userProfile, profileResolved, profileInitialised } = useUserProfile();
  
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

  // The app stores the string "null" when no role is chosen, so a missing key
  // (real null) previously fell through every `role === "null"` check and
  // landed the user on the dashboard. Treat both as "no role".
  const hasRole = Boolean(role) && role !== "null";

  // And do not trust localStorage alone. If the profile is gone -- a deleted
  // account, or a new Auth0 signup in a browser that still has an old role
  // cached -- onboarding has to run again regardless of what is stored.
  //
  // profileResolved is essential here: it is only true once the server has
  // actually answered. Keying off !userProfile alone meant a failed or slow
  // request looked identical to a missing account, so the app bounced between
  // Role Selection and the dashboard -- Role Selection's own /existing check
  // said the profile was there, while this said it was not.
  const needsProfileSetup = profileResolved && !userProfile;



  useEffect(() => {

    if (!isAuthenticated) {
      return;
    }

    console.log('this is your role when logging in', role);
    
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
    } else if ((!hasRole || needsProfileSetup) && window.location.pathname !== "/select-role" && window.location.pathname !=="/welcome") {
      console.log("you are going to select role");
      navigate("/select-role", { replace: true });
    }

    if (!isAuthenticated && !isLoading && window.location.pathname !== "/" && window.location.pathname !== "/select-role") {
      console.log("logging in with redirect");
      loginWithRedirect();
    }
  
  }, [redirected, role, hasRole, needsProfileSetup, isAuthenticated, isLoading, loginWithRedirect, navigate]);

  // If loading from Auth0 or TeamContext, show loading. TeamContext makes the
  // first API call of the session, so this is where a cold backend is felt.
  // Gate on the first load only. Using loadingProfile here meant every
  // background refresh unmounted the app, and Header's mount effect calls
  // refreshUserProfile() -- an unmount/remount loop that never settled.
  if (isLoading || loadingTeams || !profileInitialised) {
    return <BackendWaking />;
  }

  // Past the loading gate: reset the shared timer so a later slow load starts
  // counting from zero rather than inheriting this session's elapsed time.
  clearWaitTimer();

  // If not authenticated, show public routes
  if (!isAuthenticated) {
    console.log("user  is not authenticated");
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
  if (!hasRole || needsProfileSetup) {
    console.log("user has no role or no profile; sending to onboarding");
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
      <div style={{ padding: '8px', background: '#ffff', borderBottom:'1px solid #cfcfcf57'}}>
        <label>Active Team:</label>
        <select
          value={activeTeamId || ''}
          onChange={(e) => setActiveTeamId(e.target.value)}
          style={{marginLeft:'10px'}}
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
            <Layout role={role} setRole={setRole} membership={activeTeamMembership} />
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
              {/* The sidebar links to these; without routes they fell through
                  to the catch-all below and silently returned the user to the
                  dashboard, which reads as a broken link. */}
              {activeTeamMembership?.accounting && <Route path="accounting" element={<Accounting />} />}
              {activeTeamMembership?.profitLoss && <Route path="profitloss" element={<ProfitLoss />} />}
              {activeTeamMembership?.taxFiling && <Route path="tax-filing" element={<TaxFiling />} />}
              {activeTeamMembership?.generalLedger && <Route path="generalLedger" element={<Ledger/>} />}
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
