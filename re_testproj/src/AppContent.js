// src/AppContent.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './Header';
import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications/Applications';
// For landlord, you already have these:
import Tenant from './Tenant';
import Unit from './Unit';
import Issues from './Issues';
import Settings from './Settings/Settings';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import RoleSelection from './RoleSelection';
// New Tenant view components:
import TenantHomepage from './TenantView/TenantHomepage';
import TenantSettings from './TenantView/TenantSettings';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [role, setRole] = React.useState(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Route for non-authenticated users */}
      {!isAuthenticated && (
        <>
          <Route path="/*" element={<Login />} />
          <Route path="*" element={<Navigate to="/*" replace />} />
        </>
      )}

      {/* Authenticated but no role chosen yet */}
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
          <Route path="*" element={<Navigate to="/select-role" replace />} />
        </>
      )}

      {/* Authenticated and role chosen */}
      {isAuthenticated && role && (
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout role={role} />
            </ProtectedRoute>
          }
        >
          {role === 'landlord' && (
            <>
              <Route index element={<Homepage />} />
              <Route path="homepage" element={<Homepage />} />
              <Route path="billing" element={<Billings />} />
              <Route path="applications" element={<Applications />} />
              <Route path="tenant" element={<Tenant />} />
              <Route path="unit" element={<Unit />} />
              <Route path="issues" element={<Issues />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="homepage" replace />} />
            </>
          )}

          {role === 'tenant' && (
            <>
              {/* All Tenant routes are grouped under /tenant */}
              <Route path="tenant">
                <Route path="dashboard" element={<TenantHomepage />} />
                <Route path="settings" element={<TenantSettings />} />
                {/* Default tenant route redirects to dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="tenant/dashboard" replace />} />
            </>
          )}
        </Route>
      )}
    </Routes>
  );
}

export default AppContent;
