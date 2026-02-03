import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaClock,
  FaLaptop,
  FaPen,
  FaTrashAlt,
  FaInfoCircle,
  FaUserCheck,
  FaLink,
  FaCheck,
  FaCircle,
  FaNewspaper,
  FaBriefcase,
  FaGlassCheers,
  FaHandshake,
  FaGraduationCap,
  FaGlobe,
  FaExternalLinkAlt,
  FaClipboardList,
  FaPlus,
  FaImage,
  FaBoxOpen
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState({});
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });

  // Asset Activations state
  const [assetActivations, setAssetActivations] = useState([]);
  const [availableAllocations, setAvailableAllocations] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedAllocation, setSelectedAllocation] = useState('');
  const [filteredAllocations, setFilteredAllocations] = useState([]);
  const [activationForm, setActivationForm] = useState({
    tipo: '',
    descrizione: '',
    quantita_utilizzata: 1,
    responsabile: ''
  });

  const isClub = user?.role === 'club';
  const isSponsor = user?.role === 'sponsor';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchEventDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvent(response.data);

      if (response.data.registration_form_schema) {
        const schema = JSON.parse(response.data.registration_form_schema);
        const initialData = {};
        schema.forEach(field => {
          initialData[field.label] = '';
        });
        setRegistrationData(initialData);
      }
    } catch (error) {
      console.error('Errore nel caricamento dell\'evento:', error);
      setToast({ message: 'Errore nel caricamento dell\'evento', type: 'error' });
      setTimeout(() => navigate('/events'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch asset activations
  const fetchAssetActivations = async () => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}/asset-activations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssetActivations(response.data.activations || []);
    } catch (error) {
      console.error('Errore nel caricamento attivazioni:', error);
    }
  };

  // Fetch available allocations for this event
  const fetchAvailableAllocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}/available-allocations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableAllocations(response.data.allocations || []);
    } catch (error) {
      console.error('Errore nel caricamento allocazioni:', error);
    }
  };

  // Fetch contracts for the club
  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only active contracts
      const activeContracts = (response.data.contracts || []).filter(c => c.status === 'attivo');
      setContracts(activeContracts);
    } catch (error) {
      console.error('Errore nel caricamento contratti:', error);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (isClub && event) {
      fetchAssetActivations();
      fetchAvailableAllocations();
      fetchContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isClub]);

  // Filter allocations by selected contract
  const handleContractChange = (contractId) => {
    setSelectedContract(contractId);
    setSelectedAllocation('');
    if (contractId) {
      const filtered = availableAllocations.filter(
        a => a.contract_id === parseInt(contractId) && !a.already_activated
      );
      setFilteredAllocations(filtered);
    } else {
      setFilteredAllocations([]);
    }
  };

  // Handle allocation selection
  const handleAllocationChange = (allocationId) => {
    setSelectedAllocation(allocationId);
    if (allocationId) {
      const allocation = availableAllocations.find(a => a.id === parseInt(allocationId));
      if (allocation && allocation.inventory_asset) {
        setActivationForm(prev => ({
          ...prev,
          tipo: allocation.inventory_asset.categoria || ''
        }));
      }
    }
  };

  // Create asset activation
  const handleCreateActivation = async (e) => {
    e.preventDefault();
    if (!selectedContract || !selectedAllocation) {
      setToast({ message: 'Seleziona un contratto e un asset', type: 'error' });
      return;
    }

    try {
      await axios.post(`${API_URL}/events/${id}/asset-activations`, {
        contract_id: parseInt(selectedContract),
        allocation_id: parseInt(selectedAllocation),
        ...activationForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Attivazione creata con successo!', type: 'success' });
      setShowActivationModal(false);
      setSelectedContract('');
      setSelectedAllocation('');
      setFilteredAllocations([]);
      setActivationForm({ tipo: '', descrizione: '', quantita_utilizzata: 1, responsabile: '' });
      fetchAssetActivations();
      fetchAvailableAllocations();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nella creazione', type: 'error' });
    }
  };

  // Delete asset activation
  const handleDeleteActivation = (activationId, assetName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Attivazione',
      message: `Sei sicuro di voler eliminare l'attivazione per "${assetName}"?`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/events/${id}/asset-activations/${activationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Attivazione eliminata', type: 'success' });
          fetchAssetActivations();
          fetchAvailableAllocations();
        } catch (error) {
          setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
        }
      }
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/events/${id}/register`, {
        form_data: registrationData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Iscrizione completata con successo!', type: 'success' });
      setShowRegistrationModal(false);
      fetchEventDetail();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nell\'iscrizione', type: 'error' });
    }
  };

  const handleCancelRegistration = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancella Iscrizione',
      message: `Sei sicuro di voler cancellare la tua iscrizione a "${event?.titolo}"?`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/events/${id}/registration`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Iscrizione cancellata', type: 'success' });
          fetchEventDetail();
        } catch (error) {
          setToast({ message: 'Errore nella cancellazione', type: 'error' });
        }
      }
    });
  };

  const handleConfirmRegistration = async (registrationId) => {
    try {
      await axios.put(`${API_URL}/events/${id}/registrations/${registrationId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Iscrizione confermata!', type: 'success' });
      fetchEventDetail();
    } catch (error) {
      setToast({ message: 'Errore nella conferma', type: 'error' });
    }
  };

  const handleMarkAttendance = async (registrationId, presente) => {
    try {
      await axios.put(`${API_URL}/events/${id}/registrations/${registrationId}/attendance`, {
        presente
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: presente ? 'Presenza registrata!' : 'Presenza rimossa', type: 'success' });
      fetchEventDetail();
    } catch (error) {
      setToast({ message: 'Errore nell\'aggiornamento', type: 'error' });
    }
  };

  const handleDeleteEvent = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Evento',
      message: `Sei sicuro di voler eliminare "${event?.titolo}"? Questa azione non può essere annullata.`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/events/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Evento eliminato!', type: 'success' });
          setTimeout(() => navigate('/events'), 1500);
        } catch (error) {
          setToast({ message: 'Errore nell\'eliminazione', type: 'error' });
        }
      }
    });
  };

  const copyPublicLink = () => {
    const publicLink = `${window.location.origin}/events/${id}/register`;
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setToast({ message: 'Link copiato negli appunti!', type: 'success' });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEventTypeIcon = (tipo) => {
    const icons = {
      'ufficio_stampa': <FaNewspaper />,
      'presentazione_commerciale': <FaBriefcase />,
      'brand_event': <FaGlassCheers />,
      'meeting': <FaHandshake />,
      'formazione': <FaGraduationCap />,
      'networking': <FaGlobe />,
      'altro': <FaCalendarAlt />
    };
    return icons[tipo] || <FaCalendarAlt />;
  };

  const getEventTypeLabel = (tipo) => {
    const labels = {
      'ufficio_stampa': 'Ufficio Stampa',
      'presentazione_commerciale': 'Presentazione',
      'brand_event': 'Brand Event',
      'meeting': 'Meeting',
      'formazione': 'Formazione',
      'networking': 'Networking',
      'altro': 'Altro'
    };
    return labels[tipo] || tipo;
  };

  const getEventStatus = () => {
    if (!event) return { label: '-', className: 'draft' };
    const statusMap = {
      programmato: { label: 'Programmato', className: 'pending' },
      confermato: { label: 'Confermato', className: 'active' },
      in_corso: { label: 'In Corso', className: 'active' },
      completato: { label: 'Completato', className: 'expired' },
      annullato: { label: 'Annullato', className: 'draft' }
    };
    return statusMap[event.status] || { label: event.status, className: 'draft' };
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!event) {
    return <div className="sd-page"><div className="sd-loading">Evento non trovato</div></div>;
  }

  const formSchema = event.registration_form_schema ? JSON.parse(event.registration_form_schema) : [];
  const canRegister = isSponsor && event.richiede_iscrizione && !event.sponsor_registration && event.is_invited;
  const isRegistered = isSponsor && event.sponsor_registration;
  const hasReachedMax = event.max_iscrizioni && event.registrations_count >= event.max_iscrizioni;
  const status = getEventStatus();

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaInfoCircle />, count: null },
    ...(event.agenda ? [{ id: 'agenda', label: 'Agenda', icon: <FaClipboardList />, count: null }] : []),
    ...(isClub ? [
      { id: 'assets', label: 'Attivazioni Asset', icon: <FaBoxOpen />, count: assetActivations.length }
    ] : []),
    ...(isClub && event.richiede_iscrizione ? [
      { id: 'registrations', label: 'Iscritti', icon: <FaUsers />, count: event.registrations?.length || 0 }
    ] : []),
    ...(isRegistered ? [{ id: 'my-registration', label: 'La mia iscrizione', icon: <FaUserCheck />, count: null }] : [])
  ];

  const durationHours = event.data_ora_fine
    ? Math.round((new Date(event.data_ora_fine) - new Date(event.data_ora_inizio)) / (1000 * 60 * 60))
    : null;

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR */}
        <div className="sd-profile-card">
          {/* Header */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/events')}>
              <FaArrowLeft />
            </button>
            {isClub && (
              <div className="sd-header-actions">
                <button className="sd-header-btn edit" onClick={() => navigate(`/events/${id}/edit`)}>
                  <FaPen />
                </button>
                <button className="sd-header-btn delete" onClick={handleDeleteEvent}>
                  <FaTrashAlt />
                </button>
              </div>
            )}
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar">
              <div className="sd-profile-avatar-placeholder" style={{ fontSize: '32px' }}>
                {getEventTypeIcon(event.tipo)}
              </div>
            </div>
            <h1 className="sd-profile-name">{event.titolo}</h1>
            <p className="sd-profile-sector">{getEventTypeLabel(event.tipo)}</p>
            <span className={`sd-profile-status ${status.className}`}>
              <FaCircle /> {status.label}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Event Details */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dettagli Evento</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Data Inizio</span>
                  <span className="sd-info-value">{formatDate(event.data_ora_inizio)}</span>
                </div>
                {event.data_ora_fine && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Data Fine</span>
                    <span className="sd-info-value">{formatDate(event.data_ora_fine)}</span>
                  </div>
                )}
                <div className="sd-info-item">
                  <span className="sd-info-label">Modalità</span>
                  <span className="sd-info-value">{event.online ? 'Online' : 'In presenza'}</span>
                </div>
                {!event.online && event.luogo && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Luogo</span>
                    <span className="sd-info-value">{event.luogo}</span>
                  </div>
                )}
                {event.creato_da_nome && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Organizzatore</span>
                    <span className="sd-info-value">{event.creato_da_nome}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="sd-profile-section">
              {canRegister && !hasReachedMax && (
                <button
                  className="sd-btn sd-btn-primary"
                  style={{ width: '100%', marginBottom: '8px', justifyContent: 'center' }}
                  onClick={() => setShowRegistrationModal(true)}
                >
                  <FaUserCheck /> Iscriviti
                </button>
              )}
              {isRegistered && event.sponsor_registration.status === 'registrato' && (
                <button
                  className="sd-btn"
                  style={{ width: '100%', background: '#FEE2E2', color: '#DC2626', justifyContent: 'center' }}
                  onClick={handleCancelRegistration}
                >
                  <FaTrashAlt /> Cancella iscrizione
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Stats Row */}
          <div className="sd-stats-row">
            <div className="sd-stat-card">
              <div className="sd-stat-icon contracts">
                <FaCalendarAlt />
              </div>
              <div className="sd-stat-info">
                <div className="sd-stat-value">{formatDateShort(event.data_ora_inizio)}</div>
                <div className="sd-stat-label">Data</div>
              </div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-icon active">
                <FaUsers />
              </div>
              <div className="sd-stat-info">
                <div className="sd-stat-value">
                  {event.registrations_count || 0}{event.max_iscrizioni ? `/${event.max_iscrizioni}` : ''}
                </div>
                <div className="sd-stat-label">Iscritti</div>
              </div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-icon value">
                <FaClock />
              </div>
              <div className="sd-stat-info">
                <div className="sd-stat-value">{durationHours ? `${durationHours}h` : 'N/D'}</div>
                <div className="sd-stat-label">Durata</div>
              </div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-icon activities">
                {event.online ? <FaLaptop /> : <FaMapMarkerAlt />}
              </div>
              <div className="sd-stat-info">
                <div className="sd-stat-value">{event.online ? 'Online' : 'Presenza'}</div>
                <div className="sd-stat-label">Modalità</div>
              </div>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            {/* Tabs Navigation */}
            <div className="sd-tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sd-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.count !== null && <span className="sd-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaInfoCircle /> Panoramica Evento</h2>
                  </div>

                  {event.descrizione && (
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                        Descrizione
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#6B7280', whiteSpace: 'pre-wrap' }}>
                        {event.descrizione}
                      </p>
                    </div>
                  )}

                  {event.online && event.link_meeting && (
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                        Link Meeting
                      </h4>
                      <a
                        href={event.link_meeting}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sd-btn sd-btn-primary"
                        style={{ textDecoration: 'none' }}
                      >
                        <FaExternalLinkAlt /> Apri Meeting
                      </a>
                    </div>
                  )}

                  {isClub && event.richiede_iscrizione && (
                    <div style={{
                      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'white' }}>
                            Link Iscrizione Pubblica
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF', wordBreak: 'break-all' }}>
                            {window.location.origin}/events/{id}/register
                          </p>
                        </div>
                        <button
                          className="sd-btn"
                          style={{ background: 'white', color: '#1A1A1A' }}
                          onClick={copyPublicLink}
                        >
                          <FaLink /> {copiedLink ? 'Copiato!' : 'Copia Link'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Agenda Tab */}
              {activeTab === 'agenda' && event.agenda && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaClipboardList /> Agenda</h2>
                  </div>

                  <div style={{
                    background: '#F9FAFB',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <pre style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      lineHeight: 1.8,
                      color: '#6B7280'
                    }}>
                      {event.agenda}
                    </pre>
                  </div>
                </>
              )}

              {/* Asset Activations Tab */}
              {activeTab === 'assets' && isClub && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaBoxOpen /> Attivazioni Asset</h2>
                    <button
                      className="sd-btn sd-btn-primary"
                      onClick={() => setShowActivationModal(true)}
                    >
                      <FaPlus /> Aggiungi Attivazione
                    </button>
                  </div>

                  {assetActivations.length === 0 ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaBoxOpen /></div>
                      <h3 className="sd-empty-title">Nessuna attivazione asset</h3>
                      <p className="sd-empty-desc">
                        Collega asset dall'inventario a questo evento per tracciare le attivazioni sponsor
                      </p>
                      <button
                        className="sd-btn sd-btn-primary"
                        style={{ marginTop: '16px' }}
                        onClick={() => setShowActivationModal(true)}
                      >
                        <FaPlus /> Aggiungi Prima Attivazione
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {assetActivations.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '20px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px'
                          }}
                        >
                          {/* Asset Image */}
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {act.inventory_asset?.immagine_url ? (
                              <img
                                src={act.inventory_asset.immagine_url}
                                alt={act.inventory_asset.nome}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <FaImage style={{ fontSize: '24px', color: '#9CA3AF' }} />
                            )}
                          </div>

                          {/* Asset Info */}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {act.inventory_asset?.nome || 'Asset'}
                            </h4>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6B7280' }}>
                              {act.contract?.sponsor_nome} • {act.contract?.titolo}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: '#E0E7FF',
                                color: '#4F46E5',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {act.tipo}
                              </span>
                              <span style={{
                                background: act.eseguita ? '#D1FAE5' : '#FEF3C7',
                                color: act.eseguita ? '#059669' : '#D97706',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {act.eseguita ? 'Eseguita' : act.stato}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <button
                            className="sd-btn"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}
                            onClick={() => handleDeleteActivation(act.id, act.inventory_asset?.nome || 'Asset')}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Registrations Tab */}
              {activeTab === 'registrations' && isClub && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaUsers /> Lista Iscritti</h2>
                  </div>

                  {(!event.registrations || event.registrations.length === 0) ? (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaUsers /></div>
                      <h3 className="sd-empty-title">Nessuna iscrizione</h3>
                      <p className="sd-empty-desc">Gli sponsor invitati potranno iscriversi all'evento</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {event.registrations.map((reg) => (
                        <div
                          key={reg.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            background: reg.confermato ? '#F0FDF4' : '#F9FAFB',
                            border: `1px solid ${reg.confermato ? '#86EFAC' : '#E5E7EB'}`,
                            borderRadius: '12px'
                          }}
                        >
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                              {reg.sponsor_nome}
                            </h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: reg.confermato ? '#D1FAE5' : '#FEF3C7',
                                color: reg.confermato ? '#059669' : '#D97706',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {reg.confermato ? 'Confermato' : 'In attesa'}
                              </span>
                              {reg.presente && (
                                <span style={{
                                  background: '#DBEAFE',
                                  color: '#2563EB',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}>
                                  Presente
                                </span>
                              )}
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                Iscritto il {formatDateShort(reg.registrato_il)}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!reg.confermato && (
                              <button
                                className="sd-btn sd-btn-primary"
                                onClick={() => handleConfirmRegistration(reg.id)}
                              >
                                <FaCheck /> Conferma
                              </button>
                            )}
                            {reg.confermato && (
                              <button
                                className={`sd-btn ${reg.presente ? 'sd-btn-primary' : 'sd-btn-outline'}`}
                                onClick={() => handleMarkAttendance(reg.id, !reg.presente)}
                              >
                                {reg.presente ? 'Presente' : 'Segna presente'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* My Registration Tab */}
              {activeTab === 'my-registration' && isRegistered && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaUserCheck /> La tua iscrizione</h2>
                  </div>

                  <div style={{
                    background: '#F9FAFB',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <span style={{
                        background: event.sponsor_registration.confermato ? '#D1FAE5' : '#FEF3C7',
                        color: event.sponsor_registration.confermato ? '#059669' : '#D97706',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600
                      }}>
                        {event.sponsor_registration.confermato ? 'Confermato' : 'In attesa di conferma'}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6B7280' }}>
                      Iscritto il {formatDate(event.sponsor_registration.registrato_il)}
                    </p>
                    {event.sponsor_registration.status === 'registrato' && (
                      <button
                        className="sd-btn"
                        style={{ background: '#FEE2E2', color: '#DC2626' }}
                        onClick={handleCancelRegistration}
                      >
                        <FaTrashAlt /> Cancella iscrizione
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Iscrizione Evento"
      >
        <form onSubmit={handleRegister}>
          <div style={{ padding: '20px 0' }}>
            {formSchema.map((field, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={registrationData[field.label] || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, [field.label]: e.target.value })}
                    required={field.required}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={registrationData[field.label] || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, [field.label]: e.target.value })}
                    required={field.required}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Seleziona...</option>
                    {field.options?.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={registrationData[field.label] || ''}
                    onChange={(e) => setRegistrationData({ ...registrationData, [field.label]: e.target.value })}
                    required={field.required}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sd-btn sd-btn-outline"
              onClick={() => setShowRegistrationModal(false)}
            >
              Annulla
            </button>
            <button type="submit" className="sd-btn sd-btn-primary">
              Conferma Iscrizione
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
        title={confirmModal.title}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', color: '#6B7280' }}>
            {confirmModal.message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="sd-btn sd-btn-outline"
              onClick={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
            >
              Annulla
            </button>
            <button
              className="sd-btn"
              style={{ background: '#EF4444', color: 'white' }}
              onClick={async () => {
                setConfirmModal({ isOpen: false, action: null, title: '', message: '' });
                if (confirmModal.action) await confirmModal.action();
              }}
            >
              Conferma
            </button>
          </div>
        </div>
      </Modal>

      {/* Asset Activation Modal */}
      <Modal
        isOpen={showActivationModal}
        onClose={() => {
          setShowActivationModal(false);
          setSelectedContract('');
          setSelectedAllocation('');
          setFilteredAllocations([]);
          setActivationForm({ tipo: '', descrizione: '', quantita_utilizzata: 1, responsabile: '' });
        }}
        title="Aggiungi Attivazione Asset"
      >
        <form onSubmit={handleCreateActivation}>
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Contract Selection */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Contratto Sponsor *
              </label>
              <select
                value={selectedContract}
                onChange={(e) => handleContractChange(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">Seleziona contratto...</option>
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.sponsor_nome} - {contract.titolo}
                  </option>
                ))}
              </select>
            </div>

            {/* Allocation Selection */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Asset Inventario *
              </label>
              <select
                value={selectedAllocation}
                onChange={(e) => handleAllocationChange(e.target.value)}
                required
                disabled={!selectedContract}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: !selectedContract ? '#F3F4F6' : 'white'
                }}
              >
                <option value="">
                  {!selectedContract
                    ? 'Prima seleziona un contratto'
                    : filteredAllocations.length === 0
                      ? 'Nessun asset allocato disponibile'
                      : 'Seleziona asset...'}
                </option>
                {filteredAllocations.map(alloc => (
                  <option key={alloc.id} value={alloc.id}>
                    {alloc.inventory_asset?.nome} ({alloc.inventory_asset?.categoria})
                  </option>
                ))}
              </select>
              {selectedContract && filteredAllocations.length === 0 && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#D97706' }}>
                  Nessun asset allocato a questo contratto per la data dell'evento
                </p>
              )}
            </div>

            {/* Asset Preview */}
            {selectedAllocation && (() => {
              const allocation = availableAllocations.find(a => a.id === parseInt(selectedAllocation));
              if (!allocation?.inventory_asset) return null;
              return (
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  {allocation.inventory_asset.immagine_url ? (
                    <img
                      src={allocation.inventory_asset.immagine_url}
                      alt={allocation.inventory_asset.nome}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: '#E5E7EB',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaImage style={{ fontSize: '24px', color: '#9CA3AF' }} />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>
                      {allocation.inventory_asset.nome}
                    </h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6B7280' }}>
                      {allocation.inventory_asset.categoria}
                      {allocation.inventory_asset.tipo && allocation.inventory_asset.tipo !== allocation.inventory_asset.categoria && ` • ${allocation.inventory_asset.tipo}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>
                      Quantità allocata: {allocation.quantita_allocata}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Tipo */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Tipo Attivazione
              </label>
              <input
                type="text"
                value={activationForm.tipo}
                onChange={(e) => setActivationForm({ ...activationForm, tipo: e.target.value })}
                placeholder="Es: LED, Banner, Hospitality..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Descrizione */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Descrizione
              </label>
              <textarea
                value={activationForm.descrizione}
                onChange={(e) => setActivationForm({ ...activationForm, descrizione: e.target.value })}
                placeholder="Note sull'attivazione..."
                rows="2"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Responsabile */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151'
              }}>
                Responsabile
              </label>
              <input
                type="text"
                value={activationForm.responsabile}
                onChange={(e) => setActivationForm({ ...activationForm, responsabile: e.target.value })}
                placeholder="Nome responsabile..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="sd-btn sd-btn-outline"
              onClick={() => {
                setShowActivationModal(false);
                setSelectedContract('');
                setSelectedAllocation('');
                setFilteredAllocations([]);
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="sd-btn sd-btn-primary"
              disabled={!selectedContract || !selectedAllocation}
            >
              Crea Attivazione
            </button>
          </div>
        </form>
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
};

export default EventDetail;
