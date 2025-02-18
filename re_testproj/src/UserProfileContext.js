import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfileContext = createContext(null);

// Custom hook for easy usage in components
export function useUserProfile() {
  return useContext(UserProfileContext);
}

// The provider that wraps your app (somewhere in AppContent.js or a top-level file)
export function UserProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);

  // Optional: fetch or create userProfile once the user is logged in
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setLoadingProfile(false);
      return;
    }
    try {
      setLoadingProfile(true);
      // e.g., GET /api/userProfile/by-email/:email
      const res = await axios.get(`/api/user-profile/by-email/${encodeURIComponent(user.email)}`);
      // If no profile, you might set userProfile to null or route to Welcome.js, etc.
      setUserProfile(res.data.userProfile); 
      setError(null);
    } catch (err) {
      console.error("Error fetching userProfile:", err);
      setError(err.message || "Error fetching userProfile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.email, isAuthenticated]);

  // Use effect to fetch the profile once on mount if the user is authenticated
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Method to refresh or force reload the userProfile (e.g., after saving changes)
  const refreshUserProfile = async () => {
    await fetchUserProfile();
  };

  // Method to manually update userProfile state if we get new data from an API response
  const updateUserProfile = (newProfile) => {
    setUserProfile(newProfile);
  };

  const value = {
    userProfile,
    loadingProfile,
    error,
    refreshUserProfile,
    updateUserProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}
