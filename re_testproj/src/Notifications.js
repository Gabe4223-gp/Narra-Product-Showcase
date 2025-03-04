import { useEffect, useRef } from "react";
import "./Notifications.css";

function Notifications({ onBack, notifications, markNotificationsAsRead }) {
  const dropdownRef = useRef(null);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Subtract 1 month

  const recentNotifications = (notifications || []).filter(notification => {
    if (!notification.created_at) return false; // Ignore if missing date
    return new Date(notification.created_at) >= oneMonthAgo;
  });


  useEffect(() => {
    if (recentNotifications.some(notification => !notification.is_read)) {
      markNotificationsAsRead();
    }
  }, [recentNotifications]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <h3>Notifications</h3>
      <ul className="notification-list">
        {recentNotifications.length === 0 ? (
          <li>No new notifications</li>
        ) : (
          // Sort notifications by most recent date first
          recentNotifications
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by date
            .map((notification, index) => (
              <li key={index} className="notification-item">
                <div className="notification-header">
                  <span className="notification-date">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
              </li>
            ))
        )}
      </ul>
      <button onClick={onBack} className="close-btn">Close</button>
    </div>

  );
}

export default Notifications;


