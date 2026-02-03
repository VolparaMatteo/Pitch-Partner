import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import OpportunityCard from '../components/marketplace/OpportunityCard';
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters';
import MarketplaceStats from '../components/marketplace/MarketplaceStats';
import MarketplaceMap from '../components/MarketplaceMap';
import AddressAutocomplete from '../components/AddressAutocomplete';
import {
  FaPlus, FaSearch, FaMapMarkerAlt, FaEnvelopeOpenText,
  FaEdit, FaPaperPlane, FaHandshake, FaCalendarAlt,
  FaClock, FaEye, FaTimes, FaArrowRight, FaCheck,
  FaTimesCircle, FaSpinner
} from 'react-icons/fa';
import '../styles/template-style.css';
import '../styles/marketplace.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubMarketplace() {
  const navigate = useNavigate();
  const { user, token } = getAuth();

  // State principale
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Dati
  const [opportunities, setOpportunities] = useState([]);
  const [myOpportunities, setMyOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [invitesPendingCount, setInvitesPendingCount] = useState(0);
  const [stats, setStats] = useState(null);

  // Filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tipo: 'all',
    budgetRange: 'all',
    creator_type: 'all',
    applied: 'all',
    availability: 'all'
  });
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Mappa
  const [geoOpportunities, setGeoOpportunities] = useState([]);
  const [geoFilters, setGeoFilters] = useState({
    lat: null, lng: null, radius: 100,
    city: '', province: '', region: ''
  });
  const [selectedMapOpportunity, setSelectedMapOpportunity] = useState(null);

  // Auth check
  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    loadInitialData();
  }, []);

  // Load data on tab change
  useEffect(() => {
    if (user && token) {
      loadTabData();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDiscoverOpportunities(),
        fetchStats(),
        fetchInvitesCount()
      ]);
    } catch (error) {
      console.error('Errore caricamento iniziale:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'discover':
          await fetchDiscoverOpportunities();
          break;
        case 'map':
          await fetchGeoOpportunities();
          break;
        case 'my-opportunities':
          await fetchMyOpportunities();
          break;
        case 'applications':
          await fetchApplications();
          break;
        case 'collaborations':
          await fetchCollaborations();
          break;
        case 'invites':
          await fetchReceivedInvites();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Errore caricamento tab:', error);
    } finally {
      setLoading(false);
    }
  };

  // API Calls
  const fetchDiscoverOpportunities = async () => {
    const res = await axios.get(`${API_URL}/club/marketplace/discover`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOpportunities(res.data.opportunities || []);
  };

  const fetchStats = async () => {
    try {
      const [oppRes, appRes, collabRes, myOppRes] = await Promise.all([
        axios.get(`${API_URL}/club/marketplace/discover`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/club/marketplace/applications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/club/marketplace/collaborations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/club/marketplace/my-opportunities`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats({
        total_opportunities: oppRes.data.opportunities?.length || 0,
        my_applications: appRes.data.applications?.length || 0,
        active_collaborations: collabRes.data.collaborations?.length || 0,
        my_opportunities: myOppRes.data.opportunities?.length || 0
      });
    } catch (error) {
      console.error('Errore stats:', error);
    }
  };

  const fetchMyOpportunities = async () => {
    const res = await axios.get(`${API_URL}/club/marketplace/my-opportunities`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMyOpportunities(res.data.opportunities || []);
  };

  const fetchApplications = async () => {
    const res = await axios.get(`${API_URL}/club/marketplace/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setApplications(res.data.applications || []);
  };

  const fetchCollaborations = async () => {
    const res = await axios.get(`${API_URL}/club/marketplace/collaborations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCollaborations(res.data.collaborations || []);
  };

  const fetchReceivedInvites = async () => {
    const res = await axios.get(`${API_URL}/club/marketplace/invites/received`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setReceivedInvites(res.data.invites || []);
    setInvitesPendingCount(res.data.pending_count || 0);
  };

  const fetchInvitesCount = async () => {
    try {
      const res = await axios.get(`${API_URL}/club/marketplace/invites/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitesPendingCount(res.data.pending_count || 0);
    } catch (error) {
      console.error('Errore conteggio inviti:', error);
    }
  };

  const fetchGeoOpportunities = async () => {
    const params = new URLSearchParams();
    if (geoFilters.lat && geoFilters.lng) {
      params.append('lat', geoFilters.lat);
      params.append('lng', geoFilters.lng);
      params.append('radius', geoFilters.radius);
    }
    if (geoFilters.region) params.append('region', geoFilters.region);
    if (geoFilters.province) params.append('province', geoFilters.province);
    if (geoFilters.city) params.append('city', geoFilters.city);

    const res = await axios.get(`${API_URL}/club/marketplace/discover/geo?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setGeoOpportunities(res.data.opportunities || []);
  };

  // Handlers
  const handleAcceptInvite = async (inviteId) => {
    try {
      const res = await axios.post(
        `${API_URL}/club/marketplace/invites/${inviteId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Invito accettato!', type: 'success' });
      if (res.data.redirect_url) {
        navigate(res.data.redirect_url);
      }
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore', type: 'error' });
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await axios.post(
        `${API_URL}/club/marketplace/invites/${inviteId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Invito rifiutato', type: 'success' });
      await fetchReceivedInvites();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore', type: 'error' });
    }
  };

  // Filtering & Sorting
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(opp =>
        opp.titolo?.toLowerCase().includes(search) ||
        opp.descrizione?.toLowerCase().includes(search) ||
        opp.creator_name?.toLowerCase().includes(search) ||
        opp.location_city?.toLowerCase().includes(search)
      );
    }

    // Tipo
    if (filters.tipo !== 'all') {
      result = result.filter(opp => opp.tipo_opportunita === filters.tipo);
    }

    // Creator type
    if (filters.creator_type !== 'all') {
      result = result.filter(opp => opp.creator_type === filters.creator_type);
    }

    // Budget
    if (filters.budgetRange !== 'all') {
      result = result.filter(opp => {
        const budget = parseFloat(opp.budget_richiesto) || 0;
        switch (filters.budgetRange) {
          case '0-5000': return budget <= 5000;
          case '5000-15000': return budget > 5000 && budget <= 15000;
          case '15000-30000': return budget > 15000 && budget <= 30000;
          case '30000-50000': return budget > 30000 && budget <= 50000;
          case '50000+': return budget > 50000;
          default: return true;
        }
      });
    }

    // Applied status
    if (filters.applied === 'applied') {
      result = result.filter(opp => opp.has_applied);
    } else if (filters.applied === 'not_applied') {
      result = result.filter(opp => !opp.has_applied);
    }

    // Sorting
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.pubblicata_at || b.created_at) - new Date(a.pubblicata_at || a.created_at));
        break;
      case 'budget_high':
        result.sort((a, b) => (parseFloat(b.budget_richiesto) || 0) - (parseFloat(a.budget_richiesto) || 0));
        break;
      case 'budget_low':
        result.sort((a, b) => (parseFloat(a.budget_richiesto) || 0) - (parseFloat(b.budget_richiesto) || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'deadline':
        result.sort((a, b) => new Date(a.deadline_candidature || '9999') - new Date(b.deadline_candidature || '9999'));
        break;
      default:
        break;
    }

    return result;
  }, [opportunities, searchTerm, filters, sortBy]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  // Scroll to top quando cambia pagina
  const scrollToResults = () => {
    const resultsElement = document.getElementById('opportunities-grid');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setTimeout(scrollToResults, 100);
  };

  // Paginazione
  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE);
  const paginatedOpportunities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOpportunities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOpportunities, currentPage]);

  // Tabs config
  const tabs = [
    { key: 'discover', label: 'Scopri', icon: <FaSearch /> },
    { key: 'map', label: 'Mappa', icon: <FaMapMarkerAlt /> },
    { key: 'invites', label: 'Inviti', icon: <FaEnvelopeOpenText />, badge: invitesPendingCount },
    { key: 'my-opportunities', label: 'Le Mie', icon: <FaEdit /> },
    { key: 'applications', label: 'Candidature', icon: <FaPaperPlane /> },
    { key: 'collaborations', label: 'Collaborazioni', icon: <FaHandshake /> }
  ];

  // Helper functions
  const getOpportunityTypeLabel = (tipo) => {
    const types = {
      'evento_speciale': 'Evento',
      'campagna_promozionale': 'Campagna',
      'progetto_csr': 'CSR',
      'co_branding': 'Co-Branding',
      'attivazione_speciale': 'Attivazione'
    };
    return types[tipo] || 'Altro';
  };

  return (
    <div className="tp-page-container">
      {/* Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Marketplace</h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--tp-gray-500)' }}>
            Scopri opportunità di sponsorizzazione e partnership
          </p>
        </div>

        <button
          className="tp-btn tp-btn-primary"
          onClick={() => navigate('/club/marketplace/create')}
        >
          <FaPlus />
          Crea Opportunità
        </button>
      </div>

      {/* Stats */}
      {stats && <MarketplaceStats stats={stats} userRole="club" />}

      {/* Tabs */}
      <div className="mp-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`mp-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="mp-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="mp-tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mp-loading">
          <div className="mp-loading-content">
            <FaSpinner className="mp-loading-icon" />
            <p>Caricamento...</p>
          </div>
        </div>
      ) : (
        <>
          {/* DISCOVER TAB */}
          {activeTab === 'discover' && (
            <>
              <MarketplaceFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={setFilters}
                sortBy={sortBy}
                onSortChange={setSortBy}
                resultsCount={filteredOpportunities.length}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {filteredOpportunities.length === 0 ? (
                <div className="mp-empty">
                  <div className="mp-empty-icon"><FaSearch /></div>
                  <h3 className="mp-empty-title">Nessuna opportunità trovata</h3>
                  <p className="mp-empty-description">Prova a modificare i filtri o torna più tardi</p>
                </div>
              ) : (
                <>
                  <div
                    id="opportunities-grid"
                    className={`mp-grid ${viewMode === 'list' ? 'list' : ''}`}
                  >
                    {paginatedOpportunities.map(opp => (
                      <OpportunityCard
                        key={opp.id}
                        opportunity={opp}
                        userRole="club"
                      />
                    ))}
                  </div>

                  {/* Paginazione */}
                  {totalPages > 1 && (
                    <div className="mp-pagination">
                      <button
                        className="mp-pagination-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        ««
                      </button>
                      <button
                        className="mp-pagination-btn"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        «
                      </button>

                      <div className="mp-pagination-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, idx, arr) => (
                            <span key={page} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span style={{ color: 'var(--tp-gray-400)', padding: '0 4px' }}>...</span>
                              )}
                              <button
                                className={`mp-pagination-page ${currentPage === page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </span>
                          ))}
                      </div>

                      <button
                        className="mp-pagination-btn"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        »
                      </button>
                      <button
                        className="mp-pagination-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        »»
                      </button>

                      <span className="mp-pagination-info">
                        Pagina {currentPage} di {totalPages}
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div className="mp-map-container">
              {/* Map */}
              <div className="mp-map-wrapper">
                <MarketplaceMap
                  opportunities={geoOpportunities}
                  height="100%"
                  onOpportunityClick={(opp) => setSelectedMapOpportunity(opp)}
                  selectedId={selectedMapOpportunity?.id}
                />

                {/* Modal dettagli opportunità */}
                {selectedMapOpportunity && (
                  <div
                    className="mp-map-modal-overlay"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setSelectedMapOpportunity(null);
                    }}
                  >
                    <div className="mp-map-modal">
                      {/* Header */}
                      <div className="mp-map-modal-header">
                        <div className="mp-opp-badges">
                          <span className="mp-opp-badge type">
                            {getOpportunityTypeLabel(selectedMapOpportunity.tipo_opportunita)}
                          </span>
                          <span className={`mp-opp-badge ${selectedMapOpportunity.creator_type}`}>
                            {selectedMapOpportunity.creator_type === 'club' ? 'Club' : 'Sponsor'}
                          </span>
                        </div>
                        <button
                          className="mp-map-modal-close"
                          onClick={() => setSelectedMapOpportunity(null)}
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="mp-map-modal-body">
                        {/* Creator info */}
                        <div className="mp-map-modal-creator">
                          <div className="mp-opp-creator-logo">
                            {selectedMapOpportunity.creator_logo ? (
                              <img
                                src={selectedMapOpportunity.creator_logo.startsWith('http')
                                  ? selectedMapOpportunity.creator_logo
                                  : `${API_URL.replace('/api', '')}${selectedMapOpportunity.creator_logo}`}
                                alt=""
                              />
                            ) : (
                              <span style={{ fontSize: '20px' }}>
                                {selectedMapOpportunity.creator_type === 'club' ? '🏆' : '🏢'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="mp-opp-creator-name">
                              {selectedMapOpportunity.creator_name}
                            </div>
                            <div className="mp-opp-creator-date">
                              {selectedMapOpportunity.pubblicata_at
                                ? new Date(selectedMapOpportunity.pubblicata_at).toLocaleDateString('it-IT')
                                : ''}
                            </div>
                          </div>
                        </div>

                        {/* Titolo */}
                        <h3 className="mp-map-modal-title">
                          {selectedMapOpportunity.titolo}
                        </h3>

                        {/* Descrizione */}
                        <p className="mp-map-modal-description">
                          {selectedMapOpportunity.descrizione}
                        </p>

                        {/* Info */}
                        <div className="mp-map-modal-info">
                          {selectedMapOpportunity.location_city && (
                            <div className="mp-map-modal-info-item">
                              <FaMapMarkerAlt />
                              <span>
                                {selectedMapOpportunity.location_city}
                                {selectedMapOpportunity.location_province ? `, ${selectedMapOpportunity.location_province}` : ''}
                                {selectedMapOpportunity.distance_km !== undefined && selectedMapOpportunity.distance_km !== null && (
                                  <span style={{ color: 'var(--tp-gray-400)' }}> • {selectedMapOpportunity.distance_km} km</span>
                                )}
                              </span>
                            </div>
                          )}

                          {selectedMapOpportunity.data_inizio && (
                            <div className="mp-map-modal-info-item">
                              <FaCalendarAlt />
                              <span>
                                {new Date(selectedMapOpportunity.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {selectedMapOpportunity.data_fine && selectedMapOpportunity.data_fine !== selectedMapOpportunity.data_inizio && (
                                  <> - {new Date(selectedMapOpportunity.data_fine).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                                )}
                              </span>
                            </div>
                          )}

                          {selectedMapOpportunity.deadline_candidature && (
                            <div className={`mp-map-modal-info-item ${new Date(selectedMapOpportunity.deadline_candidature) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'urgent' : ''}`}>
                              <FaClock />
                              <span>
                                Scadenza: {new Date(selectedMapOpportunity.deadline_candidature).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Footer con budget e stats */}
                        <div className="mp-map-modal-footer">
                          {selectedMapOpportunity.budget_richiesto ? (
                            <div>
                              <div className="mp-map-modal-budget-label">Budget</div>
                              <div className="mp-map-modal-budget-value">
                                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(selectedMapOpportunity.budget_richiesto)}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'var(--tp-gray-400)' }}>Budget da definire</div>
                          )}

                          <div className="mp-map-modal-stats">
                            <div className="mp-map-modal-stat">
                              <div className="mp-map-modal-stat-icon"><FaEye /></div>
                              <div className="mp-map-modal-stat-value">{selectedMapOpportunity.views_count || 0}</div>
                            </div>
                            <div className="mp-map-modal-stat">
                              <div className="mp-map-modal-stat-icon"><FaPaperPlane /></div>
                              <div className="mp-map-modal-stat-value">{selectedMapOpportunity.applications_count || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          className="tp-btn tp-btn-primary"
                          style={{ width: '100%' }}
                          onClick={() => navigate(`/club/marketplace/opportunities/${selectedMapOpportunity.id}`)}
                        >
                          Scopri dettagli
                          <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="mp-map-sidebar">
                <h3 className="mp-map-sidebar-title">Filtra per Posizione</h3>

                <div className="mp-map-filters">
                  <AddressAutocomplete
                    placeholder="Cerca città o indirizzo..."
                    onChange={(location) => {
                      if (location) {
                        setGeoFilters(prev => ({
                          ...prev,
                          lat: location.location_lat,
                          lng: location.location_lng,
                          city: location.location_city || ''
                        }));
                      }
                    }}
                  />
                </div>

                <div className="mp-map-radius">
                  <label className="mp-map-radius-label">
                    Raggio: {geoFilters.radius} km
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={geoFilters.radius}
                    onChange={(e) => setGeoFilters(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                    className="mp-map-radius-slider"
                  />
                </div>

                <div className="mp-map-actions">
                  <button
                    className="tp-btn tp-btn-primary"
                    style={{ flex: 1 }}
                    onClick={fetchGeoOpportunities}
                  >
                    <FaSearch />
                    Cerca
                  </button>
                  <button
                    className="tp-btn tp-btn-outline"
                    onClick={() => {
                      setGeoFilters({
                        lat: null, lng: null, radius: 100,
                        city: '', province: '', region: ''
                      });
                      setTimeout(fetchGeoOpportunities, 100);
                    }}
                  >
                    Mostra tutte
                  </button>
                </div>

                {/* Results list */}
                <div className="mp-map-results">
                  <div className="mp-map-results-count">
                    {geoOpportunities.length} risultati
                  </div>
                  {geoOpportunities.slice(0, 10).map(opp => (
                    <div
                      key={opp.id}
                      className={`mp-map-result-item ${selectedMapOpportunity?.id === opp.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMapOpportunity(opp)}
                    >
                      <div className="mp-map-result-title">{opp.titolo}</div>
                      <div className="mp-map-result-location">
                        <FaMapMarkerAlt />
                        {opp.location_city}
                        {opp.distance_km && ` • ${opp.distance_km} km`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MY OPPORTUNITIES TAB */}
          {activeTab === 'my-opportunities' && (
            <div>
              {myOpportunities.length === 0 ? (
                <div className="mp-empty">
                  <div className="mp-empty-icon"><FaEdit /></div>
                  <h3 className="mp-empty-title">Nessuna opportunità creata</h3>
                  <p className="mp-empty-description">Crea la tua prima opportunità per attirare sponsor</p>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => navigate('/club/marketplace/create')}
                  >
                    <FaPlus />
                    Crea Opportunità
                  </button>
                </div>
              ) : (
                <div className="mp-grid">
                  {myOpportunities.map(opp => (
                    <div
                      key={opp.id}
                      className="mp-opp-card"
                      onClick={() => navigate(`/club/marketplace/manage/${opp.id}`)}
                    >
                      <div className="mp-opp-header">
                        <span className={`mp-opp-badge ${opp.stato === 'pubblicata' ? 'status-published' : 'status-draft'}`}>
                          {opp.stato}
                        </span>
                        <span className="mp-opp-date">
                          {new Date(opp.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>

                      <h3 className="mp-opp-title">{opp.titolo}</h3>

                      <div className="mp-opp-footer">
                        <div className="mp-opp-stats">
                          <div className="mp-opp-stat">
                            <div className="mp-opp-stat-icon"><FaPaperPlane /></div>
                            <div className="mp-opp-stat-value">{opp.applications_count || 0}</div>
                          </div>
                          <div className="mp-opp-stat">
                            <div className="mp-opp-stat-icon"><FaEye /></div>
                            <div className="mp-opp-stat-value">{opp.views_count || 0}</div>
                          </div>
                        </div>
                        {opp.budget_richiesto && (
                          <div className="mp-opp-budget">
                            <div className="mp-opp-budget-label">Budget</div>
                            <div className="mp-opp-budget-value" style={{ color: 'var(--tp-success-700)' }}>
                              €{Number(opp.budget_richiesto).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div>
              {applications.length === 0 ? (
                <div className="mp-empty">
                  <div className="mp-empty-icon"><FaPaperPlane /></div>
                  <h3 className="mp-empty-title">Nessuna candidatura inviata</h3>
                  <p className="mp-empty-description">Scopri le opportunità e invia la tua prima candidatura</p>
                  <button
                    className="tp-btn tp-btn-primary"
                    onClick={() => setActiveTab('discover')}
                  >
                    <FaSearch />
                    Scopri Opportunità
                  </button>
                </div>
              ) : (
                <div className="mp-applications-list">
                  {applications.map(app => (
                    <div key={app.id} className="mp-application-card">
                      <div className="mp-application-info">
                        <h4>{app.opportunity?.titolo || 'Opportunità'}</h4>
                        <div className="mp-application-meta">
                          Inviata il {new Date(app.created_at).toLocaleDateString('it-IT')}
                          {app.proposta_budget && ` • Budget proposto: €${Number(app.proposta_budget).toLocaleString()}`}
                        </div>
                      </div>
                      <span className={`mp-application-status ${app.stato === 'accettata' ? 'accepted' : app.stato === 'rifiutata' ? 'rejected' : 'pending'}`}>
                        {app.stato === 'in_attesa' && <><FaClock /> In attesa</>}
                        {app.stato === 'accettata' && <><FaCheck /> Accettata</>}
                        {app.stato === 'rifiutata' && <><FaTimesCircle /> Rifiutata</>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COLLABORATIONS TAB */}
          {activeTab === 'collaborations' && (
            <div>
              {collaborations.length === 0 ? (
                <div className="mp-empty">
                  <div className="mp-empty-icon"><FaHandshake /></div>
                  <h3 className="mp-empty-title">Nessuna collaborazione attiva</h3>
                  <p className="mp-empty-description">Le tue collaborazioni appariranno qui quando le candidature verranno accettate</p>
                </div>
              ) : (
                <div className="mp-collaborations-list">
                  {collaborations.map(collab => (
                    <div key={collab.id} className="mp-collaboration-card">
                      <div className="mp-collaboration-header">
                        <div>
                          <h4 className="mp-collaboration-title">
                            {collab.opportunity?.titolo || 'Collaborazione'}
                          </h4>
                          <div className="mp-collaboration-meta">
                            <span>Ruolo: {collab.ruolo}</span>
                            {collab.budget_confermato && (
                              <span>Budget: €{Number(collab.budget_confermato).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <span className="mp-collaboration-status">
                          <FaCheck /> {collab.stato}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INVITES TAB */}
          {activeTab === 'invites' && (
            <div>
              {receivedInvites.length === 0 ? (
                <div className="mp-empty">
                  <div className="mp-empty-icon"><FaEnvelopeOpenText /></div>
                  <h3 className="mp-empty-title">Nessun invito ricevuto</h3>
                  <p className="mp-empty-description">Gli inviti a partecipare alle opportunità appariranno qui</p>
                </div>
              ) : (
                <div className="mp-invites-list">
                  {receivedInvites.map(invite => (
                    <div
                      key={invite.id}
                      className={`mp-invite-card ${invite.stato === 'pending' ? 'pending' : ''}`}
                    >
                      <div className="mp-invite-header">
                        <div className="mp-invite-sender">
                          <div className="mp-invite-sender-logo">
                            {invite.sender_type === 'club' ? '🏆' : '🏢'}
                          </div>
                          <div>
                            <div className="mp-invite-sender-label">Invito da</div>
                            <div className="mp-invite-sender-name">{invite.sender_name}</div>
                          </div>
                        </div>
                        <span className={`mp-invite-status ${invite.stato}`}>
                          {invite.stato === 'pending' ? 'In attesa' : invite.stato === 'accepted' ? 'Accettato' : 'Rifiutato'}
                        </span>
                      </div>

                      {invite.opportunity && (
                        <div className="mp-invite-opportunity">
                          <div className="mp-invite-opportunity-title">{invite.opportunity.titolo}</div>
                          {invite.opportunity.budget_richiesto && (
                            <span className="tp-badge tp-badge-success">
                              €{Number(invite.opportunity.budget_richiesto).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {invite.messaggio && (
                        <div className="mp-invite-message">
                          "{invite.messaggio}"
                        </div>
                      )}

                      {invite.stato === 'pending' && (
                        <div className="mp-invite-actions">
                          <button
                            className="tp-btn tp-btn-success"
                            onClick={() => handleAcceptInvite(invite.id)}
                          >
                            <FaCheck />
                            Accetta e Candidati
                          </button>
                          <button
                            className="tp-btn tp-btn-outline"
                            onClick={() => handleDeclineInvite(invite.id)}
                          >
                            <FaTimes />
                            Rifiuta
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
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

export default ClubMarketplace;
