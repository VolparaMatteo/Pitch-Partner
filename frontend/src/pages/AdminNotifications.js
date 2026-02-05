import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { adminNotificationAPI, notificationAPI } from '../services/api';
import {
  FaBell,
  FaFileContract,
  FaEuroSign,
  FaBuilding,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheck,
  FaCheckDouble,
  FaTrash,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaInbox,
  FaSyncAlt
} from 'react-icons/fa';
import '../styles/template-style.css';

const TIPO_CONFIG = {
  contratto_scadenza: { label: 'Contratto in scadenza', icon: FaFileContract, color: '#F59E0B', bg: '#FFFBEB' },
  fattura_scaduta: { label: 'Fattura scaduta', icon: FaEuroSign, color: '#DC2626', bg: '#FEF2F2' },
  nuovo_club: { label: 'Nuovo club', icon: FaBuilding, color: '#059669', bg: '#ECFDF5' },
  lead_followup: { label: 'Lead da ricontattare', icon: FaCalendarAlt, color: '#3B82F6', bg: '#EFF6FF' },
  licenza_scadenza: { label: 'Licenza in scadenza', icon: FaExclamationTriangle, color: '#DC2626', bg: '#FEF2F2' }
};

const PRIORITA_CONFIG = {
  normale: { label: 'Normale', color: '#6B7280', bg: '#F3F4F6' },
  alta: { label: 'Alta', color: '#F59E0B', bg: '#FFFBEB' },
  urgente: { label: 'Urgente', color: '#DC2626', bg: '#FEF2F2' }
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { token } = authData;

  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterPriorita, setFilterPriorita] = useState('all');
  const [filterLetta, setFilterLetta] = useState('all');
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
  const [prioritaDropdownOpen, setPrioritaDropdownOpen] = useState(false);
  const [lettaDropdownOpen, setLettaDropdownOpen] = useState(false);
  const tipoRef = useRef(null);
  const prioritaRef = useRef(null);
  const lettaRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    if (token) {
      generateAndFetch();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, filterTipo, filterPriorita, filterLetta, currentPage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tipoRef.current && !tipoRef.current.contains(e.target)) setTipoDropdownOpen(false);
      if (prioritaRef.current && !prioritaRef.current.contains(e.target)) setPrioritaDropdownOpen(false);
      if (lettaRef.current && !lettaRef.current.contains(e.target)) setLettaDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateAndFetch = async () => {
    try {
      setGenerating(true);
      await adminNotificationAPI.generate();
    } catch (err) {
      console.error('Errore generazione notifiche:', err);
    } finally {
      setGenerating(false);
    }
    fetchNotifications();
    fetchSummary();
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, per_page: perPage };
      if (filterTipo !== 'all') params.tipo = filterTipo;
      if (filterPriorita !== 'all') params.priorita = filterPriorita;
      if (filterLetta !== 'all') params.letta = filterLetta;

      const res = await adminNotificationAPI.getNotifications(params);
      setNotifications(res.data.notifications);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Errore caricamento notifiche:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await adminNotificationAPI.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Errore caricamento summary:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await adminNotificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, letta: true } : n));
      fetchSummary();
    } catch (err) {
      console.error('Errore:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminNotificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, letta: true })));
      fetchSummary();
    } catch (err) {
      console.error('Errore:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminNotificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
      fetchSummary();
    } catch (err) {
      console.error('Errore:', err);
    }
  };

  const handleDeleteRead = async () => {
    try {
      await notificationAPI.clearRead();
      fetchNotifications();
      fetchSummary();
    } catch (err) {
      console.error('Errore:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.letta) {
      handleMarkRead(notification.id);
    }
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const getTimeAgo = (notification) => {
    return notification.time_ago || '';
  };

  const renderDropdown = (ref, isOpen, setIsOpen, value, setValue, options, label) => (
    <div className="tp-filter-dropdown" ref={ref} style={{ position: 'relative' }}>
      <button
        className="tp-filter-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px',
          border: '1px solid #E5E7EB', background: value !== 'all' ? '#F0F9FF' : '#fff',
          fontSize: '13px', cursor: 'pointer', color: '#374151'
        }}
      >
        <FaFilter size={11} />
        {label}: {options.find(o => o.value === value)?.label || 'Tutti'}
        <FaChevronDown size={10} />
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: '#fff', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #E5E7EB', zIndex: 50, minWidth: '180px', overflow: 'hidden'
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setValue(opt.value); setIsOpen(false); setCurrentPage(1); }}
              style={{
                display: 'block', width: '100%', padding: '10px 16px',
                border: 'none', background: value === opt.value ? '#F0F9FF' : 'transparent',
                textAlign: 'left', cursor: 'pointer', fontSize: '13px',
                color: value === opt.value ? '#2563EB' : '#374151',
                fontWeight: value === opt.value ? 600 : 400
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const tipoOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'contratto_scadenza', label: 'Contratti' },
    { value: 'fattura_scaduta', label: 'Fatture' },
    { value: 'nuovo_club', label: 'Nuovi Club' },
    { value: 'lead_followup', label: 'Lead' },
    { value: 'licenza_scadenza', label: 'Licenze' }
  ];

  const prioritaOptions = [
    { value: 'all', label: 'Tutte' },
    { value: 'normale', label: 'Normale' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];

  const lettaOptions = [
    { value: 'all', label: 'Tutte' },
    { value: 'false', label: 'Non lette' },
    { value: 'true', label: 'Lette' }
  ];

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Centro Notifiche</h1>
          <p className="tp-page-subtitle">Monitora contratti, fatture, lead e licenze</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={generateAndFetch}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#374151', opacity: generating ? 0.6 : 1
            }}
          >
            <FaSyncAlt size={13} className={generating ? 'spin' : ''} />
            {generating ? 'Scansione...' : 'Aggiorna'}
          </button>
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#374151'
            }}
          >
            <FaCheckDouble size={13} />
            Segna tutte lette
          </button>
          <button
            onClick={handleDeleteRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px', borderRadius: '10px',
              border: '1px solid #DC2626', background: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              color: '#DC2626'
            }}
          >
            <FaTrash size={12} />
            Elimina lette
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {summary && (
        <div className="tp-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaBell style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{summary.non_lette}</div>
              <div className="tp-stat-label">Non lette</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaFileContract style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{(summary.per_tipo?.contratto_scadenza || 0) + (summary.per_tipo?.licenza_scadenza || 0)}</div>
              <div className="tp-stat-label">Contratti / Licenze</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaEuroSign style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{summary.per_tipo?.fattura_scaduta || 0}</div>
              <div className="tp-stat-label">Fatture scadute</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaCalendarAlt style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{summary.per_tipo?.lead_followup || 0}</div>
              <div className="tp-stat-label">Lead da ricontattare</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {renderDropdown(tipoRef, tipoDropdownOpen, setTipoDropdownOpen, filterTipo, setFilterTipo, tipoOptions, 'Tipo')}
        {renderDropdown(prioritaRef, prioritaDropdownOpen, setPrioritaDropdownOpen, filterPriorita, setFilterPriorita, prioritaOptions, 'Priorità')}
        {renderDropdown(lettaRef, lettaDropdownOpen, setLettaDropdownOpen, filterLetta, setFilterLetta, lettaOptions, 'Stato')}
        {(filterTipo !== 'all' || filterPriorita !== 'all' || filterLetta !== 'all') && (
          <button
            onClick={() => { setFilterTipo('all'); setFilterPriorita('all'); setFilterLetta('all'); setCurrentPage(1); }}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: '#FEF2F2', color: '#DC2626', fontSize: '13px',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Resetta filtri
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>
          {total} notifiche
        </span>
      </div>

      {/* Notification List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <FaSyncAlt size={24} className="spin" />
          <p style={{ marginTop: '12px' }}>Caricamento...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#FAFAFA', borderRadius: '12px', border: '1px solid #E5E7EB'
        }}>
          <FaInbox size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
          <h3 style={{ color: '#6B7280', fontWeight: 600, margin: '0 0 4px' }}>Nessuna notifica</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>Non ci sono notifiche con i filtri selezionati</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.map(notif => {
            const tipoConf = TIPO_CONFIG[notif.tipo] || { label: notif.tipo, icon: FaBell, color: '#6B7280', bg: '#F3F4F6' };
            const prioritaConf = PRIORITA_CONFIG[notif.priorita] || PRIORITA_CONFIG.normale;
            const IconComponent = tipoConf.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 18px', borderRadius: '10px',
                  border: `1px solid ${notif.letta ? '#E5E7EB' : tipoConf.color + '40'}`,
                  background: notif.letta ? '#FAFAFA' : '#fff',
                  cursor: notif.link_url ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  opacity: notif.letta ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!notif.letta) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: tipoConf.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <IconComponent size={18} style={{ color: tipoConf.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '14px', fontWeight: notif.letta ? 400 : 600,
                      color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {notif.titolo}
                    </span>
                    {notif.priorita !== 'normale' && (
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '20px', background: prioritaConf.bg,
                        color: prioritaConf.color, textTransform: 'uppercase',
                        letterSpacing: '0.5px', flexShrink: 0
                      }}>
                        {prioritaConf.label}
                      </span>
                    )}
                    {!notif.letta && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#3B82F6', flexShrink: 0
                      }} />
                    )}
                  </div>
                  <p style={{
                    fontSize: '13px', color: '#6B7280', margin: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {notif.messaggio}
                  </p>
                </div>

                {/* Time & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {getTimeAgo(notif)}
                  </span>
                  {!notif.letta && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                      title="Segna come letta"
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#6B7280'
                      }}
                    >
                      <FaCheck size={11} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                    title="Elimina"
                    style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      border: '1px solid #FEE2E2', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#DC2626'
                    }}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: '12px', marginTop: '24px'
        }}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid #E5E7EB', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentPage <= 1 ? 'default' : 'pointer',
              opacity: currentPage <= 1 ? 0.4 : 1, color: '#374151'
            }}
          >
            <FaChevronLeft size={12} />
          </button>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            Pagina {currentPage} di {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid #E5E7EB', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: currentPage >= totalPages ? 'default' : 'pointer',
              opacity: currentPage >= totalPages ? 0.4 : 1, color: '#374151'
            }}
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminNotifications;
