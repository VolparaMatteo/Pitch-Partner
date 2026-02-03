import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import api from '../services/api';
import '../styles/club-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineCurrencyEuro,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineEnvelope,
  HiOutlinePlus,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineBuildingStorefront,
  HiOutlineArrowRight,
  HiOutlineFunnel,
  HiOutlineBolt,
  HiOutlineTrophy
} from 'react-icons/hi2';

function ClubDashboard() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState({
    totalValue: 0,
    activeSponsors: 0,
    leadsInPipeline: 0,
    activeContracts: 0,
    unreadMessages: 0
  });
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [leadsByStatus, setLeadsByStatus] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        contractsRes,
        sponsorsRes,
        leadsRes,
        matchesRes,
        eventsRes,
        messagesRes
      ] = await Promise.all([
        api.get('/contracts').catch(() => ({ data: { contracts: [] } })),
        api.get('/club/sponsors').catch(() => ({ data: [] })),
        api.get('/club/leads').catch(() => ({ data: { leads: [] } })),
        api.get('/matches').catch(() => ({ data: { matches: [] } })),
        api.get('/events').catch(() => ({ data: { events: [] } })),
        api.get('/messages/unread-count').catch(() => ({ data: { unread_count: 0 } }))
      ]);

      const now = new Date();
      const contracts = contractsRes.data.contracts || contractsRes.data || [];
      const sponsors = sponsorsRes.data.sponsors || sponsorsRes.data || [];
      const leads = leadsRes.data.leads || leadsRes.data || [];
      const matches = matchesRes.data.matches || matchesRes.data || [];
      const events = eventsRes.data.events || [];

      // Process contracts
      const activeContracts = contracts.filter(c => {
        const start = new Date(c.data_inizio);
        const end = new Date(c.data_fine);
        return c.status !== 'bozza' && now >= start && now <= end;
      });

      // Contracts expiring in 60 days
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      const expiring = activeContracts
        .filter(c => new Date(c.data_fine) <= sixtyDaysFromNow)
        .sort((a, b) => new Date(a.data_fine) - new Date(b.data_fine))
        .slice(0, 4);

      // Process sponsors
      const activeSponsors = sponsors.filter(s => s.account_attivo);

      // Process leads by status
      const leadStatusCounts = {};
      leads.forEach(lead => {
        const status = lead.stato || 'nuovo';
        leadStatusCounts[status] = (leadStatusCounts[status] || 0) + 1;
      });
      const leadStatusArray = Object.entries(leadStatusCounts).map(([status, count]) => ({
        status,
        count,
        label: getLeadStatusLabel(status)
      }));

      // Process matches
      const futureMatches = matches
        .filter(m => new Date(m.data_ora) > now)
        .sort((a, b) => new Date(a.data_ora) - new Date(b.data_ora))
        .slice(0, 5);

      // Process events
      const futureEvents = events
        .filter(e => new Date(e.data_evento) > now)
        .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento))
        .slice(0, 4);

      // Build recent activities from various sources
      const activities = [];

      // Recent contracts
      contracts.slice(0, 3).forEach(c => {
        activities.push({
          type: 'contract',
          title: `Contratto ${c.status === 'bozza' ? 'in bozza' : 'attivo'}`,
          description: c.sponsor_nome || 'Sponsor',
          date: c.created_at || c.data_inizio,
          icon: 'document'
        });
      });

      // Recent leads
      leads.slice(0, 3).forEach(l => {
        activities.push({
          type: 'lead',
          title: 'Nuovo lead',
          description: l.ragione_sociale || l.nome_contatto,
          date: l.created_at,
          icon: 'user'
        });
      });

      // Sort by date and take latest 5
      const sortedActivities = activities
        .filter(a => a.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      // Set all states
      setStats({
        totalValue: activeContracts.reduce((sum, c) => sum + (c.compenso || 0), 0),
        activeSponsors: activeSponsors.length,
        leadsInPipeline: leads.filter(l => l.stato !== 'perso' && l.stato !== 'convertito').length,
        activeContracts: activeContracts.length,
        unreadMessages: messagesRes.data.unread_count || 0
      });

      setUpcomingMatches(futureMatches);
      setExpiringContracts(expiring);
      setRecentActivities(sortedActivities);
      setLeadsByStatus(leadStatusArray);
      setUpcomingEvents(futureEvents);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadStatusLabel = (status) => {
    const labels = {
      'nuovo': 'Nuovi',
      'contattato': 'Contattati',
      'qualificato': 'Qualificati',
      'proposta': 'In Proposta',
      'negoziazione': 'In Negoziazione',
      'convertito': 'Convertiti',
      'perso': 'Persi'
    };
    return labels[status] || status;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    if (days < 0) return 'Scaduto';
    return `${days} giorni`;
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;
    return formatDate(dateString);
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span>Caricamento dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">
            {getCurrentGreeting()}, <span className="club-name">{user?.nome || 'Club'}</span>
          </h1>
          <p className="dashboard-subtitle">
            Ecco un riepilogo della tua attività di sponsorizzazione
          </p>
        </div>
        <div className="dashboard-header-right">
          <button className="dashboard-action-btn secondary" onClick={() => navigate('/club/analytics')}>
            <HiOutlineChartBar size={18} />
            <span>Analytics</span>
          </button>
          <button className="dashboard-action-btn primary" onClick={() => navigate('/pitchy')}>
            <HiOutlineSparkles size={18} />
            <span>Pitchy AI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/contracts')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Valore Contratti</div>
          <div className="tp-stat-value">{formatCurrency(stats.totalValue)}</div>
          <div className="tp-stat-description">Contratti attivi</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/club/sponsors')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Sponsor Attivi</div>
          <div className="tp-stat-value">{stats.activeSponsors}</div>
          <div className="tp-stat-description">Partner registrati</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/club/leads')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Lead in Pipeline</div>
          <div className="tp-stat-value">{stats.leadsInPipeline}</div>
          <div className="tp-stat-description">Opportunità attive</div>
        </div>

        <div className="tp-stat-card-dark" onClick={() => navigate('/club/contracts')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-label">Contratti Attivi</div>
          <div className="tp-stat-value">{stats.activeContracts}</div>
          <div className="tp-stat-description">In corso</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate('/club/sponsors/new')}>
          <HiOutlinePlus size={18} />
          <span>Nuovo Sponsor</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/club/leads/new')}>
          <HiOutlinePlus size={18} />
          <span>Nuovo Lead</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/club/contracts/new')}>
          <HiOutlinePlus size={18} />
          <span>Nuovo Contratto</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/matches/new')}>
          <HiOutlinePlus size={18} />
          <span>Nuova Partita</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Upcoming Matches */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineTrophy size={20} className="card-header-icon" />
                <h3>Prossime Partite</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/matches')}>
                Vedi tutte <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {upcomingMatches.length === 0 ? (
                <div className="empty-state">
                  <HiOutlineCalendarDays size={32} />
                  <p>Nessuna partita in programma</p>
                  <button className="empty-state-btn" onClick={() => navigate('/matches/new')}>
                    Aggiungi partita
                  </button>
                </div>
              ) : (
                <div className="matches-list">
                  {upcomingMatches.map((match, idx) => (
                    <div
                      key={idx}
                      className="match-item"
                      onClick={() => navigate(`/matches/${match.id}`)}
                    >
                      <div className="match-date-badge">
                        <span className="match-day">{new Date(match.data_ora).getDate()}</span>
                        <span className="match-month">{new Date(match.data_ora).toLocaleDateString('it-IT', { month: 'short' })}</span>
                      </div>
                      <div className="match-info">
                        <span className="match-teams">
                          {match.squadra_casa} vs {match.squadra_trasferta}
                        </span>
                        <span className="match-details">
                          <HiOutlineClock size={12} />
                          {new Date(match.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          {match.luogo && ` • ${match.luogo}`}
                        </span>
                      </div>
                      <div className="match-countdown">
                        {getDaysUntil(match.data_ora)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Contracts */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineExclamationTriangle size={20} className="card-header-icon warning" />
                <h3>Contratti in Scadenza</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/club/contracts')}>
                Vedi tutti <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {expiringContracts.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineCheckCircle size={28} />
                  <p>Nessun contratto in scadenza</p>
                </div>
              ) : (
                <div className="contracts-list">
                  {expiringContracts.map((contract, idx) => (
                    <div
                      key={idx}
                      className="contract-item"
                      onClick={() => navigate(`/club/contracts/${contract.id}`)}
                    >
                      <div className="contract-info">
                        <span className="contract-sponsor">{contract.sponsor_nome || 'Sponsor'}</span>
                        <span className="contract-value">{formatCurrency(contract.compenso || 0)}</span>
                      </div>
                      <div className={`contract-expiry ${getDaysUntil(contract.data_fine) === 'Scaduto' ? 'expired' : ''}`}>
                        <HiOutlineClock size={14} />
                        <span>Scade: {formatDate(contract.data_fine)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Lead Pipeline */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineFunnel size={20} className="card-header-icon" />
                <h3>Pipeline Lead</h3>
              </div>
              <button className="card-header-link" onClick={() => navigate('/club/leads')}>
                Gestisci <HiOutlineArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {leadsByStatus.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineFunnel size={28} />
                  <p>Nessun lead nel sistema</p>
                  <button className="empty-state-btn" onClick={() => navigate('/club/leads/new')}>
                    Aggiungi lead
                  </button>
                </div>
              ) : (
                <div className="pipeline-stats">
                  {leadsByStatus.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="pipeline-item">
                      <div className="pipeline-label">{item.label}</div>
                      <div className="pipeline-bar-container">
                        <div
                          className="pipeline-bar"
                          style={{
                            width: `${Math.min(100, (item.count / Math.max(...leadsByStatus.map(l => l.count))) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="pipeline-count">{item.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-header-left">
                <HiOutlineClock size={20} className="card-header-icon" />
                <h3>Attività Recente</h3>
              </div>
            </div>
            <div className="card-body">
              {recentActivities.length === 0 ? (
                <div className="empty-state small">
                  <HiOutlineClock size={28} />
                  <p>Nessuna attività recente</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className={`activity-icon ${activity.type}`}>
                        {activity.icon === 'document' && <HiOutlineDocumentText size={16} />}
                        {activity.icon === 'user' && <HiOutlineUserGroup size={16} />}
                      </div>
                      <div className="activity-content">
                        <span className="activity-title">{activity.title}</span>
                        <span className="activity-description">{activity.description}</span>
                      </div>
                      <span className="activity-time">{getTimeAgo(activity.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-bottom-grid">
        {/* Upcoming Events */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <HiOutlineCalendarDays size={20} className="card-header-icon" />
              <h3>Prossimi Eventi</h3>
            </div>
            <button className="card-header-link" onClick={() => navigate('/events')}>
              Calendario <HiOutlineArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state small">
                <HiOutlineCalendarDays size={28} />
                <p>Nessun evento in programma</p>
              </div>
            ) : (
              <div className="events-list">
                {upcomingEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="event-item"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="event-date">
                      <span className="event-day">{new Date(event.data_evento).getDate()}</span>
                      <span className="event-month">{new Date(event.data_evento).toLocaleDateString('it-IT', { month: 'short' })}</span>
                    </div>
                    <div className="event-info">
                      <span className="event-title">{event.titolo || event.nome}</span>
                      <span className="event-type">{event.tipo || 'Evento'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <HiOutlineEnvelope size={20} className="card-header-icon" />
              <h3>Messaggi</h3>
              {stats.unreadMessages > 0 && (
                <span className="card-badge">{stats.unreadMessages}</span>
              )}
            </div>
            <button className="card-header-link" onClick={() => navigate('/messages')}>
              Apri <HiOutlineArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="messages-summary">
              <div className="message-stat">
                <span className="message-stat-value">{stats.unreadMessages}</span>
                <span className="message-stat-label">Non letti</span>
              </div>
              <div className="message-stat">
                <span className="message-stat-value">{stats.activeSponsors}</span>
                <span className="message-stat-label">Conversazioni</span>
              </div>
            </div>
            <button className="card-action-btn" onClick={() => navigate('/messages')}>
              <HiOutlineEnvelope size={18} />
              Vai ai messaggi
            </button>
          </div>
        </div>

        {/* Marketplace */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <HiOutlineBuildingStorefront size={20} className="card-header-icon" />
              <h3>Marketplace</h3>
            </div>
            <button className="card-header-link" onClick={() => navigate('/club/marketplace')}>
              Esplora <HiOutlineArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="marketplace-cta">
              <HiOutlineBuildingStorefront size={36} />
              <p>Pubblica le tue opportunità di sponsorizzazione</p>
              <button className="card-action-btn" onClick={() => navigate('/club/marketplace/create')}>
                <HiOutlinePlus size={18} />
                Crea opportunità
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubDashboard;
