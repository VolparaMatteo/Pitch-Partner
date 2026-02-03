import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const onlyUnread = filter === 'unread';
      const res = await notificationAPI.getNotifications(onlyUnread);
      let notifs = res.data.notifications || [];

      // Apply client-side filter for 'read' filter
      if (filter === 'read') {
        notifs = notifs.filter(n => n.letta);
      }

      setNotifications(notifs);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Errore marcatura notifica:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Errore marcatura notifiche:', error);
      alert('Errore durante la marcatura delle notifiche');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa notifica?')) return;

    try {
      await notificationAPI.deleteNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Eliminare tutte le notifiche lette?')) return;

    try {
      await notificationAPI.clearRead();
      fetchNotifications();
    } catch (error) {
      console.error('Errore pulizia notifiche:', error);
      alert('Errore durante la pulizia');
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.letta) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type and reference
    if (notification.riferimento_tipo === 'contract' && notification.riferimento_id) {
      navigate(`/${user.role}/contracts/${notification.riferimento_id}`);
    } else if (notification.riferimento_tipo === 'sponsor' && notification.riferimento_id) {
      navigate(`/club/sponsors/${notification.riferimento_id}`);
    } else if (notification.riferimento_tipo === 'message') {
      navigate('/messages');
    } else if (notification.riferimento_tipo === 'match' && notification.riferimento_id) {
      navigate(`/matches/${notification.riferimento_id}`);
    } else if (notification.riferimento_tipo === 'event' && notification.riferimento_id) {
      navigate(`/events/${notification.riferimento_id}`);
    }
  };

  const getNotificationIcon = (tipo) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      message: '💬',
      contract: '📄',
      payment: '💰',
      event: '📅'
    };
    return icons[tipo] || 'ℹ️';
  };

  const getNotificationColor = (tipo) => {
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FFA500',
      error: '#F44336',
      message: '#9C27B0',
      contract: '#607D8B',
      payment: '#4CAF50',
      event: '#FF9800'
    };
    return colors[tipo] || '#999';
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  const unreadCount = notifications.filter(n => !n.letta).length;

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🔔 Notifiche</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn-secondary"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              ✓ Segna tutte come lette
            </button>
            <button className="btn-outline" onClick={handleClearRead}>
              🗑️ Elimina lette
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutte ({notifications.length})
          </button>
          <button
            className={`tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Non Lette ({unreadCount})
          </button>
          <button
            className={`tab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Lette ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {notifications.length === 0 && (
            <div className="empty-state">
              <p>Nessuna notifica</p>
            </div>
          )}

          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.letta ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
              style={{
                background: notification.letta ? 'white' : '#F9FFF0',
                border: `1px solid ${notification.letta ? '#E0E0E0' : '#85FF00'}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  flexShrink: 0
                }}
              >
                {getNotificationIcon(notification.tipo)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                      {notification.titolo}
                    </strong>
                    <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                      {notification.messaggio}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    {!notification.letta && (
                      <button
                        className="btn-icon success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        title="Segna come letta"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="btn-icon error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#999'
                    }}
                  >
                    🕒 {new Date(notification.created_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  {notification.riferimento_tipo && (
                    <span
                      style={{
                        fontSize: '11px',
                        background: getNotificationColor(notification.tipo),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {notification.riferimento_tipo}
                    </span>
                  )}

                  {notification.priorita === 'alta' && (
                    <span
                      style={{
                        fontSize: '11px',
                        background: '#F44336',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}
                    >
                      ⚠️ Alta Priorità
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Notifications;
