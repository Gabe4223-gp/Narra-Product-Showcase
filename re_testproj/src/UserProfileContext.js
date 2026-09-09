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
  // True only once the server has actually answered. A failed request leaves
  // userProfile null, which is otherwise indistinguishable from "this user has
  // no profile" -- and routing must not treat a network error as a missing
  // account.
  const [profileResolved, setProfileResolved] = useState(false);
  const [searchParams] = useSearchParams();
  const redirected = searchParams.get("redirected");


  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setLoadingProfile(false);
      return;
    } 
    try {
      setLoadingProfile(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user-profile/by-email/${encodeURIComponent(user.email)}`);
      setUserProfile(res.data.userProfile);
      setProfileResolved(true);
      console.log("Fetched user profile:", res.data.userProfile);
      

      // Store in local storage
      localStorage.setItem('userProfile', JSON.stringify(res.data.userProfile));

      setError(null);
    } catch (err) {
      console.error("Error fetching userProfile:", err);
      setError(err.message || "Error fetching userProfile.");
      // Unknown, not absent. Leave profileResolved false so callers keep the
      // user where they are rather than sending them through onboarding.
      setProfileResolved(false);
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
      setProfileResolved(false);
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
    profileResolved,
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