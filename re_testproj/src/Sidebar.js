// Sidebar.js
import React from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCog, FaBuilding, FaWrench } from 'react-icons/fa';
import { AiOutlineForm } from 'react-icons/ai';
import { FaUser, FaClipboardList } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import { useTeamContext } from './TeamContext'; // new import

function Sidebar({ isCollapsed, role }) {
  const { user } = useAuth0();

  // Pull membership from TeamContext
  const { activeTeamMembership } = useTeamContext();

  // If no membership, default everything false
  const permissions = {
    applications: activeTeamMembership?.applications || false,
    tenants: activeTeamMembership?.tenants || false,
    units: activeTeamMembership?.units || false,
    issues: activeTeamMembership?.issues || false,
    billings: activeTeamMembership?.billings || false
  };

  // Render the sidebar based on role + membership
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul>
          {role === 'tenant' ? (
            <>
              <li>
                <NavLink to="/tenant/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaHome className="sidebar-icon" />
                  {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/tenant/tenant-settings" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaCog className="sidebar-icon" />
                  {!isCollapsed && <span>Settings</span>}
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/homepage" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <FaHome className="sidebar-icon" />
                  {!isCollapsed && <span>Dashboard</span>}
                </NavLink>
              </li>

              {permissions.tenants && (
                <li>
                  <NavLink to="/tenant" className={({ isActive }) => (isActive ? 'active' : '')}>
                    <FaUser className="sidebar-icon"/>
                    {!isCollapsed && <span>Tenants</span>}
                  </NavLink>
                </li>
              )}

              {permissions.units && (
                <li>
                  <NavLink to="/unit" className={({ isActive }) => (isActive ? 'active' : '')}>
                    <FaBuilding className="sidebar-icon"/>
                    {!isCollapsed && <span>Units</span>}
                  </NavLink>
                </li>
              )}

              {permissions.issues && (
                <li>
                  <NavLink to="/issues" className={({ isActive }) => (isActive ? 'active' : '')}>
                    <FaWrench className="sidebar-icon" />
                    {!isCollapsed && <span>Maintenance</span>}
                  </NavLink>
                </li>
              )}

              {permissions.billings && (
                <li>
                  <NavLink to="/billing" className={({ isActive }) => (isActive ? 'active' : '')}>
                    <FaClipboardList className="sidebar-icon" />
                    {!isCollapsed && <span>Billings</span>}
                  </NavLink>
                </li>
              )}

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
