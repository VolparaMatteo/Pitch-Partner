import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/template-style.css';

import {
  FaSearch, FaFilter, FaEye, FaEnvelope, FaFileContract,
  FaBuilding, FaMapMarkerAlt, FaUsers, FaFutbol, FaTrophy,
  FaEuroSign, FaCalendarAlt, FaHandshake, FaChartLine
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorClubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [selectedClub, setSelectedClub] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  const sportOptions = [
    { value: 'all', label: 'Tutti gli sport' },
    { value: 'calcio', label: 'Calcio' },
    { value: 'basket', label: 'Basket' },
    { value: 'pallavolo', label: 'Pallavolo' },
    { value: 'rugby', label: 'Rugby' },
    { value: 'altro', label: 'Altro' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get contracts to find club partners
      const contractsRes = await axios.get(`${API_URL}/sponsor/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contracts = contractsRes.data.contracts || contractsRes.data || [];

      // Extract unique clubs from contracts
      const clubMap = new Map();
      contracts.forEach(c => {
        if (c.club_id && !clubMap.has(c.club_id)) {
          clubMap.set(c.club_id, {
            id: c.club_id,
            nome: c.club_nome || c.club?.nome || `Club ${c.club_id}`,
            logo_url: c.club_logo || c.club?.logo_url,
            citta: c.club_citta || c.club?.citta || 'Italia',
            sport: c.club_sport || c.club?.sport || 'calcio',
            contracts: [],
            totalValue: 0,
            activeContracts: 0
          });
        }
        if (c.club_id) {
          const club = clubMap.get(c.club_id);
          club.contracts.push(c);
          club.totalValue += c.compenso || 0;
          const now = new Date();
          const end = new Date(c.data_fine);
          if (end >= now) {
            club.activeContracts++;
          }
        }
      });

      setClubs(Array.from(clubMap.values()));
    } catch (error) {
      console.error('Error fetching clubs:', error);
      // Mock data
      setClubs([
        {
          id: 1,
          nome: 'FC Milano',
          logo_url: null,
          citta: 'Milano',
          sport: 'calcio',
          totalValue: 75000,
          activeContracts: 2,
          contracts: []
        },
        {
          id: 2,
          nome: 'AC Torino',
          logo_url: null,
          citta: 'Torino',
          sport: 'calcio',
          totalValue: 45000,
          activeContracts: 1,
          contracts: []
        },
        {
          id: 3,
          nome: 'Basket Roma',
          logo_url: null,
          citta: 'Roma',
          sport: 'basket',
          totalValue: 30000,
          activeContracts: 1,
          contracts: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.citta?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === 'all' || club.sport === sportFilter;
    return matchesSearch && matchesSport;
  });

  // Calculate totals
  const totals = {
    clubs: clubs.length,
    totalValue: clubs.reduce((sum, c) => sum + (c.totalValue || 0), 0),
    activeContracts: clubs.reduce((sum, c) => sum + (c.activeContracts || 0), 0)
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Caricamento club partner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Club Partner</h1>
          <p>I club con cui hai attive collaborazioni di sponsorizzazione</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaBuilding /></div>
          <div className="stat-content">
            <div className="stat-value">{totals.clubs}</div>
            <div className="stat-label">Club Partner</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaEuroSign /></div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(totals.totalValue)}</div>
            <div className="stat-label">Valore Totale</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaFileContract /></div>
          <div className="stat-content">
            <div className="stat-value">{totals.activeContracts}</div>
            <div className="stat-label">Contratti Attivi</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Cerca club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FaFilter />
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
            {sportOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="cards-grid">
        {filteredClubs.map(club => (
          <div key={club.id} className="card club-card" onClick={() => setSelectedClub(club)}>
            <div className="card-header">
              <img
                src={club.logo_url ? getImageUrl(club.logo_url) : FavIcon}
                alt={club.nome}
                className="club-logo"
              />
              <div className="club-info">
                <h3>{club.nome}</h3>
                <div className="club-location">
                  <FaMapMarkerAlt /> {club.citta}
                </div>
              </div>
              <span className="sport-badge">{club.sport}</span>
            </div>
            <div className="card-body">
              <div className="club-stats">
                <div className="club-stat">
                  <FaFileContract />
                  <span>{club.activeContracts} contratti attivi</span>
                </div>
                <div className="club-stat">
                  <FaEuroSign />
                  <span>{formatCurrency(club.totalValue)}</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn-secondary small" onClick={(e) => {
                e.stopPropagation();
                navigate('/messages');
              }}>
                <FaEnvelope /> Messaggio
              </button>
              <button className="btn-primary small" onClick={(e) => {
                e.stopPropagation();
                navigate('/sponsor/contracts');
              }}>
                <FaEye /> Contratti
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="empty-state">
          <FaBuilding />
          <h3>Nessun club partner trovato</h3>
          <p>Non hai ancora collaborazioni attive con club sportivi</p>
          <button className="btn-primary" onClick={() => navigate('/sponsor/marketplace')}>
            Esplora Marketplace
          </button>
        </div>
      )}

      {/* Club Detail Modal */}
      {selectedClub && (
        <div className="modal-overlay" onClick={() => setSelectedClub(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="club-modal-header">
                <img
                  src={selectedClub.logo_url ? getImageUrl(selectedClub.logo_url) : FavIcon}
                  alt={selectedClub.nome}
                  className="club-logo-large"
                />
                <div>
                  <h2>{selectedClub.nome}</h2>
                  <p><FaMapMarkerAlt /> {selectedClub.citta} • {selectedClub.sport}</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedClub(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-stats">
                <div className="detail-stat">
                  <div className="stat-icon green"><FaEuroSign /></div>
                  <div className="stat-info">
                    <div className="stat-value">{formatCurrency(selectedClub.totalValue)}</div>
                    <div className="stat-label">Valore Totale Investito</div>
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="stat-icon blue"><FaFileContract /></div>
                  <div className="stat-info">
                    <div className="stat-value">{selectedClub.activeContracts}</div>
                    <div className="stat-label">Contratti Attivi</div>
                  </div>
                </div>
              </div>

              <div className="section">
                <h3>Contratti con {selectedClub.nome}</h3>
                {selectedClub.contracts && selectedClub.contracts.length > 0 ? (
                  <div className="contracts-list">
                    {selectedClub.contracts.map((contract, index) => (
                      <div key={index} className="contract-item" onClick={() => navigate(`/sponsor/contracts/${contract.id}`)}>
                        <div className="contract-info">
                          <div className="contract-name">{contract.nome_contratto}</div>
                          <div className="contract-dates">
                            {new Date(contract.data_inizio).toLocaleDateString('it-IT')} - {new Date(contract.data_fine).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                        <div className="contract-value">{formatCurrency(contract.compenso)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">Nessun dettaglio contratto disponibile</p>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => navigate('/messages')}>
                <FaEnvelope /> Invia Messaggio
              </button>
              <button className="btn-primary" onClick={() => navigate('/sponsor/contracts')}>
                <FaFileContract /> Vai ai Contratti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorClubs;
