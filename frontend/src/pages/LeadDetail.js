import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI, uploadAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import GuidedTour from '../components/GuidedTour';
import SupportWidget from '../components/SupportWidget';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaPlus, FaCheck, FaCircle,
  FaEuroSign, FaHistory, FaPhone, FaEnvelope, FaCalendarAlt,
  FaStickyNote, FaEllipsisH, FaStar, FaComments, FaFileAlt,
  FaHandshake, FaTimes, FaExchangeAlt, FaPercentage, FaChartLine,
  FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter,
  FaGlobe, FaBuilding, FaUserTie, FaBell, FaArrowUp, FaArrowDown, FaMinus,
  FaThermometerHalf, FaUsers, FaTag, FaFileContract, FaSearch, FaEye, FaInfoCircle,
  FaPaperclip, FaDownload, FaFilePdf, FaFileWord, FaFileExcel,
  FaFilePowerpoint, FaFileAlt as FaFileGeneric, FaCloudUploadAlt, FaUpload, FaCog,
  FaBoxOpen, FaImage
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';
import '../styles/form.css';
import '../styles/sponsor-form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PIPELINE_STAGES = [
  { id: 'nuovo', label: 'Nuovo', icon: <FaStar />, color: '#6366F1' },
  { id: 'contattato', label: 'Contattato', icon: <FaPhone />, color: '#8B5CF6' },
  { id: 'in_trattativa', label: 'In Trattativa', icon: <FaComments />, color: '#F59E0B' },
  { id: 'proposta_inviata', label: 'Proposta', icon: <FaFileAlt />, color: '#3B82F6' },
  { id: 'negoziazione', label: 'Negoziazione', icon: <FaHandshake />, color: '#10B981' },
  { id: 'vinto', label: 'Vinto', icon: <FaCheck />, color: '#059669' },
  { id: 'perso', label: 'Perso', icon: <FaTimes />, color: '#EF4444' }
];

const ACTIVITY_TYPES = {
  chiamata: { icon: <FaPhone />, label: 'Chiamata', className: 'call' },
  meeting: { icon: <FaCalendarAlt />, label: 'Meeting', className: 'meeting' },
  email: { icon: <FaEnvelope />, label: 'Email', className: 'email' },
  nota: { icon: <FaStickyNote />, label: 'Nota', className: 'note' },
  proposta: { icon: <FaFileAlt />, label: 'Proposta', className: 'proposal' },
  altro: { icon: <FaEllipsisH />, label: 'Altro', className: 'other' }
};

const ESITO_OPTIONS = {
  positivo: { label: 'Positivo', bgColor: '#D1FAE5', color: '#059669' },
  negativo: { label: 'Negativo', bgColor: '#FEE2E2', color: '#DC2626' },
  neutro: { label: 'Neutro', bgColor: '#F3F4F6', color: '#6B7280' },
  da_seguire: { label: 'Da seguire', bgColor: '#FEF3C7', color: '#D97706' }
};

const PRIORITY_CONFIG = {
  1: { label: 'Bassa', icon: <FaArrowDown />, color: '#3B82F6', bg: '#EFF6FF' },
  2: { label: 'Media', icon: <FaMinus />, color: '#F59E0B', bg: '#FFFBEB' },
  3: { label: 'Alta', icon: <FaArrowUp />, color: '#EF4444', bg: '#FEF2F2' }
};

function LeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('activities');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Activity Modal
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    tipo: 'chiamata',
    titolo: '',
    descrizione: '',
    data_attivita: new Date().toISOString().slice(0, 16),
    contatto_nome: '',
    esito: '',
    data_followup: '',
    nuovo_status: ''
  });

  // Convert Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertForm, setConvertForm] = useState({
    email: '',
    password: ''
  });

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Activity Delete Modal
  const [showActivityDeleteModal, setShowActivityDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    nome: '', cognome: '', ruolo: '', email: '', telefono: '',
    ruolo_decisionale: '', linkedin: '', note: '', is_referente_principale: false
  });
  const [showContactDeleteModal, setShowContactDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  // Notes Timeline
  const [notes, setNotes] = useState([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ contenuto: '', tipo: 'generale' });

  // Stage History
  const [stageHistory, setStageHistory] = useState([]);

  // Tags
  const [allTags, setAllTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ nome: '', colore: '#6366F1' });

  // Guided Tour
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Proposals (linked to this lead)
  const [proposals, setProposals] = useState([]);
  const [showProposalStatusModal, setShowProposalStatusModal] = useState(false);
  const [selectedProposalForStatus, setSelectedProposalForStatus] = useState(null);
  const [newProposalStatus, setNewProposalStatus] = useState('');

  // Documents
  const [documents, setDocuments] = useState([]);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docForm, setDocForm] = useState({ nome: '', categoria: 'altro', descrizione: '' });
  const [docFile, setDocFile] = useState(null);
  const [showDocDeleteModal, setShowDocDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [docFilterCat, setDocFilterCat] = useState('');

  // Score Info Modal
  const [showScoreInfoModal, setShowScoreInfoModal] = useState(false);

  // Asset Interests
  const [assetInterests, setAssetInterests] = useState([]);
  const [inventoryAssets, setInventoryAssets] = useState([]);
  const [showAssetInterestModal, setShowAssetInterestModal] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadRes, activitiesRes, contactsRes, notesRes, tagsRes, historyRes, docsRes] = await Promise.all([
        clubAPI.getLead(leadId),
        clubAPI.getLeadActivities(leadId),
        clubAPI.getLeadContacts(leadId),
        clubAPI.getLeadNotes(leadId),
        clubAPI.getTags(),
        clubAPI.getLeadStageHistory(leadId),
        clubAPI.getLeadDocuments(leadId)
      ]);
      setLead(leadRes.data);
      setActivities(activitiesRes.data || []);
      setContacts(contactsRes.data || []);
      setNotes(notesRes.data || []);
      setAllTags(tagsRes.data || []);
      setStageHistory(historyRes.data || []);
      setDocuments(docsRes.data?.documents || []);
      setConvertForm(prev => ({ ...prev, email: leadRes.data.email || '' }));

      // Fetch proposals separately (optional, doesn't block page load)
      try {
        const proposalsRes = await clubAPI.getLeadProposals(leadId);
        setProposals(proposalsRes.data || []);
      } catch (e) {
        console.warn('Proposte non disponibili:', e);
        setProposals([]);
      }
    } catch (error) {
      console.error('Errore caricamento lead:', error);
      setToast({ message: 'Errore nel caricamento del lead', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await clubAPI.getLeadActivities(leadId);
      setActivities(res.data || []);
    } catch (error) {
      console.error('Errore caricamento attivita:', error);
    }
  };

  // Fetch asset interests
  const fetchAssetInterests = useCallback(async () => {
    try {
      const res = await clubAPI.getLeadAssetInterests(leadId);
      setAssetInterests(res.data?.asset_interests || []);
    } catch (error) {
      console.error('Errore caricamento interessi asset:', error);
    }
  }, [leadId]);

  // Fetch all inventory assets for selection
  const fetchInventoryAssets = useCallback(async () => {
    try {
      const res = await clubAPI.getInventoryAssets();
      setInventoryAssets(res.data?.assets || []);
    } catch (error) {
      console.error('Errore caricamento inventario:', error);
    }
  }, []);

  // Fetch asset interests when lead is loaded
  useEffect(() => {
    if (lead) {
      fetchAssetInterests();
      fetchInventoryAssets();
    }
  }, [lead, fetchAssetInterests, fetchInventoryAssets]);

  // Add asset to interests
  const handleAddAssetInterest = async (assetId) => {
    try {
      await clubAPI.addLeadAssetInterest(leadId, assetId);
      setToast({ message: 'Asset aggiunto agli interessi', type: 'success' });
      fetchAssetInterests();
    } catch (error) {
      console.error('Errore aggiunta asset:', error);
      setToast({ message: error.response?.data?.error || 'Errore nell\'aggiunta dell\'asset', type: 'error' });
    }
  };

  // Remove asset from interests
  const handleRemoveAssetInterest = async (assetId) => {
    try {
      await clubAPI.removeLeadAssetInterest(leadId, assetId);
      setToast({ message: 'Asset rimosso dagli interessi', type: 'success' });
      fetchAssetInterests();
    } catch (error) {
      console.error('Errore rimozione asset:', error);
      setToast({ message: 'Errore nella rimozione dell\'asset', type: 'error' });
    }
  };

  // Get filtered assets for the modal
  const getFilteredAssets = () => {
    return inventoryAssets.filter(asset => {
      const matchesSearch = !assetSearchTerm ||
        asset.nome?.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
        asset.categoria?.toLowerCase().includes(assetSearchTerm.toLowerCase());
      const matchesCategory = !assetCategoryFilter || asset.categoria === assetCategoryFilter;
      const notAlreadySelected = !assetInterests.some(a => a.id === asset.id);
      return matchesSearch && matchesCategory && notAlreadySelected;
    });
  };

  // Get unique categories from inventory
  const getAssetCategories = () => {
    const categories = [...new Set(inventoryAssets.map(a => a.categoria).filter(Boolean))];
    return categories.sort();
  };

  const openProposalStatusModal = (proposal) => {
    setSelectedProposalForStatus(proposal);
    setNewProposalStatus(proposal.stato);
    setShowProposalStatusModal(true);
  };

  const handleUpdateProposalStatus = async () => {
    if (!selectedProposalForStatus || !newProposalStatus) return;
    try {
      await clubAPI.updateProposalStatus(selectedProposalForStatus.id, { stato: newProposalStatus });
      setProposals(proposals.map(p => p.id === selectedProposalForStatus.id ? { ...p, stato: newProposalStatus } : p));
      setShowProposalStatusModal(false);
      setSelectedProposalForStatus(null);
      setToast({ message: 'Stato proposta aggiornato', type: 'success' });
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      setToast({ message: 'Errore nell\'aggiornamento dello stato', type: 'error' });
    }
  };

  const handleCreateActivity = async () => {
    if (!activityForm.titolo || !activityForm.tipo) {
      setToast({ message: 'Titolo e tipo sono obbligatori', type: 'error' });
      return;
    }

    try {
      await clubAPI.createLeadActivity(leadId, activityForm);
      setToast({ message: 'Attivita creata!', type: 'success' });
      setShowActivityModal(false);
      setActivityForm({
        tipo: 'chiamata',
        titolo: '',
        descrizione: '',
        data_attivita: new Date().toISOString().slice(0, 16),
        contatto_nome: '',
        esito: '',
        data_followup: '',
        nuovo_status: ''
      });
      fetchData();
    } catch (error) {
      console.error('Errore creazione attivita:', error);
      setToast({ message: 'Errore nella creazione dell\'attivita', type: 'error' });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await clubAPI.changeLeadStatus(leadId, newStatus);
      setToast({ message: 'Status aggiornato!', type: 'success' });
      setShowStatusModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore cambio status:', error);
      setToast({ message: 'Errore nel cambio status', type: 'error' });
    }
  };

  const handleConvert = async () => {
    if (!convertForm.email || !convertForm.password) {
      setToast({ message: 'Email e password sono obbligatori', type: 'error' });
      return;
    }

    try {
      const response = await clubAPI.convertLeadToSponsor(leadId, convertForm);
      setToast({ message: 'Lead convertito in sponsor con successo!', type: 'success' });
      setShowConvertModal(false);
      setTimeout(() => {
        navigate(`/club/sponsors/${response.data.sponsor.id}`);
      }, 2000);
    } catch (error) {
      console.error('Errore conversione:', error);
      setToast({ message: error.response?.data?.error || 'Errore nella conversione', type: 'error' });
    }
  };

  const handleDeleteActivityClick = (activity) => {
    setActivityToDelete(activity);
    setShowActivityDeleteModal(true);
  };

  const handleConfirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    setDeletingActivity(true);

    try {
      await clubAPI.deleteLeadActivity(leadId, activityToDelete.id);
      setToast({ message: 'Attivita eliminata', type: 'success' });
      fetchActivities();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      setToast({ message: 'Errore eliminazione attivita', type: 'error' });
    } finally {
      setDeletingActivity(false);
      setShowActivityDeleteModal(false);
      setActivityToDelete(null);
    }
  };

  const handleConfirmedDelete = async () => {
    setShowConfirmModal(false);
    try {
      await clubAPI.deleteLead(leadId);
      setToast({ message: 'Lead eliminato con successo!', type: 'success' });
      setTimeout(() => navigate('/club/leads'), 1500);
    } catch (error) {
      console.error('Errore eliminazione lead:', error);
      setToast({ message: 'Errore durante l\'eliminazione del lead', type: 'error' });
    }
  };

  // ==================== CONTACT HANDLERS ====================
  const RUOLI_DECISIONALI = [
    { value: 'decisore', label: 'Decisore', color: '#DC2626', bg: '#FEE2E2' },
    { value: 'influencer', label: 'Influencer', color: '#D97706', bg: '#FEF3C7' },
    { value: 'utente', label: 'Utente', color: '#2563EB', bg: '#DBEAFE' },
    { value: 'campione', label: 'Campione', color: '#059669', bg: '#D1FAE5' },
    { value: 'bloccante', label: 'Bloccante', color: '#6B7280', bg: '#F3F4F6' },
  ];

  const openNewContact = () => {
    setEditingContact(null);
    setContactForm({
      nome: '', cognome: '', ruolo: '', email: '', telefono: '',
      ruolo_decisionale: '', linkedin: '', note: '', is_referente_principale: false
    });
    setShowContactModal(true);
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      nome: contact.nome || '',
      cognome: contact.cognome || '',
      ruolo: contact.ruolo || '',
      email: contact.email || '',
      telefono: contact.telefono || '',
      ruolo_decisionale: contact.ruolo_decisionale || '',
      linkedin: contact.linkedin || '',
      note: contact.note || '',
      is_referente_principale: contact.is_referente_principale || false
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.nome || !contactForm.cognome) {
      setToast({ message: 'Nome e cognome sono obbligatori', type: 'error' });
      return;
    }
    try {
      if (editingContact) {
        await clubAPI.updateLeadContact(leadId, editingContact.id, contactForm);
        setToast({ message: 'Contatto aggiornato', type: 'success' });
      } else {
        await clubAPI.createLeadContact(leadId, contactForm);
        setToast({ message: 'Contatto creato', type: 'success' });
      }
      setShowContactModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio contatto:', error);
      setToast({ message: 'Errore nel salvataggio del contatto', type: 'error' });
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      await clubAPI.setLeadPrimaryContact(leadId, contactId);
      setToast({ message: 'Referente principale impostato', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore set primary:', error);
      setToast({ message: 'Errore nell\'impostazione del referente', type: 'error' });
    }
  };

  const handleDeleteContactClick = (contact) => {
    setContactToDelete(contact);
    setShowContactDeleteModal(true);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      await clubAPI.deleteLeadContact(leadId, contactToDelete.id);
      setToast({ message: 'Contatto eliminato', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione contatto:', error);
      setToast({ message: 'Errore eliminazione contatto', type: 'error' });
    } finally {
      setShowContactDeleteModal(false);
      setContactToDelete(null);
    }
  };

  const getRuoloDecisionaleConfig = (ruolo) => {
    const found = RUOLI_DECISIONALI.find(r => r.value === ruolo);
    return found || null;
  };

  // ==================== NOTE HANDLERS ====================
  const NOTE_TYPES = [
    { value: 'generale', label: 'Generale', color: '#6B7280', bg: '#F3F4F6', icon: '📝' },
    { value: 'strategia', label: 'Strategia', color: '#7C3AED', bg: '#EDE9FE', icon: '🎯' },
    { value: 'feedback', label: 'Feedback', color: '#2563EB', bg: '#DBEAFE', icon: '💬' },
    { value: 'follow_up', label: 'Follow-up', color: '#D97706', bg: '#FEF3C7', icon: '🔔' },
    { value: 'interno', label: 'Interno', color: '#059669', bg: '#D1FAE5', icon: '🔒' },
  ];

  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ contenuto: '', tipo: 'generale' });
    setShowNoteModal(true);
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({ contenuto: note.contenuto || '', tipo: note.tipo || 'generale' });
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!noteForm.contenuto.trim()) {
      setToast({ message: 'Il contenuto della nota è obbligatorio', type: 'error' });
      return;
    }
    try {
      if (editingNote) {
        await clubAPI.updateLeadNote(leadId, editingNote.id, noteForm);
        setToast({ message: 'Nota aggiornata', type: 'success' });
      } else {
        await clubAPI.createLeadNote(leadId, noteForm);
        setToast({ message: 'Nota creata', type: 'success' });
      }
      setShowNoteModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio nota:', error);
      setToast({ message: 'Errore nel salvataggio della nota', type: 'error' });
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await clubAPI.deleteLeadNote(leadId, noteId);
      setToast({ message: 'Nota eliminata', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione nota:', error);
      setToast({ message: 'Errore eliminazione nota', type: 'error' });
    }
  };

  const getNoteTypeConfig = (tipo) => {
    return NOTE_TYPES.find(t => t.value === tipo) || NOTE_TYPES[0];
  };

  // Tag handlers
  const handleAssignTag = async (tagId) => {
    try {
      await clubAPI.assignLeadTag(leadId, tagId);
      setShowTagDropdown(false);
      fetchData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Errore assegnazione tag';
      setToast({ message: msg, type: 'error' });
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await clubAPI.removeLeadTag(leadId, tagId);
      fetchData();
    } catch (error) {
      setToast({ message: 'Errore rimozione tag', type: 'error' });
    }
  };

  const handleCreateTag = async () => {
    if (!tagForm.nome.trim()) {
      setToast({ message: 'Il nome del tag è obbligatorio', type: 'error' });
      return;
    }
    try {
      const res = await clubAPI.createTag(tagForm);
      setShowTagModal(false);
      setTagForm({ nome: '', colore: '#6366F1' });
      // Assign the new tag to this lead
      await clubAPI.assignLeadTag(leadId, res.data.tag.id);
      fetchData();
      setToast({ message: 'Tag creato e assegnato', type: 'success' });
    } catch (error) {
      const msg = error.response?.data?.error || 'Errore creazione tag';
      setToast({ message: msg, type: 'error' });
    }
  };

  const getAvailableTags = () => {
    const assignedIds = (lead?.tags || []).map(t => t.id);
    return allTags.filter(t => !assignedIds.includes(t.id));
  };

  // ── Tour Handlers ─────────────────────────────────────
  const handleStartTour = () => setIsTourOpen(true);
  const handleTourClose = useCallback(() => setIsTourOpen(false), []);

  const tourSteps = [
    {
      target: '[data-tour="lead-profile"]',
      title: 'Profilo Lead',
      content: 'La scheda profilo mostra le informazioni principali dell\'azienda: nome, settore, status attuale e dati di contatto.',
      placement: 'right',
      tip: 'Usa i pulsanti in alto per modificare o eliminare il lead.',
      icon: <FaBuilding size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #85FF00, #65A30D)'
    },
    {
      target: '[data-tour="lead-pipeline"]',
      title: 'Pipeline di Vendita',
      content: 'La barra di progresso mostra in quale fase della pipeline si trova il lead. Clicca "Cambia" per avanzare alla fase successiva.',
      placement: 'right',
      tip: 'Le fasi vanno da Nuovo fino a Negoziazione, poi puoi chiudere come Vinto o Perso.',
      icon: <FaChartLine size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
    },
    {
      target: '[data-tour="lead-stats"]',
      title: 'Metriche del Deal',
      content: 'Panoramica rapida di valore stimato, probabilità di chiusura, priorità, numero di attività e lead score.',
      placement: 'bottom',
      tip: 'Queste metriche si aggiornano automaticamente in base alle attività registrate.',
      icon: <FaEuroSign size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
    },
    {
      target: '[data-tour="lead-score"]',
      title: 'Lead Score',
      content: 'Il punteggio del lead è calcolato automaticamente su 5 dimensioni: completezza profilo, potenziale deal, engagement, avanzamento pipeline e contatti.',
      placement: 'bottom',
      tip: 'Un lead score alto indica una trattativa matura e pronta per la chiusura.',
      icon: <FaThermometerHalf size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)'
    },
    {
      target: '[data-tour="lead-actions"]',
      title: 'Azioni Rapide',
      content: 'Da qui puoi creare una nuova attività, cambiare lo status nella pipeline o convertire il lead in sponsor.',
      placement: 'bottom',
      tip: 'La conversione in sponsor crea automaticamente un account sponsor collegato.',
      icon: <FaExchangeAlt size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)'
    },
    {
      target: '[data-tour="lead-tabs"]',
      title: 'Sezioni Dettaglio',
      content: 'Naviga tra le sezioni: Attività (timeline interazioni), Note, Storico Fasi, Prodotti del deal e Documenti allegati.',
      placement: 'bottom',
      tip: 'Ogni sezione mostra un contatore per avere una vista rapida dei contenuti.',
      icon: <FaHistory size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #EC4899, #DB2777)'
    },
    {
      target: '[data-tour="lead-contacts"]',
      title: 'Contatti Aziendali',
      content: 'Gestisci i contatti dell\'azienda: aggiungi referenti, assegna ruoli decisionali e imposta il referente principale.',
      placement: 'right',
      tip: 'Mappare i ruoli decisionali aiuta a capire chi coinvolgere nelle negoziazioni.',
      icon: <FaUsers size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #6366F1, #4F46E5)'
    },
    {
      target: '[data-tour="lead-tags"]',
      title: 'Tag e Segmentazione',
      content: 'Assegna tag per categorizzare e segmentare i lead. Puoi creare nuovi tag personalizzati con colori diversi.',
      placement: 'right',
      tip: 'I tag ti permettono di filtrare i lead nella vista pipeline per trovare gruppi specifici.',
      icon: <FaTag size={18} color="white" />,
      iconBg: 'linear-gradient(135deg, #14B8A6, #0D9488)'
    }
  ];

  // ── Document Handlers ────────────────────────────────────
  const fetchDocuments = async () => {
    try {
      const res = await clubAPI.getLeadDocuments(leadId);
      setDocuments(res.data?.documents || []);
    } catch (error) {
      console.error('Errore caricamento documenti:', error);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      setToast({ message: 'Seleziona un file', type: 'error' });
      return;
    }
    const nome = docForm.nome.trim() || docFile.name;
    try {
      setDocUploading(true);
      // Step 1: Upload file
      const uploadRes = await uploadAPI.uploadDocument(docFile);
      const { file_url, file_size, file_type } = uploadRes.data;
      // Step 2: Save metadata
      await clubAPI.createLeadDocument(leadId, {
        nome,
        categoria: docForm.categoria,
        descrizione: docForm.descrizione,
        file_url,
        file_size,
        file_type
      });
      setShowDocUploadModal(false);
      setDocFile(null);
      setDocForm({ nome: '', categoria: 'altro', descrizione: '' });
      setToast({ message: 'Documento caricato', type: 'success' });
      fetchDocuments();
    } catch (error) {
      const msg = error.response?.data?.error || 'Errore caricamento documento';
      setToast({ message: msg, type: 'error' });
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      await clubAPI.deleteLeadDocument(leadId, docToDelete.id);
      setShowDocDeleteModal(false);
      setDocToDelete(null);
      setToast({ message: 'Documento eliminato', type: 'success' });
      fetchDocuments();
    } catch (error) {
      setToast({ message: 'Errore eliminazione documento', type: 'error' });
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFileGeneric />;
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FaFilePdf />;
    if (['doc', 'docx'].includes(t)) return <FaFileWord />;
    if (['xls', 'xlsx'].includes(t)) return <FaFileExcel />;
    if (['ppt', 'pptx'].includes(t)) return <FaFilePowerpoint />;
    return <FaFileGeneric />;
  };

  const getFileIconColor = (fileType) => {
    if (!fileType) return '#6B7280';
    const t = fileType.toLowerCase();
    if (t === 'pdf') return '#DC2626';
    if (['doc', 'docx'].includes(t)) return '#2563EB';
    if (['xls', 'xlsx'].includes(t)) return '#059669';
    if (['ppt', 'pptx'].includes(t)) return '#D97706';
    return '#6B7280';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const DOC_CATEGORIES = {
    proposta: { label: 'Proposta', bg: '#DBEAFE', color: '#1D4ED8' },
    presentazione: { label: 'Presentazione', bg: '#FEF3C7', color: '#92400E' },
    brochure: { label: 'Brochure', bg: '#D1FAE5', color: '#065F46' },
    contratto_draft: { label: 'Bozza Contratto', bg: '#EDE9FE', color: '#6D28D9' },
    report: { label: 'Report', bg: '#FEE2E2', color: '#991B1B' },
    corrispondenza: { label: 'Corrispondenza', bg: '#E0E7FF', color: '#3730A3' },
    altro: { label: 'Altro', bg: '#F3F4F6', color: '#374151' }
  };

  const filteredDocuments = docFilterCat
    ? documents.filter(d => d.categoria === docFilterCat)
    : documents;

  const getPendingFollowups = () => {
    return activities.filter(a => a.data_followup && !a.followup_completato).length;
  };

  // Get next upcoming activity (pending follow-up or future activity)
  const getNextActivity = () => {
    const now = new Date();

    // Collect all upcoming events from activities
    const upcomingEvents = [];

    activities.forEach(activity => {
      // Pending follow-ups (not completed)
      if (activity.data_followup && !activity.followup_completato) {
        upcomingEvents.push({
          date: new Date(activity.data_followup),
          type: 'followup',
          activity
        });
      }
      // Future activities (data_attivita > now)
      if (activity.data_attivita && new Date(activity.data_attivita) > now) {
        upcomingEvents.push({
          date: new Date(activity.data_attivita),
          type: 'activity',
          activity
        });
      }
    });

    // Sort by date and return the first (most imminent)
    upcomingEvents.sort((a, b) => a.date - b.date);
    return upcomingEvents[0] || null;
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!lead) {
    return <div className="sd-page"><div className="sd-loading">Lead non trovato</div></div>;
  }

  const currentStage = PIPELINE_STAGES.find(s => s.id === lead.status) || PIPELINE_STAGES[0];
  const priorityConfig = PRIORITY_CONFIG[lead.priorita] || PRIORITY_CONFIG[2];
  const initials = (lead.ragione_sociale || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Profile Card */}
        <div className="sd-profile-card" data-tour="lead-profile">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/club/leads')}>
              <FaArrowLeft />
            </button>
            <div className="sd-header-actions">
              {!lead.convertito && (
                <>
                  <button className="sd-header-btn edit" onClick={() => navigate(`/club/leads/${leadId}/edit`)}>
                    <FaPen />
                  </button>
                  <button className="sd-header-btn delete" onClick={() => setShowConfirmModal(true)} style={{ color: '#EF4444' }}>
                    <FaTrashAlt />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {lead.logo_url ? (
                <img
                  src={lead.logo_url.startsWith('http') ? lead.logo_url : `${API_URL.replace('/api', '')}${lead.logo_url}`}
                  alt={lead.ragione_sociale}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials || <FaBuilding />}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{lead.ragione_sociale}</h1>
            <p className="sd-profile-sector">{lead.settore_merceologico || 'Lead'}</p>
            <span
              className="sd-profile-status"
              style={{ background: currentStage.color + '20', color: currentStage.color }}
            >
              {currentStage.icon} {currentStage.label}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Pipeline Progress */}
            {!lead.convertito && lead.status !== 'vinto' && lead.status !== 'perso' && (
              <div className="sd-profile-section" data-tour="lead-pipeline">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="sd-section-title" style={{ margin: 0 }}>Pipeline</h3>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    style={{
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaExchangeAlt /> Cambia
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {PIPELINE_STAGES.filter(s => s.id !== 'vinto' && s.id !== 'perso').map((stage, index) => {
                    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.status);
                    const isActive = stage.id === lead.status;
                    const isPast = index < currentIndex;

                    return (
                      <div
                        key={stage.id}
                        style={{
                          flex: 1,
                          height: '8px',
                          borderRadius: '4px',
                          background: isActive ? stage.color : isPast ? '#10B981' : '#E5E7EB',
                          transition: 'all 0.3s ease'
                        }}
                        title={stage.label}
                      />
                    );
                  })}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: currentStage.color }}>{currentStage.label}</span>
                  {lead.data_ultimo_contatto && (
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      {new Date(lead.data_ultimo_contatto).toLocaleDateString('it-IT')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Converted Badge */}
            {lead.convertito && (
              <div className="sd-profile-section">
                <div style={{
                  background: '#D1FAE5',
                  border: '1px solid #10B981',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <FaCheck style={{ color: '#059669', fontSize: '24px', marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 4px 0', color: '#065F46', fontSize: '14px' }}>Convertito in Sponsor</h4>
                  <p style={{ margin: 0, color: '#047857', fontSize: '12px' }}>
                    {lead.data_conversione && new Date(lead.data_conversione).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Contatti</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label"><FaEnvelope style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Email</span>
                  <span className="sd-info-value">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{lead.email}</a>
                    ) : '-'}
                  </span>
                </div>
                {lead.telefono && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaPhone style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Telefono</span>
                    <span className="sd-info-value">
                      <a href={`tel:${lead.telefono}`} style={{ color: '#4338CA', textDecoration: 'none' }}>{lead.telefono}</a>
                    </span>
                  </div>
                )}
                {lead.sito_web && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaGlobe style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Sito Web</span>
                    <span className="sd-info-value">
                      <a href={lead.sito_web.startsWith('http') ? lead.sito_web : `https://${lead.sito_web}`} target="_blank" rel="noopener noreferrer">
                        {lead.sito_web.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </span>
                  </div>
                )}
                {lead.indirizzo_sede && (
                  <div className="sd-info-item">
                    <span className="sd-info-label"><FaBuilding style={{ color: '#6B7280', fontSize: '12px', marginRight: '6px' }} />Indirizzo</span>
                    <span className="sd-info-value">{lead.indirizzo_sede}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fiscal Data */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dati Aziendali</h3>
              <div className="sd-info-list">
                {lead.partita_iva ? (
                  <div className="sd-info-item">
                    <span className="sd-info-label">P.IVA</span>
                    <span className="sd-info-value mono">{lead.partita_iva}</span>
                  </div>
                ) : null}
                {lead.codice_fiscale ? (
                  <div className="sd-info-item">
                    <span className="sd-info-label">C.F.</span>
                    <span className="sd-info-value mono">{lead.codice_fiscale}</span>
                  </div>
                ) : null}
                <div className="sd-info-item">
                  <span className="sd-info-label">Fonte</span>
                  <span className="sd-info-value">{lead.fonte || '-'}</span>
                </div>
                {!lead.partita_iva && !lead.codice_fiscale && !lead.fonte && (
                  <span className="sd-empty-info">Nessun dato inserito</span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="sd-profile-section" data-tour="lead-tags">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 className="sd-section-title" style={{ margin: 0 }}>
                  <FaTag style={{ marginRight: '6px', fontSize: '12px' }} />
                  Tag
                </h3>
                {!lead.convertito && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6B7280', fontSize: '11px'
                      }}
                    >
                      <FaPlus />
                    </button>
                    {showTagDropdown && (
                      <>
                      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                        onClick={() => setShowTagDropdown(false)} />
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                        background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 1000,
                        padding: '6px', minWidth: '180px', maxHeight: '220px', overflowY: 'auto'
                      }}>
                        {getAvailableTags().length > 0 ? (
                          getAvailableTags().map(tag => (
                            <div
                              key={tag.id}
                              onClick={() => handleAssignTag(tag.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '13px', color: '#374151', transition: 'background 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: '10px', height: '10px', borderRadius: '3px',
                                background: tag.colore, flexShrink: 0
                              }} />
                              {tag.nome}
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '8px 10px', fontSize: '12px', color: '#9CA3AF' }}>
                            Nessun tag disponibile
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '4px', paddingTop: '4px' }}>
                          <div
                            onClick={() => { setShowTagDropdown(false); setShowTagModal(true); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                              fontSize: '13px', color: '#6366F1', fontWeight: 500
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <FaPlus style={{ fontSize: '10px' }} /> Crea nuovo tag
                          </div>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(lead.tags || []).length > 0 ? (
                  (lead.tags || []).map(tag => (
                    <span
                      key={tag.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '6px', fontSize: '12px',
                        fontWeight: 500, color: tag.colore,
                        background: tag.colore + '18', border: `1px solid ${tag.colore}30`
                      }}
                    >
                      {tag.nome}
                      {!lead.convertito && (
                        <FaTimes
                          style={{ fontSize: '9px', cursor: 'pointer', marginLeft: '2px', opacity: 0.7 }}
                          onClick={() => handleRemoveTag(tag.id)}
                        />
                      )}
                    </span>
                  ))
                ) : (
                  <span className="sd-empty-info">Nessun tag</span>
                )}
              </div>
            </div>

            {/* Contatti */}
            <div className="sd-profile-section" data-tour="lead-contacts">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 className="sd-section-title" style={{ margin: 0 }}>
                  <FaUsers style={{ marginRight: '6px', fontSize: '13px' }} />
                  Contatti ({contacts.length})
                </h3>
                {!lead.convertito && (
                  <button
                    onClick={openNewContact}
                    style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#6B7280', fontSize: '11px'
                    }}
                  >
                    <FaPlus />
                  </button>
                )}
              </div>
              {contacts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contacts.map(contact => {
                    const rdConfig = getRuoloDecisionaleConfig(contact.ruolo_decisionale);
                    return (
                      <div key={contact.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px', borderRadius: '10px', background: '#F9FAFB',
                        border: contact.is_referente_principale ? '1.5px solid #F59E0B' : '1px solid #F3F4F6'
                      }}>
                        <div className="sd-referent-avatar" style={{ width: '36px', height: '36px', fontSize: '12px', flexShrink: 0 }}>
                          {(contact.nome?.[0] || '') + (contact.cognome?.[0] || '')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>
                              {contact.nome} {contact.cognome}
                            </h4>
                            {contact.is_referente_principale && (
                              <FaStar style={{ color: '#F59E0B', fontSize: '11px' }} />
                            )}
                          </div>
                          {contact.ruolo && (
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6B7280' }}>{contact.ruolo}</p>
                          )}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {rdConfig && (
                              <span style={{
                                fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                background: rdConfig.bg, color: rdConfig.color, fontWeight: 600
                              }}>
                                {rdConfig.label}
                              </span>
                            )}
                            {contact.email && (
                              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{contact.email}</span>
                            )}
                          </div>
                        </div>
                        {!lead.convertito && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                            {!contact.is_referente_principale && (
                              <button onClick={() => handleSetPrimaryContact(contact.id)}
                                title="Imposta come principale"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '12px', padding: '2px' }}>
                                <FaStar />
                              </button>
                            )}
                            <button onClick={() => openEditContact(contact)}
                              title="Modifica"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '11px', padding: '2px' }}>
                              <FaPen />
                            </button>
                            <button onClick={() => handleDeleteContactClick(contact)}
                              title="Elimina"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '11px', padding: '2px' }}>
                              <FaTrashAlt />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="sd-empty-info">Nessun contatto inserito</span>
              )}
            </div>

            {/* Social Media */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Social</h3>
              <div className="sd-social-grid">
                {lead.facebook ? (
                  <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="sd-social-btn">
                    <FaFacebook style={{ color: '#1877F2' }} />
                  </a>
                ) : (
                  <span className="sd-social-btn disabled"><FaFacebook /></span>
                )}
                {lead.instagram ? (
                  <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="sd-social-btn">
                    <FaInstagram style={{ color: '#E4405F' }} />
                  </a>
                ) : (
                  <span className="sd-social-btn disabled"><FaInstagram /></span>
                )}
                {lead.tiktok ? (
                  <a href={lead.tiktok} target="_blank" rel="noopener noreferrer" className="sd-social-btn">
                    <FaTiktok style={{ color: '#000000' }} />
                  </a>
                ) : (
                  <span className="sd-social-btn disabled"><FaTiktok /></span>
                )}
                {lead.linkedin ? (
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="sd-social-btn">
                    <FaLinkedin style={{ color: '#0A66C2' }} />
                  </a>
                ) : (
                  <span className="sd-social-btn disabled"><FaLinkedin /></span>
                )}
                {lead.twitter ? (
                  <a href={lead.twitter} target="_blank" rel="noopener noreferrer" className="sd-social-btn">
                    <FaTwitter style={{ color: '#1DA1F2' }} />
                  </a>
                ) : (
                  <span className="sd-social-btn disabled"><FaTwitter /></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Score Breakdown Widget */}
          <div className="tp-score-widget" data-tour="lead-score" style={{ marginBottom: '20px', position: 'relative' }}>
            {/* Info Button */}
            <button
              onClick={() => setShowScoreInfoModal(true)}
              style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(107, 114, 128, 0.1)', border: 'none',
                borderRadius: '50%', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6B7280', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(133, 255, 0, 0.15)'; e.currentTarget.style.color = '#85FF00'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'; e.currentTarget.style.color = '#6B7280'; }}
              title="Come funziona il Lead Score"
            >
              <FaInfoCircle style={{ fontSize: '14px' }} />
            </button>

            {/* SVG Circular Progress */}
            {(() => {
              const score = lead.lead_score || 0;
              const thresholdCold = lead.score_thresholds?.cold || 33;
              const thresholdWarm = lead.score_thresholds?.warm || 66;
              const scoreColor = score > thresholdWarm ? '#10B981' : score > thresholdCold ? '#F59E0B' : '#EF4444';
              return (
                <div className="tp-score-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${score * 2.639} ${263.9 - score * 2.639}`}
                    />
                  </svg>
                  <div className="tp-score-circle-text">
                    <span className="tp-score-circle-value" style={{ color: scoreColor }}>
                      {score}
                    </span>
                    <span className="tp-score-circle-max">/100</span>
                  </div>
                </div>
              );
            })()}

            {/* Mini Progress Bars — only if breakdown data exists */}
            {lead.score_breakdown && (
              <div className="tp-score-breakdown">
                {[
                  { key: 'profile', label: 'Profilo Completo' },
                  { key: 'deal', label: 'Potenziale Deal' },
                  { key: 'engagement', label: 'Engagement' },
                  { key: 'pipeline', label: 'Pipeline' },
                  { key: 'contacts', label: 'Contatti' }
                ].map(cat => {
                  const bd = lead.score_breakdown[cat.key];
                  const pct = bd ? Math.round((bd.score / bd.max) * 100) : 0;
                  const fillClass = pct > 66 ? 'hot' : pct > 33 ? 'warm' : 'cold';
                  return (
                    <div key={cat.key} className="tp-score-breakdown-item">
                      <div className="tp-score-breakdown-header">
                        <span className="tp-score-breakdown-label">{cat.label}</span>
                        <span className="tp-score-breakdown-value">{bd?.score || 0}/{bd?.max || 0}</span>
                      </div>
                      <div className="tp-score-breakdown-bar">
                        <div
                          className={`tp-score-breakdown-fill ${fillClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!lead.convertito && lead.status !== 'perso' && (
            <div className="sd-quick-actions" data-tour="lead-actions">
              <h3 className="sd-quick-title">Azioni Rapide</h3>
              <div className="sd-quick-btns">
                <button className="sd-quick-btn" onClick={() => setShowActivityModal(true)}>
                  <FaPlus /> Nuova Attivita
                </button>
                <button className="sd-quick-btn" onClick={() => setShowStatusModal(true)}>
                  <FaExchangeAlt /> Cambia Status
                </button>
                {lead.status !== 'vinto' && (
                  <button className="sd-quick-btn" onClick={() => setShowConvertModal(true)} style={{ background: '#059669', color: 'white', borderColor: '#059669' }}>
                    <FaCheck /> Converti in Sponsor
                  </button>
                )}
                {lead.convertito && lead.sponsor_id && (
                  <button className="sd-quick-btn" onClick={() => navigate(`/club/sponsors/${lead.sponsor_id}`)}>
                    <FaBuilding /> Vai allo Sponsor
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loss Reason Banner */}
          {lead.status === 'perso' && lead.motivo_perdita && (
            <div style={{ marginBottom: '16px', padding: '20px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#991B1B', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTimes /> Motivo Perdita
              </h4>
              <p style={{ margin: 0, color: '#7F1D1D', lineHeight: 1.6 }}>
                {lead.motivo_perdita}
              </p>
            </div>
          )}

          {/* Next Activity Banner */}
          {(() => {
            const nextActivity = getNextActivity();
            if (!nextActivity) return null;

            const isOverdue = nextActivity.date < new Date();
            const isFollowup = nextActivity.type === 'followup';
            const activityTypeLabels = {
              chiamata: 'Chiamata',
              meeting: 'Meeting',
              email: 'Email',
              nota: 'Nota',
              proposta: 'Proposta',
              altro: 'Attività'
            };
            const activityLabel = activityTypeLabels[nextActivity.activity.tipo] || 'Attività';

            return (
              <div style={{
                marginBottom: '16px',
                padding: '20px',
                background: isOverdue ? '#FEF2F2' : '#F0FDF4',
                borderRadius: '12px',
                border: `1px solid ${isOverdue ? '#FECACA' : '#BBF7D0'}`
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: isOverdue ? '#991B1B' : '#166534',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaCalendarAlt /> {isFollowup ? 'Prossimo Follow-up' : 'Prossima Attività'}
                </h4>
                <p style={{ margin: '0 0 4px 0', color: isOverdue ? '#7F1D1D' : '#15803D', fontSize: '15px', fontWeight: 600 }}>
                  {nextActivity.date.toLocaleString('it-IT')}
                  {isOverdue && ' (Scaduto)'}
                </p>
                <p style={{ margin: 0, color: isOverdue ? '#991B1B' : '#166534', fontSize: '13px' }}>
                  {activityLabel}: {nextActivity.activity.titolo || nextActivity.activity.descrizione?.substring(0, 50) || 'Senza titolo'}
                </p>
              </div>
            );
          })()}

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            {/* Tabs Navigation */}
            <div className="sd-tabs-nav" data-tour="lead-tabs">
              <button
                className={`sd-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
                onClick={() => setActiveTab('activities')}
              >
                <span className="sd-tab-icon"><FaHistory /></span>
                Attivita
                <span className="sd-tab-count">{activities.length}</span>
                {getPendingFollowups() > 0 && <span className="sd-tab-alert" />}
              </button>
              <button
                className={`sd-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <span className="sd-tab-icon"><FaStickyNote /></span>
                Note
                <span className="sd-tab-count">{notes.length}</span>
              </button>
              <button
                className={`sd-tab-btn ${activeTab === 'stages' ? 'active' : ''}`}
                onClick={() => setActiveTab('stages')}
              >
                <span className="sd-tab-icon"><FaChartLine /></span>
                Storico Fasi
                <span className="sd-tab-count">{stageHistory.length}</span>
              </button>
              <button
                className={`sd-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
                onClick={() => setActiveTab('proposals')}
              >
                <span className="sd-tab-icon"><FaFileContract /></span>
                Proposte
                <span className="sd-tab-count">{proposals.length}</span>
              </button>
              <button
                className={`sd-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <span className="sd-tab-icon"><FaPaperclip /></span>
                Documenti
                <span className="sd-tab-count">{documents.length}</span>
              </button>
              <button
                className={`sd-tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => setActiveTab('assets')}
              >
                <span className="sd-tab-icon"><FaBoxOpen /></span>
                Interessi Asset
                <span className="sd-tab-count">{assetInterests.length}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaHistory /> Timeline Attivita</h2>
                    {!lead.convertito && (
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowActivityModal(true)}>
                        <FaPlus /> Nuova Attivita
                      </button>
                    )}
                  </div>

                  {activities.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaHistory /></div>
                      <h3 className="sd-empty-title">Nessuna attivita registrata</h3>
                      <p className="sd-empty-desc">Inizia tracciando le interazioni con questo lead</p>
                      {!lead.convertito && (
                        <button className="sd-btn sd-btn-outline" onClick={() => setShowActivityModal(true)}>
                          <FaPlus /> Registra Attivita
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="sd-timeline">
                      {activities.map((activity) => {
                        const typeConfig = ACTIVITY_TYPES[activity.tipo] || ACTIVITY_TYPES.altro;
                        const esitoConfig = ESITO_OPTIONS[activity.esito];

                        return (
                          <div key={activity.id} className="sd-timeline-item">
                            <div className={`sd-timeline-icon ${typeConfig.className}`}>
                              {typeConfig.icon}
                            </div>
                            <div className="sd-timeline-body">
                              <div className="sd-timeline-top">
                                <div>
                                  {esitoConfig && (
                                    <div className="sd-timeline-badges">
                                      <span
                                        className="sd-badge"
                                        style={{ background: esitoConfig.bgColor, color: esitoConfig.color }}
                                      >
                                        {esitoConfig.label}
                                      </span>
                                    </div>
                                  )}
                                  <h4 className="sd-timeline-title">{activity.titolo}</h4>
                                </div>
                                <div className="sd-timeline-actions">
                                  <button
                                    className="sd-action-btn delete"
                                    onClick={() => handleDeleteActivityClick(activity)}
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </div>
                              </div>
                              {activity.descrizione && (
                                <p className="sd-timeline-desc">{activity.descrizione}</p>
                              )}
                              <div className="sd-timeline-meta">
                                <span><FaCalendarAlt /> {new Date(activity.data_attivita).toLocaleString('it-IT')}</span>
                                {activity.contatto_nome && (
                                  <span><FaUserTie /> {activity.contatto_nome}</span>
                                )}
                                {activity.data_followup && (
                                  <span style={{ color: activity.followup_completato ? '#059669' : '#D97706' }}>
                                    <FaBell /> Follow-up: {new Date(activity.data_followup).toLocaleDateString('it-IT')}
                                    {activity.followup_completato && ' (Completato)'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaStickyNote /> Note</h2>
                    {!lead.convertito && (
                      <button className="sd-btn sd-btn-primary" onClick={openNewNote}>
                        <FaPlus /> Nuova Nota
                      </button>
                    )}
                  </div>

                  {notes.length === 0 && !lead.note ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaStickyNote /></div>
                      <h3 className="sd-empty-title">Nessuna nota</h3>
                      <p className="sd-empty-desc">Aggiungi note per tracciare l'evoluzione delle conversazioni</p>
                      {!lead.convertito && (
                        <button className="sd-btn sd-btn-outline" onClick={openNewNote}>
                          <FaPlus /> Aggiungi Nota
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '16px 24px' }}>
                      {/* Legacy note (from the old single-field) */}
                      {lead.note && (
                        <div style={{
                          padding: '16px', borderRadius: '12px', background: '#FFFBEB',
                          border: '1px solid #FDE68A', marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px' }}>📌</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#92400E', textTransform: 'uppercase' }}>
                              Nota originale
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#4B5563', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                            {lead.note}
                          </p>
                        </div>
                      )}

                      {/* Notes Timeline */}
                      {notes.map(note => {
                        const typeConfig = getNoteTypeConfig(note.tipo);
                        return (
                          <div key={note.id} style={{
                            padding: '16px', borderRadius: '12px', background: '#F9FAFB',
                            border: '1px solid #F3F4F6', marginBottom: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '14px' }}>{typeConfig.icon}</span>
                                  <span style={{
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                                    background: typeConfig.bg, color: typeConfig.color, fontWeight: 600,
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                  }}>
                                    {typeConfig.label}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                    {new Date(note.created_at).toLocaleString('it-IT', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                  {note.updated_at !== note.created_at && (
                                    <span style={{ fontSize: '10px', color: '#D1D5DB', fontStyle: 'italic' }}>
                                      (modificata)
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: 0, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                                  {note.contenuto}
                                </p>
                              </div>
                              {!lead.convertito && (
                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                  <button onClick={() => openEditNote(note)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '12px', padding: '4px' }}>
                                    <FaPen />
                                  </button>
                                  <button onClick={() => handleDeleteNote(note.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '12px', padding: '4px' }}>
                                    <FaTrashAlt />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </>
              )}

              {/* Proposals Tab */}
              {activeTab === 'proposals' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFileContract /> Proposte Commerciali</h2>
                    <button
                      className="sd-btn sd-btn-primary"
                      onClick={() => navigate(`/club/proposals/new?lead_id=${leadId}`)}
                    >
                      <FaPlus /> Nuova Proposta
                    </button>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFileContract /></div>
                      <h3 className="sd-empty-title">Nessuna proposta</h3>
                      <p className="sd-empty-desc">Crea una proposta commerciale per questa lead</p>
                      <button
                        className="sd-btn sd-btn-primary"
                        style={{ marginTop: '12px' }}
                        onClick={() => navigate(`/club/proposals/new?lead_id=${leadId}`)}
                      >
                        <FaPlus /> Crea Proposta
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proposta</th>
                            <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stato</th>
                            <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}></th>
                            <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valore</th>
                            <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</th>
                            <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proposals.map(p => {
                            const statoConfig = {
                              bozza: { label: 'Bozza', bg: '#F3F4F6', color: '#6B7280' },
                              inviata: { label: 'Inviata', bg: '#DBEAFE', color: '#2563EB' },
                              visualizzata: { label: 'Visualizzata', bg: '#FEF3C7', color: '#D97706' },
                              in_trattativa: { label: 'In Trattativa', bg: '#E0E7FF', color: '#4F46E5' },
                              accettata: { label: 'Accettata', bg: '#D1FAE5', color: '#059669' },
                              rifiutata: { label: 'Rifiutata', bg: '#FEE2E2', color: '#DC2626' },
                              scaduta: { label: 'Scaduta', bg: '#F3F4F6', color: '#9CA3AF' }
                            }[p.stato] || { label: p.stato, bg: '#F3F4F6', color: '#6B7280' };
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '12px 24px' }}>
                                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1F2937' }}>{p.titolo}</div>
                                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{p.codice}</div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '12px',
                                    background: statoConfig.bg, color: statoConfig.color
                                  }}>
                                    {statoConfig.label}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => openProposalStatusModal(p)}
                                    style={{
                                      fontSize: '11px', fontWeight: 500, padding: '6px 10px', borderRadius: '6px',
                                      background: '#F3F4F6', color: '#374151',
                                      border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <FaExchangeAlt style={{ fontSize: '10px' }} />
                                    Cambia Stato
                                  </button>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                                  €{(p.valore_finale || 0).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
                                  {p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : '-'}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => navigate(`/club/proposals/${p.id}`)}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#6B7280', padding: '4px', borderRadius: '4px'
                                      }}
                                      title="Visualizza"
                                    >
                                      <FaEye style={{ fontSize: '14px' }} />
                                    </button>
                                    <button
                                      onClick={() => navigate(`/club/proposals/${p.id}/edit`)}
                                      style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#6B7280', padding: '4px', borderRadius: '4px'
                                      }}
                                      title="Modifica"
                                    >
                                      <FaPen style={{ fontSize: '12px' }} />
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
                </>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaPaperclip /> Documenti</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => {
                      setDocFile(null);
                      setDocForm({ nome: '', categoria: 'altro', descrizione: '' });
                      setShowDocUploadModal(true);
                    }}>
                      <FaUpload /> Carica Documento
                    </button>
                  </div>

                  {/* Category filter */}
                  {documents.length > 0 && (
                    <div style={{
                      padding: '10px 24px', borderBottom: '1px solid #E5E7EB',
                      display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600, marginRight: '4px' }}>FILTRA:</span>
                      <button
                        onClick={() => setDocFilterCat('')}
                        style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          border: '1px solid', transition: 'all 0.15s',
                          background: !docFilterCat ? '#1F2937' : 'white',
                          color: !docFilterCat ? 'white' : '#6B7280',
                          borderColor: !docFilterCat ? '#1F2937' : '#E5E7EB'
                        }}
                      >
                        Tutti ({documents.length})
                      </button>
                      {Object.entries(DOC_CATEGORIES).map(([key, cat]) => {
                        const count = documents.filter(d => d.categoria === key).length;
                        if (count === 0) return null;
                        return (
                          <button
                            key={key}
                            onClick={() => setDocFilterCat(docFilterCat === key ? '' : key)}
                            style={{
                              padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                              border: '1px solid', transition: 'all 0.15s',
                              background: docFilterCat === key ? cat.color : 'white',
                              color: docFilterCat === key ? 'white' : cat.color,
                              borderColor: docFilterCat === key ? cat.color : '#E5E7EB'
                            }}
                          >
                            {cat.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {documents.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaPaperclip /></div>
                      <h3 className="sd-empty-title">Nessun documento</h3>
                      <p className="sd-empty-desc">Carica brochure, proposte, presentazioni e contratti draft</p>
                      <button className="sd-btn sd-btn-primary" style={{ marginTop: '12px' }} onClick={() => {
                        setDocFile(null);
                        setDocForm({ nome: '', categoria: 'altro', descrizione: '' });
                        setShowDocUploadModal(true);
                      }}>
                        <FaUpload /> Carica Documento
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '0' }}>
                      {filteredDocuments.map(doc => {
                        const catConfig = DOC_CATEGORIES[doc.categoria] || DOC_CATEGORIES.altro;
                        const fileUrl = doc.file_url?.startsWith('http')
                          ? doc.file_url
                          : `${API_URL.replace('/api', '')}${doc.file_url}`;
                        return (
                          <div key={doc.id} style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 24px', borderBottom: '1px solid #F3F4F6',
                            transition: 'background 0.15s'
                          }}
                            onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {/* File Icon */}
                            <div style={{
                              width: '42px', height: '42px', borderRadius: '10px',
                              background: `${getFileIconColor(doc.file_type)}20`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '18px', color: getFileIconColor(doc.file_type), flexShrink: 0
                            }}>
                              {getFileIcon(doc.file_type)}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {doc.nome}
                                </span>
                                <span style={{
                                  fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '4px',
                                  background: catConfig.bg, color: catConfig.color, flexShrink: 0
                                }}>
                                  {catConfig.label}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                                {doc.file_type && (
                                  <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {doc.file_type}
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                  {formatFileSize(doc.file_size)}
                                </span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                  {doc.created_at && new Date(doc.created_at).toLocaleDateString('it-IT', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {doc.descrizione && (
                                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                                  {doc.descrizione}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#4338CA', textDecoration: 'none', fontSize: '13px'
                                }}
                                title="Apri / Scarica"
                              >
                                <FaDownload />
                              </a>
                              <button
                                onClick={() => { setDocToDelete(doc); setShowDocDeleteModal(true); }}
                                style={{
                                  width: '32px', height: '32px', borderRadius: '8px',
                                  background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#DC2626', border: 'none', cursor: 'pointer', fontSize: '13px'
                                }}
                                title="Elimina"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Stage History Tab */}
              {activeTab === 'stages' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaChartLine /> Storico Fasi</h2>
                  </div>

                  {stageHistory.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaChartLine /></div>
                      <h3 className="sd-empty-title">Nessuno storico</h3>
                      <p className="sd-empty-desc">I passaggi di fase verranno tracciati automaticamente</p>
                    </div>
                  ) : (
                    <div style={{ padding: '16px 24px' }}>
                      {/* Summary Stats */}
                      {(() => {
                        const totalDays = stageHistory.length > 1
                          ? ((new Date() - new Date(stageHistory[0].changed_at)) / 86400000).toFixed(0)
                          : 0;
                        const valueChanges = stageHistory.filter((h, i) =>
                          i > 0 && h.valore_al_momento !== stageHistory[i - 1].valore_al_momento
                        ).length;
                        return (
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px'
                          }}>
                            <div style={{
                              padding: '14px', borderRadius: '12px', background: '#EEF2FF', textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '22px', fontWeight: 700, color: '#4338CA' }}>{stageHistory.length}</div>
                              <div style={{ fontSize: '11px', color: '#6366F1', fontWeight: 500, marginTop: '2px' }}>Passaggi</div>
                            </div>
                            <div style={{
                              padding: '14px', borderRadius: '12px', background: '#F0FDF4', textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '22px', fontWeight: 700, color: '#166534' }}>{totalDays}g</div>
                              <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 500, marginTop: '2px' }}>In Pipeline</div>
                            </div>
                            <div style={{
                              padding: '14px', borderRadius: '12px', background: '#FFFBEB', textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '22px', fontWeight: 700, color: '#92400E' }}>{valueChanges}</div>
                              <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 500, marginTop: '2px' }}>Modifiche Valore</div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Timeline */}
                      <div style={{ position: 'relative' }}>
                        {/* Vertical line */}
                        <div style={{
                          position: 'absolute', left: '15px', top: '20px', bottom: '20px',
                          width: '2px', background: '#E5E7EB'
                        }} />

                        {stageHistory.map((entry, idx) => {
                          const stageConfig = PIPELINE_STAGES.find(s => s.id === entry.to_status) || {
                            label: entry.to_status, color: '#6B7280', icon: <FaCircle />
                          };
                          const prevValue = idx > 0 ? stageHistory[idx - 1].valore_al_momento : null;
                          const valueChanged = prevValue !== null && prevValue !== entry.valore_al_momento;
                          const valueDiff = valueChanged ? entry.valore_al_momento - prevValue : 0;

                          const formatDuration = (days, hours) => {
                            if (days >= 1) return `${Math.floor(days)}g ${Math.round((days % 1) * 24)}h`;
                            return `${Math.round(hours)}h`;
                          };

                          return (
                            <div key={entry.id} style={{
                              display: 'flex', gap: '16px', marginBottom: '4px', position: 'relative'
                            }}>
                              {/* Dot */}
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: entry.is_current ? stageConfig.color : 'white',
                                border: `3px solid ${stageConfig.color}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, zIndex: 1, fontSize: '12px',
                                color: entry.is_current ? 'white' : stageConfig.color
                              }}>
                                {stageConfig.icon}
                              </div>

                              {/* Content */}
                              <div style={{
                                flex: 1, padding: '8px 14px 16px', borderRadius: '10px',
                                background: entry.is_current ? `${stageConfig.color}08` : 'transparent',
                                border: entry.is_current ? `1px solid ${stageConfig.color}20` : 'none'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '13px', fontWeight: 600, color: stageConfig.color
                                  }}>
                                    {stageConfig.label}
                                  </span>
                                  {entry.is_current && (
                                    <span style={{
                                      fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                      background: stageConfig.color, color: 'white', fontWeight: 600
                                    }}>
                                      ATTUALE
                                    </span>
                                  )}
                                  {entry.from_status && (
                                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                      da {PIPELINE_STAGES.find(s => s.id === entry.from_status)?.label || entry.from_status}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                                    {new Date(entry.changed_at).toLocaleString('it-IT', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                  {!entry.is_current && (
                                    <span style={{
                                      fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                                      background: '#F3F4F6', color: '#6B7280', fontWeight: 500
                                    }}>
                                      {formatDuration(entry.duration_days, entry.duration_hours)}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                    Valore: €{(entry.valore_al_momento || 0).toLocaleString()}
                                  </span>
                                  {valueChanged && (
                                    <span style={{
                                      fontSize: '11px', fontWeight: 600,
                                      color: valueDiff > 0 ? '#059669' : '#DC2626'
                                    }}>
                                      {valueDiff > 0 ? '+' : ''}€{valueDiff.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Asset Interests Tab */}
              {activeTab === 'assets' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaBoxOpen /> Interessi Asset</h2>
                    {!lead.convertito && (
                      <button
                        className="sd-btn sd-btn-primary"
                        onClick={() => setShowAssetInterestModal(true)}
                      >
                        <FaPlus /> Aggiungi Asset
                      </button>
                    )}
                  </div>

                  {assetInterests.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaBoxOpen /></div>
                      <h3 className="sd-empty-title">Nessun interesse registrato</h3>
                      <p className="sd-empty-desc">
                        Seleziona gli asset del catalogo a cui questo lead è interessato
                      </p>
                      {!lead.convertito && (
                        <button
                          className="sd-btn sd-btn-primary"
                          style={{ marginTop: '16px' }}
                          onClick={() => setShowAssetInterestModal(true)}
                        >
                          <FaPlus /> Aggiungi Primo Asset
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px',
                      padding: '16px 24px'
                    }}>
                      {assetInterests.map((asset) => (
                        <div
                          key={asset.id}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '16px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px'
                          }}
                        >
                          {/* Asset Image */}
                          <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {asset.immagine_url ? (
                              <img
                                src={asset.immagine_url}
                                alt={asset.nome}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <FaImage style={{ fontSize: '24px', color: '#9CA3AF' }} />
                            )}
                          </div>

                          {/* Asset Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              margin: '0 0 4px 0',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#1A1A1A',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {asset.nome}
                            </h4>
                            <p style={{
                              margin: '0 0 8px 0',
                              fontSize: '12px',
                              color: '#6B7280'
                            }}>
                              {asset.categoria}
                              {asset.tipo && asset.tipo !== asset.categoria && ` • ${asset.tipo}`}
                            </p>
                            {asset.prezzo_listino > 0 && (
                              <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#059669'
                              }}>
                                €{asset.prezzo_listino.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Remove Button */}
                          {!lead.convertito && (
                            <button
                              className="sd-btn"
                              style={{
                                background: '#FEE2E2',
                                color: '#DC2626',
                                padding: '8px',
                                alignSelf: 'flex-start'
                              }}
                              onClick={() => handleRemoveAssetInterest(asset.id)}
                              title="Rimuovi"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Nuova Attivita"
      >
        <div style={{ padding: '20px 0' }}>
          {/* Activity Type */}
          <div className="form-group">
            <label>Tipo Attivita <span className="required">*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {Object.entries(ACTIVITY_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivityForm({ ...activityForm, tipo: key })}
                  className={`sf-priority-btn ${activityForm.tipo === key ? 'active' : ''}`}
                  style={{
                    borderColor: activityForm.tipo === key ? '#1A1A1A' : '#E5E7EB',
                    background: activityForm.tipo === key ? '#1A1A1A' : 'white',
                    color: activityForm.tipo === key ? 'white' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '44px',
                    fontSize: '13px'
                  }}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label>Titolo <span className="required">*</span></label>
            <input
              type="text"
              value={activityForm.titolo}
              onChange={(e) => setActivityForm({ ...activityForm, titolo: e.target.value })}
              placeholder="Es: Prima chiamata conoscitiva"
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Data e Ora <span className="required">*</span></label>
            <input
              type="datetime-local"
              value={activityForm.data_attivita}
              onChange={(e) => setActivityForm({ ...activityForm, data_attivita: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Descrizione</label>
            <textarea
              value={activityForm.descrizione}
              onChange={(e) => setActivityForm({ ...activityForm, descrizione: e.target.value })}
              placeholder="Dettagli dell'attivita..."
              rows={3}
            />
          </div>

          {/* Esito */}
          <div className="form-group">
            <label>Esito</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.entries(ESITO_OPTIONS).map(([key, esito]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivityForm({ ...activityForm, esito: activityForm.esito === key ? '' : key })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: `2px solid ${activityForm.esito === key ? esito.color : '#E5E7EB'}`,
                    borderRadius: '8px',
                    background: activityForm.esito === key ? esito.bgColor : 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    color: activityForm.esito === key ? esito.color : '#6B7280'
                  }}
                >
                  {esito.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up */}
          <div className="form-group">
            <label>Promemoria Follow-up</label>
            <input
              type="datetime-local"
              value={activityForm.data_followup}
              onChange={(e) => setActivityForm({ ...activityForm, data_followup: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowActivityModal(false)}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-primary" onClick={handleCreateActivity}>
              Salva Attivita
            </button>
          </div>
        </div>
      </Modal>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Converti in Sponsor"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: 0, color: '#065F46', fontSize: '14px' }}>
              Stai per convertire <strong>{lead.ragione_sociale}</strong> in sponsor.
              Tutti i dati del lead saranno trasferiti e lo storico attivita sara preservato.
            </p>
          </div>

          <div className="form-group">
            <label>Email Account Sponsor <span className="required">*</span></label>
            <input
              type="email"
              value={convertForm.email}
              onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
              placeholder="email@azienda.it"
            />
          </div>

          <div className="form-group">
            <label>Password Account <span className="required">*</span></label>
            <input
              type="password"
              value={convertForm.password}
              onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
              placeholder="Password per l'account sponsor"
            />
            <span className="form-hint">Lo sponsor usera queste credenziali per accedere alla piattaforma</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowConvertModal(false)}>
              Annulla
            </button>
            <button
              className="sf-btn sf-btn-primary"
              onClick={handleConvert}
              style={{ background: '#059669' }}
            >
              <FaCheck /> Converti in Sponsor
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cambia Status"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '20px', color: '#6B7280', fontSize: '14px' }}>
            Seleziona il nuovo status per questo lead:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PIPELINE_STAGES.map(stage => (
              <button
                key={stage.id}
                onClick={() => handleStatusChange(stage.id)}
                disabled={stage.id === lead.status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  border: stage.id === lead.status ? `2px solid ${stage.color}` : '2px solid #E5E7EB',
                  borderRadius: '12px',
                  background: stage.id === lead.status ? `${stage.color}10` : 'white',
                  cursor: stage.id === lead.status ? 'not-allowed' : 'pointer',
                  opacity: stage.id === lead.status ? 0.7 : 1,
                  textAlign: 'left'
                }}
              >
                <span style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: stage.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  {stage.icon}
                </span>
                <span style={{ fontWeight: 600, flex: 1 }}>{stage.label}</span>
                {stage.id === lead.status && (
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>(Attuale)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Conferma Eliminazione"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            Sei sicuro di voler eliminare il lead <strong>"{lead.ragione_sociale}"</strong>?
            Questa azione non puo essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowConfirmModal(false)}>
              Annulla
            </button>
            <button
              className="sf-btn sf-btn-primary"
              onClick={handleConfirmedDelete}
              style={{ background: '#DC2626' }}
            >
              <FaTrashAlt /> Elimina Lead
            </button>
          </div>
        </div>
      </Modal>

      {/* Activity Delete Confirmation Modal */}
      <Modal
        isOpen={showActivityDeleteModal}
        onClose={() => {
          setShowActivityDeleteModal(false);
          setActivityToDelete(null);
        }}
        title="Conferma Eliminazione Attività"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            Sei sicuro di voler eliminare l'attività <strong>"{activityToDelete?.titolo}"</strong>?
            Questa azione non può essere annullata.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="sf-btn sf-btn-outline"
              onClick={() => {
                setShowActivityDeleteModal(false);
                setActivityToDelete(null);
              }}
              disabled={deletingActivity}
            >
              Annulla
            </button>
            <button
              className="sf-btn sf-btn-primary"
              onClick={handleConfirmDeleteActivity}
              disabled={deletingActivity}
              style={{ background: '#DC2626' }}
            >
              {deletingActivity ? 'Eliminazione...' : <><FaTrashAlt /> Elimina Attività</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={editingNote ? 'Modifica Nota' : 'Nuova Nota'}
      >
        <div style={{ padding: '20px 0' }}>
          <div className="form-group">
            <label>Tipo Nota</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {NOTE_TYPES.map(nt => (
                <button key={nt.value} type="button"
                  onClick={() => setNoteForm({ ...noteForm, tipo: nt.value })}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '2px solid',
                    borderColor: noteForm.tipo === nt.value ? nt.color : '#E5E7EB',
                    background: noteForm.tipo === nt.value ? nt.bg : 'white',
                    color: noteForm.tipo === nt.value ? nt.color : '#6B7280',
                    fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                  <span>{nt.icon}</span> {nt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Contenuto <span className="required">*</span></label>
            <textarea
              value={noteForm.contenuto}
              onChange={(e) => setNoteForm({ ...noteForm, contenuto: e.target.value })}
              placeholder="Scrivi la nota..."
              rows={5}
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowNoteModal(false)}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-primary" onClick={handleSaveNote}>
              {editingNote ? 'Salva Modifiche' : 'Crea Nota'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={editingContact ? 'Modifica Contatto' : 'Nuovo Contatto'}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Nome <span className="required">*</span></label>
              <input type="text" value={contactForm.nome}
                onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                placeholder="Nome" />
            </div>
            <div className="form-group">
              <label>Cognome <span className="required">*</span></label>
              <input type="text" value={contactForm.cognome}
                onChange={(e) => setContactForm({ ...contactForm, cognome: e.target.value })}
                placeholder="Cognome" />
            </div>
          </div>

          <div className="form-group">
            <label>Ruolo Aziendale</label>
            <input type="text" value={contactForm.ruolo}
              onChange={(e) => setContactForm({ ...contactForm, ruolo: e.target.value })}
              placeholder="Es: Direttore Marketing" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="email@azienda.it" />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input type="text" value={contactForm.telefono}
                onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                placeholder="+39 ..." />
            </div>
          </div>

          <div className="form-group">
            <label>Ruolo Decisionale</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {RUOLI_DECISIONALI.map(rd => (
                <button key={rd.value} type="button"
                  onClick={() => setContactForm({ ...contactForm, ruolo_decisionale: contactForm.ruolo_decisionale === rd.value ? '' : rd.value })}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '2px solid',
                    borderColor: contactForm.ruolo_decisionale === rd.value ? rd.color : '#E5E7EB',
                    background: contactForm.ruolo_decisionale === rd.value ? rd.bg : 'white',
                    color: contactForm.ruolo_decisionale === rd.value ? rd.color : '#6B7280',
                    fontWeight: 600, fontSize: '12px', cursor: 'pointer'
                  }}>
                  {rd.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>LinkedIn</label>
            <input type="text" value={contactForm.linkedin}
              onChange={(e) => setContactForm({ ...contactForm, linkedin: e.target.value })}
              placeholder="URL profilo LinkedIn" />
          </div>

          <div className="form-group">
            <label>Note</label>
            <textarea value={contactForm.note}
              onChange={(e) => setContactForm({ ...contactForm, note: e.target.value })}
              placeholder="Note sul contatto..." rows={2} />
          </div>

          {!editingContact && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={contactForm.is_referente_principale}
                  onChange={(e) => setContactForm({ ...contactForm, is_referente_principale: e.target.checked })}
                  style={{ width: '16px', height: '16px' }} />
                <FaStar style={{ color: '#F59E0B', fontSize: '13px' }} /> Referente principale
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowContactModal(false)}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-primary" onClick={handleSaveContact}>
              {editingContact ? 'Salva Modifiche' : 'Crea Contatto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Delete Modal */}
      <Modal
        isOpen={showContactDeleteModal}
        onClose={() => { setShowContactDeleteModal(false); setContactToDelete(null); }}
        title="Conferma Eliminazione Contatto"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            Sei sicuro di voler eliminare il contatto <strong>"{contactToDelete?.nome} {contactToDelete?.cognome}"</strong>?
            {contactToDelete?.is_referente_principale && (
              <span style={{ display: 'block', marginTop: '8px', color: '#D97706' }}>
                Questo contatto e' il referente principale. Verra' promosso automaticamente il prossimo contatto.
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => { setShowContactDeleteModal(false); setContactToDelete(null); }}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-primary" onClick={handleConfirmDeleteContact} style={{ background: '#DC2626' }}>
              <FaTrashAlt /> Elimina Contatto
            </button>
          </div>
        </div>
      </Modal>

      {/* Tag Create Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => { setShowTagModal(false); setTagForm({ nome: '', colore: '#6366F1' }); }}
        title="Nuovo Tag"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Nome *
            </label>
            <input
              type="text"
              className="sf-input"
              value={tagForm.nome}
              onChange={(e) => setTagForm({ ...tagForm, nome: e.target.value })}
              placeholder="es. budget-alto, interesse-hospitality"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Colore
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'].map(c => (
                <button
                  key={c}
                  onClick={() => setTagForm({ ...tagForm, colore: c })}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: c, border: tagForm.colore === c ? '3px solid #1F2937' : '2px solid transparent',
                    cursor: 'pointer', transition: 'border 0.15s'
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => { setShowTagModal(false); setTagForm({ nome: '', colore: '#6366F1' }); }}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-primary" onClick={handleCreateTag}>
              <FaPlus /> Crea e Assegna
            </button>
          </div>
        </div>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        title="Carica Documento"
      >
        <div style={{ padding: '20px 0' }}>
          {/* Drop Zone / File Input */}
          <div
            style={{
              border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '28px',
              textAlign: 'center', marginBottom: '20px', cursor: 'pointer',
              background: docFile ? '#F0FDF4' : '#FAFAFA',
              borderColor: docFile ? '#86EFAC' : '#D1D5DB',
              transition: 'all 0.2s'
            }}
            onClick={() => document.getElementById('doc-file-input').click()}
          >
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setDocFile(file);
                  if (!docForm.nome) {
                    setDocForm(prev => ({ ...prev, nome: file.name.replace(/\.[^/.]+$/, '') }));
                  }
                }
              }}
            />
            {docFile ? (
              <div>
                <div style={{ fontSize: '28px', color: '#059669', marginBottom: '8px' }}>
                  {getFileIcon(docFile.name.split('.').pop())}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#166534' }}>{docFile.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  {formatFileSize(docFile.size)} — Clicca per cambiare file
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '28px', color: '#9CA3AF', marginBottom: '8px' }}>
                  <FaCloudUploadAlt />
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                  Clicca per selezionare un file
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                  PDF, Word, Excel, PowerPoint, TXT
                </div>
              </div>
            )}
          </div>

          {/* Nome */}
          <div className="form-group">
            <label>Nome Documento <span className="required">*</span></label>
            <input
              type="text"
              value={docForm.nome}
              onChange={e => setDocForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="es. Proposta Sponsorship 2025..."
            />
          </div>

          {/* Categoria */}
          <div className="form-group">
            <label>Categoria</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Object.entries(DOC_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDocForm(prev => ({ ...prev, categoria: key }))}
                  style={{
                    padding: '8px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                    cursor: 'pointer', border: '2px solid', transition: 'all 0.15s',
                    background: docForm.categoria === key ? cat.color : 'white',
                    color: docForm.categoria === key ? 'white' : cat.color,
                    borderColor: docForm.categoria === key ? cat.color : '#E5E7EB'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrizione */}
          <div className="form-group">
            <label>Descrizione <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>(opzionale)</span></label>
            <textarea
              value={docForm.descrizione}
              onChange={e => setDocForm(prev => ({ ...prev, descrizione: e.target.value }))}
              rows={2}
              placeholder="Breve descrizione del documento..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => setShowDocUploadModal(false)}>
              Annulla
            </button>
            <button
              className="sf-btn sf-btn-primary"
              onClick={handleUploadDocument}
              disabled={docUploading || !docFile}
              style={{ opacity: (docUploading || !docFile) ? 0.6 : 1 }}
            >
              {docUploading ? 'Caricamento...' : <><FaUpload /> Carica</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Document Delete Confirmation */}
      <Modal
        isOpen={showDocDeleteModal}
        onClose={() => { setShowDocDeleteModal(false); setDocToDelete(null); }}
        title="Elimina Documento"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '8px', color: '#374151' }}>
            Vuoi eliminare il documento <strong>{docToDelete?.nome}</strong>?
          </p>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
            Il file verrà rimosso definitivamente.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="sf-btn sf-btn-outline" onClick={() => { setShowDocDeleteModal(false); setDocToDelete(null); }}>
              Annulla
            </button>
            <button className="sf-btn sf-btn-danger" onClick={handleDeleteDocument}>
              <FaTrashAlt /> Elimina
            </button>
          </div>
        </div>
      </Modal>

      {/* Score Info Modal */}
      <Modal
        isOpen={showScoreInfoModal}
        onClose={() => setShowScoreInfoModal(false)}
        title="Come funziona il Lead Score"
      >
        <div style={{ padding: '20px 0' }}>
          {lead.score_config_custom && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
              <p style={{ fontSize: '13px', color: '#4338CA', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCog style={{ fontSize: '14px' }} />
                <strong>Algoritmo personalizzato:</strong> I pesi sono stati configurati dal tuo club.
              </p>
            </div>
          )}

          <p style={{ marginBottom: '16px', color: '#374151', lineHeight: 1.6 }}>
            Il <strong>Lead Score</strong> è un punteggio da 0 a 100 che indica la "temperatura" della lead,
            ovvero quanto è pronta per la conversione in sponsor. Più alto è il punteggio, più la lead è "calda".
          </p>

          {(() => {
            const thresholdCold = lead.score_thresholds?.cold || 33;
            const thresholdWarm = lead.score_thresholds?.warm || 66;
            return (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontWeight: 600, color: '#10B981' }}>{thresholdWarm + 1}-100: Lead Calda</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ fontWeight: 600, color: '#F59E0B' }}>{thresholdCold + 1}-{thresholdWarm}: Lead Tiepida</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ fontWeight: 600, color: '#EF4444' }}>0-{thresholdCold}: Lead Fredda</span>
                </div>
              </div>
            );
          })()}

          <h4 style={{ fontWeight: 700, color: '#1F2937', marginBottom: '12px', fontSize: '14px' }}>
            Come viene calcolato:
          </h4>

          <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                📋 Profilo Completo (max {lead.score_breakdown?.profile?.max || 15} punti)
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Dati aziendali compilati: ragione sociale, settore, P.IVA, email, telefono, sito web, indirizzo, logo.
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                💰 Potenziale Deal (max {lead.score_breakdown?.deal?.max || 25} punti)
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Valore stimato del deal, probabilità di chiusura e priorità assegnata.
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                📈 Engagement (max {lead.score_breakdown?.engagement?.max || 25} punti)
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Numero di attività registrate, follow-up completati, note aggiunte.
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                🔄 Pipeline (max {lead.score_breakdown?.pipeline?.max || 25} punti)
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Fase attuale nella pipeline (più avanzata = più punti) e velocità di avanzamento.
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                👥 Contatti (max {lead.score_breakdown?.contacts?.max || 10} punti)
              </div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>
                Numero di contatti decisionali identificati e loro completezza.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #D1FAE5' }}>
            <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>
              💡 <strong>Suggerimento:</strong> Per aumentare il lead score, completa i dati del profilo,
              registra le attività di contatto e avanza la lead nella pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="sf-btn sf-btn-primary" onClick={() => setShowScoreInfoModal(false)}>
              Ho capito
            </button>
          </div>
        </div>
      </Modal>

      {/* Asset Interest Modal */}
      <Modal
        isOpen={showAssetInterestModal}
        onClose={() => {
          setShowAssetInterestModal(false);
          setAssetSearchTerm('');
          setAssetCategoryFilter('');
        }}
        title="Seleziona Asset dal Catalogo"
      >
        <div style={{ padding: '16px 0' }}>
          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: '14px'
              }} />
              <input
                type="text"
                placeholder="Cerca asset..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <select
              value={assetCategoryFilter}
              onChange={(e) => setAssetCategoryFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="">Tutte le categorie</option>
              {getAssetCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Asset List */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #E5E7EB',
            borderRadius: '12px'
          }}>
            {getFilteredAssets().length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#6B7280'
              }}>
                <FaBoxOpen style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>
                  {inventoryAssets.length === 0
                    ? 'Nessun asset nel catalogo'
                    : 'Nessun asset trovato con questi filtri'}
                </p>
              </div>
            ) : (
              getFilteredAssets().map((asset, index) => (
                <div
                  key={asset.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 16px',
                    borderBottom: index < getFilteredAssets().length - 1 ? '1px solid #E5E7EB' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    handleAddAssetInterest(asset.id);
                    setShowAssetInterestModal(false);
                    setAssetSearchTerm('');
                    setAssetCategoryFilter('');
                  }}
                >
                  {/* Asset Image */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {asset.immagine_url ? (
                      <img
                        src={asset.immagine_url}
                        alt={asset.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FaImage style={{ fontSize: '20px', color: '#9CA3AF' }} />
                    )}
                  </div>

                  {/* Asset Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1A1A'
                    }}>
                      {asset.nome}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      {asset.categoria}
                      {asset.tipo && asset.tipo !== asset.categoria && ` • ${asset.tipo}`}
                    </p>
                  </div>

                  {/* Price */}
                  {asset.prezzo_listino > 0 && (
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#059669'
                    }}>
                      €{asset.prezzo_listino.toLocaleString()}
                    </span>
                  )}

                  {/* Add Icon */}
                  <FaPlus style={{ color: '#10B981', fontSize: '14px' }} />
                </div>
              ))
            )}
          </div>

          {/* Already selected info */}
          {assetInterests.length > 0 && (
            <p style={{
              marginTop: '12px',
              fontSize: '12px',
              color: '#6B7280',
              textAlign: 'center'
            }}>
              {assetInterests.length} asset già selezionat{assetInterests.length === 1 ? 'o' : 'i'}
            </p>
          )}
        </div>
      </Modal>

      {/* Proposal Status Modal */}
      <Modal
        isOpen={showProposalStatusModal}
        onClose={() => { setShowProposalStatusModal(false); setSelectedProposalForStatus(null); }}
        title="Cambia Stato Proposta"
      >
        <div style={{ padding: '20px 0' }}>
          {selectedProposalForStatus && (
            <>
              <p style={{ marginBottom: '20px', color: '#6B7280', fontSize: '14px' }}>
                Seleziona il nuovo stato per la proposta <strong>"{selectedProposalForStatus.titolo}"</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {[
                  { value: 'bozza', label: 'Bozza', bg: '#F3F4F6', color: '#6B7280', desc: 'Proposta in fase di preparazione' },
                  { value: 'inviata', label: 'Inviata', bg: '#DBEAFE', color: '#2563EB', desc: 'Proposta inviata al cliente' },
                  { value: 'visualizzata', label: 'Visualizzata', bg: '#FEF3C7', color: '#D97706', desc: 'Il cliente ha visualizzato la proposta' },
                  { value: 'in_trattativa', label: 'In Trattativa', bg: '#E0E7FF', color: '#4F46E5', desc: 'Negoziazione in corso' },
                  { value: 'accettata', label: 'Accettata', bg: '#D1FAE5', color: '#059669', desc: 'Proposta accettata dal cliente' },
                  { value: 'rifiutata', label: 'Rifiutata', bg: '#FEE2E2', color: '#DC2626', desc: 'Proposta rifiutata' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setNewProposalStatus(status.value)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: '12px',
                      border: newProposalStatus === status.value ? '2px solid #85FF00' : '1px solid #E5E7EB',
                      background: newProposalStatus === status.value ? '#F0FDF4' : 'white',
                      cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: status.color
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937', fontSize: '14px' }}>{status.label}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{status.desc}</div>
                      </div>
                    </div>
                    {newProposalStatus === status.value && (
                      <FaCheck style={{ color: '#059669', fontSize: '16px' }} />
                    )}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  className="sf-btn sf-btn-outline"
                  onClick={() => { setShowProposalStatusModal(false); setSelectedProposalForStatus(null); }}
                >
                  Annulla
                </button>
                <button
                  className="sf-btn sf-btn-primary"
                  onClick={handleUpdateProposalStatus}
                  disabled={!newProposalStatus || newProposalStatus === selectedProposalForStatus.stato}
                >
                  Conferma
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Support Widget */}
      <SupportWidget
        pageTitle="Dettaglio Lead"
        pageDescription="Gestisci ogni aspetto della trattativa: attività, contatti decisionali, prodotti nel deal, documenti allegati e storico delle fasi. Usa il lead score per valutare la maturità della trattativa."
        pageIcon={FaBuilding}
        docsSection="lead-detail"
        onStartTour={handleStartTour}
      />

      {/* Guided Tour */}
      <GuidedTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleTourClose}
        onComplete={handleTourClose}
      />

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

export default LeadDetail;
