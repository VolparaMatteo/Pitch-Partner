import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import SupportWidget from '../components/SupportWidget';
import GuidedTour from '../components/GuidedTour';
import DefaultLogo from '../static/logo/FavIcon.png';
import {
  FaSearch, FaList, FaTh, FaEye, FaTrashAlt, FaPlus,
  FaPhone, FaComments, FaFileAlt, FaHandshake, FaStar,
  FaCheck, FaTimes, FaArrowUp, FaArrowDown, FaMinus,
  FaInbox, FaChartLine, FaPercent, FaEuroSign, FaChevronDown,
  FaFilter, FaUserTie, FaExclamationTriangle, FaLightbulb,
  FaChevronLeft, FaChevronRight, FaThermometerHalf, FaSortAmountDown,
  FaTag, FaCog
} from 'react-icons/fa';
import { clubAPI } from '../services/api';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PIPELINE_STAGES = [
  { id: 'nuovo', label: 'Nuovo', icon: <FaStar />, color: '#6366F1', bg: '#EEF2FF' },
  { id: 'contattato', label: 'Contattato', icon: <FaPhone />, color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'in_trattativa', label: 'In Trattativa', icon: <FaComments />, color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'proposta_inviata', label: 'Proposta', icon: <FaFileAlt />, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'negoziazione', label: 'Negoziazione', icon: <FaHandshake />, color: '#10B981', bg: '#ECFDF5' }
];

const ALL_STAGES = [
  ...PIPELINE_STAGES,
  { id: 'vinto', label: 'Vinto', icon: <FaCheck />, color: '#059669', bg: '#ECFDF5' },
  { id: 'perso', label: 'Perso', icon: <FaTimes />, color: '#DC2626', bg: '#FEF2F2' }
];

const PRIORITY_CONFIG = {
  1: { label: 'Bassa', color: '#3B82F6', icon: <FaArrowDown />, class: 'low' },
  2: { label: 'Media', color: '#F59E0B', icon: <FaMinus />, class: 'medium' },
  3: { label: 'Alta', color: '#EF4444', icon: <FaArrowUp />, class: 'high' }
};

const FONTE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Sito Web' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'social', label: 'Social Media' },
  { value: 'altro', label: 'Altro' }
];

const SCORE_CONFIG = {
  FREDDO: { color: '#DC2626', bg: '#FEF2F2', cssClass: 'cold', label: 'Freddo' },
  TIEPIDO: { color: '#D97706', bg: '#FFFBEB', cssClass: 'warm', label: 'Tiepido' },
  CALDO: { color: '#059669', bg: '#ECFDF5', cssClass: 'hot', label: 'Caldo' }
};

const getScoreClass = (score) => {
  if (score <= 33) return 'cold';
  if (score <= 66) return 'warm';
  return 'hot';
};

function LeadListPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ fonte: 'all', priorita: 'all', status: 'all' });
  const [draggedLead, setDraggedLead] = useState(null);
  const [showLossModal, setShowLossModal] = useState(false);
  const [leadToLose, setLeadToLose] = useState(null);
  const [lossReason, setLossReason] = useState('');
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sortByScore, setSortByScore] = useState(false);

  // Tags
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);

  // Tag Management Modal
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalMode, setTagModalMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({ nome: '', colore: '#6366F1' });
  const [savingTagAction, setSavingTagAction] = useState(false);
  const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);

  const TAG_COLORS = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#14B8A6', '#3B82F6', '#F97316', '#84CC16'
  ];

  // Guided Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Custom dropdown states
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [fonteDropdownOpen, setFonteDropdownOpen] = useState(false);
  const [prioritaDropdownOpen, setPrioritaDropdownOpen] = useState(false);
  const [scoreDropdownOpen, setScoreDropdownOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Refs
  const statusDropdownRef = useRef(null);
  const fonteDropdownRef = useRef(null);
  const prioritaDropdownRef = useRef(null);
  const scoreDropdownRef = useRef(null);
  const listRef = useRef(null);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
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
      if (prioritaDropdownRef.current && !prioritaDropdownRef.current.contains(e.target)) {
        setPrioritaDropdownOpen(false);
      }
      if (scoreDropdownRef.current && !scoreDropdownRef.current.contains(e.target)) {
        setScoreDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tour steps configuration
  const tourSteps = [
    {
      target: '[data-tour="page-header"]',
      title: 'Benvenuto nella Pipeline Lead',
      content: 'Questa è la tua centrale operativa per la gestione commerciale. Ogni azienda potenzialmente interessata a sponsorizzare il club viene inserita qui come "Lead" e accompagnata lungo un percorso a fasi — dal primo contatto fino alla firma del contratto o alla chiusura della trattativa.',
      placement: 'bottom',
      tip: 'Un lead ben gestito ha fino al 3× di probabilità in più di convertirsi in sponsor rispetto a uno non tracciato. Registra ogni interazione!',
      icon: <FaUserTie size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
    },
    {
      target: '[data-tour="stats-row"]',
      title: 'Dashboard KPI in Tempo Reale',
      content: 'Quattro indicatori chiave sempre aggiornati: il Valore Pipeline (somma dei deal attivi in €), i Lead Attivi (solo quelli in lavorazione, esclusi vinti e persi), il Tasso di Conversione (percentuale di lead chiusi positivamente) e lo Score Medio con distribuzione Caldi/Tiepidi/Freddi che misura la "temperatura" delle tue trattative.',
      placement: 'bottom',
      tip: 'Uno Score Medio sopra 66 indica una pipeline "calda" con alte probabilità di chiusura. Sotto 33, significa che servono più attività di engagement sui tuoi lead.',
      icon: <FaChartLine size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
      target: '[data-tour="search-bar"]',
      title: 'Ricerca Istantanea',
      content: 'Digita il nome dell\'azienda, l\'indirizzo email o il settore merceologico per trovare immediatamente il lead che cerchi. La ricerca filtra in tempo reale sia nella vista Kanban che nella vista Lista.',
      placement: 'bottom',
      tip: 'Puoi cercare anche per settore: ad esempio digita "Automotive" per visualizzare tutte le aziende di quel comparto.',
      icon: <FaSearch size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="search-filters"]',
      title: 'Filtri Avanzati Combinabili',
      content: 'Cinque filtri a tendina per segmentare con precisione: Status (fase pipeline), Fonte (come è arrivato il lead), Priorità (bassa/media/alta), Temperatura (caldo/tiepido/freddo in base al lead score) e Tag (etichette personalizzate come "Premium", "Automotive", ecc.). Ogni filtro attivo si evidenzia in verde. I filtri si combinano tra loro per restringere la vista.',
      placement: 'bottom',
      tip: 'Esempio pratico: filtra per Status "Negoziazione" + Temperatura "Caldi" + Tag "Premium" per vedere solo le trattative più vicine alla chiusura ad alto valore.',
      icon: <FaFilter size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #4338CA)'
    },
    {
      target: '[data-tour="view-toggle"]',
      title: 'Vista Kanban o Lista',
      content: 'Due modalità di visualizzazione a scelta. La vista Kanban mostra la pipeline come board con colonne drag & drop — ideale per avere una visione d\'insieme e spostare i lead tra le fasi. La vista Lista mostra tutti i dati in una tabella dettagliata con contatti, valore, score, status e priorità — perfetta per analisi approfondite e operazioni rapide.',
      placement: 'bottom',
      tip: 'Usa la Kanban board durante le riunioni commerciali per una panoramica visiva, e la Lista quando devi analizzare i dati o esportare report.',
      icon: <FaTh size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #DB2777)'
    },
    {
      target: '[data-tour="kanban-board"]',
      title: 'Board Pipeline — Drag & Drop',
      content: 'Ogni colonna rappresenta una fase della trattativa: Nuovo → Contattato → In Trattativa → Proposta Inviata → Negoziazione. Trascina le card da una colonna all\'altra per aggiornare lo status del lead. In alto a ogni colonna vedi il conteggio dei lead e il valore totale aggregato della fase.',
      placement: 'top',
      tip: 'Ogni card mostra: ragione sociale, settore, lead score (badge colorato), priorità, tag assegnati e valore stimato del deal con la probabilità di chiusura.',
      icon: <FaHandshake size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      target: '[data-tour="kanban-dropzones"]',
      title: 'Chiusura Trattative — Vinti e Persi',
      content: 'Sotto la board trovi le zone di chiusura. Trascina un lead nella zona verde "Vinti" per segnarlo come concluso con successo (potrà essere convertito in sponsor). Trascinalo nella zona rossa "Persi" per registrare la perdita — ti verrà chiesto il motivo. Clicca su una zona per visualizzare lo storico completo di vinti o persi in vista Lista.',
      placement: 'top',
      tip: 'Registra sempre il motivo di perdita: è fondamentale per analizzare i pattern e migliorare il tasso di conversione nel tempo.',
      icon: <FaExclamationTriangle size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="new-lead-btn"]',
      title: 'Crea un Nuovo Lead',
      content: 'Clicca qui per inserire un nuovo potenziale sponsor nella pipeline. Un wizard guidato in 4 step ti accompagna nella compilazione: dati azienda (ragione sociale, P.IVA, settore), contatti (email, telefono, sito web, social), referente principale (nome, ruolo, recapito) e valutazione del deal (valore stimato, probabilità, fonte, priorità).',
      placement: 'bottom-left',
      tip: 'Solo la ragione sociale è obbligatoria per creare un lead. Potrai completare tutti gli altri dati successivamente dalla scheda di dettaglio.',
      icon: <FaPlus size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
    }
  ];

  const handleStartTour = () => {
    setIsTourOpen(true);
  };

  const handleTourComplete = () => {
    setIsTourOpen(false);
  };

  // Refetch with converted leads when filtering by "vinto"
  useEffect(() => {
    if (filters.status === 'vinto') {
      fetchData(true);
    } else if (filters.status !== 'vinto' && leads.some(l => l.convertito)) {
      // If we have converted leads but not filtering by vinto, refetch without them
      fetchData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const fetchData = async (includeConverted = false) => {
    try {
      setLoading(true);
      const params = includeConverted ? '?include_converted=true' : '';
      const [leadsRes, statsRes, tagsRes] = await Promise.all([
        axios.get(`${API_URL}/club/leads${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/club/leads/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        clubAPI.getTags()
      ]);

      const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data?.leads || []);
      setLeads(leadsData);
      setStats(statsRes.data || null);
      setAllTags(tagsRes.data || []);
    } catch (error) {
      console.error('Errore:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Tag Management Handlers ──
  const openTagModal = () => {
    setTagModalMode('list');
    setEditingTag(null);
    setTagForm({ nome: '', colore: '#6366F1' });
    setShowTagModal(true);
  };

  const startCreateTag = () => {
    setTagForm({ nome: '', colore: '#6366F1' });
    setTagModalMode('create');
  };

  const startEditTag = (tag) => {
    setEditingTag(tag);
    setTagForm({ nome: tag.nome, colore: tag.colore });
    setTagModalMode('edit');
  };

  const handleSaveTag = async () => {
    if (!tagForm.nome.trim()) return;
    try {
      setSavingTagAction(true);
      if (tagModalMode === 'create') {
        const res = await clubAPI.createTag({ nome: tagForm.nome.trim(), colore: tagForm.colore });
        const newTag = res.data.tag;
        setAllTags(prev => [...prev, newTag]);
        setToast({ message: `Tag "${newTag.nome}" creato!`, type: 'success' });
      } else if (tagModalMode === 'edit' && editingTag) {
        const res = await clubAPI.updateTag(editingTag.id, { nome: tagForm.nome.trim(), colore: tagForm.colore });
        const updated = res.data.tag;
        setAllTags(prev => prev.map(t => t.id === updated.id ? { ...t, nome: updated.nome, colore: updated.colore } : t));
        setToast({ message: `Tag aggiornato!`, type: 'success' });
      }
      setTagModalMode('list');
      setEditingTag(null);
      setTagForm({ nome: '', colore: '#6366F1' });
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore salvataggio tag', type: 'error' });
    } finally {
      setSavingTagAction(false);
    }
  };

  const confirmDeleteTag = (tag) => {
    setTagToDelete(tag);
    setShowDeleteTagModal(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      setSavingTagAction(true);
      await clubAPI.deleteTag(tagToDelete.id);
      setAllTags(prev => prev.filter(t => t.id !== tagToDelete.id));
      setSelectedTags(prev => prev.filter(id => id !== tagToDelete.id));
      setToast({ message: `Tag "${tagToDelete.nome}" eliminato`, type: 'success' });
      setShowDeleteTagModal(false);
      setTagToDelete(null);
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore eliminazione tag', type: 'error' });
    } finally {
      setSavingTagAction(false);
    }
  };

  const getFilteredLeads = () => {
    let result = leads.filter(lead => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!lead.ragione_sociale?.toLowerCase().includes(s) &&
            !lead.email?.toLowerCase().includes(s) &&
            !lead.settore_merceologico?.toLowerCase().includes(s)) return false;
      }
      if (filters.fonte !== 'all' && lead.fonte !== filters.fonte) return false;
      if (filters.priorita !== 'all' && lead.priorita !== parseInt(filters.priorita)) return false;
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      // Score temperature filter
      if (scoreFilter !== 'all') {
        const sc = lead.lead_score || 0;
        if (scoreFilter === 'cold' && sc > 33) return false;
        if (scoreFilter === 'warm' && (sc <= 33 || sc > 66)) return false;
        if (scoreFilter === 'hot' && sc <= 66) return false;
      }
      // Tag filter
      if (selectedTags.length > 0) {
        const leadTagIds = (lead.tags || []).map(t => t.id);
        if (!selectedTags.some(id => leadTagIds.includes(id))) return false;
      }
      return true;
    });
    if (sortByScore) {
      result = [...result].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
    }
    return result;
  };

  const getLeadsByStage = (stageId) => getFilteredLeads().filter(l => l.status === stageId);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    if (newStatus === 'perso') {
      setLeadToLose(draggedLead);
      setShowLossModal(true);
      setDraggedLead(null);
      return;
    }

    try {
      await axios.patch(
        `${API_URL}/club/leads/${draggedLead.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads(prev => prev.map(l => l.id === draggedLead.id ? { ...l, status: newStatus } : l));
      setToast({ message: 'Status aggiornato', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore cambio status:', error.response?.data || error);
      setToast({ message: error.response?.data?.error || 'Errore nell\'aggiornamento', type: 'error' });
    }
    setDraggedLead(null);
  };

  const handleConfirmLoss = async () => {
    if (!leadToLose) return;
    try {
      await axios.patch(
        `${API_URL}/club/leads/${leadToLose.id}/status`,
        { status: 'perso', motivo_perdita: lossReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeads(prev => prev.map(l => l.id === leadToLose.id ? { ...l, status: 'perso' } : l));
      setToast({ message: 'Lead segnato come perso', type: 'success' });
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
      await axios.delete(`${API_URL}/club/leads/${leadToDelete.id}`, {
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
    setFilters({ fonte: 'all', priorita: 'all', status: 'all' });
    setSearchTerm('');
    setScoreFilter('all');
    setSortByScore(false);
    setSelectedTags([]);
    fetchData(false); // Refetch without converted leads
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.fonte !== 'all') count++;
    if (filters.priorita !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (scoreFilter !== 'all') count++;
    if (selectedTags.length > 0) count++;
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
  }, [filters, searchTerm, selectedTags]);

  // Filter options for custom dropdowns
  const statusOptions = [
    { value: 'all', label: 'Tutti gli status', icon: FaFilter, color: '#6B7280' },
    ...PIPELINE_STAGES.map(s => ({ value: s.id, label: s.label, icon: () => s.icon, color: s.color })),
    { value: 'vinto', label: 'Vinto', icon: FaCheck, color: '#059669' },
    { value: 'perso', label: 'Perso', icon: FaTimes, color: '#DC2626' }
  ];

  const fonteOptions = [
    { value: 'all', label: 'Tutte le fonti', icon: FaFilter, color: '#6B7280' },
    ...FONTE_OPTIONS.map(f => ({ value: f.value, label: f.label, icon: FaUserTie, color: '#6366F1' }))
  ];

  const prioritaOptions = [
    { value: 'all', label: 'Tutte le priorità', icon: FaFilter, color: '#6B7280' },
    { value: '3', label: 'Alta', icon: FaArrowUp, color: '#EF4444' },
    { value: '2', label: 'Media', icon: FaMinus, color: '#F59E0B' },
    { value: '1', label: 'Bassa', icon: FaArrowDown, color: '#3B82F6' }
  ];

  const scoreOptions = [
    { value: 'all', label: 'Temperatura', icon: FaThermometerHalf, color: '#6B7280' },
    { value: 'hot', label: 'Caldi', icon: FaThermometerHalf, color: '#059669' },
    { value: 'warm', label: 'Tiepidi', icon: FaThermometerHalf, color: '#D97706' },
    { value: 'cold', label: 'Freddi', icon: FaThermometerHalf, color: '#DC2626' }
  ];

  const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || options[0];

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento pipeline lead...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header" data-tour="page-header">
        <h1 className="tp-page-title">Pipeline Lead</h1>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-outline"
            onClick={() => navigate('/club/leads/settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Configurazione Lead Score"
          >
            <FaCog /> Lead Score
          </button>
          <button
            className="tp-btn tp-btn-outline"
            onClick={openTagModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FaTag /> Gestisci Tag
          </button>
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/club/leads/new')}
            data-tour="new-lead-btn"
          >
            <FaPlus /> Nuovo Lead
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {stats?.totals && (
        <div className="tp-stats-row" data-tour="stats-row">
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaEuroSign style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">€{(stats.totals.total_value || 0).toLocaleString()}</div>
              <div className="tp-stat-label">Valore Pipeline</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaInbox style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{stats.totals.total_leads || 0}</div>
              <div className="tp-stat-label">Lead Attivi</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaPercent style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">
                {(() => {
                  const vinti = (stats.pipeline?.vinto?.count || 0) + (stats.totals?.converted_count || 0);
                  const persi = stats.pipeline?.perso?.count || 0;
                  const total = vinti + persi;
                  return total > 0 ? Math.round(vinti / total * 100) : 0;
                })()}%
              </div>
              <div className="tp-stat-label">Tasso Conversione</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaThermometerHalf style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value" style={{ color: stats.totals.average_score > 66 ? '#10B981' : stats.totals.average_score > 33 ? '#F59E0B' : '#EF4444' }}>
                {stats.totals.average_score || 0}
              </div>
              <div className="tp-stat-label">Score Medio</div>
              <div className="tp-score-dist">
                <span className="tp-score-dist-item"><span className="tp-score-dist-dot hot"></span> {stats.totals.score_distribution?.hot || 0}</span>
                <span className="tp-score-dist-item"><span className="tp-score-dist-dot warm"></span> {stats.totals.score_distribution?.warm || 0}</span>
                <span className="tp-score-dist-item"><span className="tp-score-dist-dot cold"></span> {stats.totals.score_distribution?.cold || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Card with Filters */}
      <div className="tp-card">
        <div className="tp-card-header" data-tour="search-filters">
          <div className="tp-card-header-left">
            {/* Search */}
            <div className="tp-search-wrapper" data-tour="search-bar">
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
                  setPrioritaDropdownOpen(false);
                  setScoreDropdownOpen(false);
                  setTagDropdownOpen(false);
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
                        {typeof selected.icon === 'function' ? <selected.icon /> : selected.icon}
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
                          if (option.value === 'vinto') fetchData(true);
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
                          {typeof option.icon === 'function' ? <option.icon /> : option.icon}
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
                  setPrioritaDropdownOpen(false);
                  setScoreDropdownOpen(false);
                  setTagDropdownOpen(false);
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

            {/* Custom Priority Dropdown */}
            <div ref={prioritaDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="custom-filter-btn"
                onClick={() => {
                  setPrioritaDropdownOpen(!prioritaDropdownOpen);
                  setStatusDropdownOpen(false);
                  setFonteDropdownOpen(false);
                  setScoreDropdownOpen(false);
                  setTagDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: filters.priorita !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: filters.priorita !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(prioritaOptions, filters.priorita);
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
                          transform: prioritaDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {prioritaDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {prioritaOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = filters.priorita === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, priorita: option.value });
                          setPrioritaDropdownOpen(false);
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

            {/* Temperature Score Filter */}
            <div ref={scoreDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="custom-filter-btn"
                onClick={() => {
                  setScoreDropdownOpen(!scoreDropdownOpen);
                  setStatusDropdownOpen(false);
                  setFonteDropdownOpen(false);
                  setPrioritaDropdownOpen(false);
                  setTagDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  border: scoreFilter !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                  borderRadius: '8px',
                  background: scoreFilter !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: '150px'
                }}
              >
                {(() => {
                  const selected = getSelectedOption(scoreOptions, scoreFilter);
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
                          transform: scoreDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                        }}
                      />
                    </>
                  );
                })()}
              </button>
              {scoreDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '200px', overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                }}>
                  {scoreOptions.map(option => {
                    const OptionIcon = option.icon;
                    const isSelected = scoreFilter === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          setScoreFilter(option.value);
                          setScoreDropdownOpen(false);
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

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div ref={tagDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="custom-filter-btn"
                  onClick={() => {
                    setTagDropdownOpen(!tagDropdownOpen);
                    setStatusDropdownOpen(false);
                    setFonteDropdownOpen(false);
                    setPrioritaDropdownOpen(false);
                    setScoreDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    border: selectedTags.length > 0 ? '2px solid #85FF00' : '2px solid #E5E7EB',
                    borderRadius: '8px',
                    background: selectedTags.length > 0 ? 'rgba(133, 255, 0, 0.08)' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '120px'
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: selectedTags.length > 0 ? '#6366F1' : '#6B7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FaTag size={12} color="white" />
                  </div>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                    {selectedTags.length > 0 ? `Tag (${selectedTags.length})` : 'Tag'}
                  </span>
                  <FaChevronDown
                    size={12}
                    color="#6B7280"
                    style={{
                      transition: 'transform 0.2s',
                      transform: tagDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                    }}
                  />
                </button>
                {tagDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                    background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 100,
                    minWidth: '220px', maxHeight: '280px', overflowY: 'auto', overflowX: 'hidden',
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    <div
                      onClick={() => { setSelectedTags([]); setTagDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: selectedTags.length === 0 ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                        borderLeft: selectedTags.length === 0 ? '3px solid #85FF00' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => { if (selectedTags.length > 0) e.currentTarget.style.background = '#F9FAFB'; }}
                      onMouseLeave={(e) => { if (selectedTags.length > 0) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: '#6B7280',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FaFilter size={14} color="white" />
                      </div>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                        Tutti i tag
                      </span>
                      {selectedTags.length === 0 && <FaCheck size={12} color="#85FF00" />}
                    </div>
                    {allTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          onClick={() => {
                            setSelectedTags(prev =>
                              prev.includes(tag.id)
                                ? prev.filter(id => id !== tag.id)
                                : [...prev, tag.id]
                            );
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
                          <span style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: tag.colore,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FaTag size={14} color="white" />
                          </span>
                          <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                            {tag.nome}
                          </span>
                          {isSelected && <FaCheck size={12} color="#85FF00" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="tp-card-header-right" data-tour="view-toggle">
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
              <div className="tp-kanban" data-tour="kanban-board">
                {PIPELINE_STAGES.map(stage => {
                  const stageLeads = getLeadsByStage(stage.id);
                  const stageValue = stageLeads.reduce((sum, l) => sum + (l.valore_stimato || 0), 0);

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

                      {/* Column Value */}
                      <div className="tp-kanban-column-value">
                        <span className="tp-kanban-column-value-label">Valore</span>
                        <span className="tp-kanban-column-value-amount">
                          €{stageValue.toLocaleString()}
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
                          stageLeads.map(lead => {
                            const priorityConfig = PRIORITY_CONFIG[lead.priorita] || PRIORITY_CONFIG[2];
                            return (
                              <div
                                key={lead.id}
                                className="tp-kanban-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, lead)}
                                onClick={() => navigate(`/club/leads/${lead.id}`)}
                              >
                                <div className="tp-kanban-card-header">
                                  <h4 className="tp-kanban-card-title">{lead.ragione_sociale}</h4>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div className={`tp-score-badge tp-score-${getScoreClass(lead.lead_score || 0)}`} title={`Score: ${lead.lead_score || 0}`}>
                                      {lead.lead_score || 0}
                                    </div>
                                    <div className={`tp-kanban-card-priority ${priorityConfig.class}`}>
                                      {priorityConfig.icon}
                                    </div>
                                  </div>
                                </div>
                                {lead.settore_merceologico && (
                                  <div className="tp-kanban-card-sector">
                                    {lead.settore_merceologico}
                                  </div>
                                )}
                                {lead.tags && lead.tags.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                                    {lead.tags.slice(0, 3).map(tag => (
                                      <span key={tag.id} style={{
                                        fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                        fontWeight: 500, color: tag.colore,
                                        background: tag.colore + '18'
                                      }}>
                                        {tag.nome}
                                      </span>
                                    ))}
                                    {lead.tags.length > 3 && (
                                      <span style={{ fontSize: '10px', color: '#9CA3AF', padding: '1px 4px' }}>
                                        +{lead.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="tp-kanban-card-footer">
                                  <span className="tp-kanban-card-value">
                                    €{(lead.valore_stimato || 0).toLocaleString()}
                                  </span>
                                  <span className="tp-kanban-card-probability">
                                    {lead.probabilita_chiusura || 0}%
                                  </span>
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

              {/* Won/Lost Drop Zones */}
              <div className="tp-kanban-dropzones" data-tour="kanban-dropzones">
                <div
                  className="tp-kanban-dropzone won"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'vinto')}
                  onClick={() => {
                    fetchData(true); // Include converted leads
                    setFilters({ ...filters, status: 'vinto' });
                    setViewMode('list');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tp-kanban-dropzone-icon"><FaCheck /></div>
                  <h3 className="tp-kanban-dropzone-title">Vinti</h3>
                  <p className="tp-kanban-dropzone-desc">
                    {(stats?.pipeline?.vinto?.count || 0) + (stats?.totals?.converted_count || 0)} vinti • Clicca per vedere
                  </p>
                </div>
                <div
                  className="tp-kanban-dropzone lost"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'perso')}
                  onClick={() => { setFilters({ ...filters, status: 'perso' }); setViewMode('list'); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tp-kanban-dropzone-icon"><FaTimes /></div>
                  <h3 className="tp-kanban-dropzone-title">Persi</h3>
                  <p className="tp-kanban-dropzone-desc">
                    {stats?.pipeline?.perso?.count || 0} persi • Clicca per vedere
                  </p>
                </div>
              </div>
            </>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <>
              {filteredLeads.length === 0 ? (
                <div className="tp-empty-state">
                  <div className="tp-empty-icon"><FaChartLine /></div>
                  <h3 className="tp-empty-title">Nessun lead trovato</h3>
                  <p className="tp-empty-description">
                    {activeFiltersCount > 0 || searchTerm
                      ? 'Prova a modificare i filtri o i termini di ricerca'
                      : 'Inizia creando il tuo primo lead'}
                  </p>
                  {(activeFiltersCount > 0 || searchTerm) ? (
                    <button className="tp-btn tp-btn-outline" onClick={clearFilters}>
                      Rimuovi filtri
                    </button>
                  ) : (
                    <button className="tp-btn tp-btn-primary" onClick={() => navigate('/club/leads/new')}>
                      <FaPlus /> Nuovo Lead
                    </button>
                  )}
                </div>
              ) : (
                <div className="tp-table-container" ref={listRef}>
                  <table className="tp-table">
                    <thead>
                      <tr>
                        <th>Lead</th>
                        <th>Contatti</th>
                        <th>Valore</th>
                        <th>Score</th>
                        <th>Status</th>
                        <th>Priorità</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeads.map((lead) => {
                        const stageConfig = ALL_STAGES.find(s => s.id === lead.status) || { label: lead.status, color: '#6B7280', bg: '#F3F4F6' };
                        const priorityConfig = PRIORITY_CONFIG[lead.priorita] || PRIORITY_CONFIG[2];

                        return (
                          <tr key={lead.id}>
                            <td>
                              <div className="tp-table-user">
                                <div className="tp-table-avatar">
                                  <img
                                    src={DefaultLogo}
                                    alt="Lead"
                                    style={{ opacity: 0.6, padding: '6px' }}
                                  />
                                </div>
                                <div className="tp-table-user-info">
                                  <span className="tp-table-name">{lead.ragione_sociale}</span>
                                  <span className="tp-table-sector">{lead.settore_merceologico || 'Non specificato'}</span>
                                  {lead.tags && lead.tags.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '2px' }}>
                                      {lead.tags.slice(0, 3).map(tag => (
                                        <span key={tag.id} style={{
                                          fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                          fontWeight: 500, color: tag.colore,
                                          background: tag.colore + '18'
                                        }}>
                                          {tag.nome}
                                        </span>
                                      ))}
                                      {lead.tags.length > 3 && (
                                        <span style={{ fontSize: '10px', color: '#9CA3AF' }}>+{lead.tags.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="tp-table-user-info">
                                <span style={{ fontSize: '14px', color: '#1f2937' }}>{lead.email || '-'}</span>
                                <span style={{ fontSize: '13px', color: '#6b7280' }}>{lead.telefono || '-'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="tp-table-value">€{(lead.valore_stimato || 0).toLocaleString()}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className={`tp-score-badge tp-score-${getScoreClass(lead.lead_score || 0)}`}>
                                  {lead.lead_score || 0}
                                </div>
                                <span className={`tp-score-label ${getScoreClass(lead.lead_score || 0)}`}>
                                  {lead.score_label || ''}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span
                                  className="tp-badge"
                                  style={{ background: stageConfig.bg, color: stageConfig.color, border: 'none' }}
                                >
                                  {stageConfig.label}
                                </span>
                                {lead.convertito && (
                                  <span
                                    className="tp-badge"
                                    style={{ background: '#ECFDF5', color: '#059669', border: 'none' }}
                                  >
                                    <FaCheck style={{ marginRight: '4px' }} /> Sponsor
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`tp-badge ${priorityConfig.class === 'high' ? 'tp-badge-danger' : priorityConfig.class === 'medium' ? 'tp-badge-warning' : 'tp-badge-neutral'}`}
                              >
                                {priorityConfig.icon} {priorityConfig.label}
                              </span>
                            </td>
                            <td>
                              <div className="tp-table-actions">
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => navigate(`/club/leads/${lead.id}`)}
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
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredLeads.length > itemsPerPage && (
                <div className="tp-pagination">
                  <ul className="tp-pagination-list">
                    <li
                      className={`tp-pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    >
                      <FaChevronLeft size={12} />
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <li
                        key={page}
                        className={`tp-pagination-item ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </li>
                    ))}
                    <li
                      className={`tp-pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    >
                      <FaChevronRight size={12} />
                    </li>
                  </ul>
                  <div className="tp-pagination-info">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLeads.length)} di {filteredLeads.length} lead
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
        title="Elimina Lead"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '16px',
            background: '#FEF2F2',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FaExclamationTriangle size={18} color="#DC2626" />
            </div>
            <div>
              <p style={{ fontSize: '15px', color: '#991B1B', fontWeight: 600, marginBottom: '4px' }}>
                Attenzione: azione irreversibile
              </p>
              <p style={{ fontSize: '14px', color: '#B91C1C' }}>
                Stai per eliminare definitivamente il lead <strong>{leadToDelete?.ragione_sociale}</strong>.
                Tutti i dati e lo storico delle attività verranno persi.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => { setShowDeleteModal(false); setLeadToDelete(null); }}
              disabled={deleting}
            >
              Annulla
            </button>
            <button
              className="tp-btn"
              style={{ background: '#DC2626', color: 'white' }}
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminazione...' : 'Elimina Lead'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Loss Modal */}
      <Modal
        isOpen={showLossModal}
        onClose={() => { setShowLossModal(false); setLeadToLose(null); setLossReason(''); }}
        title="Motivo della perdita"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '20px' }}>
            Perché il lead <strong>{leadToLose?.ragione_sociale}</strong> è stato perso?
          </p>
          <textarea
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            placeholder="Es: Budget insufficiente, scelta competitor..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              fontSize: '14px',
              marginBottom: '20px',
              resize: 'vertical'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="tp-btn tp-btn-outline"
              onClick={() => { setShowLossModal(false); setLeadToLose(null); setLossReason(''); }}
            >
              Annulla
            </button>
            <button
              className="tp-btn"
              style={{ background: '#EF4444', color: 'white' }}
              onClick={handleConfirmLoss}
            >
              Conferma
            </button>
          </div>
        </div>
      </Modal>

      {/* Tag Management Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => { setShowTagModal(false); setTagModalMode('list'); setEditingTag(null); }}
        title={tagModalMode === 'list' ? 'Gestisci Tag' : tagModalMode === 'create' ? 'Nuovo Tag' : 'Modifica Tag'}
      >
        <div style={{ padding: '8px 0' }}>
          {tagModalMode === 'list' && (
            <>
              {allTags.length === 0 ? (
                <div style={{
                  padding: '32px 20px', textAlign: 'center', background: '#F9FAFB',
                  borderRadius: '12px', marginBottom: '16px'
                }}>
                  <FaTag size={28} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 4px 0', fontWeight: 600 }}>
                    Nessun tag creato
                  </p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                    Crea il primo tag per categorizzare e segmentare i tuoi lead.
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '16px' }}>
                  {allTags.map(tag => (
                    <div
                      key={tag.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 14px', borderRadius: '10px', marginBottom: '6px',
                        background: '#FAFAFA', border: '1px solid #F3F4F6',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '12px', height: '12px', borderRadius: '4px',
                        background: tag.colore, flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>{tag.nome}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {tag.lead_count != null ? `${tag.lead_count} lead` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => startEditTag(tag)}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', border: '1px solid #E5E7EB',
                          background: 'white', color: '#6B7280', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#85FF00'; e.currentTarget.style.color = '#1A1A1A'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => confirmDeleteTag(tag)}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #FCA5A5',
                          background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        <FaTrashAlt size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={startCreateTag}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', padding: '12px 16px', border: 'none', borderRadius: '10px',
                  background: '#1A1A1A', color: '#FFFFFF', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <FaPlus size={14} /> Crea nuovo tag
              </button>
            </>
          )}

          {(tagModalMode === 'create' || tagModalMode === 'edit') && (
            <>
              {/* Tag Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                  Nome Tag <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={tagForm.nome}
                  onChange={e => setTagForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="es. Premium, B2B, Sponsor Tecnico..."
                  style={{
                    width: '100%', padding: '12px 14px', border: '2px solid #E5E7EB',
                    borderRadius: '8px', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#85FF00'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTag(); } }}
                  autoFocus
                />
              </div>

              {/* Tag Color */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                  Colore
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTagForm(prev => ({ ...prev, colore: color }))}
                      style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: color,
                        border: tagForm.colore === color ? '3px solid #1A1A1A' : '2px solid #E5E7EB',
                        cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: tagForm.colore === color ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      {tagForm.colore === color && <FaCheck size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              {tagForm.nome && (
                <div style={{
                  padding: '16px', background: '#F9FAFB', borderRadius: '12px', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '20px',
                    border: `2px solid ${tagForm.colore}`,
                    background: `${tagForm.colore}18`,
                    color: tagForm.colore, fontSize: '13px', fontWeight: 600
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tagForm.colore }} />
                    {tagForm.nome}
                    <FaCheck size={10} />
                  </span>
                  <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Anteprima</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setTagModalMode('list'); setEditingTag(null); setTagForm({ nome: '', colore: '#6366F1' }); }}
                  className="sf-btn sf-btn-outline"
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    background: 'white', color: '#6B7280', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Indietro
                </button>
                <button
                  onClick={handleSaveTag}
                  disabled={!tagForm.nome.trim() || savingTagAction}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    background: tagForm.nome.trim() ? '#1A1A1A' : '#E5E7EB',
                    color: tagForm.nome.trim() ? 'white' : '#9CA3AF',
                    fontSize: '14px', fontWeight: 600,
                    cursor: tagForm.nome.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                >
                  {savingTagAction ? 'Salvataggio...' : (tagModalMode === 'create' ? 'Crea Tag' : 'Salva Modifiche')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Tag Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteTagModal}
        onClose={() => { setShowDeleteTagModal(false); setTagToDelete(null); }}
        title="Elimina Tag"
      >
        <div style={{ padding: '20px 0' }}>
          {tagToDelete && (
            <>
              <div style={{
                padding: '16px', background: '#FEF2F2', borderRadius: '12px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: tagToDelete.colore, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FaTag size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#1A1A1A' }}>{tagToDelete.nome}</div>
                  {tagToDelete.lead_count > 0 && (
                    <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
                      Assegnato a {tagToDelete.lead_count} lead
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6B7280', marginBottom: '20px' }}>
                Sei sicuro di voler eliminare il tag "<strong>{tagToDelete.nome}</strong>"?
                {tagToDelete.lead_count > 0 && ' Verrà rimosso da tutti i lead a cui è assegnato.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowDeleteTagModal(false); setTagToDelete(null); }}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
                    background: 'white', color: '#6B7280', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  Annulla
                </button>
                <button
                  onClick={handleDeleteTag}
                  disabled={savingTagAction}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    background: '#EF4444', color: 'white', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {savingTagAction ? 'Eliminazione...' : 'Elimina Tag'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Custom Dropdown Styles */}
      <style>{`
        .tp-custom-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          min-width: 200px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          z-index: 1000;
          padding: 8px;
          animation: dropdownFadeIn 0.2s ease;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tp-custom-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.15s;
        }

        .tp-custom-dropdown-item:hover {
          background: #F3F4F6;
        }

        .tp-custom-dropdown-item.active {
          background: #F0FDF4;
          color: #166534;
          font-weight: 500;
        }

        .custom-filter-btn:hover {
          border-color: #D1D5DB !important;
          background: #F9FAFB !important;
        }

        .tp-loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .tp-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #E5E7EB;
          border-top-color: #85FF00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .tp-loading-text {
          font-size: 15px;
          color: #6B7280;
          font-weight: 500;
        }
      `}</style>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Pipeline Lead"
        pageDescription="La Pipeline Lead è il CRM commerciale del tuo club. Gestisci l'intero ciclo di acquisizione sponsor: dal primo contatto alla firma del contratto. Monitora 4 KPI in tempo reale (valore pipeline, lead attivi, tasso conversione, score medio). Usa 5 filtri combinabili (status, fonte, priorità, temperatura, tag) per segmentare i lead. Alterna tra vista Kanban (drag & drop tra 5 fasi pipeline) e vista Lista (tabella completa con paginazione). Trascina i lead nelle zone Vinti/Persi per chiudere le trattative. Ogni lead ha: dati azienda, contatti, attività, documenti, prodotti del deal, note e lead score automatico."
        pageIcon={FaUserTie}
        docsSection="leads-overview"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
}

export default LeadListPage;
