// src/BusinessSettings.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BusinessSettings({ onBack, userProfile, refreshUserProfile }) {
  // --- Section 1: Business Information (saved in businessDetails) ---
  const [businessInfo, setBusinessInfo] = useState({
    companyName: '',
    companyEmail: '',
    businessTaxId: '',
    businessRegistrationNumber: ''
  });

  // --- Section 2: Business Address (saved in businessAddressInfo) ---
  const [businessAddress, setBusinessAddress] = useState({
    companyAddress: '',
    city: '',
    country: '',
    zipCode: ''
  });

  // --- Section 3: Business Banking Details (saved in businessBankInfo) ---
  const [businessBankInfo, setBusinessBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    transitNumber: '',
    institutionNumber: '',
    swiftBicCode: '',
    currency: 'None'
  });

  // --- Populate form data from userProfile ---
  useEffect(() => {
    if (userProfile) {
      setBusinessInfo({
        companyName: userProfile.businessDetails?.companyName || '',
        companyEmail: userProfile.businessDetails?.companyEmail || '',
        businessTaxId: userProfile.businessDetails?.businessTaxId || '',
        businessRegistrationNumber: userProfile.businessDetails?.businessRegistrationNumber || ''
      });
      setBusinessAddress({
        companyAddress: userProfile.businessAddressInfo?.companyAddress || '',
        city: userProfile.businessAddressInfo?.city || '',
        country: userProfile.businessAddressInfo?.country || '',
        zipCode: userProfile.businessAddressInfo?.zipCode || ''
      });
      setBusinessBankInfo({
        bankName: userProfile.businessBankInfo?.bankName || '',
        accountNumber: userProfile.businessBankInfo?.accountNumber || '',
        routingNumber: userProfile.businessBankInfo?.routingNumber || '',
        transitNumber: userProfile.businessBankInfo?.transitNumber || '',
        institutionNumber: userProfile.businessBankInfo?.institutionNumber || '',
        swiftBicCode: userProfile.businessBankInfo?.swiftBicCode || '',
        currency: userProfile.businessBankInfo?.currency || 'None'
      });
    }
  }, [userProfile]);

  // --- Change Handlers ---
  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessAddressChange = (e) => {
    const { name, value } = e.target;
    setBusinessAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessBankInfoChange = (e) => {
    const { name, value } = e.target;
    setBusinessBankInfo(prev => ({ ...prev, [name]: value }));
  };

  // --- Save Handlers ---
  const saveBusinessInfo = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-details`,
        { businessDetails: businessInfo }
      );
      if (response.data.success) {
        alert('Business information saved successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to save business information.');
      }
    } catch (error) {
      console.error('Error saving business info:', error);
      alert('Error saving business information.');
    }
  };

  const saveBusinessAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-address`,
        { businessAddressInfo: businessAddress }
      );
      if (response.data.success) {
        alert('Business address saved successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to save business address.');
      }
    } catch (error) {
      console.error('Error saving business address:', error);
      alert('Error saving business address.');
    }
  };

  const saveBusinessBankInfo = async (e) => {
    e.preventDefault();

    // Example validations can be added here if needed
    if (!businessBankInfo.accountNumber) {
      return alert('Account number is required.');
    }
    if (!businessBankInfo.swiftBicCode || !/^[A-Za-z0-9]{8,11}$/.test(businessBankInfo.swiftBicCode)) {
      return alert('Please enter a valid SWIFT/BIC code (8-11 alphanumeric characters).');
    }
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-bank-info`,
        { businessBankInfo }
      );
      if (response.data.success) {
        alert('Business bank details saved successfully!');
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to save business bank details.');
      }
    } catch (error) {
      console.error('Error saving business bank info:', error);
      alert('Error saving business bank details.');
    }
  };

  // --- Delete Handlers ---
  const deleteBusinessInfo = async () => {
    if (!window.confirm('Are you sure you want to delete business information?')) return;
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-details`
      );
      if (response.data.success) {
        alert('Business information deleted successfully!');
        setBusinessInfo({
          companyName: '',
          companyEmail: '',
          businessTaxId: '',
          businessRegistrationNumber: ''
        });
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to delete business information.');
      }
    } catch (error) {
      console.error('Error deleting business info:', error);
      alert('Error deleting business information.');
    }
  };

  const deleteBusinessAddress = async () => {
    if (!window.confirm('Are you sure you want to delete business address?')) return;
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-address`
      );
      if (response.data.success) {
        alert('Business address deleted successfully!');
        setBusinessAddress({
          companyAddress: '',
          city: '',
          country: '',
          zipCode: ''
        });
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to delete business address.');
      }
    } catch (error) {
      console.error('Error deleting business address:', error);
      alert('Error deleting business address.');
    }
  };

  const deleteBusinessBankInfo = async () => {
    if (!window.confirm('Are you sure you want to delete business bank details?')) return;
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/user-profile/${userProfile.id}/business-bank-info`
      );
      if (response.data.success) {
        alert('Business bank details deleted successfully!');
        setBusinessBankInfo({
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          transitNumber: '',
          institutionNumber: '',
          swiftBicCode: '',
          currency: 'None'
        });
        refreshUserProfile();
      } else {
        alert(response.data.message || 'Failed to delete business bank details.');
      }
    } catch (error) {
      console.error('Error deleting business bank info:', error);
      alert('Error deleting business bank details.');
    }
  };

  // --- Render UI ---
  return (
    <div className="settings-container">
      <div className="settings-header">
        <h3>Business Settings</h3>
      </div>

      {/* Section 1: Business Information */}
      <h4>Business Information</h4>
      <form onSubmit={saveBusinessInfo}>
        <div className="fields">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={businessInfo.companyName}
            onChange={handleBusinessInfoChange}
            placeholder="ex. ABC Corp"
          />
        </div>
        <div className="fields">
          <label htmlFor="companyEmail">Company Email</label>
          <input
            type="email"
            id="companyEmail"
            name="companyEmail"
            value={businessInfo.companyEmail}
            onChange={handleBusinessInfoChange}
            placeholder="ex. contact@abccorp.com"
          />
        </div>
        <div className="fields">
          <label htmlFor="businessTaxId">Business Tax ID</label>
          <input
            type="text"
            id="businessTaxId"
            name="businessTaxId"
            value={businessInfo.businessTaxId}
            onChange={handleBusinessInfoChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="businessRegistrationNumber">Business Registration Number (if applicable)</label>
          <input
            type="text"
            id="businessRegistrationNumber"
            name="businessRegistrationNumber"
            value={businessInfo.businessRegistrationNumber}
            onChange={handleBusinessInfoChange}
          />
        </div>
        <button type="submit" className="edit-btn">Save Business Information</button>
      </form>
      <button type="button" className="link-btn danger" onClick={deleteBusinessInfo}>
        Delete Business Information
      </button>

      <hr />

      {/* Section 2: Business Address */}
      <h4>Business Address</h4>
      <form onSubmit={saveBusinessAddress}>
        <div className="fields">
          <label htmlFor="companyAddress">Company Address</label>
          <input
            type="text"
            id="companyAddress"
            name="companyAddress"
            value={businessAddress.companyAddress}
            onChange={handleBusinessAddressChange}
            placeholder="ex. 123 Business Rd"
          />
        </div>
        <div className="fields">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={businessAddress.city}
            onChange={handleBusinessAddressChange}
            placeholder="ex. Manila"
          />
        </div>
        <div className="fields">
          <label htmlFor="country">Country</label>
          <input
            type="text"
            id="country"
            name="country"
            value={businessAddress.country}
            onChange={handleBusinessAddressChange}
            placeholder="ex. PH"
          />
        </div>
        <div className="fields">
          <label htmlFor="zipCode">ZIP Code/Postcode</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={businessAddress.zipCode}
            onChange={handleBusinessAddressChange}
            placeholder="ex. 1111"
          />
        </div>
        <button type="submit" className="edit-btn">Save Business Address</button>
      </form>
      <button type="button" className="link-btn danger" onClick={deleteBusinessAddress}>
        Delete Business Address
      </button>

      <hr />

      {/* Section 3: Business Banking Details */}
      <h4>Business Banking Details</h4>
      <form onSubmit={saveBusinessBankInfo}>
        <div className="fields">
          <label htmlFor="bankName">Bank Name</label>
          <input
            type="text"
            id="bankName"
            name="bankName"
            value={businessBankInfo.bankName}
            onChange={handleBusinessBankInfoChange}
          />
        </div>
        <div className="fields">
          <label htmlFor="accountNumber">Account Number</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={businessBankInfo.accountNumber}
            onChange={handleBusinessBankInfoChange}
            placeholder="ex. 1234567890"
            required
          />
        </div>
        <div className="fields">
          <label htmlFor="routingNumber">Routing Number</label>
          <input
            type="text"
            id="routingNumber"
            name="routingNumber"
            value={businessBankInfo.routingNumber}
            onChange={handleBusinessBankInfoChange}
            placeholder="ex. 987654321"
          />
        </div>
        <div className="fields">
          <label htmlFor="transitNumber">Transit Number/Branch Code (Optional)</label>
          <input
            type="text"
            id="transitNumber"
            name="transitNumber"
            value={businessBankInfo.transitNumber}
            onChange={handleBusinessBankInfoChange}
            placeholder="ex. 00123"
          />
        </div>
        <div className="fields">
          <label htmlFor="institutionNumber">Institution Number (Optional)</label>
          <input
            type="text"
            id="institutionNumber"
            name="institutionNumber"
            value={businessBankInfo.institutionNumber}
            onChange={handleBusinessBankInfoChange}
            placeholder="ex. 123"
          />
        </div>
        <div className="fields">
          <label htmlFor="swiftBicCode">SWIFT/BIC Code</label>
          <input
            type="text"
            id="swiftBicCode"
            name="swiftBicCode"
            value={businessBankInfo.swiftBicCode}
            onChange={handleBusinessBankInfoChange}
            placeholder="ex. ABCDUS33"
            required
          />
        </div>
        <div className="fields">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            name="currency"
            value={businessBankInfo.currency}
            onChange={handleBusinessBankInfoChange}
          >
            <option value="None">None</option>
            <option value="US Dollar">US Dollar</option>
            <option value="Euro">Euro</option>
            <option value="Philippine Peso">Philippine Peso</option>
          </select>
        </div>
        <button type="submit" className="edit-btn">Save Business Bank Details</button>
      </form>
      <button type="button" className="link-btn danger" onClick={deleteBusinessBankInfo}>
        Delete Business Bank Details
      </button>
    </div>
  );
}

export default BusinessSettings;
