import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCog, FaBuilding, FaWrench } from 'react-icons/fa';
import { AiOutlineForm } from 'react-icons/ai';
import { FaUser, FaComments, FaClipboardList } from 'react-icons/fa';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

function Sidebar({ isCollapsed, role }) {
  const { user } = useAuth0();
  const [permissions, setPermissions] = useState({
    applications: false,
    tenants: false,
    units: false,
    issues: false,
    billings: false
  });

  useEffect(() => {
    if (!user?.email) return;
    
    console.log(`Fetching permissions for Sidebar - Email: ${user.email}`);
    
    axios.get(`/api/team/permissions?email=${encodeURIComponent(user.email)}`)
      .then(res => {
        console.log(`Sidebar received permissions:`, res.data);
        setPermissions(res.data);
      })
      .catch(err => {
        console.warn(`Failed to fetch permissions:`, err);
      });
  }, [user?.email]);

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
                <NavLink to="/tenant/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
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

              {permissions.applications && (
                <li>
                  <NavLink to="/applications" className={({ isActive }) => (isActive ? 'active' : '')}>
                    <AiOutlineForm className="sidebar-icon" />
                    {!isCollapsed && <span>Applications</span>}
                  </NavLink>
                </li>
              )}

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
                    {!isCollapsed && <span>Issues</span>}
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
