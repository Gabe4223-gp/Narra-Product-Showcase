// Sidebar.js
import React from 'react';
import './Sidebar.css'; // Import the CSS file for styling
import { NavLink } from 'react-router-dom';
import { AiOutlineForm } from 'react-icons/ai';
import {
  FaBars,
  FaHome,
  FaChartBar,
  FaCog,
  FaComments,
  FaClipboardList,
  FaUser,
  FaMoneyBill,
  FaBuilding,
  FaWrench
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
            <NavLink to="/tenants" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaUser className="sidebar-icon"/>
              {!isCollapsed && <span>Tenants</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/units" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaBuilding className="sidebar-icon"/>
              {!isCollapsed && <span>Units</span>}
            </NavLink>
          </li>
          <li>
            <NavLink to="/issues" className={({ isActive }) => isActive ? 'active' : ''}>
              <FaWrench className="sidebar-icon" />
              {!isCollapsed && <span>Issues</span>}
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
