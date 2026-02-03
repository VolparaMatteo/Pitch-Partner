import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/admin-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineUserGroup,
  HiOutlineCurrencyEuro,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCursorArrowRays,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
  HiOutlineSparkles,
  HiOutlineHandRaised,
  HiOutlineBolt,
  HiOutlineWallet,
  HiOutlineChatBubbleLeftRight
} from 'react-icons/hi2';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    kpis: {
      total_clubs: 0,
      active_clubs: 0,
      total_sponsors: 0,
      active_subscriptions: 0,
      trial_subscriptions: 0,
      mrr: 0,
      arr: 0,
      total_leads: 0,
      hot_leads: 0,
      leads_this_month: 0,
      expiring_soon: 0,
      expired_licenses: 0,
      new_clubs_month: 0,
      total_contracts: 0,
      total_contract_value: 0
    },
    pipeline: {},
    recent_activities: []
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Errore nel caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  const getActionIcon = (azione) => {
    const icons = {
      create: <HiOutlinePlusCircle size={16} />,
      update: <HiOutlineArrowPath size={16} />,
      delete: <HiOutlineExclamationTriangle size={16} />,
      login: <HiOutlineEye size={16} />,
      renew: <HiOutlineCheckCircle size={16} />,
      cancel: <HiOutlineExclamationTriangle size={16} />,
      convert: <HiOutlineSparkles size={16} />
    };
    return icons[azione] || <HiOutlineDocumentText size={16} />;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Ora';
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
    return `${Math.floor(diff / 86400)} giorni fa`;
  };

  const { kpis, pipeline, recent_activities } = dashboardData;

  // Calculate pipeline totals
  const pipelineStages = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione'];
  const totalPipelineValue = pipelineStages.reduce((sum, stage) => {
    return sum + (pipeline[stage]?.value || 0);
  }, 0);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Panoramica della piattaforma Pitch Partner</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary" onClick={fetchDashboard}>
            <HiOutlineArrowPath size={18} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card primary">
          <div className="kpi-icon mrr">
            <HiOutlineCurrencyEuro size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">MRR</span>
            <span className="kpi-value">{formatCurrency(kpis.mrr)}</span>
            <span className="kpi-sublabel">Monthly Recurring Revenue</span>
          </div>
        </div>

        <div className="admin-kpi-card primary">
          <div className="kpi-icon arr">
            <HiOutlineArrowTrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">ARR</span>
            <span className="kpi-value">{formatCurrency(kpis.arr)}</span>
            <span className="kpi-sublabel">Annual Recurring Revenue</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon clubs">
            <HiOutlineBuildingOffice2 size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Club Attivi</span>
            <span className="kpi-value">{kpis.active_clubs}</span>
            <span className="kpi-sublabel">su {kpis.total_clubs} totali</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon sponsors">
            <HiOutlineHandRaised size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Sponsor</span>
            <span className="kpi-value">{kpis.total_sponsors}</span>
            <span className="kpi-sublabel">Totali in piattaforma</span>
          </div>
        </div>
      </div>

      {/* Secondary KPIs Row */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="stat-icon subscriptions">
            <HiOutlineWallet size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.active_subscriptions}</span>
            <span className="stat-label">Abbonamenti Attivi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon trials">
            <HiOutlineClock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.trial_subscriptions}</span>
            <span className="stat-label">In Trial</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon leads">
            <HiOutlineCursorArrowRays size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.total_leads}</span>
            <span className="stat-label">Lead Totali</span>
          </div>
        </div>

        <div className="admin-stat-card hot">
          <div className="stat-icon hot-leads">
            <HiOutlineBolt size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.hot_leads}</span>
            <span className="stat-label">Lead Caldi</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon new">
            <HiOutlinePlusCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.new_clubs_month}</span>
            <span className="stat-label">Nuovi Club (30gg)</span>
          </div>
        </div>

        <div className="admin-stat-card warning">
          <div className="stat-icon expiring">
            <HiOutlineExclamationTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{kpis.expiring_soon}</span>
            <span className="stat-label">In Scadenza</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="admin-dashboard-grid">
        {/* Pipeline Widget */}
        <div className="dashboard-card pipeline-card">
          <div className="card-header">
            <h3><HiOutlineCursorArrowRays size={20} /> Pipeline Lead</h3>
            <button className="btn-link" onClick={() => navigate('/admin/leads')}>
              Vedi tutti
            </button>
          </div>
          <div className="card-content">
            <div className="pipeline-summary">
              <div className="pipeline-total">
                <span className="total-value">{formatCurrency(totalPipelineValue)}</span>
                <span className="total-label">Valore totale pipeline</span>
              </div>
            </div>
            <div className="pipeline-stages">
              {pipelineStages.map((stage) => {
                const stageData = pipeline[stage] || { count: 0, value: 0 };
                const stageLabels = {
                  nuovo: 'Nuovo',
                  contattato: 'Contattato',
                  qualificato: 'Qualificato',
                  demo: 'Demo',
                  proposta: 'Proposta',
                  negoziazione: 'Negoziazione'
                };
                return (
                  <div key={stage} className={`pipeline-stage stage-${stage}`}>
                    <div className="stage-header">
                      <span className="stage-name">{stageLabels[stage]}</span>
                      <span className="stage-count">{stageData.count}</span>
                    </div>
                    <div className="stage-value">{formatCurrency(stageData.value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card actions-card">
          <div className="card-header">
            <h3><HiOutlineSparkles size={20} /> Azioni Rapide</h3>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              <button className="quick-action" onClick={() => navigate('/admin/leads')}>
                <div className="action-icon leads">
                  <HiOutlinePlusCircle size={24} />
                </div>
                <span>Nuovo Lead</span>
              </button>

              <button className="quick-action" onClick={() => navigate('/admin/clubs')}>
                <div className="action-icon clubs">
                  <HiOutlineBuildingOffice2 size={24} />
                </div>
                <span>Nuovo Club</span>
              </button>

              <button className="quick-action" onClick={() => navigate('/admin/subscriptions')}>
                <div className="action-icon subscriptions">
                  <HiOutlineWallet size={24} />
                </div>
                <span>Abbonamenti</span>
              </button>

              <button className="quick-action" onClick={() => navigate('/admin/communications')}>
                <div className="action-icon communications">
                  <HiOutlineChatBubbleLeftRight size={24} />
                </div>
                <span>Comunicazioni</span>
              </button>

              <button className="quick-action" onClick={() => navigate('/admin/analytics')}>
                <div className="action-icon analytics">
                  <HiOutlineChartBar size={24} />
                </div>
                <span>Analytics</span>
              </button>

              <button className="quick-action" onClick={() => navigate('/admin/plans')}>
                <div className="action-icon plans">
                  <HiOutlineDocumentText size={24} />
                </div>
                <span>Piani</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="dashboard-card alerts-card">
          <div className="card-header">
            <h3><HiOutlineExclamationTriangle size={20} /> Attenzione Richiesta</h3>
          </div>
          <div className="card-content">
            <div className="alerts-list">
              {kpis.expired_licenses > 0 && (
                <div className="alert-item critical">
                  <div className="alert-icon">
                    <HiOutlineExclamationTriangle size={20} />
                  </div>
                  <div className="alert-content">
                    <span className="alert-title">{kpis.expired_licenses} licenze scadute</span>
                    <span className="alert-desc">Richiede azione immediata</span>
                  </div>
                  <button className="alert-action" onClick={() => navigate('/admin/subscriptions?status=expired')}>
                    Gestisci
                  </button>
                </div>
              )}

              {kpis.expiring_soon > 0 && (
                <div className="alert-item warning">
                  <div className="alert-icon">
                    <HiOutlineClock size={20} />
                  </div>
                  <div className="alert-content">
                    <span className="alert-title">{kpis.expiring_soon} licenze in scadenza</span>
                    <span className="alert-desc">Nei prossimi 30 giorni</span>
                  </div>
                  <button className="alert-action" onClick={() => navigate('/admin/subscriptions?expiring=30')}>
                    Vedi
                  </button>
                </div>
              )}

              {kpis.trial_subscriptions > 0 && (
                <div className="alert-item info">
                  <div className="alert-icon">
                    <HiOutlineClock size={20} />
                  </div>
                  <div className="alert-content">
                    <span className="alert-title">{kpis.trial_subscriptions} trial attivi</span>
                    <span className="alert-desc">Da convertire</span>
                  </div>
                  <button className="alert-action" onClick={() => navigate('/admin/subscriptions?status=trial')}>
                    Vedi
                  </button>
                </div>
              )}

              {kpis.hot_leads > 0 && (
                <div className="alert-item success">
                  <div className="alert-icon">
                    <HiOutlineBolt size={20} />
                  </div>
                  <div className="alert-content">
                    <span className="alert-title">{kpis.hot_leads} lead caldi</span>
                    <span className="alert-desc">Pronti per il contatto</span>
                  </div>
                  <button className="alert-action" onClick={() => navigate('/admin/leads?temperatura=hot')}>
                    Contatta
                  </button>
                </div>
              )}

              {kpis.expired_licenses === 0 && kpis.expiring_soon === 0 && kpis.hot_leads === 0 && (
                <div className="alert-item empty">
                  <HiOutlineCheckCircle size={24} />
                  <span>Tutto sotto controllo!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3><HiOutlineCalendarDays size={20} /> Attività Recenti</h3>
          </div>
          <div className="card-content">
            <div className="activity-list">
              {recent_activities.length === 0 ? (
                <div className="empty-activity">
                  <span>Nessuna attività recente</span>
                </div>
              ) : (
                recent_activities.map((activity, idx) => (
                  <div key={idx} className="activity-item">
                    <div className={`activity-icon ${activity.azione}`}>
                      {getActionIcon(activity.azione)}
                    </div>
                    <div className="activity-content">
                      <span className="activity-text">
                        <strong>{activity.azione}</strong> su {activity.entita}
                        {activity.entita_id && ` #${activity.entita_id}`}
                      </span>
                      {activity.dettagli && (
                        <span className="activity-details">{activity.dettagli}</span>
                      )}
                    </div>
                    <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="dashboard-card stats-card">
          <div className="card-header">
            <h3><HiOutlineChartBar size={20} /> Statistiche Piattaforma</h3>
            <button className="btn-link" onClick={() => navigate('/admin/analytics')}>
              Analytics completi
            </button>
          </div>
          <div className="card-content">
            <div className="platform-stats">
              <div className="platform-stat">
                <div className="stat-bar">
                  <div className="stat-label">Contratti Attivi</div>
                  <div className="stat-value-large">{formatNumber(kpis.total_contracts)}</div>
                </div>
              </div>

              <div className="platform-stat">
                <div className="stat-bar">
                  <div className="stat-label">Valore Contratti</div>
                  <div className="stat-value-large">{formatCurrency(kpis.total_contract_value)}</div>
                </div>
              </div>

              <div className="platform-stat">
                <div className="stat-bar">
                  <div className="stat-label">Lead Questo Mese</div>
                  <div className="stat-value-large">{kpis.leads_this_month}</div>
                </div>
              </div>

              <div className="platform-stat">
                <div className="stat-bar">
                  <div className="stat-label">Tasso Attivazione</div>
                  <div className="stat-value-large">
                    {kpis.total_clubs > 0
                      ? Math.round((kpis.active_clubs / kpis.total_clubs) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
