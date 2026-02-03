/**
 * NotificationsCenter - Centro Notifiche
 * Pagina per visualizzare e gestire le notifiche
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/notifications.css';
import '../styles/template-style.css';

import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineChatBubbleLeft,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineXMark
} from 'react-icons/hi2';

function NotificationsCenter() {
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
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const onlyUnread = filter === 'unread';
      const res = await notificationAPI.getNotifications(onlyUnread);
      let notifs = res.data.notifications || [];

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

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
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
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Eliminare questa notifica?')) return;

    try {
      await notificationAPI.deleteNotification(id);
      fetchNotifications();
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Eliminare tutte le notifiche lette?')) return;

    try {
      await notificationAPI.clearRead();
      fetchNotifications();
    } catch (error) {
      console.error('Errore pulizia notifiche:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.letta) {
      handleMarkAsRead(notification.id);
    }

    if (notification.link) {
      const path = notification.link.replace('/api', '').replace(/^\//, '');
      navigate(`/${path}`);
    } else if (notification.riferimento_tipo === 'contract' && notification.riferimento_id) {
      navigate(`/${user.role}/contracts/${notification.riferimento_id}`);
    } else if (notification.riferimento_tipo === 'sponsor' && notification.riferimento_id) {
      navigate(`/club/sponsors/${notification.riferimento_id}`);
    } else if (notification.riferimento_tipo === 'message') {
      navigate('/messages');
    }
  };

  const getNotificationIcon = (tipo) => {
    const icons = {
      info: HiOutlineInformationCircle,
      success: HiOutlineCheckCircle,
      warning: HiOutlineExclamationTriangle,
      error: HiOutlineXMark,
      message: HiOutlineChatBubbleLeft,
      contract: HiOutlineDocumentText,
      payment: HiOutlineCurrencyDollar,
      event: HiOutlineCalendar,
      project_update: HiOutlineDocumentText,
      task_assegnato: HiOutlineCheckCircle,
      task_completato: HiOutlineCheckCircle,
      scadenza_imminente: HiOutlineClock
    };
    const Icon = icons[tipo] || HiOutlineBell;
    return Icon;
  };

  const getIconColor = (tipo) => {
    const colors = {
      info: '#3B82F6',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      message: '#8B5CF6',
      contract: '#6B7280',
      payment: '#22C55E',
      event: '#F59E0B'
    };
    return colors[tipo] || '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const unreadCount = notifications.filter(n => !n.letta).length;
  const readCount = notifications.filter(n => n.letta).length;
  const todayCount = notifications.filter(n => {
    const today = new Date();
    const notifDate = new Date(n.created_at);
    return notifDate.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="notifications-page">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner"></div>
          <p>Caricamento notifiche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div>
          <h1>Notifiche</h1>
          <p>Centro notifiche e avvisi</p>
        </div>
        <div className="notifications-header-actions">
          <button
            className="btn-secondary"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <HiOutlineCheck size={18} />
            Segna tutte come lette
          </button>
          <button
            className="btn-outline-danger"
            onClick={handleClearRead}
            disabled={readCount === 0}
          >
            <HiOutlineTrash size={18} />
            Elimina lette
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tutte ({notifications.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          <HiOutlineEnvelope size={16} />
          Non lette ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          <HiOutlineEnvelopeOpen size={16} />
          Lette ({readCount})
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="notifications-empty-icon">
            <HiOutlineBell size={48} />
          </div>
          <h3>Nessuna notifica</h3>
          <p>Non hai notifiche da visualizzare al momento</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => {
            const IconComponent = getNotificationIcon(notification.tipo);
            const iconColor = getIconColor(notification.tipo);

            return (
              <div
                key={notification.id}
                className={`notification-item ${!notification.letta ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon */}
                <div
                  className="notification-icon"
                  style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                >
                  <IconComponent size={22} />
                </div>

                {/* Content */}
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.titolo}</h4>
                    {!notification.letta && (
                      <span className="notification-badge">Nuova</span>
                    )}
                  </div>
                  <p className="notification-message">{notification.messaggio}</p>
                  <div className="notification-meta">
                    <span className="notification-time">
                      <HiOutlineClock size={14} />
                      {formatDate(notification.created_at)}
                    </span>
                    {notification.riferimento_tipo && (
                      <span className="notification-type">
                        {notification.riferimento_tipo}
                      </span>
                    )}
                    {notification.priorita === 'alta' && (
                      <span className="notification-priority high">
                        <HiOutlineExclamationTriangle size={12} />
                        Alta priorità
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                  {!notification.letta && (
                    <button
                      className="btn-icon success"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Segna come letta"
                    >
                      <HiOutlineCheck size={16} />
                    </button>
                  )}
                  <button
                    className="btn-icon danger"
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Elimina"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsCenter;
