import React from 'react';
import { Link } from 'react-router-dom';

function TenantsPage( { onLogout } ) {
  return (
    <div className="tenants-page">
      <h1>Tenant Info</h1>
      <p>Tenant information here.</p>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default TenantsPage;