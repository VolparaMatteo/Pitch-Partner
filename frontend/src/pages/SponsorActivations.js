import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/sponsor-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineBolt,
  HiOutlineCalendarDays,
  HiOutlineTrophy,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineChevronDown,
  HiOutlineArchiveBox
} from 'react-icons/hi2';

function SponsorActivations() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [activations, setActivations] = useState([]);
  const [stats, setStats] = useState({
    totale: 0,
    pianificate: 0,
    confermate: 0,
    eseguite: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    tipo: '',
    stato: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchActivations();
  }, [filters.tipo, filters.stato]);

  const fetchActivations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.stato) params.append('stato', filters.stato);

      const response = await api.get(`/sponsor/activations?${params.toString()}`);
      setActivations(response.data.activations || []);
      setStats(response.data.stats || {});

    } catch (error) {
      console.error('Errore nel caricamento attivazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Passato';
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    return `Tra ${days} giorni`;
  };

  const getStatusBadge = (stato, eseguita) => {
    if (eseguita) {
      return <span className="status-badge eseguita"><HiOutlineCheckCircle size={14} /> Eseguita</span>;
    }
    switch (stato) {
      case 'pianificata':
        return <span className="status-badge pianificata"><HiOutlineClock size={14} /> Pianificata</span>;
      case 'confermata':
        return <span className="status-badge confermata"><HiOutlineCheckCircle size={14} /> Confermata</span>;
      case 'annullata':
        return <span className="status-badge annullata">Annullata</span>;
      default:
        return <span className="status-badge">{stato}</span>;
    }
  };

  const filteredActivations = activations.filter(act => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return act.titolo?.toLowerCase().includes(searchLower) ||
             act.asset_nome?.toLowerCase().includes(searchLower) ||
             act.asset_tipo?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  // Group activations by month
  const groupedActivations = filteredActivations.reduce((groups, activation) => {
    if (!activation.data) return groups;
    const date = new Date(activation.data);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    if (!groups[monthKey]) {
      groups[monthKey] = { label: monthLabel, items: [] };
    }
    groups[monthKey].items.push(activation);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento attivazioni...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Attivazioni</h1>
          <p className="page-subtitle">Le tue attivazioni sponsor per partite ed eventi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Totale</div>
          <div className="tp-stat-value">{stats.totale}</div>
          <div className="tp-stat-description">Tutte le attivazioni</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Pianificate</div>
          <div className="tp-stat-value">{stats.pianificate}</div>
          <div className="tp-stat-description">In attesa</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Confermate</div>
          <div className="tp-stat-value">{stats.confermate}</div>
          <div className="tp-stat-description">Pronte</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Eseguite</div>
          <div className="tp-stat-value">{stats.eseguite}</div>
          <div className="tp-stat-description">Completate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca attivazione..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-buttons">
          <select
            className="filter-select"
            value={filters.tipo}
            onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
          >
            <option value="">Tutti i tipi</option>
            <option value="match">Partite</option>
            <option value="evento">Eventi</option>
          </select>

          <select
            className="filter-select"
            value={filters.stato}
            onChange={(e) => setFilters({ ...filters, stato: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="pianificata">Pianificate</option>
            <option value="confermata">Confermate</option>
            <option value="eseguita">Eseguite</option>
          </select>
        </div>
      </div>

      {/* Activations List */}
      <div className="activations-container">
        {filteredActivations.length === 0 ? (
          <div className="empty-state-card">
            <HiOutlineBolt size={48} />
            <h3>Nessuna attivazione trovata</h3>
            <p>Non ci sono attivazioni che corrispondono ai filtri selezionati</p>
          </div>
        ) : (
          Object.entries(groupedActivations)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, group]) => (
              <div key={monthKey} className="activation-month-group">
                <h3 className="month-header">{group.label}</h3>
                <div className="activation-cards">
                  {group.items.map((activation, idx) => (
                    <div key={idx} className="activation-card">
                      <div className="activation-card-header">
                        <div className="activation-type-badge">
                          {activation.tipo_attivazione === 'match' ? (
                            <><HiOutlineTrophy size={14} /> Partita</>
                          ) : (
                            <><HiOutlineCalendarDays size={14} /> Evento</>
                          )}
                        </div>
                        {getStatusBadge(activation.stato, activation.eseguita)}
                      </div>

                      <div className="activation-card-body">
                        <h4 className="activation-card-title">{activation.titolo}</h4>

                        <div className="activation-card-details">
                          <div className="detail-item">
                            <HiOutlineCalendarDays size={16} />
                            <span>{formatDate(activation.data)}</span>
                          </div>
                          {activation.luogo && (
                            <div className="detail-item">
                              <HiOutlineMapPin size={16} />
                              <span>{activation.luogo}</span>
                            </div>
                          )}
                        </div>

                        <div className="activation-asset-info">
                          <div className="asset-badge">
                            <HiOutlineArchiveBox size={14} />
                            <span>{activation.asset_tipo || 'Asset'}</span>
                          </div>
                          {activation.asset_nome && (
                            <span className="asset-name">{activation.asset_nome}</span>
                          )}
                          {activation.quantita && (
                            <span className="asset-qty">x{activation.quantita}</span>
                          )}
                        </div>

                        {activation.descrizione && (
                          <p className="activation-description">{activation.descrizione}</p>
                        )}
                      </div>

                      <div className="activation-card-footer">
                        <span className="countdown">{getDaysUntil(activation.data)}</span>
                        {activation.foto_attivazione && (
                          <button className="view-photo-btn">
                            <HiOutlinePhoto size={16} />
                            Foto
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default SponsorActivations;
