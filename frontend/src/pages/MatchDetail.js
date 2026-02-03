import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaPlus, FaCalendarAlt,
  FaMapMarkerAlt, FaHome, FaPlane, FaCheck, FaTimes,
  FaBullseye, FaTicketAlt, FaInfoCircle, FaCircle, FaFutbol
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [match, setMatch] = useState(null);
  const [activations, setActivations] = useState([]);
  const [boxInvites, setBoxInvites] = useState([]);
  const [businessBoxes, setBusinessBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showBoxInviteModal, setShowBoxInviteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });

  const [contracts, setContracts] = useState([]);
  const [assets, setAssets] = useState([]); // Legacy assets
  const [inventoryAssets, setInventoryAssets] = useState([]); // Inventory assets for this match
  const [availableAllocations, setAvailableAllocations] = useState([]); // Allocations for selected contract
  const [sponsors, setSponsors] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]); // Legacy
  const [filteredAllocations, setFilteredAllocations] = useState([]); // Inventory allocations
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  const [activationForm, setActivationForm] = useState({
    sponsor_id: '',
    contract_id: '',
    asset_id: '', // Legacy
    allocation_id: '', // NEW: Inventory allocation
    inventory_asset_id: '', // NEW: Inventory asset
    tipo: '',
    descrizione: '',
    descrizione_attivazione: '',
    responsabile: '',
    quantita_utilizzata: ''
  });

  const [boxInviteForm, setBoxInviteForm] = useState({
    business_box_id: '',
    nome: '',
    cognome: '',
    email: '',
    azienda: '',
    vip: false,
    parcheggio_richiesto: false,
    note: ''
  });

  const isClub = user?.role === 'club';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMatchDetails();
    fetchActivations();
    fetchBoxInvites();
    if (isClub) {
      fetchSponsors();
      fetchContracts();
      fetchAssets();
      fetchBusinessBoxes();
      fetchInventoryAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMatchDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatch(response.data.match);
    } catch (error) {
      console.error('Errore nel caricamento della partita:', error);
      setToast({ message: 'Errore nel caricamento della partita', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivations = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/${id}/activations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivations(response.data.activations || []);
    } catch (error) {
      console.error('Errore nel caricamento delle attivazioni:', error);
    }
  };

  const fetchBoxInvites = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/${id}/box-invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoxInvites(response.data.invites || []);
    } catch (error) {
      console.error('Errore nel caricamento degli inviti:', error);
    }
  };

  const fetchSponsors = async () => {
    try {
      const response = await axios.get(`${API_URL}/club/sponsors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSponsors(response.data.sponsors || []);
    } catch (error) {
      console.error('Errore nel caricamento degli sponsor:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(response.data.contracts || []);
    } catch (error) {
      console.error('Errore nel caricamento dei contratti:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(response.data.assets || []);
    } catch (error) {
      console.error('Errore nel caricamento degli asset:', error);
    }
  };

  const fetchBusinessBoxes = async () => {
    try {
      const response = await axios.get(`${API_URL}/business-boxes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinessBoxes(response.data.boxes || []);
    } catch (error) {
      console.error('Errore nel caricamento dei business box:', error);
    }
  };

  // NEW: Fetch inventory assets available for this match
  const fetchInventoryAssets = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches/${id}/available-assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryAssets(response.data.assets || []);
    } catch (error) {
      console.error('Errore nel caricamento degli asset inventario:', error);
    }
  };

  // NEW: Fetch allocations available for a specific contract
  const fetchAllocationsForContract = async (contractId) => {
    if (!contractId) {
      setAvailableAllocations([]);
      setFilteredAllocations([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/matches/${id}/available-allocations?contract_id=${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allocations = response.data.allocations || [];
      setAvailableAllocations(allocations);
      setFilteredAllocations(allocations.filter(a => !a.gia_attivato)); // Solo quelli non già attivati
    } catch (error) {
      console.error('Errore nel caricamento delle allocazioni:', error);
      setAvailableAllocations([]);
      setFilteredAllocations([]);
    }
  };

  const handleDeleteMatch = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Partita',
      message: `Sei sicuro di voler eliminare la partita vs "${match?.avversario}"? Questa azione non può essere annullata.`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/matches/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Partita eliminata con successo!', type: 'success' });
          setTimeout(() => navigate('/matches'), 1500);
        } catch (error) {
          setToast({ message: 'Errore nell\'eliminazione della partita', type: 'error' });
        }
      }
    });
  };

  const handleCreateActivation = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Conferma Attivazione',
      message: 'Sei sicuro di voler creare questa attivazione?',
      action: async () => {
        try {
          await axios.post(`${API_URL}/matches/${id}/activations`, {
            contract_id: activationForm.contract_id,
            // NEW: Priorità a inventory allocation
            allocation_id: activationForm.allocation_id || undefined,
            inventory_asset_id: activationForm.inventory_asset_id || undefined,
            // Legacy fallback
            asset_id: activationForm.asset_id || undefined,
            tipo: activationForm.tipo,
            descrizione: activationForm.descrizione_attivazione,
            responsabile: activationForm.responsabile,
            quantita_utilizzata: activationForm.quantita_utilizzata ? parseInt(activationForm.quantita_utilizzata) : undefined
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Attivazione creata con successo!', type: 'success' });
          setShowActivationModal(false);
          resetActivationForm();
          fetchActivations();
          fetchInventoryAssets(); // Refresh available assets
        } catch (error) {
          setToast({ message: error.response?.data?.error || 'Errore nella creazione dell\'attivazione', type: 'error' });
        }
      }
    });
  };

  const handleCreateBoxInvite = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Conferma Invito',
      message: 'Sei sicuro di voler creare questo invito?',
      action: async () => {
        try {
          await axios.post(`${API_URL}/box-invites`, {
            ...boxInviteForm,
            match_id: id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Invito creato con successo!', type: 'success' });
          setShowBoxInviteModal(false);
          resetBoxInviteForm();
          fetchBoxInvites();
        } catch (error) {
          setToast({ message: error.response?.data?.error || 'Errore nella creazione dell\'invito', type: 'error' });
        }
      }
    });
  };

  const handleConfirmActivation = async (activationId) => {
    try {
      await axios.put(`${API_URL}/activations/${activationId}`,
        { stato: 'confermata' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Attivazione confermata!', type: 'success' });
      fetchActivations();
    } catch (error) {
      setToast({ message: 'Errore nella conferma dell\'attivazione', type: 'error' });
    }
  };

  const handleMarkAsExecuted = async (activationId) => {
    try {
      await axios.put(`${API_URL}/activations/${activationId}`,
        { eseguita: true, stato: 'completata' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Attivazione segnata come eseguita!', type: 'success' });
      fetchActivations();
    } catch (error) {
      setToast({ message: 'Errore nell\'aggiornamento dell\'attivazione', type: 'error' });
    }
  };

  const handleDeleteActivation = (activationId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Attivazione',
      message: 'Sei sicuro di voler eliminare questa attivazione?',
      action: async () => {
        try {
          await axios.delete(`${API_URL}/activations/${activationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Attivazione eliminata con successo!', type: 'success' });
          fetchActivations();
        } catch (error) {
          setToast({ message: 'Errore nell\'eliminazione dell\'attivazione', type: 'error' });
        }
      }
    });
  };

  const handleSponsorChange = (sponsorId) => {
    setActivationForm({
      sponsor_id: sponsorId,
      contract_id: '',
      asset_id: '',
      tipo: '',
      descrizione: '',
      descrizione_attivazione: '',
      responsabile: '',
      quantita_utilizzata: ''
    });

    if (sponsorId) {
      const filtered = contracts.filter(c => c.sponsor && String(c.sponsor.id) === String(sponsorId));
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts([]);
    }
    setFilteredAssets([]);
    setSelectedAsset(null);
  };

  const handleContractChange = (contractId) => {
    setActivationForm({
      ...activationForm,
      contract_id: contractId,
      asset_id: '',
      allocation_id: '',
      inventory_asset_id: '',
      tipo: '',
      descrizione: '',
      descrizione_attivazione: '',
      quantita_utilizzata: ''
    });

    if (contractId) {
      // Legacy: filter old assets
      const filtered = assets.filter(a => String(a.head_of_terms_id) === String(contractId));
      setFilteredAssets(filtered);

      // NEW: Fetch inventory allocations for this contract
      fetchAllocationsForContract(contractId);

      const contract = contracts.find(c => String(c.id) === String(contractId));
      if (contract) {
        setActivationForm(prev => ({
          ...prev,
          contract_id: contractId,
          responsabile: contract.sponsor?.referente_nome || ''
        }));
      }
    } else {
      setFilteredAssets([]);
      setFilteredAllocations([]);
    }
    setSelectedAsset(null);
    setSelectedAllocation(null);
  };

  // Legacy: Handle old asset selection
  const handleAssetChange = (assetId) => {
    const asset = assets.find(a => String(a.id) === String(assetId));
    setSelectedAsset(asset || null);
    setSelectedAllocation(null);

    setActivationForm({
      ...activationForm,
      asset_id: assetId,
      allocation_id: '',
      inventory_asset_id: '',
      tipo: asset?.categoria?.toLowerCase() || activationForm.tipo,
      descrizione: asset?.descrizione || activationForm.descrizione
    });
  };

  // NEW: Handle inventory allocation selection
  const handleAllocationChange = (allocationId) => {
    const allocation = filteredAllocations.find(a => String(a.id) === String(allocationId));
    setSelectedAllocation(allocation || null);
    setSelectedAsset(null);

    if (allocation) {
      setActivationForm({
        ...activationForm,
        asset_id: '', // Clear legacy
        allocation_id: allocationId,
        inventory_asset_id: allocation.asset_id,
        tipo: allocation.inventory_asset?.tipo?.toLowerCase() || activationForm.tipo,
        descrizione: allocation.inventory_asset?.nome || activationForm.descrizione
      });
    } else {
      setActivationForm({
        ...activationForm,
        allocation_id: '',
        inventory_asset_id: ''
      });
    }
  };

  const resetActivationForm = () => {
    setActivationForm({
      sponsor_id: '',
      contract_id: '',
      asset_id: '',
      allocation_id: '',
      inventory_asset_id: '',
      tipo: '',
      descrizione: '',
      descrizione_attivazione: '',
      responsabile: '',
      quantita_utilizzata: ''
    });
    setFilteredContracts([]);
    setFilteredAssets([]);
    setFilteredAllocations([]);
    setSelectedAsset(null);
    setSelectedAllocation(null);
  };

  const resetBoxInviteForm = () => {
    setBoxInviteForm({
      business_box_id: '',
      nome: '',
      cognome: '',
      email: '',
      azienda: '',
      vip: false,
      parcheggio_richiesto: false,
      note: ''
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      programmata: { label: 'Programmata', className: 'pending' },
      confermata: { label: 'Confermata', className: 'active' },
      in_corso: { label: 'In Corso', className: 'active' },
      completata: { label: 'Completata', className: 'active' },
      rinviata: { label: 'Rinviata', className: 'draft' },
      annullata: { label: 'Annullata', className: 'expired' }
    };
    return configs[status] || { label: status, className: 'draft' };
  };

  const getActivationTypeLabel = (tipo) => {
    const labels = {
      'led': 'LED / Maxischermo',
      'social': 'Social Media',
      'hospitality': 'Hospitality',
      'product_placement': 'Product Placement',
      'branding': 'Branding',
      'sampling': 'Sampling',
      'meet_and_greet': 'Meet & Greet',
      'altro': 'Altro'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  if (!match) {
    return <div className="sd-page"><div className="sd-loading">Partita non trovata</div></div>;
  }

  const status = getStatusConfig(match.status);
  const completedActivations = activations.filter(a => a.stato === 'completata').length;

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaInfoCircle />, count: null },
    { id: 'activations', label: 'Attivazioni', icon: <FaBullseye />, count: activations.length },
    { id: 'invites', label: 'Business Box', icon: <FaTicketAlt />, count: boxInvites.length }
  ];

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR - Match Info Card */}
        <div className="sd-profile-card">
          {/* Header with dark background */}
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate(-1)}>
              <FaArrowLeft />
            </button>
            {isClub && (
              <div className="sd-header-actions">
                <button className="sd-header-btn edit" onClick={() => navigate(`/matches/${id}/edit`)}>
                  <FaPen />
                </button>
                <button className="sd-header-btn delete" onClick={handleDeleteMatch}>
                  <FaTrashAlt />
                </button>
              </div>
            )}
          </div>

          {/* Avatar Section */}
          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar" style={{ background: match.luogo === 'casa' ? '#dcfce7' : '#f0f9ff' }}>
              {match.luogo === 'casa' ? (
                <FaHome style={{ fontSize: '32px', color: '#16a34a' }} />
              ) : (
                <FaPlane style={{ fontSize: '32px', color: '#0284c7' }} />
              )}
            </div>
            <h1 className="sd-profile-name">vs {match.avversario}</h1>
            <p className="sd-profile-sector">{match.competizione || 'Partita'}</p>
            <span className={`sd-profile-status ${status.className}`}>
              <FaCircle /> {status.label}
            </span>
          </div>

          {/* Profile Body */}
          <div className="sd-profile-body">
            {/* Match Details */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Dettagli Partita</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Data e Ora</span>
                  <span className="sd-info-value">
                    {new Date(match.data_ora).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' '}{new Date(match.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Luogo</span>
                  <span className="sd-info-value">
                    {match.luogo === 'casa' ? 'Casa' : 'Trasferta'}
                  </span>
                </div>
                {match.stadio && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Stadio</span>
                    <span className="sd-info-value">{match.stadio}</span>
                  </div>
                )}
                {match.risultato && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Risultato</span>
                    <span className="sd-info-value" style={{ color: '#059669', fontWeight: 700 }}>
                      {match.risultato}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Statistiche</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Attivazioni</span>
                  <span className="sd-info-value" style={{ fontWeight: 600 }}>{activations.length}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Completate</span>
                  <span className="sd-info-value" style={{ fontWeight: 600, color: '#059669' }}>{completedActivations}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Inviti Box</span>
                  <span className="sd-info-value" style={{ fontWeight: 600 }}>{boxInvites.length}</span>
                </div>
              </div>
            </div>

            {/* Back to Calendar */}
            <div className="sd-profile-section">
              <button
                className="sd-btn sd-btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/matches')}
              >
                <FaCalendarAlt /> Torna al Calendario
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Stats Row */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Attivazioni</div>
              <div className="tp-stat-value">{activations.length}</div>
              <div className="tp-stat-description">totali</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Completate</div>
              <div className="tp-stat-value">{completedActivations}</div>
              <div className="tp-stat-description">confermate</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Inviti Box</div>
              <div className="tp-stat-value">{boxInvites.length}</div>
              <div className="tp-stat-description">inviati</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Luogo</div>
              <div className="tp-stat-value">{match.luogo === 'casa' ? 'Casa' : 'Trasf.'}</div>
              <div className="tp-stat-description">partita</div>
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
                    <h2 className="sd-tab-title"><FaInfoCircle /> Panoramica Partita</h2>
                  </div>

                  {/* Match Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px'
                  }}>
                    {/* Activations Progress */}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaBullseye />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            Attivazioni Sponsor
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                            {completedActivations} di {activations.length} completate
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1, background: '#E5E7EB', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
                          <div style={{
                            background: '#85FF00',
                            width: activations.length > 0 ? `${(completedActivations / activations.length) * 100}%` : '0%',
                            height: '100%',
                            borderRadius: '8px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', minWidth: '50px', textAlign: 'right' }}>
                          {activations.length > 0 ? Math.round((completedActivations / activations.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    {/* Box Invites */}
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaTicketAlt />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                            Inviti Business Box
                          </h4>
                          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                            {boxInvites.filter(i => i.vip).length} VIP su {boxInvites.length} totali
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                          flex: 1,
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A' }}>{boxInvites.length}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>Inviti</div>
                        </div>
                        <div style={{
                          flex: 1,
                          background: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F59E0B' }}>{boxInvites.filter(i => i.vip).length}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>VIP</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {isClub && (
                    <div style={{
                      background: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div>
                        <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600 }}>
                          Azioni Rapide
                        </h3>
                        <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
                          Gestisci attivazioni e inviti
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          className="sd-btn"
                          style={{ background: 'white', color: '#1A1A1A' }}
                          onClick={() => setShowActivationModal(true)}
                        >
                          <FaPlus /> Nuova Attivazione
                        </button>
                        <button
                          className="sd-btn"
                          style={{ background: 'white', color: '#1A1A1A' }}
                          onClick={() => setShowBoxInviteModal(true)}
                        >
                          <FaPlus /> Nuovo Invito
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Activations Tab */}
              {activeTab === 'activations' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaBullseye /> Attivazioni Sponsor</h2>
                    {isClub && (
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowActivationModal(true)}>
                        <FaPlus /> Nuova Attivazione
                      </button>
                    )}
                  </div>

                  {activations.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: '20px'
                    }}>
                      {activations.map(activation => (
                        <div key={activation.id} className="sd-contract-card" style={{ cursor: 'default' }}>
                          <div className="sd-contract-top">
                            <div>
                              <h3 className="sd-contract-title">{getActivationTypeLabel(activation.tipo)}</h3>
                              {activation.sponsor_nome && (
                                <p className="sd-contract-desc">Sponsor: {activation.sponsor_nome}</p>
                              )}
                            </div>
                            <span className={`sd-contract-status ${activation.stato === 'completata' ? 'active' : activation.stato === 'confermata' ? 'pending' : 'draft'}`}>
                              {activation.stato}
                            </span>
                          </div>

                          {activation.descrizione && (
                            <p style={{ margin: '12px 0', fontSize: '14px', color: '#6B7280', lineHeight: 1.5 }}>
                              {activation.descrizione}
                            </p>
                          )}

                          {/* NEW: Show inventory asset if present */}
                          {activation.inventory_asset && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              background: '#F0FDF4',
                              padding: '10px',
                              borderRadius: '8px',
                              marginBottom: '12px'
                            }}>
                              {activation.inventory_asset.immagine_principale && (
                                <img
                                  src={activation.inventory_asset.immagine_principale.startsWith('http')
                                    ? activation.inventory_asset.immagine_principale
                                    : `${API_URL.replace('/api', '')}${activation.inventory_asset.immagine_principale}`}
                                  alt={activation.inventory_asset.nome}
                                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>
                                  {activation.inventory_asset.nome}
                                </div>
                                <div style={{ fontSize: '11px', color: '#15803D' }}>
                                  {activation.inventory_asset.codice} • {activation.inventory_asset.tipo}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Legacy: Show old asset if present */}
                          {!activation.inventory_asset && activation.asset && (
                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                              Asset: <strong>{activation.asset.categoria} - {activation.asset.nome}</strong>
                            </div>
                          )}

                          {activation.responsabile && (
                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                              Responsabile: {activation.responsabile}
                            </div>
                          )}

                          {activation.eseguita && (
                            <div style={{
                              background: '#D1FAE5',
                              color: '#059669',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <FaCheck /> Eseguita {activation.eseguita_il && `il ${new Date(activation.eseguita_il).toLocaleDateString('it-IT')}`}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            {!isClub && activation.stato === 'pianificata' && (
                              <button
                                className="sd-btn sd-btn-primary"
                                style={{ flex: 1, background: '#85FF00', color: '#1A1A1A' }}
                                onClick={() => handleConfirmActivation(activation.id)}
                              >
                                <FaCheck /> Conferma
                              </button>
                            )}

                            {isClub && !activation.eseguita && activation.stato === 'confermata' && (
                              <button
                                className="sd-btn sd-btn-primary"
                                style={{ flex: 1, background: '#85FF00', color: '#1A1A1A' }}
                                onClick={() => handleMarkAsExecuted(activation.id)}
                              >
                                <FaCheck /> Segna Eseguita
                              </button>
                            )}

                            {isClub && (
                              <button
                                className="sd-btn"
                                style={{ background: '#FEE2E2', color: '#DC2626' }}
                                onClick={() => handleDeleteActivation(activation.id)}
                              >
                                <FaTrashAlt />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaBullseye /></div>
                      <h3 className="sd-empty-title">Nessuna attivazione</h3>
                      <p className="sd-empty-desc">Aggiungi attivazioni sponsor per questa partita</p>
                      {isClub && (
                        <button className="sd-btn sd-btn-primary" onClick={() => setShowActivationModal(true)}>
                          <FaPlus /> Nuova Attivazione
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Box Invites Tab */}
              {activeTab === 'invites' && (
                <>
                  <div className="sd-tab-header">
                    <h2 className="sd-tab-title"><FaTicketAlt /> Inviti Business Box</h2>
                    {isClub && (
                      <button className="sd-btn sd-btn-primary" onClick={() => setShowBoxInviteModal(true)}>
                        <FaPlus /> Nuovo Invito
                      </button>
                    )}
                  </div>

                  {boxInvites.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Ospite</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Email</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Business Box</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>VIP</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Parcheggio</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Stato</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boxInvites.map(invite => (
                            <tr key={invite.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '16px 12px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                                  {invite.nome} {invite.cognome}
                                </div>
                                {invite.azienda && (
                                  <small style={{ color: '#6B7280' }}>{invite.azienda}</small>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px', color: '#6B7280' }}>{invite.email}</td>
                              <td style={{ padding: '16px 12px', color: '#6B7280' }}>
                                {invite.business_box?.nome || '-'}
                              </td>
                              <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                {invite.vip ? (
                                  <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>VIP</span>
                                ) : '-'}
                              </td>
                              <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                                {invite.parcheggio_richiesto ? <FaCheck style={{ color: '#059669' }} /> : '-'}
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  background: invite.status === 'confermato' ? '#D1FAE5' : '#F3F4F6',
                                  color: invite.status === 'confermato' ? '#059669' : '#6B7280'
                                }}>
                                  {invite.status || 'Inviato'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="sd-empty">
                      <div className="sd-empty-icon"><FaTicketAlt /></div>
                      <h3 className="sd-empty-title">Nessun invito</h3>
                      <p className="sd-empty-desc">Crea inviti per i business box di questa partita</p>
                      {isClub && (
                        <button className="sd-btn sd-btn-primary" onClick={() => setShowBoxInviteModal(true)}>
                          <FaPlus /> Nuovo Invito
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nuova Attivazione */}
      <Modal
        isOpen={showActivationModal}
        onClose={() => { setShowActivationModal(false); resetActivationForm(); }}
        title="Nuova Attivazione"
      >
        <div style={{ padding: '20px 0' }}>
          <form onSubmit={handleCreateActivation}>
            <div className="form-group">
              <label>Sponsor <span className="required">*</span></label>
              <select
                value={activationForm.sponsor_id}
                onChange={(e) => handleSponsorChange(e.target.value)}
                required
              >
                <option value="">Seleziona sponsor...</option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.ragione_sociale}
                  </option>
                ))}
              </select>
            </div>

            {activationForm.sponsor_id && (
              <div className="form-group">
                <label>Contratto <span className="required">*</span></label>
                <select
                  value={activationForm.contract_id}
                  onChange={(e) => handleContractChange(e.target.value)}
                  required
                >
                  <option value="">Seleziona contratto...</option>
                  {filteredContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.nome_contratto || `Contratto #${contract.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activationForm.contract_id && (
              <>
                {/* NEW: Inventory Allocations Selector */}
                {filteredAllocations.length > 0 && (
                  <div className="form-group">
                    <label>Asset dall'Inventario</label>
                    <select
                      value={activationForm.allocation_id}
                      onChange={(e) => handleAllocationChange(e.target.value)}
                    >
                      <option value="">Seleziona asset inventario...</option>
                      {filteredAllocations.map((allocation) => (
                        <option key={allocation.id} value={allocation.id}>
                          {allocation.inventory_asset?.nome} ({allocation.inventory_asset?.codice}) - €{allocation.prezzo_concordato?.toLocaleString() || allocation.inventory_asset?.prezzo_listino?.toLocaleString() || 0}
                        </option>
                      ))}
                    </select>
                    <span className="form-hint" style={{ color: '#059669' }}>
                      {filteredAllocations.length} asset allocati disponibili per questo match
                    </span>
                  </div>
                )}

                {/* Show selected allocation details */}
                {selectedAllocation && (
                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {selectedAllocation.inventory_asset?.immagine_principale && (
                      <img
                        src={selectedAllocation.inventory_asset.immagine_principale.startsWith('http')
                          ? selectedAllocation.inventory_asset.immagine_principale
                          : `${API_URL.replace('/api', '')}${selectedAllocation.inventory_asset.immagine_principale}`}
                        alt={selectedAllocation.inventory_asset?.nome}
                        style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534' }}>{selectedAllocation.inventory_asset?.nome}</div>
                      <div style={{ fontSize: '12px', color: '#15803D' }}>
                        {selectedAllocation.inventory_asset?.tipo} • {selectedAllocation.inventory_asset?.posizione || 'N/D'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy: Old Assets (hidden if inventory has items) */}
                {filteredAllocations.length === 0 && filteredAssets.length > 0 && (
                  <div className="form-group">
                    <label>Asset (Legacy)</label>
                    <select
                      value={activationForm.asset_id}
                      onChange={(e) => handleAssetChange(e.target.value)}
                    >
                      <option value="">Nessun asset</option>
                      {filteredAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.categoria} - {asset.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedAsset && selectedAsset.quantita_totale && (
                  <div className="form-group">
                    <label>Quantità utilizzata <span className="required">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max={selectedAsset.quantita_totale - (selectedAsset.quantita_utilizzata || 0)}
                      value={activationForm.quantita_utilizzata}
                      onChange={(e) => setActivationForm({ ...activationForm, quantita_utilizzata: e.target.value })}
                      required
                    />
                    <span className="form-hint">
                      Disponibile: {selectedAsset.quantita_totale - (selectedAsset.quantita_utilizzata || 0)} / {selectedAsset.quantita_totale}
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Tipo Attivazione <span className="required">*</span></label>
                  <select
                    value={activationForm.tipo}
                    onChange={(e) => setActivationForm({ ...activationForm, tipo: e.target.value })}
                    disabled={!!selectedAsset}
                    required
                  >
                    <option value="">Seleziona...</option>
                    <option value="led">LED / Maxischermo</option>
                    <option value="social">Social Media</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="product_placement">Product Placement</option>
                    <option value="branding">Branding</option>
                    <option value="sampling">Sampling</option>
                    <option value="meet_and_greet">Meet & Greet</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Note Attivazione</label>
                  <textarea
                    value={activationForm.descrizione_attivazione}
                    onChange={(e) => setActivationForm({ ...activationForm, descrizione_attivazione: e.target.value })}
                    placeholder="Note specifiche per questa attivazione..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Responsabile</label>
                  <input
                    type="text"
                    value={activationForm.responsabile}
                    onChange={(e) => setActivationForm({ ...activationForm, responsabile: e.target.value })}
                    placeholder="Nome del responsabile"
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                className="sd-btn sd-btn-outline"
                onClick={() => { setShowActivationModal(false); resetActivationForm(); }}
              >
                Annulla
              </button>
              <button type="submit" className="sd-btn sd-btn-primary">
                Crea Attivazione
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Nuovo Invito Business Box */}
      <Modal
        isOpen={showBoxInviteModal}
        onClose={() => { setShowBoxInviteModal(false); resetBoxInviteForm(); }}
        title="Nuovo Invito Business Box"
      >
        <div style={{ padding: '20px 0' }}>
          <form onSubmit={handleCreateBoxInvite}>
            <div className="form-group">
              <label>Business Box <span className="required">*</span></label>
              <select
                value={boxInviteForm.business_box_id}
                onChange={(e) => setBoxInviteForm({ ...boxInviteForm, business_box_id: e.target.value })}
                required
              >
                <option value="">Seleziona Business Box...</option>
                {businessBoxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.nome} - {box.settore} ({box.numero_posti} posti)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nome <span className="required">*</span></label>
                <input
                  type="text"
                  value={boxInviteForm.nome}
                  onChange={(e) => setBoxInviteForm({ ...boxInviteForm, nome: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cognome <span className="required">*</span></label>
                <input
                  type="text"
                  value={boxInviteForm.cognome}
                  onChange={(e) => setBoxInviteForm({ ...boxInviteForm, cognome: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                value={boxInviteForm.email}
                onChange={(e) => setBoxInviteForm({ ...boxInviteForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Azienda</label>
              <input
                type="text"
                value={boxInviteForm.azienda}
                onChange={(e) => setBoxInviteForm({ ...boxInviteForm, azienda: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Note</label>
              <textarea
                value={boxInviteForm.note}
                onChange={(e) => setBoxInviteForm({ ...boxInviteForm, note: e.target.value })}
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={boxInviteForm.vip}
                  onChange={(e) => setBoxInviteForm({ ...boxInviteForm, vip: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                Ospite VIP
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={boxInviteForm.parcheggio_richiesto}
                  onChange={(e) => setBoxInviteForm({ ...boxInviteForm, parcheggio_richiesto: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                Parcheggio Richiesto
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="sd-btn sd-btn-outline"
                onClick={() => { setShowBoxInviteModal(false); resetBoxInviteForm(); }}
              >
                Annulla
              </button>
              <button type="submit" className="sd-btn sd-btn-primary">
                Crea Invito
              </button>
            </div>
          </form>
        </div>
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
              className="sd-btn sd-btn-primary"
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

export default MatchDetail;
