import React, { useState } from 'react';
import './Homepage.css';
import { Link } from 'react-router-dom';
import { FaChartBar, FaUsers, FaCog } from 'react-icons/fa';

function HomePage( { onLogout } ) {
  return (
    <div className="homepage">
      <h1>Dashboard</h1>
      <div className="info-boxes">
        <div className="info-box">
          <div className="info-box-header">
            <FaChartBar className="info-icon" /> Analytics
          </div>
          <div className="info-box-content">
            <p>View and manage your billing information.</p>
            {/* Add more content or charts as needed */}
          </div>
        </div>
        <div className="info-box">
          <div className="info-box-header">
            <FaUsers className="info-icon" /> Users
          </div>
          <div className="info-box-content">
            <p>Review and process tenant applications.</p>
            {/* Add user statistics or management tools */}
          </div>
        </div>
        <div className="info-box">
          <div className="info-box-header">
            <FaCog className="info-icon" /> Settings
          </div>
          <div className="info-box-content">
            <p>Manage your tenants and their lease agreements.</p>
            {/* Add settings options or links */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;