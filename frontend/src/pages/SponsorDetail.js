import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubAPI, contractAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter,
  FaPhone, FaEnvelope, FaCalendarAlt, FaStickyNote, FaEllipsisH,
  FaArrowLeft, FaPen, FaTrashAlt, FaPlus, FaFileContract,
  FaUser, FaCheck, FaCircle, FaHistory,
  FaUsers, FaStar, FaFileAlt, FaCube, FaRoute, FaExternalLinkAlt,
  FaChartLine, FaFire, FaClock, FaFolder, FaFolderOpen, FaUpload,
  FaDownload, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel,
  FaFilePowerpoint, FaFileArchive, FaFileVideo, FaFileAudio, FaSearch,
  FaFilter, FaLink, FaTimes, FaEye, FaCopy, FaRedo, FaCheckCircle,
  FaHourglass, FaUserPlus, FaEuroSign, FaClipboardList
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';
import '../styles/form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const ACTIVITY_TYPES = {
  chiamata: { icon: <FaPhone />, label: 'Chiamata', className: 'call' },
  meeting: { icon: <FaCalendarAlt />, label: 'Meeting', className: 'meeting' },
  email: { icon: <FaEnvelope />, label: 'Email', className: 'email' },
  nota: { icon: <FaStickyNote />, label: 'Nota', className: 'note' },
  altro: { icon: <FaEllipsisH />, label: 'Altro', className: 'other' }
};

const ESITO_OPTIONS = {
  positivo: { label: 'Positivo', bgColor: '#D1FAE5', color: '#059669' },
  negativo: { label: 'Negativo', bgColor: '#FEE2E2', color: '#DC2626' },
  neutro: { label: 'Neutro', bgColor: '#F3F4F6', color: '#6B7280' },
  da_seguire: { label: 'Da seguire', bgColor: '#FEF3C7', color: '#D97706' }
};

function SponsorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const [sponsor, setSponsor] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contracts');
  const [toast, setToast] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  // Proposals
  const [proposals, setProposals] = useState([]);

  // Assets (inventario allocato)
  const [assets, setAssets] = useState([]);

  // Drive
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveStats, setDriveStats] = useState(null);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [editingDriveFile, setEditingDriveFile] = useState(null);
  const [driveFilter, setDriveFilter] = useState({ contract_id: '', categoria: '', search: '' });
  const [driveForm, setDriveForm] = useState({
    nome: '', file_url: '', descrizione: '', categoria: 'altro',
    contract_id: '', activation_id: '', inventory_asset_id: '', tags: []
  });
  const [showDriveDeleteModal, setShowDriveDeleteModal] = useState(false);
  const [driveFileToDelete, setDriveFileToDelete] = useState(null);

  // Invitation
  const [invitation, setInvitation] = useState(null);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sponsorRes, contractsRes, activitiesRes, contactsRes, notesRes, proposalsRes, assetsRes, driveRes, driveStatsRes, invitationRes] = await Promise.all([
        clubAPI.getSponsor(id),
        contractAPI.getContracts(),
        clubAPI.getSponsorActivities(id),
        clubAPI.getSponsorContacts(id),
        clubAPI.getSponsorNotes(id),
        clubAPI.getSponsorProposals(id),
        clubAPI.getSponsorAssets(id),
        clubAPI.getSponsorDrive(id),
        clubAPI.getSponsorDriveStats(id),
        clubAPI.getSponsorInvitation(id).catch(() => ({ data: { has_invitation: false } }))
      ]);
      setSponsor(sponsorRes.data);

      const allContracts = contractsRes.data.contracts || contractsRes.data || [];
      const sponsorContracts = allContracts.filter(
        c => (c.sponsor?.id === parseInt(id)) || (c.sponsor_id === parseInt(id))
      );

      setContracts(sponsorContracts);
      setActivities(activitiesRes.data || []);
      setContacts(contactsRes.data || []);
      setNotes(notesRes.data || []);
      setProposals(proposalsRes.data || []);
      setAssets(assetsRes.data?.assets || []);
      setDriveFiles(driveRes.data?.files || []);
      setDriveStats(driveStatsRes.data || null);
      setInvitation(invitationRes.data?.invitation || null);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await clubAPI.getSponsorActivities(id);
      setActivities(res.data || []);
    } catch (error) {
      console.error('Errore nel caricamento delle attività:', error);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa attività?')) return;

    try {
      await clubAPI.deleteSponsorActivity(id, activityId);
      setToast({ message: 'Attività eliminata con successo!', type: 'success' });
      fetchActivities();
    } catch (error) {
      console.error('Errore eliminazione attività:', error);
      setToast({ message: 'Errore durante l\'eliminazione dell\'attività', type: 'error' });
    }
  };

  const handleCompleteFollowup = async (activityId) => {
    try {
      await clubAPI.completeSponsorActivityFollowup(id, activityId);
      setToast({ message: 'Follow-up completato!', type: 'success' });
      fetchActivities();
    } catch (error) {
      console.error('Errore completamento follow-up:', error);
      setToast({ message: 'Errore durante il completamento del follow-up', type: 'error' });
    }
  };

  const handleConfirmedDelete = async () => {
    setShowConfirmModal(false);
    try {
      await clubAPI.deleteSponsor(id);
      setToast({ message: 'Sponsor eliminato con successo!', type: 'success' });
      setTimeout(() => navigate('/club/sponsors'), 1500);
    } catch (error) {
      console.error('Errore eliminazione sponsor:', error);
      setToast({ message: 'Errore durante l\'eliminazione dello sponsor', type: 'error' });
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
        await clubAPI.updateSponsorContact(id, editingContact.id, contactForm);
        setToast({ message: 'Contatto aggiornato', type: 'success' });
      } else {
        await clubAPI.createSponsorContact(id, contactForm);
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
      await clubAPI.setSponsorPrimaryContact(id, contactId);
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
      await clubAPI.deleteSponsorContact(id, contactToDelete.id);
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
        await clubAPI.updateSponsorNote(id, editingNote.id, noteForm);
        setToast({ message: 'Nota aggiornata', type: 'success' });
      } else {
        await clubAPI.createSponsorNote(id, noteForm);
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
      await clubAPI.deleteSponsorNote(id, noteId);
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

  // ==================== DRIVE HANDLERS ====================
  const DRIVE_CATEGORIES = [
    { value: 'contratto', label: 'Contratto', icon: <FaFileContract />, color: '#2563EB', bg: '#DBEAFE' },
    { value: 'fattura', label: 'Fattura', icon: <FaFile />, color: '#059669', bg: '#D1FAE5' },
    { value: 'creativita', label: 'Creatività', icon: <FaFileImage />, color: '#9333EA', bg: '#F3E8FF' },
    { value: 'report', label: 'Report', icon: <FaFileAlt />, color: '#D97706', bg: '#FEF3C7' },
    { value: 'presentazione', label: 'Presentazione', icon: <FaFilePowerpoint />, color: '#DC2626', bg: '#FEE2E2' },
    { value: 'altro', label: 'Altro', icon: <FaFile />, color: '#6B7280', bg: '#F3F4F6' },
  ];

  const getFileIcon = (estensione, fileType) => {
    const ext = (estensione || '').toLowerCase();
    if (['pdf'].includes(ext)) return <FaFilePdf style={{ color: '#DC2626' }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <FaFileImage style={{ color: '#9333EA' }} />;
    if (['doc', 'docx'].includes(ext)) return <FaFileWord style={{ color: '#2563EB' }} />;
    if (['xls', 'xlsx'].includes(ext)) return <FaFileExcel style={{ color: '#059669' }} />;
    if (['ppt', 'pptx'].includes(ext)) return <FaFilePowerpoint style={{ color: '#DC2626' }} />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FaFileArchive style={{ color: '#6B7280' }} />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return <FaFileVideo style={{ color: '#7C3AED' }} />;
    if (['mp3', 'wav', 'aac'].includes(ext)) return <FaFileAudio style={{ color: '#D97706' }} />;
    return <FaFile style={{ color: '#6B7280' }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openNewDriveFile = () => {
    setEditingDriveFile(null);
    setDriveForm({
      nome: '', file_url: '', descrizione: '', categoria: 'altro',
      contract_id: '', activation_id: '', inventory_asset_id: '', tags: []
    });
    setShowDriveModal(true);
  };

  const openEditDriveFile = (file) => {
    setEditingDriveFile(file);
    setDriveForm({
      nome: file.nome || '',
      file_url: file.file_url || '',
      descrizione: file.descrizione || '',
      categoria: file.categoria || 'altro',
      contract_id: file.contract_id || '',
      activation_id: file.activation_id || '',
      inventory_asset_id: file.inventory_asset_id || '',
      tags: file.tags || []
    });
    setShowDriveModal(true);
  };

  const handleSaveDriveFile = async () => {
    if (!driveForm.nome || !driveForm.file_url) {
      setToast({ message: 'Nome e URL file sono obbligatori', type: 'error' });
      return;
    }
    try {
      const payload = {
        ...driveForm,
        contract_id: driveForm.contract_id || null,
        activation_id: driveForm.activation_id || null,
        inventory_asset_id: driveForm.inventory_asset_id || null
      };
      if (editingDriveFile) {
        await clubAPI.updateSponsorDriveFile(id, editingDriveFile.id, payload);
        setToast({ message: 'File aggiornato', type: 'success' });
      } else {
        await clubAPI.uploadSponsorDriveFile(id, payload);
        setToast({ message: 'File caricato', type: 'success' });
      }
      setShowDriveModal(false);
      fetchData();
    } catch (error) {
      console.error('Errore salvataggio file:', error);
      setToast({ message: 'Errore nel salvataggio del file', type: 'error' });
    }
  };

  const handleDeleteDriveFileClick = (file) => {
    setDriveFileToDelete(file);
    setShowDriveDeleteModal(true);
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!driveFileToDelete) return;
    try {
      await clubAPI.deleteSponsorDriveFile(id, driveFileToDelete.id);
      setToast({ message: 'File eliminato', type: 'success' });
      fetchData();
    } catch (error) {
      console.error('Errore eliminazione file:', error);
      setToast({ message: 'Errore eliminazione file', type: 'error' });
    } finally {
      setShowDriveDeleteModal(false);
      setDriveFileToDelete(null);
    }
  };

  const getFilteredDriveFiles = () => {
    let filtered = driveFiles;
    if (driveFilter.contract_id) {
      filtered = filtered.filter(f => f.contract_id === parseInt(driveFilter.contract_id));
    }
    if (driveFilter.categoria) {
      filtered = filtered.filter(f => f.categoria === driveFilter.categoria);
    }
    if (driveFilter.search) {
      const search = driveFilter.search.toLowerCase();
      filtered = filtered.filter(f => f.nome.toLowerCase().includes(search));
    }
    return filtered;
  };

  const getCategoryConfig = (categoria) => {
    return DRIVE_CATEGORIES.find(c => c.value === categoria) || DRIVE_CATEGORIES[DRIVE_CATEGORIES.length - 1];
  };

  const getContractStatus = (contract) => {
    const now = new Date();
    const dataInizio = new Date(contract.data_inizio);
    const dataFine = new Date(contract.data_fine);

    if (contract.status === 'bozza') return { label: 'Bozza', className: 'draft' };
    if (now < dataInizio) return { label: 'In attesa', className: 'pending' };
    if (now > dataFine) return { label: 'Scaduto', className: 'expired' };
    return { label: 'Attivo', className: 'active' };
  };

  const getActiveContracts = () => {
    return contracts.filter(c => getContractStatus(c).label === 'Attivo');
  };

  const getTotalValue = () => {
    return getActiveContracts().reduce((sum, c) => sum + (c.compenso || 0), 0);
  };

  const getPendingFollowups = () => {
    return activities.filter(a => a.data_followup && !a.followup_completato).length;
  };

  // ==================== INVITATION HANDLERS ====================
  const getInvitationLink = () => {
    if (!invitation?.token) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/sponsor/${invitation.token}`;
  };

  const handleCopyInvitationLink = async () => {
    const link = getInvitationLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setToast({ message: 'Link copiato negli appunti!', type: 'success' });
    } catch (err) {
      console.error('Errore copia link:', err);
      setToast({ message: 'Errore nella copia del link', type: 'error' });
    }
  };

  const handleRegenerateInvitation = async () => {
    if (invitationLoading) return;

    setInvitationLoading(true);
    try {
      const res = await clubAPI.regenerateSponsorInvitation(id);
      setInvitation(res.data.invitation);
      setToast({ message: 'Nuovo link di invito generato!', type: 'success' });
    } catch (error) {
      console.error('Errore rigenerazione invito:', error);
      setToast({ message: error.response?.data?.error || 'Errore nella rigenerazione dell\'invito', type: 'error' });
    } finally {
      setInvitationLoading(false);
    }
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!sponsor) {
    return <div className="sd-page"><div className="sd-loading">Sponsor non trovato</div></div>;
  }

  const isPending = sponsor.membership_status === 'pending';
  const isActive = getActiveContracts().length > 0;
  const initials = (sponsor.ragione_sociale || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Profile Card */}
        <div className="sd-profile-card">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/club/sponsors')}>
              <FaArrowLeft />
            </button>
            <div className="sd-header-actions">
              <button className="sd-header-btn edit" onClick={() => navigate(`/club/sponsors/${id}/edit`)}>
                <FaPen />
              </button>
              <button className="sd-header-btn delete" onClick={() => setShowConfirmModal(true)}>
                <FaTrashAlt />
              </button>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              {sponsor.logo_url ? (
                <img
                  src={sponsor.logo_url.startsWith('http') ? sponsor.logo_url : `${API_URL.replace('/api', '')}${sponsor.logo_url}`}
                  alt={sponsor.ragione_sociale}
                />
              ) : (
                <div className="sd-profile-avatar-placeholder">{initials}</div>
              )}
            </div>
            <h1 className="sd-profile-name">{sponsor.ragione_sociale}</h1>
            <p className="sd-profile-sector">{sponsor.settore_merceologico || 'Partnership'}</p>
            <span className={`sd-profile-status ${isPending ? 'pending' : (isActive ? 'active' : 'inactive')}`}>
              <FaCircle /> {isPending ? 'In attesa' : (isActive ? 'Attivo' : 'Inattivo')}
            </span>
          </div>


          {/* Joined Status - Se ha accettato */}
          {sponsor.membership_status === 'active' && sponsor.data_adesione && (
            <div style={{
              margin: '0 16px 16px',
              padding: '12px 16px',
              background: '#D1FAE5',
              borderRadius: '10px',
              border: '1px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaCheckCircle style={{ color: '#059669', fontSize: '16px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#065F46', fontWeight: 600 }}>
                  Sponsor registrato
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#047857' }}>
                  Dal {new Date(sponsor.data_adesione).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Contact Info */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Contatti</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Email</span>
                  <span className="sd-info-value">{sponsor.email}</span>
                </div>
                {sponsor.telefono && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Telefono</span>
                    <span className="sd-info-value">{sponsor.telefono}</span>
                  </div>
                )}
                {sponsor.sito_web && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Sito Web</span>
                    <span className="sd-info-value">
                      <a href={sponsor.sito_web} target="_blank" rel="noopener noreferrer">
                        {sponsor.sito_web.replace(/^https?:\/\//, '').split('/')[0]}
                      </a>
                    </span>
                  </div>
                )}
                {sponsor.indirizzo_sede && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Indirizzo</span>
                    <span className="sd-info-value">{sponsor.indirizzo_sede}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fiscal Data */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dati Aziendali</h3>
              <div className="sd-info-list">
                {sponsor.partita_iva ? (
                  <div className="sd-info-item">
                    <span className="sd-info-label">P.IVA</span>
                    <span className="sd-info-value mono">{sponsor.partita_iva}</span>
                  </div>
                ) : null}
                {sponsor.codice_fiscale ? (
                  <div className="sd-info-item">
                    <span className="sd-info-label">C.F.</span>
                    <span className="sd-info-value mono">{sponsor.codice_fiscale}</span>
                  </div>
                ) : null}
                {!sponsor.partita_iva && !sponsor.codice_fiscale && (
                  <span className="sd-empty-info">Nessun dato fiscale inserito</span>
                )}
              </div>
            </div>

            {/* Contatti */}
            <div className="sd-profile-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 className="sd-section-title" style={{ margin: 0 }}>
                  <FaUsers style={{ marginRight: '6px', fontSize: '13px' }} />
                  Contatti ({contacts.length})
                </h3>
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
                <a
                  href={sponsor.facebook || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sd-social-btn ${!sponsor.facebook ? 'disabled' : ''}`}
                  style={{ '--social-color': '#1877F2' }}
                >
                  <FaFacebook style={{ color: sponsor.facebook ? '#1877F2' : undefined }} />
                </a>
                <a
                  href={sponsor.instagram || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sd-social-btn ${!sponsor.instagram ? 'disabled' : ''}`}
                  style={{ '--social-color': '#E4405F' }}
                >
                  <FaInstagram style={{ color: sponsor.instagram ? '#E4405F' : undefined }} />
                </a>
                <a
                  href={sponsor.tiktok || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sd-social-btn ${!sponsor.tiktok ? 'disabled' : ''}`}
                  style={{ '--social-color': '#000000' }}
                >
                  <FaTiktok style={{ color: sponsor.tiktok ? '#000000' : undefined }} />
                </a>
                <a
                  href={sponsor.linkedin || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sd-social-btn ${!sponsor.linkedin ? 'disabled' : ''}`}
                  style={{ '--social-color': '#0A66C2' }}
                >
                  <FaLinkedin style={{ color: sponsor.linkedin ? '#0A66C2' : undefined }} />
                </a>
                <a
                  href={sponsor.twitter || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`sd-social-btn ${!sponsor.twitter ? 'disabled' : ''}`}
                  style={{ '--social-color': '#1DA1F2' }}
                >
                  <FaTwitter style={{ color: sponsor.twitter ? '#1DA1F2' : undefined }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Invitation Banner - Solo se pending */}
          {isPending && (
            <div style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #252525 100%)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FaUserPlus style={{ color: '#1A1A1A', fontSize: '14px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                      Invita lo Sponsor
                    </div>
                    {invitation && (
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        Scade {new Date(invitation.expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </div>
                </div>

                {invitation ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '500px', minWidth: '280px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      background: '#0A0A0A',
                      borderRadius: '8px',
                      padding: '2px 2px 2px 12px',
                      border: '1px solid #333'
                    }}>
                      <input
                        type="text"
                        value={getInvitationLink()}
                        readOnly
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          fontSize: '12px',
                          color: '#9CA3AF',
                          outline: 'none',
                          fontFamily: 'monospace',
                          minWidth: 0
                        }}
                      />
                      <button
                        onClick={handleCopyInvitationLink}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: copiedLink ? '#059669' : 'white',
                          color: copiedLink ? 'white' : '#1A1A1A',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {copiedLink ? <FaCheck size={11} /> : <FaCopy size={11} />}
                        {copiedLink ? 'Copiato!' : 'Copia'}
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerateInvitation}
                      disabled={invitationLoading}
                      title="Genera nuovo link"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'white',
                        color: '#1A1A1A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: invitationLoading ? 0.5 : 1,
                        flexShrink: 0
                      }}
                    >
                      <FaRedo style={{ fontSize: '11px' }} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleRegenerateInvitation}
                    disabled={invitationLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#85FF00',
                      color: '#1A1A1A',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      opacity: invitationLoading ? 0.7 : 1
                    }}
                  >
                    <FaLink size={12} /> {invitationLoading ? 'Generazione...' : 'Genera Link'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="tp-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="tp-stat-card-dark" style={{ flex: 1 }}>
              <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
                <FaFileContract style={{ color: '#1F2937' }} />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{contracts.length}</div>
                <div className="tp-stat-label">Contratti Totali</div>
              </div>
            </div>
            <div className="tp-stat-card-dark" style={{ flex: 1 }}>
              <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
                <FaCheck style={{ color: '#1F2937' }} />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">{getActiveContracts().length}</div>
                <div className="tp-stat-label">Contratti Attivi</div>
              </div>
            </div>
            <div className="tp-stat-card-dark" style={{ flex: 1 }}>
              <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
                <FaEuroSign style={{ color: '#1F2937' }} />
              </div>
              <div className="tp-stat-content">
                <div className="tp-stat-value">€{getTotalValue().toLocaleString()}</div>
                <div className="tp-stat-label">Valore Totale</div>
              </div>
            </div>
          </div>

          {/* Lead Journey - Se lo sponsor proviene da una Lead */}
          {sponsor.lead_journey && (
            <div style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              border: '1px solid #C7D2FE'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '18px'
                  }}>
                    <FaRoute />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E1B4B' }}>
                      Percorso da Lead
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6366F1' }}>
                      Questo sponsor è stato convertito da una Lead
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/club/leads/${sponsor.lead_journey.lead_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'white', border: '1px solid #C7D2FE',
                    color: '#4F46E5', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <FaExternalLinkAlt style={{ fontSize: '11px' }} /> Vedi Lead
                </button>
              </div>

              {/* Journey Timeline */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  background: 'white', padding: '12px', borderRadius: '10px',
                  border: '1px solid #E0E7FF'
                }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                    <FaClock style={{ marginRight: '4px' }} /> Lead Creata
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                    {sponsor.lead_journey.created_at ?
                      new Date(sponsor.lead_journey.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '-'}
                  </div>
                </div>

                <div style={{
                  background: 'white', padding: '12px', borderRadius: '10px',
                  border: '1px solid #E0E7FF'
                }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                    <FaChartLine style={{ marginRight: '4px' }} /> Fasi Attraversate
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                    {sponsor.lead_journey.stage_history?.length || 0} fasi
                  </div>
                </div>

                <div style={{
                  background: 'white', padding: '12px', borderRadius: '10px',
                  border: '1px solid #E0E7FF'
                }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                    <FaFire style={{ marginRight: '4px' }} /> Ultimo Score
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                    {sponsor.lead_journey.ultimo_score || '-'}/100
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                  padding: '12px', borderRadius: '10px',
                  border: '1px solid #6EE7B7'
                }}>
                  <div style={{ fontSize: '11px', color: '#047857', marginBottom: '4px' }}>
                    <FaCheck style={{ marginRight: '4px' }} /> Convertita il
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#047857' }}>
                    {sponsor.lead_journey.data_conversione ?
                      new Date(sponsor.lead_journey.data_conversione).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : '-'}
                  </div>
                </div>
              </div>

              {/* Stage History Timeline */}
              {sponsor.lead_journey.stage_history && sponsor.lead_journey.stage_history.length > 0 && (
                <div style={{
                  background: 'white', borderRadius: '10px', padding: '14px',
                  border: '1px solid #E0E7FF'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#4F46E5', marginBottom: '10px' }}>
                    Evoluzione nella Pipeline
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {sponsor.lead_journey.stage_history.map((stage, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px',
                          background: stage.stage_name === 'vinto' ? '#D1FAE5' :
                                     stage.stage_name === 'perso' ? '#FEE2E2' : '#F3F4F6',
                          color: stage.stage_name === 'vinto' ? '#059669' :
                                stage.stage_name === 'perso' ? '#DC2626' : '#374151',
                          fontSize: '12px', fontWeight: 500
                        }}>
                          {stage.stage_name}
                        </span>
                        {idx < sponsor.lead_journey.stage_history.length - 1 && (
                          <span style={{ color: '#D1D5DB' }}>→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fonte */}
              {sponsor.lead_journey.fonte && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#6366F1' }}>
                  <strong>Fonte Lead:</strong> {sponsor.lead_journey.fonte}
                </div>
              )}
            </div>
          )}

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            {/* Tabs Navigation - Organized by Areas */}
            <div className="sd-tabs-nav">
              {/* Area Commerciale */}
              <div className="sd-tab-group">
                <span className="sd-tab-group-label">Commerciale</span>
                <div className="sd-tab-group-buttons">
                  <button
                    className={`sd-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proposals')}
                  >
                    <span className="sd-tab-icon"><FaFileAlt /></span>
                    Proposte
                    <span className="sd-tab-count">{proposals.length}</span>
                  </button>
                  <button
                    className={`sd-tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contracts')}
                  >
                    <span className="sd-tab-icon"><FaFileContract /></span>
                    Contratti
                    <span className="sd-tab-count">{contracts.length}</span>
                  </button>
                </div>
              </div>

              <div className="sd-tab-divider" />

              {/* Area Risorse */}
              <div className="sd-tab-group">
                <span className="sd-tab-group-label">Risorse</span>
                <div className="sd-tab-group-buttons">
                  <button
                    className={`sd-tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assets')}
                  >
                    <span className="sd-tab-icon"><FaCube /></span>
                    Inventario
                    <span className="sd-tab-count">{assets.length}</span>
                  </button>
                  <button
                    className={`sd-tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drive')}
                  >
                    <span className="sd-tab-icon"><FaFolder /></span>
                    Drive
                    <span className="sd-tab-count">{driveFiles.length}</span>
                  </button>
                </div>
              </div>

              <div className="sd-tab-divider" />

              {/* Area CRM */}
              <div className="sd-tab-group">
                <span className="sd-tab-group-label">CRM</span>
                <div className="sd-tab-group-buttons">
                  <button
                    className={`sd-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activities')}
                  >
                    <span className="sd-tab-icon"><FaHistory /></span>
                    Attività
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
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Contracts Tab */}
              {activeTab === 'contracts' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFileContract /> Contratti</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => navigate('/club/contracts/new')}>
                      <FaPlus /> Nuovo Contratto
                    </button>
                  </div>

                  {contracts.length > 0 ? (
                    <div className="sd-contracts-list">
                      {contracts.map(contract => {
                        const status = getContractStatus(contract);
                        const dataInizio = new Date(contract.data_inizio);
                        const dataFine = new Date(contract.data_fine);
                        const durataGiorni = Math.ceil((dataFine - dataInizio) / (1000 * 60 * 60 * 24));
                        const oggi = new Date();
                        const giorniRimanenti = Math.ceil((dataFine - oggi) / (1000 * 60 * 60 * 24));

                        return (
                          <div
                            key={contract.id}
                            className="sd-contract-card"
                            onClick={() => navigate(`/club/contracts/${contract.id}`)}
                          >
                            <div className="sd-contract-top">
                              <div>
                                <h3 className="sd-contract-title">{contract.nome_contratto}</h3>
                                {contract.descrizione && (
                                  <p className="sd-contract-desc">{contract.descrizione}</p>
                                )}
                              </div>
                              <span className={`sd-contract-status ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="sd-contract-stats">
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Compenso</div>
                                <div className="sd-contract-stat-value highlight">
                                  €{contract.compenso?.toLocaleString()}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Inizio</div>
                                <div className="sd-contract-stat-value">
                                  {dataInizio.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Fine</div>
                                <div className="sd-contract-stat-value">
                                  {dataFine.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Durata</div>
                                <div className="sd-contract-stat-value">{Math.ceil(durataGiorni / 30)} mesi</div>
                                {status.label === 'Attivo' && giorniRimanenti > 0 && (
                                  <div className="sd-contract-stat-hint">{giorniRimanenti} giorni rimasti</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFileContract /></div>
                      <h3 className="sd-empty-title">Nessun contratto</h3>
                      <p className="sd-empty-desc">Non ci sono ancora contratti per questo sponsor</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => navigate('/club/contracts/new')}>
                        <FaPlus /> Crea primo contratto
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaHistory /> Registro Attività</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => navigate(`/club/sponsors/${id}/activities/new`)}>
                      <FaPlus /> Nuova Attività
                    </button>
                  </div>

                  {activities.length > 0 ? (
                    <div className="sd-timeline">
                      {activities.map((activity) => {
                        const typeInfo = ACTIVITY_TYPES[activity.tipo] || ACTIVITY_TYPES.altro;
                        const esitoInfo = activity.esito ? ESITO_OPTIONS[activity.esito] : null;
                        const dataAttivita = new Date(activity.data_attivita);
                        const hasFollowup = activity.data_followup && !activity.followup_completato;
                        const followupDate = activity.data_followup ? new Date(activity.data_followup) : null;
                        const isFollowupOverdue = followupDate && followupDate < new Date() && !activity.followup_completato;

                        return (
                          <div key={activity.id} className="sd-timeline-item">
                            <div className={`sd-timeline-icon ${typeInfo.className}`}>
                              {typeInfo.icon}
                            </div>
                            <div className="sd-timeline-body">
                              <div className="sd-timeline-top">
                                <div>
                                  <div className="sd-timeline-badges">
                                    <span className="sd-badge" style={{
                                      background: typeInfo.className === 'call' ? '#D1FAE5' :
                                                 typeInfo.className === 'meeting' ? '#DBEAFE' :
                                                 typeInfo.className === 'email' ? '#FEF3C7' :
                                                 typeInfo.className === 'note' ? '#F3E8FF' : '#F3F4F6',
                                      color: typeInfo.className === 'call' ? '#059669' :
                                             typeInfo.className === 'meeting' ? '#2563EB' :
                                             typeInfo.className === 'email' ? '#D97706' :
                                             typeInfo.className === 'note' ? '#9333EA' : '#6B7280'
                                    }}>
                                      {typeInfo.label}
                                    </span>
                                    {esitoInfo && (
                                      <span className="sd-badge" style={{ background: esitoInfo.bgColor, color: esitoInfo.color }}>
                                        {esitoInfo.label}
                                      </span>
                                    )}
                                    {isFollowupOverdue && (
                                      <span className="sd-badge" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                        Follow-up scaduto
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="sd-timeline-title">{activity.titolo}</h4>
                                </div>
                                <div className="sd-timeline-actions">
                                  <button
                                    className="sd-action-btn"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/club/sponsors/${id}/activities/${activity.id}/edit`); }}
                                  >
                                    <FaPen />
                                  </button>
                                  <button
                                    className="sd-action-btn delete"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.id); }}
                                  >
                                    <FaTrashAlt />
                                  </button>
                                </div>
                              </div>

                              {activity.descrizione && (
                                <p className="sd-timeline-desc">{activity.descrizione}</p>
                              )}

                              <div className="sd-timeline-meta">
                                <span>
                                  <FaCalendarAlt /> {dataAttivita.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })} alle {dataAttivita.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {activity.contatto_nome && (
                                  <span><FaUser /> {activity.contatto_nome}</span>
                                )}
                                {hasFollowup && (
                                  <span style={{ color: isFollowupOverdue ? '#DC2626' : '#D97706' }}>
                                    Follow-up: {followupDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                    <button
                                      className="sd-followup-btn"
                                      onClick={(e) => { e.stopPropagation(); handleCompleteFollowup(activity.id); }}
                                    >
                                      <FaCheck /> Fatto
                                    </button>
                                  </span>
                                )}
                                {activity.followup_completato && (
                                  <span style={{ color: '#059669' }}><FaCheck /> Follow-up completato</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaHistory /></div>
                      <h3 className="sd-empty-title">Nessuna attività</h3>
                      <p className="sd-empty-desc">Inizia a tracciare chiamate, meeting ed email</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => navigate(`/club/sponsors/${id}/activities/new`)}>
                        <FaPlus /> Registra attività
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Proposals Tab */}
              {activeTab === 'proposals' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFileAlt /> Proposte Commerciali</h2>
                    <button className="sd-btn sd-btn-primary" onClick={() => navigate('/club/proposals/new')}>
                      <FaPlus /> Nuova Proposta
                    </button>
                  </div>

                  {proposals.length > 0 ? (
                    <div className="sd-contracts-list">
                      {proposals.map(proposal => {
                        const statusColors = {
                          bozza: { bg: '#F3F4F6', color: '#6B7280' },
                          inviata: { bg: '#DBEAFE', color: '#2563EB' },
                          visualizzata: { bg: '#FEF3C7', color: '#D97706' },
                          accettata: { bg: '#D1FAE5', color: '#059669' },
                          rifiutata: { bg: '#FEE2E2', color: '#DC2626' }
                        };
                        const statusLabels = {
                          bozza: 'Bozza',
                          inviata: 'Inviata',
                          visualizzata: 'Visualizzata',
                          accettata: 'Accettata',
                          rifiutata: 'Rifiutata'
                        };
                        const statusConfig = statusColors[proposal.status] || statusColors.bozza;

                        return (
                          <div
                            key={proposal.id}
                            className="sd-contract-card"
                            onClick={() => navigate(`/club/proposals/${proposal.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="sd-contract-top">
                              <div>
                                <h3 className="sd-contract-title">{proposal.titolo}</h3>
                                {proposal.descrizione && (
                                  <p className="sd-contract-desc">{proposal.descrizione}</p>
                                )}
                              </div>
                              <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                background: statusConfig.bg, color: statusConfig.color
                              }}>
                                {statusLabels[proposal.status] || proposal.status}
                              </span>
                            </div>
                            <div className="sd-contract-stats">
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Valore</div>
                                <div className="sd-contract-stat-value highlight">
                                  €{(proposal.valore_totale || 0).toLocaleString()}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Elementi</div>
                                <div className="sd-contract-stat-value">
                                  {proposal.items_count || 0}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Creata il</div>
                                <div className="sd-contract-stat-value">
                                  {new Date(proposal.created_at).toLocaleDateString('it-IT', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </div>
                              </div>
                              {proposal.visualizzata_at && (
                                <div className="sd-contract-stat">
                                  <div className="sd-contract-stat-label">Visualizzata</div>
                                  <div className="sd-contract-stat-value">
                                    {new Date(proposal.visualizzata_at).toLocaleDateString('it-IT', {
                                      day: '2-digit', month: 'short'
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFileAlt /></div>
                      <h3 className="sd-empty-title">Nessuna proposta</h3>
                      <p className="sd-empty-desc">Non ci sono ancora proposte per questo sponsor</p>
                      <button className="sd-btn sd-btn-primary" onClick={() => navigate('/club/proposals/new')}>
                        <FaPlus /> Crea prima proposta
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Assets/Inventory Tab */}
              {activeTab === 'assets' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaCube /> Inventario Allocato</h2>
                  </div>

                  {assets.length > 0 ? (
                    <div className="sd-contracts-list">
                      {assets.map(asset => {
                        const statusColors = {
                          disponibile: { bg: '#D1FAE5', color: '#059669', label: 'Disponibile' },
                          prenotato: { bg: '#FEF3C7', color: '#D97706', label: 'Prenotato' },
                          venduto: { bg: '#DBEAFE', color: '#2563EB', label: 'Venduto' },
                          in_uso: { bg: '#E0E7FF', color: '#4F46E5', label: 'In Uso' }
                        };
                        const statusConfig = statusColors[asset.stato] || statusColors.disponibile;

                        return (
                          <div
                            key={asset.id}
                            className="sd-contract-card"
                            onClick={() => navigate(`/club/inventory/${asset.id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="sd-contract-top">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {asset.immagine_url && (
                                  <img
                                    src={asset.immagine_url.startsWith('http') ? asset.immagine_url : `${API_URL.replace('/api', '')}${asset.immagine_url}`}
                                    alt={asset.nome}
                                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                                  />
                                )}
                                <div>
                                  <h3 className="sd-contract-title">{asset.nome}</h3>
                                  <p className="sd-contract-desc">{asset.categoria}</p>
                                </div>
                              </div>
                              <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                background: statusConfig.bg, color: statusConfig.color
                              }}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <div className="sd-contract-stats">
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Valore</div>
                                <div className="sd-contract-stat-value highlight">
                                  €{(asset.prezzo || 0).toLocaleString()}
                                </div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Quantità Tot.</div>
                                <div className="sd-contract-stat-value">{asset.quantita_totale || 0}</div>
                              </div>
                              <div className="sd-contract-stat">
                                <div className="sd-contract-stat-label">Allocati</div>
                                <div className="sd-contract-stat-value">{asset.quantita_allocata || 1}</div>
                              </div>
                              {asset.posizione && (
                                <div className="sd-contract-stat">
                                  <div className="sd-contract-stat-label">Posizione</div>
                                  <div className="sd-contract-stat-value">{asset.posizione}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaCube /></div>
                      <h3 className="sd-empty-title">Nessun asset allocato</h3>
                      <p className="sd-empty-desc">Questo sponsor non ha ancora asset dell'inventario allocati</p>
                    </div>
                  )}
                </>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaStickyNote /> Note</h2>
                    <button className="sd-btn sd-btn-primary" onClick={openNewNote}>
                      <FaPlus /> Nuova Nota
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaStickyNote /></div>
                      <h3 className="sd-empty-title">Nessuna nota</h3>
                      <p className="sd-empty-desc">Aggiungi note per tracciare l'evoluzione delle conversazioni</p>
                      <button className="sd-btn sd-btn-outline" onClick={openNewNote}>
                        <FaPlus /> Aggiungi Nota
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px 24px' }}>
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
                                    fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Drive Tab */}
              {activeTab === 'drive' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaFolder /> Drive Condiviso</h2>
                    <button className="sd-btn sd-btn-primary" onClick={openNewDriveFile}>
                      <FaUpload /> Carica File
                    </button>
                  </div>

                  {/* Drive Stats */}
                  {driveStats && (
                    <div style={{ padding: '0 24px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}>
                        <FaFile style={{ color: '#059669' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{driveStats.total_files}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>File totali</div>
                        </div>
                      </div>
                      <div style={{
                        padding: '12px 16px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE',
                        display: 'flex', alignItems: 'center', gap: '10px'
                      }}>
                        <FaFolder style={{ color: '#2563EB' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#2563EB' }}>{formatFileSize(driveStats.total_size_bytes)}</div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>Spazio usato</div>
                        </div>
                      </div>
                      {driveStats.files_with_contract > 0 && (
                        <div style={{
                          padding: '12px 16px', borderRadius: '10px', background: '#FEF3C7', border: '1px solid #FDE68A',
                          display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                          <FaLink style={{ color: '#D97706' }} />
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#D97706' }}>{driveStats.files_with_contract}</div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>Collegati a contratti</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filters */}
                  <div style={{ padding: '0 24px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                      <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '13px' }} />
                      <input
                        type="text"
                        placeholder="Cerca file..."
                        value={driveFilter.search}
                        onChange={(e) => setDriveFilter({ ...driveFilter, search: e.target.value })}
                        style={{
                          width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                          border: '1px solid #E5E7EB', fontSize: '13px'
                        }}
                      />
                    </div>
                    <select
                      value={driveFilter.categoria}
                      onChange={(e) => setDriveFilter({ ...driveFilter, categoria: e.target.value })}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                        fontSize: '13px', background: 'white', minWidth: '140px'
                      }}
                    >
                      <option value="">Tutte le categorie</option>
                      {DRIVE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <select
                      value={driveFilter.contract_id}
                      onChange={(e) => setDriveFilter({ ...driveFilter, contract_id: e.target.value })}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                        fontSize: '13px', background: 'white', minWidth: '160px'
                      }}
                    >
                      <option value="">Tutti i contratti</option>
                      {contracts.map(c => (
                        <option key={c.id} value={c.id}>{c.nome_contratto}</option>
                      ))}
                    </select>
                    {(driveFilter.search || driveFilter.categoria || driveFilter.contract_id) && (
                      <button
                        onClick={() => setDriveFilter({ contract_id: '', categoria: '', search: '' })}
                        style={{
                          padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB',
                          background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                          color: '#6B7280', fontSize: '13px'
                        }}
                      >
                        <FaTimes /> Resetta
                      </button>
                    )}
                  </div>

                  {getFilteredDriveFiles().length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaFolderOpen /></div>
                      <h3 className="sd-empty-title">
                        {driveFiles.length === 0 ? 'Nessun file nel drive' : 'Nessun file trovato'}
                      </h3>
                      <p className="sd-empty-desc">
                        {driveFiles.length === 0
                          ? 'Carica il primo file per condividerlo con lo sponsor'
                          : 'Prova a modificare i filtri di ricerca'}
                      </p>
                      {driveFiles.length === 0 && (
                        <button className="sd-btn sd-btn-primary" onClick={openNewDriveFile}>
                          <FaUpload /> Carica primo file
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '0 24px 24px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px'
                      }}>
                        {getFilteredDriveFiles().map(file => {
                          const catConfig = getCategoryConfig(file.categoria);
                          return (
                            <div key={file.id} style={{
                              background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB',
                              overflow: 'hidden', transition: 'all 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                            >
                              {/* File Preview/Icon */}
                              <div style={{
                                height: '100px', background: '#F9FAFB',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid #F3F4F6', position: 'relative'
                              }}>
                                {file.thumbnail_url ? (
                                  <img src={file.thumbnail_url} alt={file.nome} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontSize: '36px' }}>{getFileIcon(file.estensione, file.file_type)}</span>
                                )}
                                {/* Category Badge */}
                                <span style={{
                                  position: 'absolute', top: '8px', right: '8px',
                                  padding: '3px 8px', borderRadius: '6px',
                                  background: catConfig.bg, color: catConfig.color,
                                  fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                  {catConfig.icon} {catConfig.label}
                                </span>
                              </div>

                              {/* File Info */}
                              <div style={{ padding: '14px' }}>
                                <h4 style={{
                                  margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: '#1F2937',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}>
                                  {file.nome}
                                </h4>
                                {file.descrizione && (
                                  <p style={{
                                    margin: '0 0 8px', fontSize: '12px', color: '#6B7280',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                  }}>
                                    {file.descrizione}
                                  </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#9CA3AF' }}>
                                  <span>{formatFileSize(file.file_size)}</span>
                                  <span>•</span>
                                  <span>{new Date(file.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                                  {file.contract_nome && (
                                    <>
                                      <span>•</span>
                                      <span style={{ color: '#2563EB' }}><FaLink style={{ fontSize: '9px' }} /> {file.contract_nome}</span>
                                    </>
                                  )}
                                </div>

                                {/* Actions */}
                                <div style={{
                                  display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px',
                                  borderTop: '1px solid #F3F4F6'
                                }}>
                                  <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB',
                                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      gap: '6px', color: '#374151', fontSize: '12px', textDecoration: 'none',
                                      fontWeight: 500
                                    }}
                                  >
                                    <FaEye /> Apri
                                  </a>
                                  <a
                                    href={file.file_url}
                                    download
                                    style={{
                                      flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB',
                                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      gap: '6px', color: '#374151', fontSize: '12px', textDecoration: 'none',
                                      fontWeight: 500
                                    }}
                                  >
                                    <FaDownload /> Scarica
                                  </a>
                                  <button
                                    onClick={() => openEditDriveFile(file)}
                                    style={{
                                      padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E7EB',
                                      background: 'white', cursor: 'pointer', color: '#6B7280', fontSize: '12px'
                                    }}
                                  >
                                    <FaPen />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDriveFileClick(file)}
                                    style={{
                                      padding: '8px 10px', borderRadius: '6px', border: '1px solid #FEE2E2',
                                      background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', fontSize: '12px'
                                    }}
                                  >
                                    <FaTrashAlt />
                                  </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Elimina Sponsor"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            Sei sicuro di voler eliminare <strong>{sponsor?.ragione_sociale}</strong>?
            Questa azione non può essere annullata e verranno eliminati anche tutti i contratti associati.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="sd-btn sd-btn-outline" onClick={() => setShowConfirmModal(false)}>
              Annulla
            </button>
            <button
              className="sd-btn"
              style={{ background: '#EF4444', color: 'white' }}
              onClick={handleConfirmedDelete}
            >
              Elimina Sponsor
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
            <button className="sd-btn sd-btn-outline" onClick={() => setShowNoteModal(false)}>
              Annulla
            </button>
            <button className="sd-btn sd-btn-primary" onClick={handleSaveNote}>
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
            <button className="sd-btn sd-btn-outline" onClick={() => setShowContactModal(false)}>
              Annulla
            </button>
            <button className="sd-btn sd-btn-primary" onClick={handleSaveContact}>
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
            <button className="sd-btn sd-btn-outline" onClick={() => { setShowContactDeleteModal(false); setContactToDelete(null); }}>
              Annulla
            </button>
            <button className="sd-btn" style={{ background: '#DC2626', color: 'white' }} onClick={handleConfirmDeleteContact}>
              <FaTrashAlt /> Elimina Contatto
            </button>
          </div>
        </div>
      </Modal>

      {/* Drive File Modal */}
      <Modal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        title={editingDriveFile ? 'Modifica File' : 'Carica File'}
      >
        <div style={{ padding: '20px 0' }}>
          <div className="form-group">
            <label>Nome File <span className="required">*</span></label>
            <input
              type="text"
              value={driveForm.nome}
              onChange={(e) => setDriveForm({ ...driveForm, nome: e.target.value })}
              placeholder="Nome del file"
            />
          </div>

          <div className="form-group">
            <label>URL File <span className="required">*</span></label>
            <input
              type="text"
              value={driveForm.file_url}
              onChange={(e) => setDriveForm({ ...driveForm, file_url: e.target.value })}
              placeholder="https://..."
            />
            <small style={{ color: '#6B7280', fontSize: '11px' }}>
              Inserisci l'URL del file caricato su un servizio di storage (es. AWS S3, Google Drive, ecc.)
            </small>
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DRIVE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setDriveForm({ ...driveForm, categoria: cat.value })}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '2px solid',
                    borderColor: driveForm.categoria === cat.value ? cat.color : '#E5E7EB',
                    background: driveForm.categoria === cat.value ? cat.bg : 'white',
                    color: driveForm.categoria === cat.value ? cat.color : '#6B7280',
                    fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descrizione</label>
            <textarea
              value={driveForm.descrizione}
              onChange={(e) => setDriveForm({ ...driveForm, descrizione: e.target.value })}
              placeholder="Descrizione opzionale del file..."
              rows={2}
            />
          </div>

          <div style={{
            background: '#F9FAFB', borderRadius: '10px', padding: '16px', marginTop: '16px',
            border: '1px solid #E5E7EB'
          }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaLink style={{ color: '#6B7280' }} /> Collega a (opzionale)
            </h4>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px' }}>Contratto</label>
              <select
                value={driveForm.contract_id}
                onChange={(e) => setDriveForm({ ...driveForm, contract_id: e.target.value })}
                style={{ fontSize: '13px' }}
              >
                <option value="">Nessun contratto</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>{c.nome_contratto}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px' }}>Asset Inventario</label>
              <select
                value={driveForm.inventory_asset_id}
                onChange={(e) => setDriveForm({ ...driveForm, inventory_asset_id: e.target.value })}
                style={{ fontSize: '13px' }}
              >
                <option value="">Nessun asset</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="sd-btn sd-btn-outline" onClick={() => setShowDriveModal(false)}>
              Annulla
            </button>
            <button className="sd-btn sd-btn-primary" onClick={handleSaveDriveFile}>
              {editingDriveFile ? 'Salva Modifiche' : 'Carica File'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Drive Delete Modal */}
      <Modal
        isOpen={showDriveDeleteModal}
        onClose={() => { setShowDriveDeleteModal(false); setDriveFileToDelete(null); }}
        title="Conferma Eliminazione File"
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6b7280' }}>
            Sei sicuro di voler eliminare il file <strong>"{driveFileToDelete?.nome}"</strong>?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="sd-btn sd-btn-outline" onClick={() => { setShowDriveDeleteModal(false); setDriveFileToDelete(null); }}>
              Annulla
            </button>
            <button className="sd-btn" style={{ background: '#DC2626', color: 'white' }} onClick={handleConfirmDeleteDriveFile}>
              <FaTrashAlt /> Elimina File
            </button>
          </div>
        </div>
      </Modal>

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

export default SponsorDetail;
