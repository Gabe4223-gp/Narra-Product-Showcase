import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserProfile } from '../UserProfileContext';
import './TeamSettings.css';

function TeamSettings({ onClose, userName, userEmail }) {
  const {userProfile} = useUserProfile();
  const senderEmail = userProfile?.email;
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    applications: true,
    tenants: true,
    units: true,
    issues: true,
    billings: true
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const paginatedMembers = teamMembers.slice((page - 1) * pageSize, page * pageSize);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        console.log('Fetching team members...');
        const res = await axios.get('/api/team');
        console.log('Response received:', res);
  
        let teamMembersData = res.data;
  
        const ensureRes = await axios.post('/api/team/ensure', {
          name: userName,
          email: userEmail
        });
  
        if (ensureRes.status === 201) {
          const updatedRes = await axios.get('/api/team');
          teamMembersData = updatedRes.data;
        }
  
        const formattedMembers = teamMembersData.map(member => {
          const permissions = [];
  
          if (member.applications) permissions.push('Applications');
          if (member.tenants) permissions.push('Tenants');
          if (member.units) permissions.push('Units');
          if (member.issues) permissions.push('Issues');
          if (member.billings) permissions.push('Billings');
  
          return {
            ...member,
            displayPermissions: permissions.length === 5 ? 'All functions' :
                                permissions.length > 0 ? permissions.join(', ') :
                                'No app features.'
          };
        });
  
        setTeamMembers(formattedMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchTeamMembers();
  }, [page, userName, userEmail]);
  

  const handleAddMemberChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewMember((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveNewMember = async () => {
    try {
      if (editingMember) {
        const res = await axios.put(`/api/team/${editingMember.id}`, newMember, {
          headers: { 'user-email': senderEmail } // Use the logged-in user’s email
        });
        console.log('Updated member:', res.data);
  
        setTeamMembers(teamMembers.map(member =>
          member.id === editingMember.id ? res.data : member
        ));
      } else {
        console.log('Sending request to add new member:', newMember);
        const res = await axios.post('/api/team', newMember, {
          headers: { 'user-email': senderEmail } //  Use the logged-in user’s email
        });
        console.log('New member added successfully:', res.data);
        setTeamMembers([...teamMembers, res.data]);
      }
  
      setShowAddMemberPopup(false);
      setEditingMember(null);
      setNewMember({
        name: '',
        email: '',
        applications: false,
        tenants: false,
        units: false,
        issues: false,
        billings: false
      });

      alert("Please log-in again to see your changes");
    } catch (error) {
      console.error('Error saving/updating team member:', error.response ? error.response.data : error.message);
      alert(`Error: ${error.response ? error.response.data.error : 'Unknown error'}`);
    }
  };
  
  const handleEditMember = (member) => {
    setEditingMember(member);
    setNewMember({ ...member });
    setShowAddMemberPopup(true);
  };

  const handleDeleteMember = (id) => {
    console.log('Delete button clicked for ID:', id);  // ✅ Debugging log
    setMemberToDelete(id);
    setShowDeletePopup(true);
  };
  
  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      console.log('Confirming deletion for ID:', memberToDelete);  // ✅ Debugging log
      await axios.delete(`/api/team/${memberToDelete}`);
      setTeamMembers(teamMembers.filter((member) => member.id !== memberToDelete));
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
    setShowDeletePopup(false);
    setMemberToDelete(null);
  };
  

  return (
    <>
      {/* Add/Edit Member Popup */}
      {showAddMemberPopup && (
        <div className="team-settings-popup-container">
          <div className="team-settings-popup">
            <h3>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
  
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={newMember.name}
              onChange={handleAddMemberChange}
            />
  
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={newMember.email}
              onChange={handleAddMemberChange}
            />
  
            <h4>App Features</h4>
            {['applications', 'tenants', 'units', 'issues', 'billings'].map((feature) => (
              <label key={feature}>
                <input
                  type="checkbox"
                  name={feature}
                  checked={newMember[feature]}
                  onChange={handleAddMemberChange}
                />
                {feature.charAt(0).toUpperCase() + feature.slice(1)}
              </label>
            ))}
  
            <div className="team-settings-actions">
              <button onClick={() => setShowAddMemberPopup(false)} className="team-settings-small-btn">Cancel</button>
              <button onClick={saveNewMember} className="team-settings-small-btn">
                {editingMember ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <p>Are you sure you want to delete this team member?</p>
            <button onClick={confirmDeleteMember}>Yes, Delete</button>
            <button onClick={() => setShowDeletePopup(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main Team Settings Table */}
      <div className='overlay'>
        <div className="team-settings-container">
          <h3>Team Settings</h3>
    
          <button className="team-settings-add-btn" onClick={() => setShowAddMemberPopup(true)}>
            Add More
          </button>
    
          {loading ? (
            <p>Loading team members...</p>
          ) : (
            <>
              <table className="team-settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>App Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.displayPermissions}</td>
                      <td>
                        <button onClick={() => handleEditMember(member)}>Edit</button>
                        <button onClick={() => handleDeleteMember(member.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
    
              {/* Pagination Controls */}
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button disabled={page * pageSize >= teamMembers.length} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </>
          )}
    
          <button onClick={onClose} className="team-settings-small-btn">Back</button>
        </div>
      </div>
      
    </>
  );  
}

export default TeamSettings;
