import React from 'react';
import { Link } from 'react-router-dom';

function BillingPage({ onLogout }) {
  return (
    <div className="billing-page">
      <h1>Billing</h1>
      <p>Billings will go here.</p>
      <Link to="/back"><p>back</p></Link>
    </div>
  );
}

export default BillingPage;