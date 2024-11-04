import React from 'react';
import { Link } from 'react-router-dom';

function ApplicationsPage() {
  return (
    <div className="applications-page">
      <h1>Applications</h1>
      <p>Applications in this page.</p>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default ApplicationsPage;