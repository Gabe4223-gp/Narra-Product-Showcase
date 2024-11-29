// Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; // Import the CSS file for styling
import {
  FaBars,
  FaHome,
  FaChartBar,
  FaCog,
  FaComments,
  FaClipboardList,
} from 'react-icons/fa'; // Import icons from react-icons

function Sidebar({ isCollapsed, toggleSidebar }) {
  const location = useLocation();

  // Define the navigation items
  const menuItems = [
    {
      path: '/homepage',
      name: 'Dashboard',
      icon: <FaHome />,
    },
    {
      path: '/chat',
      name: 'Chat',
      icon: <FaComments />,
    },
    {
      path: '/billing',
      name: 'Billings',
      icon: <FaClipboardList />,
    },
    {
      path: '/settings',
      name: 'Settings',
      icon: <FaCog />,
    },
    // Add more items as needed
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="top-section">
        <h1 className="logo">{!isCollapsed && 'Tenent'}</h1>
        <div className="toggle-menu" onClick={toggleSidebar}>
          <FaBars />
        </div>
      </div>
      <div className="menu-items">
        {menuItems.map((item, index) => (
          <Link
            to={item.path}
            key={index}
            className={`menu-item ${
              location.pathname === item.path ? 'active' : ''
            }`}
          >
            <div className="icon">{item.icon}</div>
            {!isCollapsed && <div className="text">{item.name}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
