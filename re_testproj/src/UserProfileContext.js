import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const UserProfileContext = createContext(null);

// Custom hook for easy usage in components
export function useUserProfile() {
  return useContext(UserProfileContext);
}

// The provider that wraps your app
export function UserProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile from API or local storage
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      console.log("Fetching user profile from API...");
      
      /* First, check local storage
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        console.log("its getting from here", storedProfile);
        setUserProfile(JSON.parse(storedProfile));
        setLoadingProfile(false);
        return;
      }*/

      // Otherwise, fetch from API
      const res = await axios.get(`/api/user-profile/by-email/${encodeURIComponent(user.email)}`);
      setUserProfile(res.data.userProfile); 
      console.log("Fetched user profile:", res.data.userProfile);
      

      // Store in local storage
      localStorage.setItem('userProfile', JSON.stringify(res.data.userProfile));

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
    if (!isAuthenticated || !user?.email) {
      setUserProfile(null); // Reset profile when user logs out
      localStorage.removeItem('userProfile'); // Remove from local storage
      setLoadingProfile(false);
      return;
    }

    fetchUserProfile();
  }, [fetchUserProfile, user?.email, isAuthenticated]);

  // Method to refresh or force reload the userProfile (e.g., after saving changes)
  const refreshUserProfile = async () => {
    await fetchUserProfile();
  };

  // Method to manually update userProfile state if we get new data from an API response
  const updateUserProfile = (newProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('userProfile', JSON.stringify(newProfile)); // Persist new profile data
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
