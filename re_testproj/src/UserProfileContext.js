import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { useSearchParams } from 'react-router-dom';

const UserProfileContext = createContext(null);

export function useUserProfile() {
  return useContext(UserProfileContext);
}

export function UserProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth0();
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const redirected = searchParams.get("redirected");


  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setLoadingProfile(false);
      return;
    }
    try {
      setLoadingProfile(true);
      const res = await axios.get(`/api/user-profile/by-email/${encodeURIComponent(user.email)}`);
      setUserProfile(res.data.userProfile);
      setError(null);
    } catch (err) {
      console.error("Error fetching userProfile:", err);
      setError(err.message || "Error fetching userProfile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.email, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && redirected) {
      return;
    }

    if (!isAuthenticated || !user?.email) {
      setUserProfile(null);
      setLoadingProfile(false);
      return;
    }

    if (isAuthenticated && user?.email) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, user?.email, isAuthenticated, redirected]);

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