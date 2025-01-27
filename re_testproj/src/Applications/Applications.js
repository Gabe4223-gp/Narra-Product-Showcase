import React from 'react';
import './Applications.css';
import TenantApplications from './TenantApplications';
import Forms from './Forms';
import Docs from './Docs';
import EmailMessages from './EmailMessages';
import { Link } from 'react-router-dom';

function ApplicationsPage({ onLogout }) {
  return (
    <div className="applications-page">
      <div className="container">
        <div className="applications-header">
          <h2>Applications</h2>
        </div>
        <div className="applications-content">
          <div className="top-section">
            <TenantApplications /> {/* TenantApplications component */}
            <EmailMessages /> {/* EmailMessages component */}
          </div>
          <div className="bottom-section">
            <Forms /> {/* Forms component */}
            <Docs /> {/* Docs component */}
          </div>
        </div>
      </div>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
};

export default ApplicationsPage;