// Sidebar.js
import React from 'react';
import './Sidebar.css'; // Import the CSS file for styling
import { NavLink } from 'react-router-dom';
import {
  FaBars,
  FaHome,
  FaChartBar,
  FaCog,
  FaComments,
  FaClipboardList,
  FaUser,
  FaMoneyBill
} from 'react-icons/fa'; // Import icons from react-icons

function Sidebar({ isCollapsed }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/homepage" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaHome />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaComments />
              {!isCollapsed && <span>Chat</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaClipboardList />
              {!isCollapsed && <span>Billings</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaCog />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
