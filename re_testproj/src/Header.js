import React, { useState } from 'react';
import './Header.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FaBars } from 'react-icons/fa';


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

  const handleLogout = () => {
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
      <nav className="navbar">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
      <nav className="account">
        <ul>
          <li><b href="/faq">FAQ</b></li>
          <img src={logo2} alt="Settings" className="logo2" />
          <img src={logo3} alt="Messages" className="logo3" />
          <img src={logo4} alt="Notifications" className="logo4" />
          <img
            className="avatar"
            src={user.avatar}
            alt={'Photo of ' + user.name}
            style={{ width: user.imageSize, height: user.imageSize }}
          />
          <li>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
export default Header;