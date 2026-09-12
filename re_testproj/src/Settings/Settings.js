// src/Settings.js
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../UserProfileContext';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import TeamSettings from './TeamSettings';
import BusinessSettings from './BusinessSettings';
import './Settings.css';

function Settings() {
  const { logout } = useAuth0();
  const {
    userProfile,
    loadingProfile,
    error,
    refreshUserProfile,
    updateUserProfile,
  } = useUserProfile();

  // For the business settings popup
  const [showBusinessSettings, setShowBusinessSettings] = useState(false);

  // For the team settings popup
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

  // For the address details form
  const [addressDetails, setAddressDetails] = useState({
    country: "",
    city: "",
    streetAddress: "",
    zipCode: ""
  });  

  // Existing bank form data (for Bank Name, etc. – unchanged)
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    landlordBankId: ''
  });

  // For Bank details form
  const [userBankDetails, setUserBankDetails] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'Checking',  // Default selection; options: Checking, Savings, Other
    customAccountType: '',    // Only used when accountType is "Other"
    routingNumber: '',
    transitNumber: '',
    institutionNumber: '',
    swiftBicCode: '',         // Changed from swiftCode, now required
    wiseAccountId: '',        // Optional
  });  

  const [currency, setCurrency] = useState('None');

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
        // Deliberately blank. The stored column is not the sign-in credential,
        // so showing it would imply this field reflects the real password.
        password: '',
      });

      setAddressDetails({
        country: userProfile.personalAddressInfo?.country || '',
        city: userProfile.personalAddressInfo?.city || '',
        streetAddress: userProfile.personalAddressInfo?.streetAddress || '',
        zipCode: userProfile.personalAddressInfo?.zipCode || ''
      });

      setBankFormData({
        // The column is bankName; userProfile.bank is undefined, which is why
        // the field came up empty when editing.
        bankName: userProfile.bankName || '',
        landlordBankId: userProfile.landlordBankId || ''
      });

      setCurrency(userProfile.landlordBankDetails?.currency || 'None');

      // Populate the bank details form
      if (userProfile.landlordBankDetails) {
        setUserBankDetails({
          accountNumber: userProfile.landlordBankDetails.accountNumber || '',
          accountName: userProfile.landlordBankDetails.accountName || '',
          accountType: userProfile.landlordBankDetails.accountType || 'Checking',
          customAccountType: userProfile.landlordBankDetails.customAccountType || '',
          routingNumber: userProfile.landlordBankDetails.routingNumber || '',
          transitNumber: userProfile.landlordBankDetails.transitNumber || '',
          institutionNumber: userProfile.landlordBankDetails.institutionNumber || '',
          swiftBicCode: userProfile.landlordBankDetails.swiftBicCode || '',
          wiseAccountId: userProfile.landlordBankDetails.wiseAccountId || '',
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

  const handleAddressDetailsChange = (e) => {
    const { name, value } = e.target;
    setAddressDetails((prev) => ({
      ...prev,
      [name]: value,
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

  const toggleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  const handleChangePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Profile details. The password is deliberately not sent here: it is a
      // plain column in our database and changing it never affected signing in.
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/user-profile/${formData.id}`, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
      });

      let notice = res.data.message || 'Settings updated successfully.';

      // A new password goes to Auth0, which is what actually authenticates.
      if (formData.password) {
        try {
          const pw = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/user-profile/${formData.id}/password`,
            { newPassword: formData.password }
          );
          notice = pw.data.message || 'Settings and password updated.';
          setFormData((prev) => ({ ...prev, password: '' }));
        } catch (pwErr) {
          notice = pwErr?.response?.data?.message || 'Your details were saved, but the password could not be changed.';
        }
      }

      setMessage(notice);
      updateUserProfile({
        id: formData.id,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        dateofBirth: formData.dateofBirth,
        email: formData.email,
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while saving settings.');
    }
  };

  const saveAddressDetails = async () => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/address-details`, {
        personalAddressInfo: addressDetails,
      });
      if (response.data.success) {
        alert('Address details saved successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to save address details.');
      }
    } catch (error) {
      console.error("Error saving address details:", error);
      alert("Error saving address details.");
    }
  };  

  const saveBankDetails = async () => {
    if (!userProfile?.id) {
      alert('User profile is not loaded yet.');
      return;
    }
  
    if (!bankFormData.bankName) {
      alert('Please enter a bank name.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/user-profile/register-bank`, {
        userId: userProfile.id,
        bankName: bankFormData.bankName
      });
      if (response.data.success) {
        alert('Bank details registered successfully!');
        await refreshUserProfile(); // Ensure update before re-render
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
  
    // Basic Validation
    if (!/^\d{6,20}$/.test(userBankDetails.accountNumber)) {
      return alert('Please enter a valid account number (6-20 digits).');
    }
    if (!userBankDetails.accountName) {
      return alert('Please enter an account name.');
    }
    if (userBankDetails.accountType === 'Other' && !userBankDetails.customAccountType) {
      return alert('Please specify your account type.');
    }
    if (userBankDetails.routingNumber && !/^\d{5,12}$/.test(userBankDetails.routingNumber)) {
      return alert('Please enter a valid routing number (5-12 digits), or leave blank if not applicable.');
    }
    // SWIFT/BIC Code is now required and must be 8-11 alphanumeric characters
    if (!userBankDetails.swiftBicCode || !/^[A-Za-z0-9]{8,11}$/.test(userBankDetails.swiftBicCode)) {
      return alert('Please enter a valid SWIFT/BIC code (8-11 letters/numbers).');
    }
  
    try {
      if (!userProfile?.id) {
        return alert('No user ID found. Please log in again.');
      }
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/landlord-bank-details`,
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

  const saveCurrency = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/landlord-bank-details/currency`,
        { currency }
      );
      if (response.data.success) {
        alert('Currency updated successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to update currency.');
      }
    } catch (error) {
      console.error("Error updating currency:", error);
      alert("Error updating currency.");
    }
  };

  const deleteAddressDetails = async () => {
    if (!window.confirm("Are you sure you want to delete your address details?")) return;
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/address-details`);
      if (response.data.success) {
        alert("Address details deleted successfully!");
        setAddressDetails({
          country: "",
          city: "",
          streetAddress: "",
          zipCode: ""
        });
        refreshUserProfile();
      } else {
        alert(response.data.message || "Failed to delete address details.");
      }
    } catch (error) {
      console.error("Error deleting address details:", error);
      alert("Error deleting address details.");
    }
  };
  

  // Delete bank info
  const deleteBankInfo = async () => {
    if (!window.confirm('Are you sure you want to delete your bank info?')) return;
  
    try {
      // This route will clear userProfile.bank and userProfile.landlordBankId
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/delete-bank-info`
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
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/landlord-bank-details`
      );
      if (response.data.success) {
        alert('User bank details deleted successfully!');
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
      const { data } = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${formData.id}`
      );
      setShowDeleteConfirmation(false);

      // Clear everything cached about the old account. userRole must be set
      // to the string "null" rather than removed: AppContent checks
      // `role === "null"`, so a missing key read back as a real null, failed
      // that check, and dropped the next sign-in straight onto the dashboard.
      localStorage.setItem('userRole', 'null');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('selectedPropertyID');
      localStorage.removeItem('selectedPropertyIDIssue');

      if (data?.auth0?.status && data.auth0.status !== 'deleted') {
        // Surfaced in the console for debugging; the user does not need to act
        // on it, and their data is deleted either way.
        console.warn('Auth0 account removal:', data.auth0);
      }

      // logout() rather than a redirect: the Auth0 session outlives the
      // profile, so navigating away would put the user straight back into the
      // app with a deleted account. The previous code sent them to /login,
      // which is not a route in this app either.
      logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(
        error?.response?.data?.message ||
          'We could not delete your account. Please try again.'
      );
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
      <div className="settings-header">
        <h3>Account Settings</h3>
        <div className="toggle-settings">
          {showBusinessSettings ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowBusinessSettings(false)}
            >
              Back to Account Settings
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowBusinessSettings(true)}
            >
              Setup Business Settings Here
            </button>
          )}
        </div>
      </div>
      
      {showBusinessSettings ? (
        <div className="business-settings-container">
          {/* Render BusinessSettings component */}
          <BusinessSettings onBack={() => setShowBusinessSettings(false)} userProfile={userProfile} refreshUserProfile={refreshUserProfile} />
        </div>
      ) : (
      <>
      
      {/* Personal Details Section */}
      <h4>Personal Details</h4>
      <form onSubmit={handleSubmit}>
        <div className="fields">
          <label htmlFor="name">Full Name</label>
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

      <h4>Address Details</h4>
      <form onSubmit={(e) => { e.preventDefault(); saveAddressDetails(); }}>
        <div className="fields">
          <label htmlFor="country">Country</label>
          <input
            type="text"
            id="country"
            name="country"
            value={addressDetails.country}
            onChange={handleAddressDetailsChange}
            placeholder="e.g. PH"
          />
        </div>
        <div className="fields">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={addressDetails.city}
            onChange={handleAddressDetailsChange}
            placeholder="e.g. Pasig"
          />
        </div>
        <div className="fields">
          <label htmlFor="streetAddress">Address (Street, Apt/Unit)</label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={addressDetails.streetAddress}
            onChange={handleAddressDetailsChange}
            placeholder="e.g. 123 Main St, Apt 4B"
          />
        </div>
        <div className="fields">
          <label htmlFor="zipCode">Zip Code/Postcode</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={addressDetails.zipCode}
            onChange={handleAddressDetailsChange}
            placeholder="e.g. 1234"
          />
        </div>
        <button type="submit" className="edit-btn">Save Address Details</button>
      </form>
      <button
        type="button"
        className="link-btn danger"
        onClick={deleteAddressDetails}
      >
        Delete Address Details
      </button>

      {/* Bank Information */}
      <h4>Bank Information</h4>
      <label>Bank Name:</label>
      <input type="text" name="bankName" value={bankFormData.bankName} onChange={handleBankChange} />

      <p><strong>Bank Registered:</strong> {bankFormData.landlordBankId ? '✔️ Registered' : '❌ Not Registered'}</p>
      <p><strong>Current Bank:</strong> {userProfile.bankName ? userProfile.bankName : "None"}</p>

      {/* Popup Buttons */}    
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
          <label htmlFor="accountName">Account Name</label>
          <input
            id="accountName"
            name="accountName"
            type="text"
            placeholder="ex. My Checking Account"
            value={userBankDetails.accountName}
            onChange={handleUserBankDetailsChange}
            required
          />
        </div>

        <div className="fields">
          <label htmlFor="accountType">Account Type</label>
          <select
            id="accountType"
            name="accountType"
            value={userBankDetails.accountType}
            onChange={handleUserBankDetailsChange}
          >
            <option value="Checking">Checking</option>
            <option value="Savings">Savings</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {userBankDetails.accountType === 'Other' && (
          <div className="fields">
            <label htmlFor="customAccountType">Specify Account Type</label>
            <input
              id="customAccountType"
              name="customAccountType"
              type="text"
              placeholder="ex. Business"
              value={userBankDetails.customAccountType}
              onChange={handleUserBankDetailsChange}
            />
          </div>
        )}

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
          <label htmlFor="transitNumber">Transit Number (Optional)</label>
          <input
            id="transitNumber"
            name="transitNumber"
            type="text"
            placeholder="ex. 00123"
            value={userBankDetails.transitNumber}
            onChange={handleUserBankDetailsChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="institutionNumber">Institution Number (Optional)</label>
          <input
            id="institutionNumber"
            name="institutionNumber"
            type="text"
            placeholder="ex. 123"
            value={userBankDetails.institutionNumber}
            onChange={handleUserBankDetailsChange}
          />
        </div>

        <div className="fields">
          <label htmlFor="swiftBicCode">SWIFT/BIC Code</label>
          <input
            id="swiftBicCode"
            name="swiftBicCode"
            type="text"
            placeholder="ex. ABCDUS33"
            value={userBankDetails.swiftBicCode}
            onChange={handleUserBankDetailsChange}
            required
          />
        </div>

        <div className="fields">
          <label htmlFor="wiseAccountId">Wise Account ID (Optional)</label>
          <input
            id="wiseAccountId"
            name="wiseAccountId"
            type="text"
            value={userBankDetails.wiseAccountId}
            onChange={handleUserBankDetailsChange}
          />
        </div>

        <button type="submit" className="edit-btn">Save User Bank Details</button>
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
      <button onClick={() => setShowTeamSettings(true)} className="team-setting-btn">
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
        Currency Set: {currency}
      </p>
      <select value={currency} onChange={toggleCurrencyChange}>
        <option value="None">None</option>
        <option value="US Dollar">US Dollar</option>
        <option value="Euro">Euro</option>
        <option value="Philippine Peso">Philippine Peso</option>
      </select>
      <button type="button" className="link-btn" onClick={saveCurrency}>
        Save Currency
      </button>

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

      </>
      )}
    </div>
  );
}

export default Settings;
