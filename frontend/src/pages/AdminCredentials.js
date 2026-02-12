import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { adminCredentialAPI } from '../services/api';
import Toast from '../components/Toast';
import {
  FaSearch, FaPlus, FaEye, FaEyeSlash, FaCopy, FaEdit,
  FaTrashAlt, FaInbox, FaExternalLinkAlt, FaKey,
  FaChevronDown, FaCheck, FaFilter
} from 'react-icons/fa';
import {
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import '../styles/template-style.css';

const CATEGORIE = [
  { id: 'all', label: 'Tutte', icon: FaFilter, color: '#6B7280' },
  { id: 'email', label: 'Email', icon: FaKey, color: '#7c3aed' },
  { id: 'api', label: 'API', icon: FaKey, color: '#d97706' },
  { id: 'cloud', label: 'Cloud', icon: FaKey, color: '#2563eb' },
  { id: 'social', label: 'Social', icon: FaKey, color: '#db2777' },
  { id: 'database', label: 'Database', icon: FaKey, color: '#059669' },
  { id: 'hosting', label: 'Hosting', icon: FaKey, color: '#ea580c' },
  { id: 'altro', label: 'Altro', icon: FaKey, color: '#64748b' },
];

const CATEGORIA_COLORS = {
  email: { bg: '#EDE9FE', color: '#7C3AED' },
  api: { bg: '#FEF3C7', color: '#D97706' },
  cloud: { bg: '#DBEAFE', color: '#2563EB' },
  social: { bg: '#FCE7F3', color: '#DB2777' },
  database: { bg: '#D1FAE5', color: '#059669' },
  hosting: { bg: '#FFEDD5', color: '#EA580C' },
  altro: { bg: '#F1F5F9', color: '#64748B' },
};

function AdminCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ categoria: 'all' });
  const [toast, setToast] = useState(null);

  // Dropdown state
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Password reveal
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const revealTimers = useRef({});

  const [form, setForm] = useState({
    nome_servizio: '', categoria: 'altro', username: '', password: '', url: '', note: ''
  });

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchCredentials();
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup reveal timers
  useEffect(() => {
    const timers = revealTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await adminCredentialAPI.getAll();
      setCredentials(res.data.credentials || []);
    } catch (err) {
      console.error('Errore caricamento credenziali:', err);
      setToast({ message: 'Errore nel caricamento delle credenziali', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCredentials = () => {
    return credentials.filter(cred => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!cred.nome_servizio?.toLowerCase().includes(s) &&
            !cred.username?.toLowerCase().includes(s) &&
            !cred.url?.toLowerCase().includes(s) &&
            !cred.note?.toLowerCase().includes(s)) return false;
      }
      if (filters.categoria !== 'all' && (cred.categoria || 'altro') !== filters.categoria) return false;
      return true;
    });
  };

  const clearFilters = () => {
    setFilters({ categoria: 'all' });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categoria !== 'all') count++;
    return count;
  };

  const openCreateModal = () => {
    setEditingCredential(null);
    setForm({ nome_servizio: '', categoria: 'altro', username: '', password: '', url: '', note: '' });
    setShowFormPassword(false);
    setShowModal(true);
  };

  const openEditModal = (cred) => {
    setEditingCredential(cred);
    setForm({
      nome_servizio: cred.nome_servizio,
      categoria: cred.categoria || 'altro',
      username: cred.username || '',
      password: '',
      url: cred.url || '',
      note: cred.note || '',
    });
    setShowFormPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome_servizio.trim()) return;
    setSaving(true);
    try {
      if (editingCredential) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await adminCredentialAPI.update(editingCredential.id, payload);
        setToast({ message: 'Credenziale aggiornata', type: 'success' });
      } else {
        await adminCredentialAPI.create(form);
        setToast({ message: 'Credenziale creata', type: 'success' });
      }
      setShowModal(false);
      fetchCredentials();
    } catch (err) {
      console.error('Errore salvataggio:', err);
      setToast({ message: 'Errore nel salvataggio', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (cred) => {
    setDeleteTarget(cred);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCredentialAPI.delete(deleteTarget.id);
      fetchCredentials();
      setToast({ message: 'Credenziale eliminata', type: 'success' });
    } catch (err) {
      setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleReveal = async (credId) => {
    if (revealedPasswords[credId]) {
      setRevealedPasswords(prev => { const next = { ...prev }; delete next[credId]; return next; });
      if (revealTimers.current[credId]) { clearTimeout(revealTimers.current[credId]); delete revealTimers.current[credId]; }
      return;
    }
    try {
      const res = await adminCredentialAPI.revealPassword(credId);
      setRevealedPasswords(prev => ({ ...prev, [credId]: res.data.password }));
      revealTimers.current[credId] = setTimeout(() => {
        setRevealedPasswords(prev => { const next = { ...prev }; delete next[credId]; return next; });
        delete revealTimers.current[credId];
      }, 10000);
    } catch (err) {
      console.error('Errore reveal password:', err);
    }
  };

  const handleCopy = async (credId) => {
    let password = revealedPasswords[credId];
    if (!password) {
      try {
        const res = await adminCredentialAPI.revealPassword(credId);
        password = res.data.password;
      } catch (err) { return; }
    }
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopiedId(credId);
      setToast({ message: 'Password copiata', type: 'success' });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredCredentials = getFilteredCredentials();
  const activeFiltersCount = getActiveFiltersCount();

  const getSelectedCategory = () => CATEGORIE.find(c => c.id === filters.categoria) || CATEGORIE[0];

  const getCatColors = (cat) => CATEGORIA_COLORS[cat] || CATEGORIA_COLORS.altro;

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento Credenziali...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Credenziali</h1>
        <div className="tp-page-actions">
          <button className="tp-btn tp-btn-primary" onClick={openCreateModal}>
            <FaPlus /> Nuova Credenziale
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca credenziali..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Category Dropdown */}
            <div ref={catDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  border: filters.categoria !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.categoria !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedCategory();
                  const Icon = selected.icon;
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px'
                      }}>
                        <Icon size={12} />
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12} color="#6B7280"
                        style={{ transition: 'transform 0.2s', transform: catDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                      />
                    </>
                  );
                })()}
              </button>
              {catDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden'
                }}>
                  {CATEGORIE.map(option => {
                    const Icon = option.icon;
                    const isSelected = filters.categoria === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => { setFilters({ ...filters, categoria: option.id }); setCatDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px'
                        }}>
                          <Icon size={14} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          {option.label}
                        </span>
                        {isSelected && <FaCheck size={12} color="#85FF00" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="tp-card-header-right">
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
              {filteredCredentials.length} credenziali
            </span>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters Badge */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredCredentials.length} credenziali trovate
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* Table */}
          <div className="tp-table-container">
            <table className="tp-table">
              <thead>
                <tr>
                  <th>Servizio</th>
                  <th>Categoria</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>URL</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                      <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>
                        {searchTerm || filters.categoria !== 'all' ? 'Nessuna credenziale trovata' : 'Nessuna credenziale'}
                      </p>
                      {!searchTerm && filters.categoria === 'all' && (
                        <button
                          onClick={openCreateModal}
                          style={{
                            marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
                            border: 'none', background: '#1F2937', color: '#fff',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <FaPlus size={10} /> Aggiungi Credenziale
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCredentials.map(cred => {
                    const catColors = getCatColors(cred.categoria);
                    return (
                      <tr key={cred.id}>
                        <td>
                          <div className="tp-table-user">
                            <div className="tp-table-avatar" style={{
                              borderRadius: '10px',
                              background: catColors.bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <FaKey size={14} color={catColors.color} />
                            </div>
                            <div className="tp-table-user-info">
                              <span className="tp-table-name">{cred.nome_servizio}</span>
                              {cred.note && (
                                <span className="tp-table-sector" style={{
                                  maxWidth: '200px', overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                  {cred.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px', borderRadius: '6px',
                            background: catColors.bg, fontSize: '12px',
                            fontWeight: 500, color: catColors.color,
                            textTransform: 'capitalize'
                          }}>
                            {cred.categoria || 'altro'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '14px', color: cred.username ? '#1f2937' : '#9CA3AF' }}>
                            {cred.username || '-'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {revealedPasswords[cred.id] ? (
                              <span style={{
                                fontFamily: "'SF Mono', 'Fira Code', monospace",
                                fontSize: '13px', color: '#1F2937',
                                background: '#FEF9C3', padding: '3px 8px',
                                borderRadius: '4px', maxWidth: '160px',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {revealedPasswords[cred.id]}
                              </span>
                            ) : (
                              <span style={{ color: '#9CA3AF', letterSpacing: '3px', fontSize: '12px' }}>
                                ••••••••
                              </span>
                            )}
                            <button
                              onClick={() => handleReveal(cred.id)}
                              title={revealedPasswords[cred.id] ? 'Nascondi' : 'Mostra'}
                              style={{
                                width: '28px', height: '28px', borderRadius: '6px',
                                border: 'none', background: 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#9CA3AF'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#1F2937'; e.currentTarget.style.background = '#F3F4F6'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; }}
                            >
                              {revealedPasswords[cred.id] ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                            </button>
                            <button
                              onClick={() => handleCopy(cred.id)}
                              title="Copia password"
                              style={{
                                width: '28px', height: '28px', borderRadius: '6px',
                                border: 'none',
                                background: copiedId === cred.id ? '#ECFDF5' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: copiedId === cred.id ? '#059669' : '#9CA3AF'
                              }}
                              onMouseEnter={e => { if (copiedId !== cred.id) { e.currentTarget.style.color = '#1F2937'; e.currentTarget.style.background = '#F3F4F6'; } }}
                              onMouseLeave={e => { if (copiedId !== cred.id) { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.background = 'transparent'; } }}
                            >
                              {copiedId === cred.id ? <FaCheck size={11} /> : <FaCopy size={11} />}
                            </button>
                          </div>
                        </td>
                        <td>
                          {cred.url ? (
                            <a
                              href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                color: '#3B82F6', fontSize: '13px', textDecoration: 'none',
                                maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                            >
                              <FaExternalLinkAlt size={10} />
                              {cred.url.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>-</span>
                          )}
                        </td>
                        <td>
                          <div className="tp-table-actions">
                            <button
                              className="tp-btn-icon tp-btn-icon-view"
                              onClick={() => openEditModal(cred)}
                              title="Modifica"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="tp-btn-icon tp-btn-icon-delete"
                              onClick={() => handleDeleteClick(cred)}
                              title="Elimina"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', width: '100%',
              maxWidth: '560px', maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                {editingCredential ? 'Modifica Credenziale' : 'Nuova Credenziale'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B7280'
                }}
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Nome Servizio *</label>
                  <input
                    type="text" value={form.nome_servizio}
                    onChange={e => setForm({ ...form, nome_servizio: e.target.value })}
                    placeholder="es. Google Cloud"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', background: '#F9FAFB', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    {CATEGORIE.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Username / Email</label>
                <input
                  type="text" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="es. admin@example.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                  {editingCredential ? 'Password (lascia vuoto per non modificare)' : 'Password'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editingCredential ? '••••••••' : 'Inserisci password'}
                    style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', padding: '6px',
                      cursor: 'pointer', color: '#9CA3AF', borderRadius: '6px'
                    }}
                  >
                    {showFormPassword ? <HiOutlineEyeSlash size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>URL di Accesso</label>
                <input
                  type="text" value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="es. https://console.cloud.google.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Note</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={3} placeholder="Note aggiuntive..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.nome_servizio.trim() || saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 24px', borderRadius: '8px',
                    border: 'none', background: '#1F2937',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    color: '#fff', opacity: (!form.nome_servizio.trim() || saving) ? 0.5 : 1
                  }}
                >
                  {saving ? 'Salvataggio...' : (editingCredential ? 'Salva Modifiche' : 'Crea Credenziale')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}
          onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', width: '100%',
              maxWidth: '420px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: '#FEF2F2', color: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <HiOutlineExclamationTriangle size={28} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', margin: '0 0 8px' }}>
                Elimina Credenziale
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px' }}>
                Sei sicuro di voler eliminare <strong>{deleteTarget?.nome_servizio}</strong>?
                Questa azione non può essere annullata.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                  disabled={deleting}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#6B7280' }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{
                    padding: '10px 24px', borderRadius: '8px',
                    border: 'none', background: '#DC2626',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    color: '#fff', opacity: deleting ? 0.5 : 1
                  }}
                >
                  {deleting ? 'Eliminazione...' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AdminCredentials;
