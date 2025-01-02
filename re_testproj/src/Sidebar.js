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
              <FaHome className="sidebar-icon" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/tenant" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaUser />
              {!isCollapsed && <span>Tenants</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/chat" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaComments className="sidebar-icon" />
              {!isCollapsed && <span>Chat</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaClipboardList className="sidebar-icon" />
              {!isCollapsed && <span>Billings</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaCog className="sidebar-icon" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
