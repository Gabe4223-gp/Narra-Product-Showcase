// AppContent.js
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import Header from './Header';
import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications';
import Tenant from './Tenant';
import Chat from './Chat';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
//import Profile from './Profile';

function AppContent() {
  const { isAuthenticated } = React.useContext(AuthContext);
  const location = useLocation();

  // Determine if Header should be displayed
  // Header is hidden on the login page (path "/")
  const hideHeader = location.pathname === '/';

  return (
    <>
      {!hideHeader && isAuthenticated && <Header />}
      <Routes>
        {/* Public Route: Login */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Login />
            ) : (
              <Navigate to="/homepage" replace />
            )
          }
        />

        {/* Protected Routes */}
        <Route path="/homepage" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Homepage /></ProtectedRoute>}/>
        <Route path="/billing" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Billings /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Applications /></ProtectedRoute>} />
        <Route path="/tenant" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Tenant /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Chat /></ProtectedRoute>} />
        <Route path="/back" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Homepage /></ProtectedRoute>} />
        {/* Redirect Unknown Routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/homepage" : "/"} replace />} />
      </Routes>
    </>
  );
}

export default AppContent;
