// TeamContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const TeamContext = createContext();

export function useTeamContext() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }) {
  const { user } = useAuth0();
  
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Pivot-based membership for the currently active team
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [activeTeamMembership, setActiveTeamMembership] = useState(null);

  // Track if we've created the default team for this user (to prevent duplicates)
  const [hasCreatedDefaultTeam, setHasCreatedDefaultTeam] = useState(false);

  // ---------------------------
  // A) Fetch the user's teams
  // ---------------------------
  async function fetchTeamsByEmail() {
    if (!user?.email) {
      setTeams([]);
      setLoadingTeams(false);
      return;
    }
    try {
      setLoadingTeams(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/teams`, {
        headers: { 'user-email': user.email },
        // Bounded so a hung request cannot pin loadingTeams true and hold the
        // whole app on the loading screen.
        timeout: 30000,
      });
      if (res.data.success) {
        setTeams(res.data.teams);
      } else {
        setTeams([]);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }

  // Helper to refresh teams (e.g. after creating a team)
  const refreshTeams = async () => {
    await fetchTeamsByEmail();
  };

  // Fetch teams whenever user changes (login/logout)
  useEffect(() => {
    fetchTeamsByEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // ---------------------------
  // B) Auto-Create "Default Team" if zero teams
  // ---------------------------
  useEffect(() => {
    // If we are done loading, we have a user, and the final teams length is zero
    // but we haven't created a default team yet => create it
    if (!loadingTeams && user?.email) {
      if (teams.length > 0) {
        // The user already has at least one team, so mark that we do not need to create default
        setHasCreatedDefaultTeam(true);
      } else if (!hasCreatedDefaultTeam) {
        createDefaultTeam();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingTeams, teams]);

  async function createDefaultTeam() {
    try {
      setHasCreatedDefaultTeam(true);
      console.log('Creating default team for new user...');
      console.log('Here is the new react app api url', process.env.REACT_APP_API_URL);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/teams`,
        { teamName: 'Default Team' }, // or "My First Team"
        { headers: { 'user-email': user.email } }
      );
      if (res.data.success) {
        // The user is now owner+admin with all booleans
        // Refresh teams so the array length becomes 1
        await refreshTeams();
      } else {
        console.warn('Failed to auto-create default team:', res.data);
      }
    } catch (err) {
      console.error('Error auto-creating default team:', err);
    }
  }

  // ---------------------------
  // C) Load membership for the active team
  // ---------------------------
  useEffect(() => {
    async function fetchMembership() {
      if (!activeTeamId || !user?.email) {
        setActiveTeamMembership(null);
        return;
      }
      try {
        const memRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/teams/${activeTeamId}/my-membership`,
          { headers: { 'user-email': user.email } }
        );
        if (memRes.data.success) {
          setActiveTeamMembership(memRes.data.membership);
        } else {
          setActiveTeamMembership(null);
        }
      } catch (err) {
        console.warn('No membership or error fetching membership:', err);
        setActiveTeamMembership(null);
      }
    }
    fetchMembership();
  }, [activeTeamId, user?.email]);

  // Export everything
  const value = {
    teams,
    loadingTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeamMembership,
    refreshTeams
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
