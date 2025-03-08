import React from 'react';
import AppContent from './AppContent';
import { UserProfileProvider } from './UserProfileContext';
import { TeamProvider } from './TeamContext';

function App() {
  return (
    <UserProfileProvider>
      <TeamProvider>
        <div className="invoice-page">
        <AppContent />
        </div>
      </TeamProvider>
    </UserProfileProvider>
  );
}

export default App;