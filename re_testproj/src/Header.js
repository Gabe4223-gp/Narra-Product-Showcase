import React, { useState } from 'react';
import './Header.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FaBars } from 'react-icons/fa';
import { useUserProfile } from "./UserProfileContext";


const logo1 = require('./images/tenent.png');
const logo2 = require('./images/settings.png');
const logo3 = require('./images/message.png');
const logo4 = require('./images/notifs.png');
const user = {
    name: 'Gabe Payumo',
    avatar: require('./images/squidward.png'),
    imageSize: 50,
  };

function Header({toggleSidebar, isSidebarCollapsed}) {
  const { logout } = useAuth0();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {userProfile} = useUserProfile();

  const handleLogout = () => {
    // Clear stored role
    localStorage.removeItem("userRole");
  
    // Proceed with Auth0 logout
    logout({
      returnTo: window.location.origin,
    });
  };
  

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed); // Toggle the collapsed state
    toggleSidebar(); // Call the sidebar toggle function if needed
  };

  return (
    <div className="header">
      <link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet'></link>
      <div className={`left-section ${isCollapsed ? 'collapsed' : ''}`}>
        <button className="toggle-button" onClick={handleToggle}>
          <FaBars />
        </button>
        {!isCollapsed && (
          <h3 className='narra-logo'>narra</h3>
        )}
      </div>
      <div className="right-section">
        <nav className="navbar">
          <ul>
            <li><a>Welcome {userProfile?.name}!</a></li>
          </ul>
        </nav>
        <nav className="account">
          <ul>
            <li>
              <button onClick={handleLogout} className="btn-logout">
                Back to Login
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
    </div>
  );
}
export default Header;