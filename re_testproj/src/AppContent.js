// AppContent.js
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Header from './Header';
import Homepage from './Homepage';
import Billings from './Billings';
import Applications from './Applications/Applications';
import Tenant from './Tenant';
import Unit from './Unit';
import Issues from './Issues';
import Settings from './Settings/Settings';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import DocumentViewer from './DocumentViewer';
//import Profile from './Profile';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading...</div>; //Or a spinner component
  }

  return (
    <>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/*" element={!isAuthenticated ? <Login /> : <Navigate to="/homepage" replace />} />
        {/* Protected Routes */}
        {isAuthenticated && (
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Homepage />} />
            <Route path="/homepage" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Homepage /></ProtectedRoute>}/>
            <Route path="/billing" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Billings /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Applications /></ProtectedRoute>} />
            <Route path="/tenant" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Tenant /></ProtectedRoute>} />
            <Route path="/unit" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Unit /></ProtectedRoute>} />
            <Route path="/issues" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Issues /></ProtectedRoute>} />
            <Route path="/back" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Homepage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Settings /></ProtectedRoute>} />
          </Route>
        )}
        {/* Redirect Unknown Routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/homepage" : "/"} replace />} />
      </Routes>
    </>
  );
}

export default AppContent;
