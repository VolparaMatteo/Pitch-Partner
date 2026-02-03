import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import DefaultAvatar from '../static/logo/FavIcon.png';
import {
  FaSearch, FaList, FaTh, FaEye, FaPen, FaTrashAlt,
  FaPlus, FaUsers, FaUserShield, FaUserCheck,
  FaCheck, FaTimes, FaChevronDown, FaLayerGroup, FaEnvelope, FaClock
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState('list');

  // Custom dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'Tutti gli status', icon: FaLayerGroup, color: '#6B7280' },
    { value: 'active', label: 'Attivi', icon: FaCheck, color: '#10B981' },
    { value: 'inactive', label: 'Disattivati', icon: FaTimes, color: '#EF4444' }
  ];

  const roleOptions = [
    { value: 'all', label: 'Tutti i ruoli', icon: FaUsers, color: '#6B7280' },
    { value: 'amministratore', label: 'Amministratori', icon: FaUserShield, color: '#85FF00' },
    { value: 'manager', label: 'Manager', icon: FaUserCheck, color: '#3B82F6' },
    { value: 'operatore', label: 'Operatori', icon: FaUsers, color: '#9CA3AF' }
  ];

  const sortOptions = [
    { value: 'name_asc', label: 'Nome A-Z', icon: FaUsers, color: '#6B7280' },
    { value: 'name_desc', label: 'Nome Z-A', icon: FaUsers, color: '#6B7280' },
    { value: 'recent', label: 'Più recenti', icon: FaClock, color: '#3B82F6' },
    { value: 'last_login', label: 'Ultimo accesso', icon: FaClock, color: '#10B981' }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  // Click outside handler for custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchUsers();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/club/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data.user);
    } catch (error) {
      console.error('Errore caricamento utente corrente:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Mai effettuato';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const applyFilters = (usersList) => {
    return usersList.filter(userItem => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          userItem.nome?.toLowerCase().includes(searchLower) ||
          userItem.cognome?.toLowerCase().includes(searchLower) ||
          userItem.email?.toLowerCase().includes(searchLower) ||
          `${userItem.nome} ${userItem.cognome}`.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !userItem.is_active) return false;
        if (filterStatus === 'inactive' && userItem.is_active) return false;
      }

      if (filterRole !== 'all') {
        if (userItem.ruolo !== filterRole) return false;
      }

      return true;
    });
  };

  const applySorting = (usersList) => {
    const sorted = [...usersList];

    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`));
      case 'name_desc':
        return sorted.sort((a, b) => `${b.nome} ${b.cognome}`.localeCompare(`${a.nome} ${a.cognome}`));
      case 'recent':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'last_login':
        return sorted.sort((a, b) => {
          if (!a.last_login) return 1;
          if (!b.last_login) return -1;
          return new Date(b.last_login) - new Date(a.last_login);
        });
      default:
        return sorted;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterRole !== 'all') count++;
    return count;
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterRole('all');
    setSearchTerm('');
  };

  const filteredUsers = applySorting(applyFilters(users));
  const activeFiltersCount = getActiveFiltersCount();

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.ruolo === 'amministratore').length;

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header">
        <div className="tp-header-content">
          <h1 className="tp-page-title">Gestione Utenti</h1>
          <p className="tp-page-subtitle">
            Gestisci gli utenti del tuo club e i loro permessi
          </p>
        </div>
        <div className="tp-page-actions">
          {/* Future: Add user button
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/club/users/new')}
          >
            <FaPlus /> Nuovo Utente
          </button>
          */}
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaUsers style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{totalUsers}</div>
            <div className="tp-stat-label">Utenti Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheck style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{activeUsers}</div>
            <div className="tp-stat-label">Utenti Attivi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaUserShield style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{adminUsers}</div>
            <div className="tp-stat-label">Amministratori</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca utente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Status Filter - Custom Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setRoleDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: filterStatus !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterStatus !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(statusOptions, filterStatus);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {statusOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setFilterStatus(option.value); setStatusDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: filterStatus === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = filterStatus === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Role Filter - Custom Dropdown */}
            <div ref={roleDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setStatusDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: filterRole !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterRole !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(roleOptions, filterRole);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: roleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {roleDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {roleOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setFilterRole(option.value); setRoleDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: filterRole === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = filterRole === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right">
            {/* Sort Dropdown */}
            <div ref={sortDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setStatusDropdownOpen(false);
                  setRoleDropdownOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', border: '2px solid #E5E7EB', borderRadius: '8px',
                  background: 'white', cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(sortOptions, sortBy);
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={12} color="white" />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown size={12} color="#6B7280"
                        style={{ transform: sortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      />
                    </>
                  );
                })()}
              </button>
              {sortDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '180px', overflow: 'hidden'
                }}>
                  {sortOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        onClick={() => { setSortBy(option.value); setSortDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          background: sortBy === option.value ? '#F3F4F6' : 'white',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.target.style.background = sortBy === option.value ? '#F3F4F6' : 'white'}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Icon size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="tp-view-toggle">
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <FaList />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Griglia"
              >
                <FaTh />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters Badge */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredUsers.length} utenti trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* Users Grid/List */}
          {filteredUsers.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaUsers /></div>
              <h3 className="tp-empty-title">Nessun utente trovato</h3>
              <p className="tp-empty-description">
                {activeFiltersCount > 0 || searchTerm
                  ? 'Prova a modificare i filtri o i termini di ricerca'
                  : 'Non ci sono ancora utenti registrati'}
              </p>
              {(activeFiltersCount > 0 || searchTerm) && (
                <button className="tp-btn tp-btn-outline" onClick={clearFilters}>
                  Rimuovi filtri
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="tp-grid">
              {filteredUsers.map((userItem) => (
                <div key={userItem.id} className="tp-sponsor-card">
                  {/* Header */}
                  <div className="tp-sponsor-header">
                    <div className="tp-sponsor-logo">
                      {userItem.avatar_url ? (
                        <img
                          src={userItem.avatar_url.startsWith('http') ? userItem.avatar_url : `${API_URL.replace('/api', '')}${userItem.avatar_url}`}
                          alt={`${userItem.nome} ${userItem.cognome}`}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#1A1A1A'
                        }}>
                          {userItem.nome?.charAt(0).toUpperCase()}{userItem.cognome?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className={`tp-badge ${userItem.is_active ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                      {userItem.is_active ? 'Attivo' : 'Disattivato'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="tp-sponsor-content">
                    <div className="tp-sponsor-sector" style={{ textTransform: 'capitalize' }}>
                      {userItem.ruolo}
                      {currentUser?.id === userItem.id && (
                        <span style={{ marginLeft: '8px', color: '#85FF00', fontWeight: 700 }}>(Tu)</span>
                      )}
                    </div>
                    <h3 className="tp-sponsor-name">{userItem.nome} {userItem.cognome}</h3>
                    <div className="tp-sponsor-tags">
                      <span className="tp-sponsor-tag">
                        <FaEnvelope style={{ marginRight: '4px' }} />
                        {userItem.email}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="tp-sponsor-footer">
                    <div className="tp-sponsor-contact">
                      <span className="tp-sponsor-contact-item" style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        <FaClock style={{ marginRight: '4px' }} />
                        {userItem.last_login ? `Ultimo accesso: ${formatDate(userItem.last_login)}` : 'Mai effettuato accesso'}
                      </span>
                    </div>
                    <div className="tp-sponsor-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="tp-btn-icon tp-btn-icon-view"
                        title="Visualizza"
                      >
                        <FaEye />
                      </button>
                      {/* Future: Edit and Delete buttons
                      <button
                        className="tp-btn-icon tp-btn-icon-edit"
                        title="Modifica"
                      >
                        <FaPen />
                      </button>
                      */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW (Table) */
            <div className="tp-table-container">
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Utente</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Stato</th>
                    <th>Ultimo Accesso</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem.id} style={{
                      cursor: 'pointer',
                      background: currentUser?.id === userItem.id ? 'rgba(133, 255, 0, 0.05)' : 'transparent'
                    }}>
                      <td>
                        <div className="tp-table-user">
                          <div className="tp-table-avatar">
                            {userItem.avatar_url ? (
                              <img
                                src={userItem.avatar_url.startsWith('http') ? userItem.avatar_url : `${API_URL.replace('/api', '')}${userItem.avatar_url}`}
                                alt={`${userItem.nome} ${userItem.cognome}`}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #85FF00 0%, #70E000 100%)',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#1A1A1A',
                                borderRadius: '8px'
                              }}>
                                {userItem.nome?.charAt(0).toUpperCase()}{userItem.cognome?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="tp-table-user-info">
                            <span className="tp-table-name">
                              {userItem.nome} {userItem.cognome}
                              {currentUser?.id === userItem.id && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#85FF00', fontWeight: 700 }}>(Tu)</span>
                              )}
                            </span>
                            <span className="tp-table-sector">Creato il {formatDate(userItem.created_at)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '14px', color: '#1f2937' }}>{userItem.email}</span>
                      </td>
                      <td>
                        <span className={`tp-badge ${
                          userItem.ruolo === 'amministratore' ? 'tp-badge-success' :
                          userItem.ruolo === 'manager' ? 'tp-badge-info' : 'tp-badge-neutral'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {userItem.ruolo}
                        </span>
                      </td>
                      <td>
                        <span className={`tp-badge ${userItem.is_active ? 'tp-badge-success' : 'tp-badge-neutral'}`}>
                          {userItem.is_active ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#6B7280' }}>
                          {formatDateTime(userItem.last_login)}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="tp-table-actions">
                          <button
                            className="tp-btn-icon tp-btn-icon-view"
                            title="Visualizza"
                          >
                            <FaEye />
                          </button>
                          {/* Future: Edit and Delete buttons
                          <button
                            className="tp-btn-icon tp-btn-icon-edit"
                            title="Modifica"
                          >
                            <FaPen />
                          </button>
                          <button
                            className="tp-btn-icon tp-btn-icon-delete"
                            title="Elimina"
                          >
                            <FaTrashAlt />
                          </button>
                          */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="tp-card" style={{ marginTop: '24px', background: '#EFF6FF', border: '1px solid #3B82F6' }}>
        <div className="tp-card-body" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FaUsers size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#1E40AF', margin: 0, fontWeight: 600, marginBottom: '4px' }}>
                Sistema Multi-Utente
              </p>
              <p style={{ fontSize: '13px', color: '#3B82F6', margin: 0, lineHeight: 1.6 }}>
                Ogni club può avere più utenti con ruoli diversi. Gli amministratori hanno accesso completo a tutte le funzionalità.
                La gestione degli utenti aggiuntivi sarà disponibile prossimamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubUsers;
