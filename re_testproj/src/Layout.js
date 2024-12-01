// Layout.js
import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css'; // CSS for layout styling
import { Outlet } from 'react-router-dom';

function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
      <div className="layout-body">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <main className={`main-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
