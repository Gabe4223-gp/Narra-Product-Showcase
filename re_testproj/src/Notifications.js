import { useEffect, useMemo, useRef } from "react";
import "./Notifications.css";

function Notifications({ onBack, notifications, markNotificationsAsRead }) {
  const dropdownRef = useRef(null);

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Subtract 1 month

  // Memoised and sorted once. Previously this array was rebuilt on every
  // render and used as an effect dependency, so the effect re-ran constantly
  // and re-issued markNotificationsAsRead on each pass.
  const recentNotifications = useMemo(() => {
    const cutoff = oneMonthAgo.getTime();
    return (notifications || [])
      .filter((n) => n.created_at && new Date(n.created_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const unreadCount = recentNotifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (unreadCount > 0) {
      markNotificationsAsRead();
    }
    // Keyed on the count, a primitive, rather than on a fresh array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <div className="dropdown-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && <span className="unread-pill">{unreadCount} new</span>}
      </div>

      {recentNotifications.length === 0 ? (
        <p className="notification-empty">You have no notifications from the past month.</p>
      ) : (
        <ul className="notification-list">
          {recentNotifications.map((notification, index) => (
            <li
              key={notification.id || index}
              className={`notification-item${notification.is_read ? '' : ' is-unread'}`}
            >
              <p className="notification-message">{notification.message}</p>
              <span className="notification-date">
                {new Date(notification.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button onClick={onBack} className="close-btn">Close</button>
    </div>

  );
}

export default Notifications;


