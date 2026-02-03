import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI, messageAPI } from '../services/api';
import { getAuth, clearAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import logo from '../static/logo/logo_nobg2.png';
import '../styles/navbar.css';

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadMessagesCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
    }, 30000); // Aggiorna ogni 30 secondi
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    try {
      // Solo per club e sponsor
      if (user.role === 'club' || user.role === 'sponsor') {
        const response = await messageAPI.getUnreadCount();
        setUnreadMessagesCount(response.data.unread_count);
      }
    } catch (error) {
      console.error('Errore nel caricamento contatore messaggi:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications(false, 10);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.letta) {
      await notificationAPI.markAsRead(notification.id);
      fetchUnreadCount();
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setShowNotifications(false);
  };

  const handleBellClick = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'club') return '/club/dashboard';
    if (user.role === 'sponsor') return '/sponsor/dashboard';
    return '/';
  };

  const getMenuItems = () => {
    if (user.role === 'club') {
      return [
        { label: 'Dashboard', path: '/club/dashboard', icon: '🏠' },
        { label: 'Pitchy', path: '/pitchy', icon: '🤖' },
        { label: 'Community', path: '/club/press-area', icon: '📣' },
        { label: 'Marketplace', path: '/club/marketplace', icon: '🛒' },
        { label: 'Profilo', path: '/club/profile', icon: '👤' },
        { label: 'Messanger', path: '/messages', icon: '💬' },
        { label: 'Sponsor', path: '/club/sponsors', icon: '🤝' },
        { label: 'Partite', path: '/matches', icon: '🏟️' },
        { label: 'Business Box', path: '/club/business-boxes', icon: '🎟️' },
        { label: 'Eventi', path: '/events', icon: '📅' },
        { label: 'Risorse', path: '/resources', icon: '📚' },
        { label: 'Formazione', path: '/best-practice-events', icon: '🎓' },
      ];
    } else if (user.role === 'sponsor') {
      return [
        { label: 'Dashboard', path: '/sponsor/dashboard', icon: '🏠' },
        { label: 'Pitchy', path: '/pitchy', icon: '🤖' },
        { label: 'Contratti', path: '/sponsor/contracts', icon: '📄' },
        { label: 'Progetti', path: '/sponsor/projects', icon: '📊' },
        { label: 'Eventi', path: '/events', icon: '📅' },
        { label: 'Marketplace', path: '/sponsor/marketplace', icon: '🛒' },
        { label: 'Networking', path: '/sponsor-network', icon: '🤝' },
        { label: 'Risorse', path: '/resources', icon: '📚' },
        { label: 'Messanger', path: '/messages', icon: '💬' },
      ];
    } else if (user.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
        { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
        { label: 'Club', path: '/admin/clubs', icon: '⚽' },
        { label: 'Pagamenti', path: '/admin/payments', icon: '💳' },
        { label: 'Marketplace', path: '/admin/marketplace', icon: '🛒' },
        { label: 'Eventi BP', path: '/admin/best-practice-events', icon: '🎓' },
        { label: 'Risorse', path: '/admin/resources', icon: '📚' },
      ];
    }
    return [];
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <img
            src={logo}
            alt="Pitch Partner"
            className="navbar-logo"
            onClick={() => navigate(getDashboardLink())}
          />
        </div>

        <div className="navbar-center">
          {user.role === 'club' && user.logo_url ? (
            <img
              src={getImageUrl(user.logo_url)}
              alt={user.nome}
              style={{
                maxHeight: '60px',
                maxWidth: '120px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))'
              }}
            />
          ) : (
            <div className="club-info">
              <div className="club-details">
                <span className="club-name-navbar">
                  {user.role === 'admin' && user.username}
                  {user.role === 'club' && user.nome}
                  {user.role === 'sponsor' && user.ragione_sociale}
                </span>
                <span className="club-role">{user.role}</span>
              </div>
            </div>
          )}
        </div>

        <div className="navbar-right">

          {/* Messages Icon - Solo per club e sponsor */}
          {(user.role === 'club' || user.role === 'sponsor') && (
            <div className="notification-container">
              <button
                className="notification-bell"
                onClick={() => navigate('/messages')}
                title="Messaggi"
              >
                💬
                {unreadMessagesCount > 0 && (
                  <span className="notification-badge">{unreadMessagesCount}</span>
                )}
              </button>
            </div>
          )}

          <div className="notification-container">
            <button className="notification-bell" onClick={handleBellClick}>
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifiche</h3>
                  {notifications.length > 0 && (
                    <button
                      className="mark-all-read"
                      onClick={async () => {
                        await notificationAPI.markAllAsRead();
                        fetchNotifications();
                      }}
                    >
                      Segna tutte come lette
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">Nessuna notifica</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`notification-item ${!notif.letta ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="notification-title">{notif.titolo}</div>
                        <div className="notification-message">{notif.messaggio}</div>
                        <div className="notification-time">
                          {new Date(notif.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notification-footer">
                  <button onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}>
                    Vedi tutte
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu Button */}
          <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>
            Menu
          </button>

          <button className="btn-logout" onClick={handleLogout}>
            Esci
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="navbar-menu">
          <div className="menu-overlay" onClick={() => setShowMenu(false)}></div>
          <div className="menu-content">
            <div className="menu-header">
              <h3>Navigazione</h3>
              <button className="menu-close" onClick={() => setShowMenu(false)}>✕</button>
            </div>
            <div className="menu-items">
              {getMenuItems().map((item, idx) => (
                <div
                  key={idx}
                  className="menu-item"
                  onClick={() => {
                    navigate(item.path);
                    setShowMenu(false);
                  }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
