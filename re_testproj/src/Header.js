import { useState, useRef, useEffect } from "react";
import './Header.css';
import { useAuth0 } from '@auth0/auth0-react';
import { FaBars, FaBell } from 'react-icons/fa';
import { useUserProfile } from "./UserProfileContext";
import Notifications from "./Notifications";


const logo1 = require('./images/tenent.png');
const logo2 = require('./images/settings.png');
const logo3 = require('./images/message.png');
const logo4 = require('./images/notifs.png');
const user = {
    name: 'Gabe Payumo',
    avatar: require('./images/squidward.png'),
    imageSize: 50,
  };

function Header({ toggleSidebar }) {
  const { logout } = useAuth0();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile, refreshUserProfile } = useUserProfile();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout({
      returnTo: window.location.origin,
    });
  };

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    toggleSidebar();
  };

   // Flag to check if the profile is fetched already
  const [profileFetched, setProfileFetched] = useState(false);

  // Fetch user profile only once on mount
  useEffect(() => {
    if (!profileFetched) {
      const fetchProfile = async () => {
        await refreshUserProfile();
        setProfileFetched(true);  // Set flag to prevent rerunning the fetch logic
      };

      fetchProfile();
    }
  }, [profileFetched, refreshUserProfile]);  // Trigger only once on mount

  // Automatically fetch notifications when userProfile changes
  useEffect(() => {
    if (userProfile?.id) {
      const fetchNotifications = async () => {
        try {
          const response = await fetch(`/api/notifications/${userProfile.id}`);
          if (response.ok) {
            const data = await response.json();
            setNotifications(data);
            const unread = data.filter((notification) => !notification.is_read).length;
            setUnreadCount(unread);
          } else {
            console.error("Failed to fetch notifications");
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
    }
  }, [userProfile?.id]);  

  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/${userProfile.id}/mark-read`, {
        method: "POST",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0); // Remove the unread badge
      } else {
        console.error("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <div className="header">
      <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"></link>
      <div className={`left-section ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-button" onClick={handleToggle}>
          <FaBars />
        </button>
        {!isCollapsed && <h3 className="narra-logo">narra</h3>}
      </div>
      <div className="right-section">
        <nav className="navbar">
          <ul>
            <li>
              <a>Welcome {userProfile?.name}!</a>
            </li>
          </ul>
        </nav>
        <nav className="account">
          <ul style={{ display: "flex", alignItems: "center", gap: "15px", padding: 0, margin: 0 }}>
            <li
              className="bell-icon"
              style={{ position: "relative", display: "flex", alignItems: "center" }}
              onClick={() => setShowNotifications(true)}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "18px",
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </li>
            <li>
              <button onClick={handleLogout} className="btn-logout">
                Back to Login
              </button>
            </li>
          </ul>
        </nav>
      </div>
      {showNotifications && (
        <div className="notification-dropdown" ref={dropdownRef}>
          <Notifications
            onBack={() => setShowNotifications(false)}
            notifications={notifications}
            markNotificationsAsRead={markNotificationsAsRead}
          />
        </div>
      )}
    </div>
  );
}

export default Header;
