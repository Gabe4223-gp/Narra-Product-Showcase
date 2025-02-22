// src/AppContent.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications/Applications';
import Tenants from './Tenants';
import Units from './Units';
import Issues from './Issues';
import Settings from './Settings/Settings';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import RoleSelection from './RoleSelection';

// New Tenant view component:
import TenantHomepage from './TenantView/TenantHomepage';

// New "Welcome" component for setting up a profile if incomplete
import Welcome from './Welcome';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [role, setRole] = React.useState(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* 1. Public Route for non-authenticated users */}
      {!isAuthenticated && (
        <>
          <Route path="/*" element={<Login />} />
          <Route path="*" element={<Navigate to="/*" replace />} />
        </>
      )}

      {/* 2. Authenticated but no role chosen yet */}
      {isAuthenticated && !role && (
        <>
          <Route
            path="/select-role"
            element={
              <ProtectedRoute>
                <RoleSelection setRole={setRole} />
              </ProtectedRoute>
            }
          />
          {/* If userProfile check fails, we route them to Welcome */}
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <Welcome onProfileCreated={(selectedRole) => setRole(selectedRole)} />
              </ProtectedRoute>
            }
          />

          {/* Default path when no role is set */}
          <Route path="*" element={<Navigate to="/select-role" replace />} />
        </>
      )}

      {/* 3. Authenticated and role chosen */}
      {isAuthenticated && role && (
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout role={role} />
            </ProtectedRoute>
          }
        >
          {/* Landlord Routes */}
          {role === 'landlord' && (
            <>
              <Route index element={<Homepage />} />
              <Route path="homepage" element={<Homepage />} />
              <Route path="billing" element={<Billings />} />
              <Route path="applications" element={<Applications />} />
              <Route path="tenant" element={<Tenants />} />
              <Route path="unit" element={<Units />} />
              <Route path="issues" element={<Issues />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/homepage" replace />} />
            </>
          )}

          {/* Tenant Routes */}
          {role === 'tenant' && (
            <>
              <Route path="tenant">
                <Route path="dashboard" element={<TenantHomepage />} />
                <Route path="settings" element={<Settings />} />
                {/* Default tenant route redirects to /tenant/dashboard */}
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
