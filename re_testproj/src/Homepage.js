import React, { useState } from 'react';
import Sidebar from './Sidebar';
import './Homepage.css';
import { Link } from 'react-router-dom';

function HomePage( { onLogout } ) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="home-page">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className={'content ${isCollapsed ? "collapsed" : ""}'}>
        <h1>Home Page</h1>
        <div className="search-bar">
          <input type="text" placeholder="Search" />
          <button>Search</button>
        </div>
        <h2>Home</h2>
        <p>Welcome to your property management dashboard.</p>
        <Link to="/billing"><h2>Billings</h2></Link>
        <p>View and manage your billing information.</p>
        <Link to="/applications"><h2>Applications</h2></Link>
        <p>Review and process tenant applications.</p>
        <Link to="/tenant"><h2>Tenant</h2></Link>
        <p>Manage your tenants and their lease agreements.</p>
        <Link to="/chat"><h2>Chat</h2></Link>
        <p>Communicate with tenants and property owners.</p>
      </div>
    </div>
  );
}

export default HomePage;