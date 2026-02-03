import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/analytics.css';
import '../styles/template-style.css';

import {
  FaChartLine, FaUsers, FaEuroSign, FaFunnelDollar, FaCalendarCheck, FaComments,
  FaArrowUp, FaArrowDown, FaMinus, FaHandshake, FaFileContract, FaEnvelope,
  FaBullseye, FaChartPie, FaCalendarAlt, FaNewspaper, FaTrophy, FaCheckCircle,
  FaClock, FaExclamationTriangle, FaUserPlus, FaPhoneAlt, FaFileSignature,
  FaBuilding, FaProjectDiagram, FaWallet, FaGlobe
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');
  const navigate = useNavigate();
  const { user } = getAuth();

  // All analytics data
  const [data, setData] = useState({
    // Overview
    totalInvestment: 0,
    activeContracts: 0,
    totalClubs: 0,
    totalOpportunities: 0,
    unreadMessages: 0,
    // Contracts
    contracts: [],
    contractsByStatus: {},
    avgContractValue: 0,
    monthlyInvestment: [],
    expiringContracts: [],
    // Clubs
    clubs: [],
    clubsBySport: [],
    clubsTimeline: [],
    // Opportunities
    opportunities: [],
    opportunitiesByStatus: {},
    // Projects
    projects: [],
    projectsByStatus: {},
    tasksCompletion: 0,
    // Budget
    budgets: [],
    totalBudget: 0,
    usedBudget: 0,
    // Events
    events: [],
    upcomingEvents: [],
    // Engagement
    messagesStats: {},
    activities: []
  });

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [
        contractsRes,
        projectsRes,
        budgetsRes,
        eventsRes,
        messagesRes,
        opportunitiesRes,
        marketplaceRes
      ] = await Promise.all([
        axios.get(`${API_URL}/sponsor/contracts`, { headers }).catch(() => ({ data: { contracts: [] } })),
        axios.get(`${API_URL}/sponsor/projects`, { headers }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${API_URL}/sponsor/budgets`, { headers }).catch(() => ({ data: { budgets: [] } })),
        axios.get(`${API_URL}/events`, { headers }).catch(() => ({ data: { events: [] } })),
        axios.get(`${API_URL}/messages/unread-count`, { headers }).catch(() => ({ data: { unread_count: 0 } })),
        axios.get(`${API_URL}/sponsor/opportunities`, { headers }).catch(() => ({ data: { opportunities: [] } })),
        axios.get(`${API_URL}/marketplace/opportunities`, { headers }).catch(() => ({ data: { opportunities: [] } }))
      ]);

      const contracts = contractsRes.data.contracts || contractsRes.data || [];
      const projects = projectsRes.data.projects || projectsRes.data || [];
      const budgets = budgetsRes.data.budgets || budgetsRes.data || [];
      const events = eventsRes.data.events || eventsRes.data || [];
      const opportunities = opportunitiesRes.data.opportunities || marketplaceRes.data.opportunities || [];

      const now = new Date();

      // Process contracts
      const activeContracts = contracts.filter(c => {
        const start = new Date(c.data_inizio);
        const end = new Date(c.data_fine);
        return c.status !== 'bozza' && now >= start && now <= end;
      });

      const expiredContracts = contracts.filter(c => now > new Date(c.data_fine));
      const draftContracts = contracts.filter(c => c.status === 'bozza');

      // Contracts expiring in next 60 days
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      const expiringContracts = activeContracts.filter(c => {
        const end = new Date(c.data_fine);
        return end <= sixtyDaysFromNow && end >= now;
      }).sort((a, b) => new Date(a.data_fine) - new Date(b.data_fine));

      // Total investment
      const totalInvestment = activeContracts.reduce((sum, c) => sum + (c.compenso || 0), 0);
      const avgContractValue = activeContracts.length > 0 ? totalInvestment / activeContracts.length : 0;

      // Unique clubs from contracts
      const clubIds = [...new Set(contracts.map(c => c.club_id))];
      const totalClubs = clubIds.length;

      // Monthly investment
      const monthlyInvestment = generateMonthlyInvestment(contracts, 12);

      // Projects by status
      const projectsByStatus = {};
      projects.forEach(p => {
        const status = p.status || 'in_corso';
        projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
      });

      // Tasks completion
      let totalTasks = 0;
      let completedTasks = 0;
      projects.forEach(p => {
        if (p.tasks) {
          totalTasks += p.tasks.length;
          completedTasks += p.tasks.filter(t => t.status === 'completato').length;
        }
      });
      const tasksCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Budget calculations
      const totalBudget = budgets.reduce((sum, b) => sum + (b.budget_totale || 0), 0);
      const usedBudget = budgets.reduce((sum, b) => sum + (b.speso || 0), 0);

      // Upcoming events
      const upcomingEvents = events.filter(e => new Date(e.data_evento) >= now)
        .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento))
        .slice(0, 5);

      // Opportunities by status
      const opportunitiesByStatus = {};
      opportunities.forEach(o => {
        const status = o.status || 'attiva';
        opportunitiesByStatus[status] = (opportunitiesByStatus[status] || 0) + 1;
      });

      // Recent activities
      const activities = generateRecentActivities(contracts, projects, events);

      setData({
        totalInvestment,
        activeContracts: activeContracts.length,
        totalClubs,
        totalOpportunities: opportunities.length,
        unreadMessages: messagesRes.data.unread_count || 0,
        contracts,
        contractsByStatus: {
          active: activeContracts.length,
          expired: expiredContracts.length,
          draft: draftContracts.length
        },
        avgContractValue,
        monthlyInvestment,
        expiringContracts,
        clubs: [],
        clubsBySport: [],
        clubsTimeline: [],
        opportunities,
        opportunitiesByStatus,
        projects,
        projectsByStatus,
        tasksCompletion,
        budgets,
        totalBudget,
        usedBudget,
        events,
        upcomingEvents,
        messagesStats: {
          unread: messagesRes.data.unread_count || 0,
          conversations: totalClubs
        },
        activities
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const generateMonthlyInvestment = (contracts, months) => {
    const investment = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });

      let monthInvestment = 0;
      contracts.forEach(c => {
        const start = new Date(c.data_inizio);
        const end = new Date(c.data_fine);
        if (start <= date && end >= date && c.compenso) {
          const totalMonths = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));
          monthInvestment += c.compenso / totalMonths;
        }
      });

      investment.push({ month: monthName, value: Math.round(monthInvestment) });
    }
    return investment;
  };

  const generateRecentActivities = (contracts, projects, events) => {
    const activities = [];

    contracts.slice(0, 2).forEach(c => {
      activities.push({
        type: 'contract',
        title: `Contratto: ${c.nome_contratto || 'Nuovo contratto'}`,
        description: `Valore: ${formatCurrency(c.compenso)}`,
        date: c.created_at,
        icon: 'blue'
      });
    });

    projects.slice(0, 2).forEach(p => {
      activities.push({
        type: 'project',
        title: `Progetto: ${p.nome || 'Nuovo progetto'}`,
        description: `Status: ${p.status || 'In corso'}`,
        date: p.created_at,
        icon: 'purple'
      });
    });

    events.slice(0, 2).forEach(e => {
      activities.push({
        type: 'event',
        title: `Evento: ${e.nome || 'Nuovo evento'}`,
        description: formatDate(e.data_evento),
        date: e.created_at,
        icon: 'green'
      });
    });

    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getChangeIndicator = (current, previous) => {
    if (!previous || previous === 0) return { icon: <FaMinus />, class: 'neutral', text: '-' };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: <FaArrowUp />, class: 'positive', text: `+${change.toFixed(1)}%` };
    if (change < 0) return { icon: <FaArrowDown />, class: 'negative', text: `${change.toFixed(1)}%` };
    return { icon: <FaMinus />, class: 'neutral', text: '0%' };
  };

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaChartLine /> },
    { id: 'contracts', label: 'Contratti', icon: <FaFileContract /> },
    { id: 'projects', label: 'Progetti', icon: <FaProjectDiagram /> },
    { id: 'budget', label: 'Budget', icon: <FaWallet /> },
    { id: 'events', label: 'Eventi', icon: <FaCalendarAlt /> },
    { id: 'engagement', label: 'Engagement', icon: <FaComments /> }
  ];

  // Render Overview Tab
  const renderOverview = () => (
    <div className="analytics-overview">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-icon">
            <FaEuroSign />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(data.totalInvestment)}</div>
            <div className="kpi-label">Investimento Totale</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue">
            <FaFileContract />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{data.activeContracts}</div>
            <div className="kpi-label">Contratti Attivi</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <FaBuilding />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{data.totalClubs}</div>
            <div className="kpi-label">Club Partner</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <FaBullseye />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{data.totalOpportunities}</div>
            <div className="kpi-label">Opportunità</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="analytics-row">
        {/* Investment Trend */}
        <div className="analytics-card large">
          <div className="card-header">
            <h3>Andamento Investimenti</h3>
            <div className="period-selector">
              <button className={period === 'quarter' ? 'active' : ''} onClick={() => setPeriod('quarter')}>3M</button>
              <button className={period === 'half' ? 'active' : ''} onClick={() => setPeriod('half')}>6M</button>
              <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>12M</button>
            </div>
          </div>
          <div className="chart-container">
            <div className="simple-chart">
              {data.monthlyInvestment.map((item, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(10, (item.value / Math.max(...data.monthlyInvestment.map(m => m.value), 1)) * 100)}%`
                    }}
                  >
                    <span className="chart-bar-value">{formatCurrency(item.value)}</span>
                  </div>
                  <span className="chart-bar-label">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Statistiche Rapide</h3>
          </div>
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-icon green"><FaCheckCircle /></div>
              <div className="stat-info">
                <div className="stat-value">{data.tasksCompletion}%</div>
                <div className="stat-label">Task Completati</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon blue"><FaWallet /></div>
              <div className="stat-info">
                <div className="stat-value">{formatCurrency(data.avgContractValue)}</div>
                <div className="stat-label">Valore Medio Contratto</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon purple"><FaProjectDiagram /></div>
              <div className="stat-info">
                <div className="stat-value">{data.projects.length}</div>
                <div className="stat-label">Progetti Attivi</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon orange"><FaCalendarAlt /></div>
              <div className="stat-info">
                <div className="stat-value">{data.upcomingEvents.length}</div>
                <div className="stat-label">Eventi in Arrivo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="analytics-row">
        {/* Expiring Contracts */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Contratti in Scadenza</h3>
            <span className="badge warning">{data.expiringContracts.length}</span>
          </div>
          <div className="expiring-list">
            {data.expiringContracts.length === 0 ? (
              <div className="empty-state small">
                <FaCheckCircle className="success" />
                <p>Nessun contratto in scadenza nei prossimi 60 giorni</p>
              </div>
            ) : (
              data.expiringContracts.slice(0, 5).map((contract, index) => {
                const days = getDaysUntil(contract.data_fine);
                return (
                  <div key={index} className="expiring-item" onClick={() => navigate(`/sponsor/contracts/${contract.id}`)}>
                    <div className="expiring-info">
                      <div className="expiring-name">{contract.nome_contratto}</div>
                      <div className="expiring-value">{formatCurrency(contract.compenso)}</div>
                    </div>
                    <div className={`expiring-days ${days <= 15 ? 'urgent' : days <= 30 ? 'warning' : ''}`}>
                      {days} giorni
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Attività Recenti</h3>
          </div>
          <div className="activity-list">
            {data.activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.icon}`}>
                  {activity.type === 'contract' && <FaFileContract />}
                  {activity.type === 'project' && <FaProjectDiagram />}
                  {activity.type === 'event' && <FaCalendarAlt />}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">{activity.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="analytics-row">
        <div className="analytics-card full-width">
          <div className="card-header">
            <h3>Panoramica Budget</h3>
          </div>
          <div className="budget-overview">
            <div className="budget-stat">
              <div className="budget-label">Budget Totale</div>
              <div className="budget-value">{formatCurrency(data.totalBudget)}</div>
            </div>
            <div className="budget-stat">
              <div className="budget-label">Utilizzato</div>
              <div className="budget-value used">{formatCurrency(data.usedBudget)}</div>
            </div>
            <div className="budget-stat">
              <div className="budget-label">Disponibile</div>
              <div className="budget-value available">{formatCurrency(data.totalBudget - data.usedBudget)}</div>
            </div>
            <div className="budget-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${data.totalBudget > 0 ? (data.usedBudget / data.totalBudget) * 100 : 0}%` }}
                />
              </div>
              <div className="progress-label">
                {data.totalBudget > 0 ? Math.round((data.usedBudget / data.totalBudget) * 100) : 0}% utilizzato
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Contracts Tab
  const renderContracts = () => (
    <div className="analytics-contracts">
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="card-header">
            <h3>Stato Contratti</h3>
          </div>
          <div className="status-grid">
            <div className="status-item active">
              <div className="status-value">{data.contractsByStatus.active || 0}</div>
              <div className="status-label">Attivi</div>
            </div>
            <div className="status-item warning">
              <div className="status-value">{data.expiringContracts.length}</div>
              <div className="status-label">In Scadenza</div>
            </div>
            <div className="status-item muted">
              <div className="status-value">{data.contractsByStatus.expired || 0}</div>
              <div className="status-label">Scaduti</div>
            </div>
            <div className="status-item draft">
              <div className="status-value">{data.contractsByStatus.draft || 0}</div>
              <div className="status-label">Bozze</div>
            </div>
          </div>
        </div>

        <div className="analytics-card large">
          <div className="card-header">
            <h3>Lista Contratti Attivi</h3>
          </div>
          <div className="contracts-list">
            {data.contracts.filter(c => {
              const now = new Date();
              const start = new Date(c.data_inizio);
              const end = new Date(c.data_fine);
              return c.status !== 'bozza' && now >= start && now <= end;
            }).slice(0, 10).map((contract, index) => (
              <div key={index} className="contract-item" onClick={() => navigate(`/sponsor/contracts/${contract.id}`)}>
                <div className="contract-info">
                  <div className="contract-name">{contract.nome_contratto}</div>
                  <div className="contract-dates">
                    {formatDate(contract.data_inizio)} - {formatDate(contract.data_fine)}
                  </div>
                </div>
                <div className="contract-value">{formatCurrency(contract.compenso)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Projects Tab
  const renderProjects = () => (
    <div className="analytics-projects">
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="card-header">
            <h3>Stato Progetti</h3>
          </div>
          <div className="status-grid">
            <div className="status-item active">
              <div className="status-value">{data.projectsByStatus.in_corso || 0}</div>
              <div className="status-label">In Corso</div>
            </div>
            <div className="status-item success">
              <div className="status-value">{data.projectsByStatus.completato || 0}</div>
              <div className="status-label">Completati</div>
            </div>
            <div className="status-item warning">
              <div className="status-value">{data.projectsByStatus.in_attesa || 0}</div>
              <div className="status-label">In Attesa</div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header">
            <h3>Completamento Task</h3>
          </div>
          <div className="completion-chart">
            <div className="completion-circle">
              <svg viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#85FF00"
                  strokeWidth="3"
                  strokeDasharray={`${data.tasksCompletion}, 100`}
                />
              </svg>
              <div className="completion-value">{data.tasksCompletion}%</div>
            </div>
            <div className="completion-label">Task Completati</div>
          </div>
        </div>
      </div>

      <div className="analytics-row">
        <div className="analytics-card full-width">
          <div className="card-header">
            <h3>Progetti Attivi</h3>
          </div>
          <div className="projects-list">
            {data.projects.slice(0, 10).map((project, index) => (
              <div key={index} className="project-item" onClick={() => navigate(`/sponsor/projects/${project.id}`)}>
                <div className="project-info">
                  <div className="project-name">{project.nome}</div>
                  <div className="project-status">
                    <span className={`status-badge ${project.status || 'in_corso'}`}>
                      {project.status === 'completato' ? 'Completato' :
                       project.status === 'in_attesa' ? 'In Attesa' : 'In Corso'}
                    </span>
                  </div>
                </div>
                <div className="project-progress">
                  <div className="progress-bar small">
                    <div className="progress-fill" style={{ width: `${project.percentuale_completamento || 0}%` }} />
                  </div>
                  <span className="progress-text">{project.percentuale_completamento || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Budget Tab
  const renderBudget = () => (
    <div className="analytics-budget">
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="card-header">
            <h3>Riepilogo Budget</h3>
          </div>
          <div className="budget-summary">
            <div className="budget-item total">
              <FaWallet />
              <div className="budget-info">
                <div className="budget-label">Budget Totale</div>
                <div className="budget-value">{formatCurrency(data.totalBudget)}</div>
              </div>
            </div>
            <div className="budget-item used">
              <FaChartPie />
              <div className="budget-info">
                <div className="budget-label">Utilizzato</div>
                <div className="budget-value">{formatCurrency(data.usedBudget)}</div>
              </div>
            </div>
            <div className="budget-item available">
              <FaCheckCircle />
              <div className="budget-info">
                <div className="budget-label">Disponibile</div>
                <div className="budget-value">{formatCurrency(data.totalBudget - data.usedBudget)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card large">
          <div className="card-header">
            <h3>Budget per Contratto</h3>
          </div>
          <div className="budget-list">
            {data.budgets.slice(0, 10).map((budget, index) => (
              <div key={index} className="budget-row" onClick={() => navigate(`/sponsor/budgets/${budget.id}`)}>
                <div className="budget-contract">{budget.nome || `Budget ${budget.id}`}</div>
                <div className="budget-bars">
                  <div className="budget-bar-container">
                    <div
                      className="budget-bar-fill"
                      style={{ width: `${budget.budget_totale > 0 ? (budget.speso / budget.budget_totale) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="budget-amounts">
                  <span className="used">{formatCurrency(budget.speso || 0)}</span>
                  <span className="separator">/</span>
                  <span className="total">{formatCurrency(budget.budget_totale || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Events Tab
  const renderEvents = () => (
    <div className="analytics-events">
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="card-header">
            <h3>Statistiche Eventi</h3>
          </div>
          <div className="event-stats">
            <div className="stat-item">
              <div className="stat-icon green"><FaCalendarCheck /></div>
              <div className="stat-info">
                <div className="stat-value">{data.upcomingEvents.length}</div>
                <div className="stat-label">In Arrivo</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon blue"><FaCalendarAlt /></div>
              <div className="stat-info">
                <div className="stat-value">{data.events.length}</div>
                <div className="stat-label">Totali</div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card large">
          <div className="card-header">
            <h3>Prossimi Eventi</h3>
          </div>
          <div className="events-list">
            {data.upcomingEvents.map((event, index) => (
              <div key={index} className="event-item" onClick={() => navigate(`/events/${event.id}`)}>
                <div className="event-date">
                  <div className="event-day">{new Date(event.data_evento).getDate()}</div>
                  <div className="event-month">{new Date(event.data_evento).toLocaleDateString('it-IT', { month: 'short' })}</div>
                </div>
                <div className="event-info">
                  <div className="event-name">{event.nome}</div>
                  <div className="event-location">{event.luogo || 'Luogo da definire'}</div>
                </div>
                <div className="event-type">
                  <span className="type-badge">{event.tipo || 'Evento'}</span>
                </div>
              </div>
            ))}
            {data.upcomingEvents.length === 0 && (
              <div className="empty-state small">
                <FaCalendarAlt />
                <p>Nessun evento in programma</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Engagement Tab
  const renderEngagement = () => (
    <div className="analytics-engagement">
      <div className="analytics-row">
        <div className="analytics-card">
          <div className="card-header">
            <h3>Messaggi</h3>
          </div>
          <div className="message-stats">
            <div className="stat-big">
              <FaEnvelope />
              <div className="stat-value">{data.messagesStats.unread || 0}</div>
              <div className="stat-label">Non Letti</div>
            </div>
            <div className="stat-secondary">
              <div className="stat-row">
                <span className="label">Conversazioni Attive</span>
                <span className="value">{data.messagesStats.conversations || 0}</span>
              </div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/messages')}>
            Vai ai Messaggi
          </button>
        </div>

        <div className="analytics-card large">
          <div className="card-header">
            <h3>Attività Recenti</h3>
          </div>
          <div className="activity-timeline">
            {data.activities.map((activity, index) => (
              <div key={index} className="timeline-item">
                <div className={`timeline-icon ${activity.icon}`}>
                  {activity.type === 'contract' && <FaFileContract />}
                  {activity.type === 'project' && <FaProjectDiagram />}
                  {activity.type === 'event' && <FaCalendarAlt />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{activity.title}</div>
                  <div className="timeline-description">{activity.description}</div>
                  <div className="timeline-date">{formatDate(activity.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'contracts':
        return renderContracts();
      case 'projects':
        return renderProjects();
      case 'budget':
        return renderBudget();
      case 'events':
        return renderEvents();
      case 'engagement':
        return renderEngagement();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Analytics</h1>
          <p>Monitora le performance delle tue sponsorizzazioni</p>
        </div>
      </div>

      <div className="analytics-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="analytics-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default SponsorAnalytics;
