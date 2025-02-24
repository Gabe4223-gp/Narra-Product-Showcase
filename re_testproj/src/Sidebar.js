// src/Sidebar.js
import React from 'react';
import './Sidebar.css'; // Your existing sidebar CSS
import { NavLink } from 'react-router-dom';
import { FaHome, FaCog, FaBuilding, FaWrench } from 'react-icons/fa';
// (Other icons are imported for the landlord view only)
import { AiOutlineForm } from 'react-icons/ai';
import { FaUser, FaComments, FaClipboardList } from 'react-icons/fa';

function Sidebar({ isCollapsed, role }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul>
          {role === 'tenant' ? (
            <>
              <li>
                <NavLink
                  to="/tenant/dashboard"
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <FaHome className="sidebar-icon" />
                  {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/tenant/settings"
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <FaCog className="sidebar-icon" />
                  {!isCollapsed && <span>Settings</span>}
                </NavLink>
              </li>
            </>
          ) : (
            // Landlord view links (as you already have them)
            <>
              <li>
                <NavLink to="/homepage" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaHome className="sidebar-icon" />
                  {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/applications" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <AiOutlineForm className="sidebar-icon" />
                  {!isCollapsed && <span>Applications</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/tenant" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaUser className="sidebar-icon"/>
                  {!isCollapsed && <span>Tenants</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/unit" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaBuilding className="sidebar-icon"/>
                  {!isCollapsed && <span>Units</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/issues" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaWrench className="sidebar-icon" />
                  {!isCollapsed && <span>Issues</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/billing" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaClipboardList className="sidebar-icon" />
                  {!isCollapsed && <span>Billings</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaCog className="sidebar-icon" />
                  {!isCollapsed && <span>Settings</span>}
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
