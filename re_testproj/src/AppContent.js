import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useUserProfile } from './UserProfileContext';
import { useAuth0 } from '@auth0/auth0-react';
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

// New Tenant view component:
import TenantHomepage from './TenantView/TenantHomepage';

// New "Welcome" component for setting up a profile if incomplete
import Welcome from './Welcome';

function AppContent() {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const { userProfile, refreshUserProfile } = useUserProfile();

  const redirected = searchParams.get('redirected'); // Detect if redirected from payment

  // Fetch permissions on login
  useEffect(() => {
    if (user?.email) {
      const fetchPermissions = async () => {
        try {
          const res = await axios.get(`/api/team/permissions?email=${encodeURIComponent(user.email)}`);
          setPermissions(res.data);
        } catch (error) {
          console.warn("No team permissions found, defaulting to no access.");
          setPermissions({});
        }
      };
      fetchPermissions();
    }

    // Auto-login if user was redirected from payment
    if (!isAuthenticated && redirected) {
      loginWithRedirect();
    }

    // Refresh user profile after payment redirection
    if (redirected) {
      refreshUserProfile();
    }

  }, [user?.email, isAuthenticated, loginWithRedirect, redirected, refreshUserProfile]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* 1. Public Route for non-authenticated users */}
      {!isAuthenticated && !redirected && (
        <>
          <Route path="/*" element={<Login />} />
          <Route path="*" element={<Navigate to="/*" replace />} />
        </>
      )}

      {/* 2. Authenticated but no role chosen yet */}
      {isAuthenticated && !role && (
        <>
          <Route path="/select-role" element={
            <ProtectedRoute>
              <RoleSelection setRole={setRole} setPermissions={setPermissions} />
            </ProtectedRoute>
          }/>
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Welcome onProfileCreated={(selectedRole) => setRole(selectedRole)} />
            </ProtectedRoute>
          }/>
          <Route path="*" element={<Navigate to="/select-role" replace />} />
        </>
      )}

      {/* 3. Redirect Handling After Payment */}
      {isAuthenticated && redirected && (
        <Route path="/" element={<ProtectedRoute><Layout role="tenant" /></ProtectedRoute>}>
          <Route path="tenant/dashboard" element={<TenantHomepage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/tenant/dashboard" replace />} />
        </Route>
      )}

      {/* 4. Authenticated and role chosen */}
      {isAuthenticated && role && (
        <Route path="/" element={
          <ProtectedRoute>
            <Layout role={role} permissions={permissions} />
          </ProtectedRoute>
        }>
          {/* Landlord Routes */}
          {role === 'landlord' && (
            <>
              <Route index element={<Homepage />} />
              <Route path="homepage" element={<Homepage />} />
              {permissions.billings && <Route path="billing" element={<Billings />} />}
              {permissions.applications && <Route path="applications" element={<Applications />} />}
              {permissions.tenants && <Route path="tenant" element={<Tenants />} />}
              {permissions.units && <Route path="unit" element={<Units />} />}
              {permissions.issues && <Route path="issues" element={<Issues />} />}
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/homepage" replace />} />
            </>
          )}

          {/* Tenant Routes */}
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
      )}
    </Routes>
  );
}

export default AppContent;
