import React from 'react';
import './Header.css';
import { Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const logo1 = require('./images/tenent.png');
const logo2 = require('./images/settings.png');
const logo3 = require('./images/message.png');
const logo4 = require('./images/notifs.png');
const user = {
    name: 'Gabe Payumo',
    avatar: require('./images/squidward.png'),
    imageSize: 50,
  };

function Header() {
  const { logout } = React.useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

    return (
      <div className="header">
        <img src={logo1} alt="Tenent Property Software" className="logo1" />
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
            <img src={logo2} alt="Tenent Property Software" className="logo2" />
            <img src={logo3} alt="Tenent Property Software" className="logo3" />
            <img src={logo4} alt="Tenent Property Software" className="logo4" />
            <img 
            className="avatar" 
            src={user.avatar}
            alt={'Photo of ' + user.name}
            style={{width: user.imageSize, height: user.imageSize}} />
            <li><button onClick={handleLogout}>Logout</button></li>
            {/*<Link to="/profile"><img 
            className="avatar" 
            src={user.avatar}
            alt={'Photo of ' + user.name}
            style={{width: user.imageSize, height: user.imageSize}} /></Link>*/}
           </ul>
        </nav>
      </div>
    );
  }
export default Header;