import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserProfile } from '../UserProfileContext';
import './TeamSettings.css';

function TeamSettings({ onClose }) {
  const { userProfile } = useUserProfile();

  // The current logged-in user’s ID and Email (from your DB)
  const userId = userProfile?.id;
  const userEmail = userProfile?.email;

  // 1) We store all teams the user belongs to
  const [teams, setTeams] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 2) For creating/editing a team
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [editTeamId, setEditTeamId] = useState(null);  // if null => create new, else editing

  // 3) For deleting a team
  const [deleteTeamId, setDeleteTeamId] = useState(null);

  // 4) For adding/editing members
  const [showMemberPopup, setShowMemberPopup] = useState(false);
  const [memberForm, setMemberForm] = useState({
    memberName: '',
    memberEmail: '',
    isAdmin: false,
    applications: false,
    tenants: false,
    units: false,
    issues: false,
    billings: false,
  });
  const [currentTeamId, setCurrentTeamId] = useState(null);
  const [editMemberId, setEditMemberId] = useState(null);

  // 5) For deleting a member
  const [deleteMemberId, setDeleteMemberId] = useState(null);

  // For tracking user’s membership in each team (e.g. isAdmin/isOwner)
  // This could be an object { [teamId]: { isOwner, isAdmin, ... } }
  const [myMemberships, setMyMemberships] = useState({});

  // ------------------------------------------------------------------
  // A) Fetch All Teams for This User
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!userEmail) return;
    const fetchTeams = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        // GET /api/teams => returns { success: true, teams: [...] }
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/teams`, {
          headers: { 'user-email': userEmail }
        });
        if (res.data.success) {
          setTeams(res.data.teams);
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setErrorMessage('Could not fetch teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [userEmail]);

  // ------------------------------------------------------------------
  // B) For Each Team, Fetch My Membership & The Team’s Members
  // ------------------------------------------------------------------
  // Call this whenever a new team is created or we first load teams.
  // We'll store them in "teams" -> team.members, and store my membership in "myMemberships"
  const loadTeamDetails = async (teamId) => {
    if (!userEmail) return;

    // 1) Get this user’s membership in the team
    // GET /api/teams/:teamId/my-membership => { success: true, membership: {...} }
    try {
      const memRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/my-membership`, {
        headers: { 'user-email': userEmail }
      });
      if (memRes.data.success) {
        setMyMemberships((prev) => ({
          ...prev,
          [teamId]: memRes.data.membership
        }));
      }
    } catch (err) {
      console.warn(`No membership info for user in team ${teamId}. Possibly no membership?`);
    }

    // 2) Get the team’s members
    // GET /api/teams/:teamId/members => { success: true, members: [...] }
    try {
      const memListRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/members`, {
        headers: { 'user-email': userEmail }
      });
      if (memListRes.data.success) {
        const members = memListRes.data.members;
        setTeams((prev) =>
          prev.map((t) => (t.id === teamId ? { ...t, members } : t))
        );
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  // We'll load team details once we have the teams
  useEffect(() => {
    if (!loading && teams.length > 0) {
      teams.forEach((team) => {
        loadTeamDetails(team.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, teams.length]);

  // ------------------------------------------------------------------
  // UTILITY: Check if current user isOwner or isAdmin in a given team
  // ------------------------------------------------------------------
  const isOwner = (teamId) => myMemberships[teamId]?.isOwner;
  const isAdmin = (teamId) => myMemberships[teamId]?.isAdmin;

  // ------------------------------------------------------------------
  // 1) CREATE / EDIT TEAM
  // ------------------------------------------------------------------
  const openTeamPopup = (team = null) => {
    setShowTeamPopup(true);
    if (team) {
      // Editing existing
      setEditTeamId(team.id);
      setTeamNameInput(team.teamName);
    } else {
      // Creating new
      setEditTeamId(null);
      setTeamNameInput('');
    }
  };

  const handleSaveTeam = async () => {
    if (!teamNameInput) {
      return alert('Team Name required!');
    }
    try {
      if (editTeamId) {
        // Update existing team name
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/teams/${editTeamId}`,
          { teamName: teamNameInput },
          { headers: { 'user-email': userEmail } }
        );
        // Update local state
        setTeams((prev) =>
          prev.map((t) =>
            t.id === editTeamId ? { ...t, teamName: teamNameInput } : t
          )
        );
      } else {
        // Create new team
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/teams`,
          { teamName: teamNameInput },
          { headers: { 'user-email': userEmail } }
        );
        if (res.data.success && res.data.team) {
          // Insert into local state
          const newTeam = { ...res.data.team, members: [] };
          setTeams((prev) => [...prev, newTeam]);
          // Immediately load membership & members for the new team
          loadTeamDetails(newTeam.id);
        }
      }
    } catch (err) {
      console.error('Error saving team:', err);
      alert('Failed to save team. Check console.');
    }
    setShowTeamPopup(false);
  };

  // ------------------------------------------------------------------
  // 2) DELETE TEAM
  // ------------------------------------------------------------------
  const handleDeleteTeam = (teamId) => {
    setDeleteTeamId(teamId);
  };

  const confirmDeleteTeam = async () => {
    if (!deleteTeamId) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/teams/${deleteTeamId}`, {
        headers: { 'user-email': userEmail }
      });
      setTeams((prev) => prev.filter((t) => t.id !== deleteTeamId));
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('Failed to delete team. Maybe you are not the owner or server error?');
    }
    setDeleteTeamId(null);
  };

  // ------------------------------------------------------------------
  // 3) ADD / EDIT MEMBER
  // ------------------------------------------------------------------
  const openMemberPopup = (teamId, member = null) => {
    setCurrentTeamId(teamId);
    setShowMemberPopup(true);

    if (member) {
      // Edit existing
      setEditMemberId(member.id);
      setMemberForm({
        memberName: member.memberName || '',
        memberEmail: member.memberEmail || '',
        isAdmin: member.isAdmin || false,
        applications: member.applications || false,
        tenants: member.tenants || false,
        units: member.units || false,
        issues: member.issues || false,
        billings: member.billings || false,
      });
    } else {
      // Add new
      setEditMemberId(null);
      setMemberForm({
        memberName: '',
        memberEmail: '',
        isAdmin: false,
        applications: false,
        tenants: false,
        units: false,
        issues: false,
        billings: false,
      });
    }
  };

  const handleMemberFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    setMemberForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };  

  const saveMember = async () => {
    if (!currentTeamId) return alert('No team selected!');
    if (!memberForm.memberEmail) return alert('Member email is required!');
  
    try {
      if (editMemberId) {
        // PUT
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/teams/${currentTeamId}/members/${editMemberId}`,
          {
            memberName: memberForm.memberName,
            memberEmail: memberForm.memberEmail,
            isAdmin: memberForm.isAdmin,
            applications: memberForm.applications,
            tenants: memberForm.tenants,
            units: memberForm.units,
            issues: memberForm.issues,
            billings: memberForm.billings
          },
          { headers: { 'user-email': userEmail } }
        );
      } else {
        // POST
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/teams/${currentTeamId}/members`,
          {
            memberName: memberForm.memberName,
            memberEmail: memberForm.memberEmail,
            isAdmin: memberForm.isAdmin,
            applications: memberForm.applications,
            tenants: memberForm.tenants,
            units: memberForm.units,
            issues: memberForm.issues,
            billings: memberForm.billings
          },
          { headers: { 'user-email': userEmail } }
        );
      }
  
      await loadTeamDetails(currentTeamId);
      setShowMemberPopup(false);
    } catch (err) {
      console.error('Error saving member:', err);
      alert('Failed to save member. Check console.');
    }
  };
  

  // ------------------------------------------------------------------
  // 4) DELETE MEMBER
  // ------------------------------------------------------------------
  const handleDeleteMember = (teamId, memberId) => {
    setCurrentTeamId(teamId);
    setDeleteMemberId(memberId);
  };

  const confirmDeleteMember = async () => {
    if (!deleteMemberId || !currentTeamId) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/teams/${currentTeamId}/members/${deleteMemberId}`,
        { headers: { 'user-email': userEmail } }
      );
      await loadTeamDetails(currentTeamId); // reload
    } catch (err) {
      console.error('Error deleting member:', err);
      alert('Failed to delete member. Possibly the Owner or server error.');
    }
    setDeleteMemberId(null);
  };

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="team-settings-container">
      <h2>Team Settings</h2>

      {loading && <p>Loading teams...</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {!loading && !errorMessage && teams.length === 0 && (
        <p>No Teams set up.</p>
      )}

      {/* Button to create a new Team */}
      <button onClick={() => openTeamPopup(null)} className="team-settings-add-btn">
        Create Team
      </button>

      {/* Render each Team */}
      {teams.map((team) => {
        const membership = myMemberships[team.id] || {};
        const canManageTeam = membership.isAdmin || membership.isOwner; // If user is admin/owner
        return (
          <div key={team.id} className="team-block">
            <div className="team-header">
              <h3>{team.teamName}</h3>
              {membership.isOwner && <span className="role-badge">Owner</span>}
              {!membership.isOwner && membership.isAdmin && (
                <span className="role-badge">Admin</span>
              )}
            </div>

            {/* If I'm admin/owner, I can edit or delete the team */}
            {canManageTeam && (
              <div className="team-actions">
                <button onClick={() => openTeamPopup(team)}>Edit Team Name</button>
                <button onClick={() => handleDeleteTeam(team.id)}>Delete Team</button>
                <button onClick={() => openMemberPopup(team.id, null)}>Add Member</button>
              </div>
            )}

            {/* Team Members Table */}
            {team.members && team.members.length > 0 ? (
              <table className="team-settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Permissions</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((member) => {
                    // Build a permission string
                    const permArr = [];
                    if (member.applications) permArr.push('Applications');
                    if (member.tenants) permArr.push('Tenants');
                    if (member.units) permArr.push('Units');
                    if (member.issues) permArr.push('Issues');
                    if (member.billings) permArr.push('Billings');
                    const displayPermissions = permArr.length
                      ? permArr.join(', ')
                      : 'No Permissions';

                    let roleLabel = '';
                    if (member.isOwner) roleLabel = 'Owner';
                    else if (member.isAdmin) roleLabel = 'Admin';

                    // If I'm admin or owner, I can manage others,
                    // but cannot remove or demote the Owner.
                    const canEditOrDelete =
                      canManageTeam && !member.isOwner; // can't demote the Owner

                    return (
                      <tr key={member.id}>
                        <td>{member.memberName}</td>
                        <td>{member.memberEmail}</td>
                        <td>{displayPermissions}</td>
                        <td>{roleLabel}</td>
                        <td>
                          {canEditOrDelete && (
                            <>
                              <button onClick={() => openMemberPopup(team.id, member)}>
                                Edit
                              </button>
                              <button onClick={() => handleDeleteMember(team.id, member.id)}>
                                Delete
                              </button>
                            </>
                          )}
                          {member.isOwner && <span> (Owner)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No Team Members.</p>
            )}
          </div>
        );
      })}

      <button onClick={onClose} className="team-settings-small-btn">
        Back
      </button>

      {/* ===========================
          CREATE/EDIT TEAM POPUP
      ============================ */}
      {showTeamPopup && (
        <div className="team-settings-popup-container">
          <div className="team-settings-popup">
            <h3>{editTeamId ? 'Edit Team' : 'Create Team'}</h3>
            <label>Team Name</label>
            <input
              type="text"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
            />
            <div className="team-settings-actions">
              <button
                onClick={() => {
                  setShowTeamPopup(false);
                  setEditTeamId(null);
                  setTeamNameInput('');
                }}
              >
                Cancel
              </button>
              <button onClick={handleSaveTeam}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          ADD/EDIT MEMBER POPUP
      ============================ */}
      {showMemberPopup && (
        <div className="team-settings-popup-container">
          <div className="team-settings-popup">
            <h3>{editMemberId ? 'Edit Member' : 'Add Member'}</h3>

            <label>Member Name</label>
            <input
              type="text"
              name="memberName"
              value={memberForm.memberName}
              onChange={handleMemberFormChange}
            />

            <label>Member Email</label>
            <input
              type="email"
              name="memberEmail"
              value={memberForm.memberEmail}
              onChange={handleMemberFormChange}
            />

            <div style={{ margin: '10px 0' }}>
              <label>
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={memberForm.isAdmin}
                  onChange={handleMemberFormChange}
                />
                Admin?
              </label>
            </div>

            <h4>Features</h4>
            {['applications', 'tenants', 'units', 'issues', 'billings'].map((feat) => (
              <label key={feat}>
                <input
                  type="checkbox"
                  name={feat}
                  checked={memberForm[feat]}
                  onChange={handleMemberFormChange}
                />
                {feat.charAt(0).toUpperCase() + feat.slice(1)}
              </label>
            ))}

            <div className="team-settings-actions">
              <button
                onClick={() => {
                  setShowMemberPopup(false);
                  setEditMemberId(null);
                }}
              >
                Cancel
              </button>
              <button onClick={saveMember}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===========================
          DELETE TEAM CONFIRMATION
      ============================ */}
      {deleteTeamId && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <p>Are you sure you want to delete this team?</p>
            <button onClick={confirmDeleteTeam}>Yes, Delete</button>
            <button onClick={() => setDeleteTeamId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ===========================
          DELETE MEMBER CONFIRMATION
      ============================ */}
      {deleteMemberId && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <p>Are you sure you want to delete this member?</p>
            <button onClick={confirmDeleteMember}>Yes, Delete</button>
            <button onClick={() => setDeleteMemberId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamSettings;
