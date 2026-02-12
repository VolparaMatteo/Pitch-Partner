import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaSearch, FaList, FaTh, FaEye, FaTrashAlt, FaPlus,
  FaPhone, FaFileAlt, FaHandshake, FaStar,
  FaCheck, FaTimes,
  FaInbox, FaChevronDown,
  FaFilter, FaUserTie, FaBuilding,
  FaChevronLeft, FaChevronRight,
  FaFutbol, FaMapMarkerAlt, FaRocket
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Pipeline stages for CRM leads
const PIPELINE_STAGES = [
  { id: 'nuovo', label: 'Nuovo', icon: <FaStar />, color: '#6366F1', bg: '#EEF2FF' },
  { id: 'contattato', label: 'Contattato', icon: <FaPhone />, color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'demo', label: 'Demo', icon: <FaRocket />, color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'proposta', label: 'Proposta', icon: <FaFileAlt />, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'negoziazione', label: 'Negoziazione', icon: <FaHandshake />, color: '#10B981', bg: '#ECFDF5' }
];

const ALL_STAGES = [
  ...PIPELINE_STAGES,
  { id: 'vinto', label: 'Vinto', icon: <FaCheck />, color: '#059669', bg: '#ECFDF5' },
  { id: 'perso', label: 'Perso', icon: <FaTimes />, color: '#DC2626', bg: '#FEF2F2' }
];

const FONTE_OPTIONS = [
  { value: 'sito_web', label: 'Sito Web' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'vamos_group', label: 'Vamos Group' },
  { value: 'altro', label: 'Altro' }
];


function AdminLeadListPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ fonte: 'all', status: 'all' });
  const [draggedLead, setDraggedLead] = useState(null);
  const [showLossModal, setShowLossModal] = useState(false);
  const [leadToLose, setLeadToLose] = useState(null);
  const [lossReason, setLossReason] = useState('');
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Custom dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [fonteDropdownOpen, setFonteDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Refs
  const statusDropdownRef = useRef(null);
  const fonteDropdownRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
      if (fonteDropdownRef.current && !fonteDropdownRef.current.contains(e.target)) {
        setFonteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const leadsRes = await axios.get(`${API_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.leads || []);
      setLeads(leadsData);
    } catch (error) {
      console.error('Errore:', error);
      setLeads([]);
      setToast({ message: 'Errore nel caricamento dei lead', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!lead.nome_club?.toLowerCase().includes(s) &&
            !lead.email?.toLowerCase().includes(s) &&
            !lead.contatto_nome?.toLowerCase().includes(s) &&
            !lead.citta?.toLowerCase().includes(s)) return false;
      }
      if (filters.fonte !== 'all' && lead.fonte !== filters.fonte) return false;
      if (filters.status !== 'all' && lead.stage !== filters.status) return false;
      return true;
    });
  };

  const getLeadsByStage = (stageId) => getFilteredLeads().filter(l => l.stage === stageId);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.stage === newStage) {
      setDraggedLead(null);
      return;
    }

    if (newStage === 'perso') {
      setLeadToLose(draggedLead);
      setShowLossModal(true);
      setDraggedLead(null);
      return;
    }

    try {
      await axios.put(
        `${API_URL}/admin/leads/${draggedLead.id}`,
        { stage: newStage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, stage: newStage } : l));
      setToast({ message: 'Stage aggiornato', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore cambio stage:', error.response?.data || error);
      setToast({ message: error.response?.data?.error || 'Errore nell\'aggiornamento', type: 'error' });
    }
    setDraggedLead(null);
  };

  const handleConfirmLoss = async () => {
    if (!leadToLose) return;
    try {
      await axios.put(
        `${API_URL}/admin/leads/${leadToLose.id}`,
        { stage: 'perso', motivo_perdita: lossReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads(prev => prev.map(l => l.id === leadToLose.id ? { ...l, stage: 'perso' } : l));
      setToast({ message: 'Lead segnato come perso', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ message: 'Errore', type: 'error' });
    }
    setShowLossModal(false);
    setLeadToLose(null);
    setLossReason('');
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/admin/leads/${leadToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      setToast({ message: 'Lead eliminato con successo', type: 'success' });
    } catch (error) {
      setToast({ message: 'Errore nell\'eliminazione del lead', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setLeadToDelete(null);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearFilters = () => {
    setFilters({ fonte: 'all', status: 'all' });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.fonte !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  const filteredLeads = getFilteredLeads();
  const activeFiltersCount = getActiveFiltersCount();

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = viewMode === 'list'
    ? filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredLeads;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Filter options for custom dropdowns
  const statusOptions = [
    { value: 'all', label: 'Tutti gli stage', icon: FaFilter, color: '#6B7280' },
    ...PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label, icon: () => s.icon, color: s.color })),
    { value: 'vinto', label: 'Vinto', icon: FaCheck, color: '#059669' },
    { value: 'perso', label: 'Perso', icon: FaTimes, color: '#DC2626' }
  ];

  const fonteOptions = [
    { value: 'all', label: 'Tutte le fonti', icon: FaFilter, color: '#6B7280' },
    ...FONTE_OPTIONS.map(f => ({ value: f.value, label: f.label, icon: FaUserTie, color: '#6366F1' }))
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento CRM Lead...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">CRM Lead</h1>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/admin/leads/new')}
          >
            <FaPlus /> Nuovo Lead
          </button>
        </div>
      </div>

      {/* Main Card with Filters */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper">
              <input
                type="text"
                className="tp-search-input"
                placeholder="Cerca lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="tp-search-icon"><FaSearch /></span>
            </div>

            {/* Custom Status Dropdown */}
            <div ref={statusDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="custom-filter-btn"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setFonteDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filters.status !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.status !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '160px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(statusOptions, filters.status);
                  return (
                    <>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: selected.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px'
                      }}>
                        {typeof selected.icon === 'function' ? <selected.icon /> : <selected.icon />}
                      </div>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        {selected.label}
                      </span>
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {statusDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '220px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {statusOptions.map(option => {
                    const isSelected = filters.status === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, status: option.value });
                          setStatusDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '14px'
                        }}>
                          {typeof option.icon === 'function' ? <option.icon /> : <option.icon />}
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

            {/* Custom Fonte Dropdown */}
            <div ref={fonteDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="custom-filter-btn"
                onClick={() => {
                  setFonteDropdownOpen(!fonteDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filters.fonte !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.fonte !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(fonteOptions, filters.fonte);
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
                      <FaChevronDown
                        size={12}
                        color="#6B7280"
                        style={{
                          transition: 'transform 0.2s',
                          transform: fonteDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {fonteDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {fonteOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = filters.fonte === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, fonte: option.value });
                          setFonteDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer',
                          transition: 'background 0.15s',
                          background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          background: option.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <OptionIcon size={14} color="white" />
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
            {/* View Toggle */}
            <div className="tp-view-toggle">
              <button
                className={`tp-view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Kanban"
              >
                <FaTh />
              </button>
              <button
                className={`tp-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Lista"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        <div className="tp-card-body">
          {/* Active Filters Badge */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="tp-active-filters">
              <span className="tp-active-filters-text">
                {filteredLeads.length} lead trovati
                {activeFiltersCount > 0 && ` (${activeFiltersCount} filtri attivi)`}
              </span>
              <button className="tp-clear-filters-btn" onClick={clearFilters}>
                Rimuovi filtri
              </button>
            </div>
          )}

          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <>
              <div className="tp-kanban">
                {PIPELINE_STAGES.map(stage => {
                  const stageLeads = getLeadsByStage(stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="tp-kanban-column"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                    >
                      {/* Column Header */}
                      <div className="tp-kanban-column-header">
                        <div className="tp-kanban-column-title">
                          <div
                            className="tp-kanban-column-icon"
                            style={{ background: stage.bg, color: stage.color }}
                          >
                            {stage.icon}
                          </div>
                          <span className="tp-kanban-column-name">{stage.label}</span>
                        </div>
                        <span
                          className="tp-kanban-column-count"
                          style={{ background: stage.color }}
                        >
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="tp-kanban-cards">
                        {stageLeads.length === 0 ? (
                          <div className="tp-kanban-empty">
                            <div className="tp-kanban-empty-icon"><FaInbox /></div>
                            <p className="tp-kanban-empty-text">Nessun lead</p>
                          </div>
                        ) : (
                          stageLeads.map(lead => (
                            <div
                              key={lead.id}
                              className="tp-kanban-card"
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                              onClick={() => navigate(`/admin/leads/${lead.id}`)}
                              style={{
                                padding: '12px',
                                borderRadius: '8px'
                              }}
                            >
                              {/* Header con logo e nome */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: lead.logo_url ? 'white' : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                                  border: '2px solid #E5E7EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                  {lead.logo_url ? (
                                    <img
                                      src={getImageUrl(lead.logo_url)}
                                      alt={lead.nome_club}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <FaBuilding size={16} color="#9CA3AF" />
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4 style={{
                                    margin: 0,
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1A1A1A',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>{lead.nome_club}</h4>
                                  {lead.tipologia_sport && (
                                    <span style={{
                                      fontSize: '11px',
                                      color: '#6B7280',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '2px'
                                    }}>
                                      <FaFutbol size={9} color="#9CA3AF" />
                                      {lead.tipologia_sport}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Info aggiuntive */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {lead.citta && (
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#6B7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <FaMapMarkerAlt size={10} color="#9CA3AF" />
                                    <span>{lead.citta}{lead.regione ? `, ${lead.regione}` : ''}</span>
                                  </div>
                                )}
                                {lead.contatto_nome && (
                                  <div style={{
                                    fontSize: '11px',
                                    color: '#6B7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <FaUserTie size={10} color="#9CA3AF" />
                                    <span>{lead.contatto_nome}{lead.contatto_cognome ? ` ${lead.contatto_cognome}` : ''}</span>
                                  </div>
                                )}
                              </div>

                              {/* Footer con fonte */}
                              {lead.fonte && (
                                <div style={{
                                  marginTop: '10px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #F3F4F6'
                                }}>
                                  <span style={{
                                    fontSize: '10px',
                                    color: '#6366F1',
                                    background: '#EEF2FF',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 500
                                  }}>
                                    {FONTE_OPTIONS.find(f => f.value === lead.fonte)?.label || lead.fonte}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dropzones for Won/Lost */}
              <div className="tp-kanban-dropzones">
                <div
                  className={`tp-kanban-dropzone won ${draggedLead ? 'active' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'vinto')}
                  onClick={() => setFilters({ ...filters, status: 'vinto' })}
                  style={{ cursor: 'pointer' }}
                >
                  <h3 className="tp-kanban-dropzone-title">Vinti</h3>
                  <p className="tp-kanban-dropzone-desc">
                    {leads.filter(l => l.stage === 'vinto').length} vinti • Clicca per vedere
                  </p>
                </div>
                <div
                  className={`tp-kanban-dropzone lost ${draggedLead ? 'active' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'perso')}
                  onClick={() => setFilters({ ...filters, status: 'perso' })}
                  style={{ cursor: 'pointer' }}
                >
                  <h3 className="tp-kanban-dropzone-title">Persi</h3>
                  <p className="tp-kanban-dropzone-desc">
                    {leads.filter(l => l.stage === 'perso').length} persi • Clicca per vedere
                  </p>
                </div>
              </div>
            </>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <>
              <div className="tp-table-container" ref={listRef}>
                <table className="tp-table">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th>Contatto</th>
                      <th>Location</th>
                      <th>Stage</th>
                      <th>Fonte</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                          <FaInbox size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p>Nessun lead trovato</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedLeads.map(lead => {
                        const stageInfo = ALL_STAGES.find(s => s.id === lead.stage) || ALL_STAGES[0];
                        return (
                          <tr key={lead.id} onClick={() => navigate(`/admin/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                            <td>
                              <div className="tp-table-user">
                                <div className="tp-table-avatar" style={{ borderRadius: '50%' }}>
                                  {lead.logo_url ? (
                                    <img
                                      src={getImageUrl(lead.logo_url)}
                                      alt={lead.nome_club}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    />
                                  ) : (
                                    <FaBuilding size={18} color="#9CA3AF" />
                                  )}
                                </div>
                                <div className="tp-table-user-info">
                                  <span className="tp-table-name">{lead.nome_club}</span>
                                  <span className="tp-table-sector">{lead.tipologia_sport || 'Sport Club'}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tp-table-user-info">
                                <span style={{ fontSize: '14px', color: '#1f2937' }}>
                                  {lead.contatto_nome ? `${lead.contatto_nome}${lead.contatto_cognome ? ` ${lead.contatto_cognome}` : ''}` : '-'}
                                </span>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                  {lead.contatto_ruolo || lead.contatto_email || '-'}
                                </span>
                              </div>
                            </td>
                            <td>
                              {lead.citta ? (
                                <div className="tp-table-user-info">
                                  <span style={{ fontSize: '14px', color: '#1f2937' }}>{lead.citta}</span>
                                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{lead.regione || ''}</span>
                                </div>
                              ) : (
                                <span style={{ color: '#9CA3AF' }}>-</span>
                              )}
                            </td>
                            <td>
                              <span className={`tp-badge`} style={{
                                background: stageInfo.bg,
                                color: stageInfo.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                {stageInfo.icon}
                                {stageInfo.label}
                              </span>
                            </td>
                            <td>
                              {lead.fonte ? (
                                <span style={{
                                  fontSize: '12px',
                                  color: '#6366F1',
                                  background: '#EEF2FF',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 500
                                }}>
                                  {FONTE_OPTIONS.find(f => f.value === lead.fonte)?.label || lead.fonte}
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF' }}>-</span>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="tp-table-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => navigate(`/admin/leads/${lead.id}`)}
                                  title="Visualizza"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="tp-btn-icon tp-btn-icon-delete"
                                  onClick={() => handleDeleteClick(lead)}
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

      {/* Loss Modal */}
      {showLossModal && (
        <Modal
          isOpen={showLossModal}
          onClose={() => { setShowLossModal(false); setLeadToLose(null); setLossReason(''); }}
          title="Motivo Perdita Lead"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '16px', color: '#4B5563' }}>
              Indica il motivo per cui il lead <strong>{leadToLose?.nome_club}</strong> è stato perso:
            </p>
            <textarea
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              placeholder="Es: Budget insufficiente, tempistiche non compatibili, scelta competitor..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => { setShowLossModal(false); setLeadToLose(null); setLossReason(''); }}
              >
                Annulla
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleConfirmLoss}
                style={{ background: '#DC2626' }}
              >
                Conferma Perdita
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
          title="Elimina Lead"
        >
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              Sei sicuro di voler eliminare il lead <strong>{leadToDelete?.nome_club}</strong>?
              Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
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

export default AdminLeadListPage;
