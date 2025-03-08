// src/TenantSettings.js
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../UserProfileContext';
import axios from 'axios';
import TeamSettings from './TeamSettings';
import './Settings.css';

function TenantSettings() {
  const {
    userProfile,
    loadingProfile,
    error,
    refreshUserProfile,
    updateUserProfile,
  } = useUserProfile();

  const [showTeamSettings, setShowTeamSettings] = useState(false);

  // Locally store the form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phoneNumber: '',
    dateofBirth: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  // For the delete confirmation popup
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Existing bank form data (for Bank Name, etc. – unchanged)
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    landlordBankId: ''
  });

  // For Bank details form
  const [userBankDetails, setUserBankDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
  });

  // When userProfile changes, populate formData
  useEffect(() => {
    if (!userProfile) {
      refreshUserProfile();
    }
    if (userProfile) {
      setFormData({
        id: userProfile.id || '',
        name: userProfile.name || '',
        phoneNumber: userProfile.phoneNumber || '',
        dateofBirth: userProfile.dateofBirth
          ? userProfile.dateofBirth.split('T')[0]
          : '',
        email: userProfile.email || '',
        password: userProfile.password || '',
      });

      setBankFormData({
        bankName: userProfile.bank || '',
        landlordBankId: userProfile.landlordBankId || ''
      });

      // Populate the bank details form
      if (userProfile.landlordBankDetails) {
        setUserBankDetails({
          accountNumber: userProfile.landlordBankDetails.accountNumber || '',
          routingNumber: userProfile.landlordBankDetails.routingNumber || '',
          swiftCode: userProfile.landlordBankDetails.swiftCode || '',
        });
      }
    }
  }, [userProfile, refreshUserProfile]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBankChange = (e) => {
    setBankFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 3) Handler for changes in the bank details form
  const handleUserBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/user-profile/${formData.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
        password: formData.password,
      });
      setMessage(res.data.message || 'Settings updated successfully.');
      updateUserProfile({
        id: formData.id,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while saving settings.');
    }
  };

  const saveBankDetails = async () => {
    try {
      const response = await axios.post('/api/user-profile/register-bank', {
        userId: userProfile.id,
        bankName: bankFormData.bankName
      });
      if (response.data.success) {
        alert('Bank details registered successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to register bank.');
      }
    } catch (error) {
      console.error('Error registering bank details:', error);
      alert('Error registering bank.');
    }
  };

  // Save/Update userBankDetails in DB (landlordBankDetails column)
  const saveUserBankDetails = async (e) => {
    e.preventDefault();
  
    // -- Basic Validation --
    if (!/^\d{6,20}$/.test(userBankDetails.accountNumber)) {
      return alert('Please enter a valid account number (6-20 digits).');
    }
  
    // For routing number: typically 9 digits for US banks, but may differ internationally
    if (userBankDetails.routingNumber && !/^\d{5,12}$/.test(userBankDetails.routingNumber)) {
      return alert('Please enter a valid routing number (5-12 digits), or leave blank if not applicable.');
    }
  
    // Swift code: typically 8-11 alphanumeric characters.
    if (
      userBankDetails.swiftCode &&
      !/^[A-Za-z0-9]{8,11}$/.test(userBankDetails.swiftCode)
    ) {
      return alert('Please enter a valid SWIFT code (8-11 letters/numbers) or leave blank.');
    }
    
    try {
      if (!userProfile?.id) {
        return alert('No user ID found. Please log in again.');
      }
  
      const response = await axios.post(
        `/api/user-profile/${userProfile.id}/landlord-bank-details`,
        { landlordBankDetails: userBankDetails }
      );
  
      if (response.data.success) {
        alert('User bank details saved successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to save user bank details.');
      }
    } catch (error) {
      console.error('Error saving user bank details:', error);
      alert('An error occurred while saving user bank details.');
    }
  };

  // Delete bank info
  const deleteBankInfo = async () => {
    if (!window.confirm('Are you sure you want to delete your bank info?')) return;
  
    try {
      // This route will clear userProfile.bank and userProfile.landlordBankId
      const response = await axios.delete(
        `/api/user-profile/${userProfile.id}/delete-bank-info`
      );
  
      if (response.data.success) {
        alert('Bank info deleted successfully.');
        refreshUserProfile();  // to re-fetch updated userProfile
      } else {
        alert(response.data.message || 'Failed to delete bank info.');
      }
    } catch (error) {
      console.error('Error deleting bank info:', error);
      alert('An error occurred while deleting bank info.');
    }
  };

  // Delete userBankDetails
  const deleteUserBankDetails = async () => {
    if (!window.confirm('Are you sure you want to delete these bank details?')) return;
    try {
      const response = await axios.delete(
        `/api/user-profile/${userProfile.id}/landlord-bank-details`
      );
      if (response.data.success) {
        alert('User bank details deleted successfully.');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to delete user bank details.');
      }
    } catch (error) {
      console.error('Error deleting user bank details:', error);
      alert('An error occurred while deleting user bank details.');
    }
  };

  // Handle Delete Account (front-end only for now)
  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await axios.delete(`/api/user-profile/${formData.id}`);
      setShowDeleteConfirmation(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (loadingProfile) {
    return <div>Loading your profile...</div>;
  }
  if (error) {
    return <div>Error loading profile: {error}</div>;
  }

  return (
    <div className="settings-container">
      <div className='settings-header'>
        <h3>Account Settings</h3>
      </div>
      
      
      {/* Personal Details Section */}
      <h4>Personal Details</h4>
      <form onSubmit={handleSubmit}>
        <div className="fields">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="text"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="+63 ### ### ####"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="dateofBirth">Date of Birth</label>
          <input
            type="date"
            id="dateofBirth"
            name="dateofBirth"
            value={formData.dateofBirth}
            onChange={handleChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="password">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={!showPassword}
          />
          <button
            type="button"
            className="link-btn"
            onClick={handleChangePassword}
          >
            {showPassword ? 'Hide Password' : 'Change Password'}
          </button>
        </div>

        <button type="submit" className="edit-btn">Save Changes</button>
      </form>

      {/* Bank Information */}
      <h4>Bank Information</h4>
      <label>Bank Name:</label>
      <input type="text" name="bankName" value={bankFormData.bankName} onChange={handleBankChange} />

      <p><strong>Bank Registered:</strong> {bankFormData.landlordBankId ? '✔️ Registered' : '❌ Not Registered'}</p>
      <p><strong>Current Bank:</strong> {userProfile.bankName ? userProfile.bankName : "None"}</p>

      <div className="popup-actions">
        <button
          className="link-btn danger"
          style={{ marginLeft: '1rem' }}
          onClick={deleteBankInfo}
        >
          Delete Bank Info
        </button>
        <button onClick={saveBankDetails}>Save</button>
      </div>

      {/* Bank Details Form */}
      <hr />
      <h4>User Bank Details</h4>
      <form onSubmit={saveUserBankDetails}>
        <div className="fields">
          <label htmlFor="accountNumber">Account Number</label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            placeholder="ex. 1234567890"
            value={userBankDetails.accountNumber}
            onChange={handleUserBankDetailsChange}
            required
          />
        </div>

        <div className="fields">
          <label htmlFor="routingNumber">Routing Number</label>
          <input
            id="routingNumber"
            name="routingNumber"
            type="text"
            placeholder="ex. 987654321"
            value={userBankDetails.routingNumber}
            onChange={handleUserBankDetailsChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="swiftCode">SWIFT Code (optional)</label>
          <input
            id="swiftCode"
            name="swiftCode"
            type="text"
            placeholder="ex. ABC123XYZ"
            value={userBankDetails.swiftCode}
            onChange={handleUserBankDetailsChange}
          />
        </div>

        <button type="submit" className="edit-btn">
          Save User Bank Details
        </button>
      </form>

      <button
        type="button"
        onClick={deleteUserBankDetails}
        className="link-btn danger"
        style={{ marginTop: '1rem' }}
      >
        Delete User Bank Details
      </button>
      
      {/* ====================== Team Settings, Language & Currency, etc. ====================== */}
      <h4>Team Settings</h4>
      <button onClick={() => setShowTeamSettings(true)} className="link-btn">
        View Team
      </button>
      {showTeamSettings && (
        <TeamSettings 
          onClose={() => setShowTeamSettings(false)} 
          userName={userProfile.name} 
          userEmail={userProfile.email}
        />
      )}

      <h4>Language and Currency</h4>
      <p>
        Default Language: English{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => alert('Change Language feature not yet available')}
        >
          Change Language
        </button>
      </p>
      <p>
        Default Currency: Philippine Peso{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => alert('Change Currency feature not yet available')}
        >
          Change Currency
        </button>
      </p>

      {/* ====================== Help Section ====================== */}
      <h4>Help</h4>
      <h5>Contact Support</h5>
      <p>Company Email: admin@narra-ph.com</p>

      {/* ====================== Delete Account ====================== */}
      <button
        type="button"
        className="link-btn danger"
        onClick={handleDeleteAccount}
      >
        Delete Account
      </button>
      {showDeleteConfirmation && (
        <div className='overlay'>
          <div className="modal">
            <p>
              Are you sure you want to delete your account?
              <br />
              You will be returned to the login page upon deleting.
            </p>
            <div style={{ marginTop: '10px' }}>
              <button onClick={confirmDeleteAccount} style={{ marginRight: '10px' }}>
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirmation(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {message && <p>{message}</p>}
    </div>
  );
}

export default TenantSettings;