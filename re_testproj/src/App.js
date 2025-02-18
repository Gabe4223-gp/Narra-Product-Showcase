import React from 'react';
import AppContent from './AppContent';
import { UserProfileProvider } from './UserProfileContext';

function App() {
  return (
    <UserProfileProvider>
      <div className="invoice-page">
      <AppContent />
      </div>
    </UserProfileProvider>
  );
}

export default App;