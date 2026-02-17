import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaSearch, FaList, FaTh, FaPlus, FaEdit, FaTrashAlt, FaCheck,
  FaPlay, FaInbox, FaChevronDown, FaChevronLeft, FaChevronRight,
  FaClock, FaUser
} from 'react-icons/fa';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { getImageUrl } from '../services/api';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const TIPO_OPTIONS = [
  { value: 'generale', label: 'Generale' },
  { value: 'lead_followup', label: 'Follow-up Lead' },
  { value: 'club_onboarding', label: 'Onboarding Club' },
  { value: 'rinnovo_contratto', label: 'Rinnovo Contratto' },
  { value: 'fattura', label: 'Fattura' },
  { value: 'supporto', label: 'Supporto' }
];

const PRIORITA_OPTIONS = [
  { value: 'bassa', label: 'Bassa', color: '#6B7280', bg: '#F3F4F6' },
  { value: 'media', label: 'Media', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'alta', label: 'Alta', color: '#F59E0B', bg: '#FFFBEB' },
  { value: 'urgente', label: 'Urgente', color: '#DC2626', bg: '#FEF2F2' }
];

const STATO_COLUMNS = [
  { id: 'da_fare', label: 'Da Fare', color: '#6366F1', bg: '#EEF2FF', icon: <FaInbox /> },
  { id: 'in_corso', label: 'In Corso', color: '#F59E0B', bg: '#FFFBEB', icon: <FaPlay /> },
  { id: 'completato', label: 'Completato', color: '#059669', bg: '#ECFDF5', icon: <FaCheck /> }
];

function DropdownIcon({ option, iconColor, iconContent }) {
  if (option?.avatar_url) {
    return (
      <img
        src={getImageUrl(option.avatar_url)}
        alt=""
        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  if (option?.color || iconColor) {
    return (
      <div style={{
        width: '24px', height: '24px', borderRadius: '6px',
        background: option?.color || iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {iconContent || <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>!</span>}
      </div>
    );
  }
  return null;
}

function FormDropdown({ options, value, onChange, placeholder, iconColor, iconContent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));
  const showIcon = selected?.avatar_url || selected?.color || iconColor;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
          border: open ? '2px solid #111827' : '2px solid #E5E7EB', borderRadius: '8px', width: '100%',
          background: 'white', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box'
        }}
      >
        {showIcon && <DropdownIcon option={selected} iconColor={iconColor} iconContent={iconContent} />}
        <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: selected ? '#1A1A1A' : '#9CA3AF' }}>
          {selected?.label || placeholder || 'Seleziona...'}
        </span>
        <FaChevronDown size={12} color="#6B7280"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200,
          maxHeight: '220px', overflowY: 'auto', animation: 'fadeIn 0.15s ease'
        }}>
          {options.map(option => {
            const isSelected = String(value) === String(option.value);
            const showOptIcon = option.avatar_url || option.color || iconColor;
            return (
              <div key={option.value}
                onClick={() => { onChange(option.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent'; }}
              >
                {showOptIcon && <DropdownIcon option={option} iconColor={iconColor} iconContent={iconContent} />}
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
  );
}

function AdminTasks() {
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriorita, setFilterPriorita] = useState('all');
  const [filterTipo, setFilterTipo] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    titolo: '', descrizione: '', tipo: 'generale', priorita: 'media',
    collegamento: 'nessuno', lead_id: null, club_id: null, contract_id: null,
    data_scadenza: '', admin_id: ''
  });

  // Entity lists for linking
  const [leads, setLeads] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);

  // Dropdowns
  const [prioritaDropdownOpen, setPrioritaDropdownOpen] = useState(false);
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false);
  const prioritaDropdownRef = useRef(null);
  const tipoDropdownRef = useRef(null);

  // Drag
  const [draggedTask, setDraggedTask] = useState(null);

  // Toast & Delete
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const listRef = useRef(null);

  // Auth check
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (prioritaDropdownRef.current && !prioritaDropdownRef.current.contains(e.target)) {
        setPrioritaDropdownOpen(false);
      }
      if (tipoDropdownRef.current && !tipoDropdownRef.current.contains(e.target)) {
        setTipoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPriorita, filterTipo]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const tasksRes = await fetch(`${API_URL}/admin/tasks?per_page=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : null).catch(() => null);
      if (tasksRes) setTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchEntities = async () => {
    try {
      const [leadsRes, clubsRes, contractsRes, adminsRes] = await Promise.all([
        fetch(`${API_URL}/admin/leads`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_URL}/admin/clubs`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_URL}/admin/contracts`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_URL}/admin/tasks/admins`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      setLeads(Array.isArray(leadsRes) ? leadsRes : leadsRes?.leads || []);
      setClubs(Array.isArray(clubsRes) ? clubsRes : clubsRes?.clubs || []);
      setContracts(Array.isArray(contractsRes) ? contractsRes : contractsRes?.contracts || []);
      setAdminUsers(Array.isArray(adminsRes) ? adminsRes : []);
    } catch (err) {
      console.error('Error fetching entities:', err);
    }
  };

  // Filters
  const getFilteredTasks = () => {
    return tasks.filter(t => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!t.titolo?.toLowerCase().includes(s) &&
            !t.descrizione?.toLowerCase().includes(s)) return false;
      }
      if (filterPriorita !== 'all' && t.priorita !== filterPriorita) return false;
      if (filterTipo !== 'all' && t.tipo !== filterTipo) return false;
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = viewMode === 'list'
    ? filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredTasks;

  const getTasksByStato = (stato) => filteredTasks.filter(t => t.stato === stato);

  const activeFiltersCount = (filterPriorita !== 'all' ? 1 : 0) + (filterTipo !== 'all' ? 1 : 0);

  // Dropdown data
  const prioritaFilterOptions = [
    { value: 'all', label: 'Tutte le priorità', color: '#6B7280' },
    ...PRIORITA_OPTIONS
  ];
  const tipoFilterOptions = [
    { value: 'all', label: 'Tutti i tipi' },
    ...TIPO_OPTIONS
  ];

  const getSelectedPriorita = () => prioritaFilterOptions.find(o => o.value === filterPriorita) || prioritaFilterOptions[0];
  const getSelectedTipo = () => tipoFilterOptions.find(o => o.value === filterTipo) || tipoFilterOptions[0];

  const clearFilters = () => {
    setFilterPriorita('all');
    setFilterTipo('all');
    setSearchTerm('');
  };

  // Drag & Drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStato) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.stato === newStato) {
      setDraggedTask(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/tasks/${draggedTask.id}/stato`, {
        method: 'PUT', headers, body: JSON.stringify({ stato: newStato })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, stato: newStato } : t));
        setToast({ message: 'Stato aggiornato', type: 'success' });
        fetchAll(true);
      }
    } catch (err) {
      setToast({ message: 'Errore nell\'aggiornamento', type: 'error' });
    }
    setDraggedTask(null);
  };

  // CRUD
  const openNewModal = () => {
    setEditingTask(null);
    setFormData({
      titolo: '', descrizione: '', tipo: 'generale', priorita: 'media',
      collegamento: 'nessuno', lead_id: null, club_id: null, contract_id: null,
      data_scadenza: '', admin_id: ''
    });
    fetchEntities();
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    let collegamento = 'nessuno';
    if (task.lead_id) collegamento = 'lead';
    else if (task.club_id) collegamento = 'club';
    else if (task.contract_id) collegamento = 'contratto';
    setFormData({
      titolo: task.titolo || '',
      descrizione: task.descrizione || '',
      tipo: task.tipo || 'generale',
      priorita: task.priorita || 'media',
      collegamento,
      lead_id: task.lead_id,
      club_id: task.club_id,
      contract_id: task.contract_id,
      data_scadenza: task.data_scadenza ? task.data_scadenza.split('T')[0] : '',
      admin_id: task.admin_id || ''
    });
    fetchEntities();
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.titolo.trim()) {
      setToast({ message: 'Il titolo è obbligatorio', type: 'error' });
      return;
    }

    const payload = {
      titolo: formData.titolo,
      descrizione: formData.descrizione,
      tipo: formData.tipo,
      priorita: formData.priorita,
      admin_id: formData.admin_id || null,
      lead_id: formData.collegamento === 'lead' ? formData.lead_id : null,
      club_id: formData.collegamento === 'club' ? formData.club_id : null,
      contract_id: formData.collegamento === 'contratto' ? formData.contract_id : null,
      data_scadenza: formData.data_scadenza || null
    };

    try {
      const url = editingTask
        ? `${API_URL}/admin/tasks/${editingTask.id}`
        : `${API_URL}/admin/tasks`;
      const res = await fetch(url, {
        method: editingTask ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setToast({ message: editingTask ? 'Task aggiornato' : 'Task creato', type: 'success' });
        setShowModal(false);
        fetchAll(true);
      } else {
        const err = await res.json();
        setToast({ message: err.error || 'Errore', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Errore di rete', type: 'error' });
    }
  };

  const handleQuickComplete = async (task) => {
    const newStato = task.stato === 'completato' ? 'da_fare' : 'completato';
    try {
      const res = await fetch(`${API_URL}/admin/tasks/${task.id}/stato`, {
        method: 'PUT', headers, body: JSON.stringify({ stato: newStato })
      });
      if (res.ok) {
        setToast({ message: newStato === 'completato' ? 'Task completato!' : 'Task riaperto', type: 'success' });
        fetchAll(true);
      }
    } catch (err) {
      setToast({ message: 'Errore', type: 'error' });
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/admin/tasks/${taskToDelete.id}`, {
        method: 'DELETE', headers
      });
      if (res.ok) {
        setToast({ message: 'Task eliminato', type: 'success' });
        fetchAll(true);
      }
    } catch (err) {
      setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  // Helpers
  const getPriorita = (p) => PRIORITA_OPTIONS.find(o => o.value === p) || PRIORITA_OPTIONS[1];
  const getTipoLabel = (t) => TIPO_OPTIONS.find(o => o.value === t)?.label || t;

  const isScaduto = (task) => {
    if (!task.data_scadenza || task.stato === 'completato') return false;
    return new Date(task.data_scadenza) < new Date();
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getEntityLabel = (task) => {
    if (task.lead_nome) return { type: 'Lead', name: task.lead_nome, path: `/admin/leads/${task.lead_id}` };
    if (task.club_nome) return { type: 'Club', name: task.club_nome, path: `/admin/clubs/${task.club_id}` };
    if (task.contract_nome) return { type: 'Contratto', name: task.contract_nome, path: `/admin/contratti/${task.contract_id}` };
    return null;
  };

  // Pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento Task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Task & To-Do</h1>
          <p className="tp-page-subtitle">Gestisci e organizza le attività operative</p>
        </div>
        <div className="tp-page-actions">
          <button className="tp-btn tp-btn-primary" onClick={openNewModal}>
            <FaPlus /> Nuovo Task
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Priorità Dropdown */}
            <div ref={prioritaDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setPrioritaDropdownOpen(!prioritaDropdownOpen); setTipoDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  border: filterPriorita !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterPriorita !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px'
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: getSelectedPriorita().color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>!</span>
                </div>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                  {getSelectedPriorita().label}
                </span>
                <FaChevronDown size={12} color="#6B7280"
                  style={{ transition: 'transform 0.2s', transform: prioritaDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </button>
              {prioritaDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '220px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {prioritaFilterOptions.map(option => {
                    const isSelected = filterPriorita === option.value;
                    return (
                      <div key={option.value}
                        onClick={() => { setFilterPriorita(option.value); setPrioritaDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px', background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>!</span>
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

            {/* Tipo Dropdown */}
            <div ref={tipoDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setTipoDropdownOpen(!tipoDropdownOpen); setPrioritaDropdownOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                  border: filterTipo !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filterTipo !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', minWidth: '150px'
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px', background: '#6366F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <HiOutlineClipboardDocumentList size={13} color="white" />
                </div>
                <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                  {getSelectedTipo().label}
                </span>
                <FaChevronDown size={12} color="#6B7280"
                  style={{ transition: 'transform 0.2s', transform: tipoDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </button>
              {tipoDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '220px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {tipoFilterOptions.map(option => {
                    const isSelected = filterTipo === option.value;
                    return (
                      <div key={option.value}
                        onClick={() => { setFilterTipo(option.value); setTipoDropdownOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px', background: '#6366F1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <HiOutlineClipboardDocumentList size={14} color="white" />
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
            <div className="tp-view-toggle">
              <button className={`tp-view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')} title="Kanban">
                <FaTh />
              </button>
              <button className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')} title="Lista">
                <FaList />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredTasks.length} task trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className="tp-kanban">
              {STATO_COLUMNS.map(col => {
                const colTasks = getTasksByStato(col.id);
                return (
                  <div
                    key={col.id}
                    className="tp-kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className="tp-kanban-column-header">
                      <div className="tp-kanban-column-title">
                        <div className="tp-kanban-column-icon" style={{ background: col.bg, color: col.color }}>
                          {col.icon}
                        </div>
                        <span className="tp-kanban-column-name">{col.label}</span>
                      </div>
                      <span className="tp-kanban-column-count" style={{ background: col.color }}>
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="tp-kanban-cards">
                      {colTasks.length === 0 ? (
                        <div className="tp-kanban-empty">
                          <div className="tp-kanban-empty-icon"><FaInbox /></div>
                          <p className="tp-kanban-empty-text">Nessun task</p>
                        </div>
                      ) : (
                        colTasks.map(task => {
                          const entity = getEntityLabel(task);
                          const scaduto = isScaduto(task);
                          const priorita = getPriorita(task.priorita);
                          return (
                            <div
                              key={task.id}
                              className="tp-kanban-card"
                              draggable
                              onDragStart={(e) => handleDragStart(e, task)}
                              onClick={() => openEditModal(task)}
                            >
                              <h4 className="tp-kanban-card-title">{task.titolo}</h4>

                              <div className="tp-kanban-card-meta" style={{ marginTop: '6px' }}>
                                <span style={{
                                  width: '8px', height: '8px', borderRadius: '50%',
                                  background: priorita.color, flexShrink: 0
                                }} />
                                <span style={{ color: priorita.color, fontWeight: 600 }}>{priorita.label}</span>
                                <span style={{ color: '#D1D5DB' }}>·</span>
                                <span>{getTipoLabel(task.tipo)}</span>
                              </div>

                              {task.admin_nome && (
                                <div className="tp-kanban-card-meta">
                                  {task.admin_avatar
                                    ? <img src={getImageUrl(task.admin_avatar)} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                                    : <FaUser size={9} />
                                  }
                                  {task.admin_nome}
                                </div>
                              )}

                              {entity && (
                                <div className="tp-kanban-card-meta-link"
                                  onClick={(e) => { e.stopPropagation(); navigate(entity.path); }}>
                                  {entity.type}: {entity.name}
                                </div>
                              )}

                              {task.data_scadenza && (
                                <div className={`tp-kanban-card-meta${scaduto ? ' overdue' : ''}`}>
                                  <FaClock size={10} />
                                  {scaduto ? 'Scaduto: ' : 'Scad. '}{formatDate(task.data_scadenza)}
                                </div>
                              )}

                              <div className="tp-kanban-card-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-sm tp-btn-icon-view"
                                  onClick={(e) => { e.stopPropagation(); handleQuickComplete(task); }}
                                  title={task.stato === 'completato' ? 'Riapri' : 'Completa'}
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  className="tp-btn-icon tp-btn-icon-sm"
                                  onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                  title="Modifica"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="tp-btn-icon tp-btn-icon-sm tp-btn-icon-delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(task); }}
                                  title="Elimina"
                                >
                                  <FaTrashAlt />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <>
              <div className="tp-table-container" ref={listRef}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>Titolo</th>
                      <th>Assegnato a</th>
                      <th>Tipo</th>
                      <th>Priorità</th>
                      <th>Collegato a</th>
                      <th>Scadenza</th>
                      <th>Stato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                          <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5, display: 'block', margin: '0 auto 12px' }} />
                          Nessun task trovato
                        </td>
                      </tr>
                    ) : (
                      paginatedTasks.map(task => {
                        const entity = getEntityLabel(task);
                        const scaduto = isScaduto(task);
                        const statoCol = STATO_COLUMNS.find(c => c.id === task.stato);
                        const priorita = getPriorita(task.priorita);
                        return (
                          <tr key={task.id} onClick={() => openEditModal(task)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div className="tp-table-user-info">
                                <span className="tp-table-name">{task.titolo}</span>
                              </div>
                            </td>
                            <td>
                              {task.admin_nome ? (
                                <span className="tp-kanban-card-meta">
                                  {task.admin_avatar
                                    ? <img src={getImageUrl(task.admin_avatar)} alt="" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                                    : <FaUser size={10} />
                                  }
                                  {task.admin_nome}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                            <td>
                              <span className="tp-badge tp-badge-neutral">{getTipoLabel(task.tipo)}</span>
                            </td>
                            <td>
                              <span className="tp-badge" style={{ background: priorita.bg, color: priorita.color }}>
                                {priorita.label}
                              </span>
                            </td>
                            <td>
                              {entity ? (
                                <span className="tp-kanban-card-meta-link"
                                  onClick={(e) => { e.stopPropagation(); navigate(entity.path); }}>
                                  {entity.type}: {entity.name}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                            <td>
                              {task.data_scadenza ? (
                                <span style={{
                                  fontSize: '12px',
                                  color: scaduto ? '#DC2626' : '#6B7280',
                                  fontWeight: scaduto ? 600 : 400
                                }}>
                                  {formatDate(task.data_scadenza)}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB', fontSize: '12px' }}>-</span>
                              )}
                            </td>
                            <td>
                              <span className="tp-badge" style={{ background: statoCol?.bg, color: statoCol?.color }}>
                                {statoCol?.icon} {statoCol?.label || task.stato}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="tp-table-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => handleQuickComplete(task)}
                                  title={task.stato === 'completato' ? 'Riapri' : 'Completa'}
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  className="tp-btn-icon"
                                  onClick={() => openEditModal(task)}
                                  title="Modifica"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="tp-btn-icon tp-btn-icon-delete"
                                  onClick={() => handleDeleteClick(task)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="tp-pagination">
                  <button
                    className="tp-pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="tp-pagination-info">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <button
                    className="tp-pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTask ? 'Modifica Task' : 'Nuovo Task'}
        >
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="tp-form-group">
              <label className="tp-form-label">Titolo <span className="required">*</span></label>
              <input
                type="text"
                className="tp-form-input"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                placeholder="Es. Follow-up con AC Milan"
              />
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Descrizione</label>
              <textarea
                className="tp-form-textarea"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={3}
              />
            </div>

            <div className="tp-form-row tp-form-row-2" style={{ marginBottom: 0 }}>
              <div className="tp-form-group">
                <label className="tp-form-label">Tipo</label>
                <FormDropdown
                  options={TIPO_OPTIONS}
                  value={formData.tipo}
                  onChange={(v) => setFormData({ ...formData, tipo: v })}
                  placeholder="Seleziona tipo..."
                  iconColor="#6366F1"
                  iconContent={<HiOutlineClipboardDocumentList size={13} color="white" />}
                />
              </div>
              <div className="tp-form-group">
                <label className="tp-form-label">Priorità</label>
                <FormDropdown
                  options={PRIORITA_OPTIONS}
                  value={formData.priorita}
                  onChange={(v) => setFormData({ ...formData, priorita: v })}
                  placeholder="Seleziona priorità..."
                />
              </div>
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Assegnato a</label>
              <FormDropdown
                options={[
                  { value: '', label: 'Non assegnato' },
                  ...adminUsers.map(a => ({ value: a.id, label: `${a.nome} ${a.cognome}`, avatar_url: a.avatar }))
                ]}
                value={formData.admin_id}
                onChange={(v) => setFormData({ ...formData, admin_id: v ? parseInt(v) : '' })}
                placeholder="Seleziona utente..."
                iconColor="#8B5CF6"
                iconContent={<FaUser size={11} color="white" />}
              />
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Collegamento</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['nessuno', 'lead', 'club', 'contratto'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`tp-filter-chip${formData.collegamento === opt ? ' active' : ''}`}
                    onClick={() => setFormData({ ...formData, collegamento: opt, lead_id: null, club_id: null, contract_id: null })}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
              {formData.collegamento === 'lead' && (
                <div style={{ marginTop: '10px' }}>
                  <FormDropdown
                    options={[
                      { value: '', label: 'Seleziona lead...' },
                      ...leads.map(l => ({ value: l.id, label: l.nome_club }))
                    ]}
                    value={formData.lead_id || ''}
                    onChange={(v) => setFormData({ ...formData, lead_id: v ? parseInt(v) : null })}
                    placeholder="Seleziona lead..."
                  />
                </div>
              )}
              {formData.collegamento === 'club' && (
                <div style={{ marginTop: '10px' }}>
                  <FormDropdown
                    options={[
                      { value: '', label: 'Seleziona club...' },
                      ...clubs.map(c => ({ value: c.id, label: c.nome }))
                    ]}
                    value={formData.club_id || ''}
                    onChange={(v) => setFormData({ ...formData, club_id: v ? parseInt(v) : null })}
                    placeholder="Seleziona club..."
                  />
                </div>
              )}
              {formData.collegamento === 'contratto' && (
                <div style={{ marginTop: '10px' }}>
                  <FormDropdown
                    options={[
                      { value: '', label: 'Seleziona contratto...' },
                      ...contracts.map(c => ({ value: c.id, label: c.club_name || `Contratto #${c.id}` }))
                    ]}
                    value={formData.contract_id || ''}
                    onChange={(v) => setFormData({ ...formData, contract_id: v ? parseInt(v) : null })}
                    placeholder="Seleziona contratto..."
                  />
                </div>
              )}
            </div>

            <div className="tp-form-group">
              <label className="tp-form-label">Data Scadenza</label>
              <input
                type="date"
                className="tp-form-input"
                value={formData.data_scadenza}
                onChange={(e) => setFormData({ ...formData, data_scadenza: e.target.value })}
              />
            </div>
          </div>

          <div className="tp-modal-footer">
            <button className="tp-btn tp-btn-outline" onClick={() => setShowModal(false)}>Annulla</button>
            <button className="tp-btn tp-btn-primary" onClick={handleSave}>
              {editingTask ? 'Aggiorna' : 'Crea Task'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setTaskToDelete(null); }}
          title="Elimina Task"
        >
          <div style={{ padding: '24px' }}>
            <p style={{ color: '#4B5563', marginBottom: 0 }}>
              Sei sicuro di voler eliminare il task <strong>{taskToDelete?.titolo}</strong>?
              Questa azione non può essere annullata.
            </p>
          </div>
          <div className="tp-modal-footer">
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => { setShowDeleteModal(false); setTaskToDelete(null); }}
              disabled={deleting}
            >
              Annulla
            </button>
            <button
              className="tp-btn tp-btn-primary"
              onClick={handleConfirmDelete}
              disabled={deleting}
              style={{ background: '#DC2626' }}
            >
              {deleting ? 'Eliminazione...' : 'Elimina'}
            </button>
          </div>
        </Modal>
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

export default AdminTasks;
