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
  FaClock, FaExclamationTriangle, FaUserPlus, FaPhoneAlt, FaFileSignature
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');
  const navigate = useNavigate();
  const { user } = getAuth();

  // All analytics data
  const [data, setData] = useState({
    // Overview
    totalValue: 0,
    activeContracts: 0,
    totalSponsors: 0,
    totalLeads: 0,
    unreadMessages: 0,
    // Sponsors
    sponsors: [],
    sponsorsBySector: [],
    sponsorsTimeline: [],
    expiringContracts: [],
    // Financial
    contracts: [],
    monthlyRevenue: [],
    contractsByStatus: {},
    avgContractValue: 0,
    // Leads
    leads: [],
    leadsByStatus: {},
    leadsBySource: {},
    conversionRate: 0,
    pipelineValue: 0,
    // Activations
    matches: [],
    events: [],
    assets: [],
    assetDeliveryRate: 0,
    // Engagement
    messagesStats: {},
    pressStats: {},
    activities: [],
    // Inventory Performance
    inventoryAssets: [],
    inventoryAllocations: []
  });

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
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
        sponsorsRes,
        contractsRes,
        leadsRes,
        matchesRes,
        eventsRes,
        messagesRes
      ] = await Promise.all([
        axios.get(`${API_URL}/club/sponsors`, { headers }).catch(() => ({ data: { sponsors: [] } })),
        axios.get(`${API_URL}/contracts`, { headers }).catch(() => ({ data: { contracts: [] } })),
        axios.get(`${API_URL}/club/leads`, { headers }).catch(() => ({ data: { leads: [] } })),
        axios.get(`${API_URL}/matches`, { headers }).catch(() => ({ data: { matches: [] } })),
        axios.get(`${API_URL}/events`, { headers }).catch(() => ({ data: { events: [] } })),
        axios.get(`${API_URL}/messages/unread-count`, { headers }).catch(() => ({ data: { unread_count: 0 } }))
      ]);

      const sponsors = sponsorsRes.data.sponsors || sponsorsRes.data || [];
      const contracts = contractsRes.data.contracts || contractsRes.data || [];
      const leads = leadsRes.data.leads || leadsRes.data || [];
      const matches = matchesRes.data.matches || matchesRes.data || [];
      const events = eventsRes.data.events || eventsRes.data || [];

      // Debug: log raw data with sample IDs
      console.log('Raw API Data:', {
        sponsorsRes: sponsorsRes.data,
        contractsRes: contractsRes.data,
        sponsors: sponsors.length,
        contracts: contracts.length,
        sampleSponsor: sponsors[0],
        sampleContract: contracts[0],
        sponsorIds: sponsors.slice(0, 5).map(s => ({ id: s.id, type: typeof s.id })),
        contractSponsorIds: contracts.slice(0, 5).map(c => ({ sponsor_id: c.sponsor_id, type: typeof c.sponsor_id }))
      });

      const now = new Date();

      // Process contracts
      const activeContracts = contracts.filter(c => {
        const start = new Date(c.data_inizio);
        const end = new Date(c.data_fine);
        return c.status !== 'bozza' && now >= start && now <= end;
      });
      const expiredContracts = contracts.filter(c => now > new Date(c.data_fine));
      const draftContracts = contracts.filter(c => c.status === 'bozza');

      // Total value
      const totalValue = activeContracts.reduce((sum, c) => sum + (c.compenso || 0), 0);
      const avgContractValue = activeContracts.length > 0 ? totalValue / activeContracts.length : 0;

      // Contracts expiring in next 60 days - with sponsor name
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      const expiringContracts = activeContracts.filter(c => {
        const end = new Date(c.data_fine);
        return end <= sixtyDaysFromNow && end >= now;
      }).map(c => {
        const sponsor = sponsors.find(s => s.id === c.sponsor_id);
        return {
          ...c,
          sponsor_name: c.sponsor_nome || c.sponsor?.ragione_sociale || sponsor?.ragione_sociale || 'N/D'
        };
      }).sort((a, b) => new Date(a.data_fine) - new Date(b.data_fine));

      // Sponsors by sector
      const sectorCounts = {};
      sponsors.forEach(s => {
        const sector = s.settore_merceologico || 'Altro';
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      });
      const sponsorsBySector = Object.entries(sectorCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Sponsors timeline
      const sponsorsTimeline = generateTimeline(sponsors, 'created_at', 12);

      // Top sponsors by value - use == for type coercion (sponsor_id may be string or number)
      const topSponsorsByValue = sponsors.map(s => {
        const sponsorContracts = contracts.filter(c => String(c.sponsor_id) === String(s.id));
        const totalSponsorValue = sponsorContracts.reduce((sum, c) => sum + (parseFloat(c.compenso) || 0), 0);
        return {
          id: s.id,
          name: s.ragione_sociale,
          sector: s.settore_merceologico,
          value: totalSponsorValue,
          contracts_count: sponsorContracts.length
        };
      }).filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

      // Debug log
      console.log('Analytics Data:', { sponsors: sponsors.length, contracts: contracts.length, topSponsorsByValue });

      // Leads by status
      const leadsByStatus = {};
      leads.forEach(l => {
        const status = l.status || 'nuovo';
        leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
      });

      // Leads by source
      const leadsBySource = {};
      leads.forEach(l => {
        const source = l.fonte || 'altro';
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });

      // Pipeline value
      const pipelineValue = leads
        .filter(l => !l.convertito && l.status !== 'perso')
        .reduce((sum, l) => sum + (l.valore_stimato || 0), 0);

      // Conversion rate
      const convertedLeads = leads.filter(l => l.convertito);
      const lostLeads = leads.filter(l => l.status === 'perso');
      const totalLeadsWithOutcome = convertedLeads.length + lostLeads.length;
      const conversionRate = totalLeadsWithOutcome > 0
        ? Math.round((convertedLeads.length / totalLeadsWithOutcome) * 100)
        : 0;

      // Hot leads
      const hotLeads = leads.filter(l =>
        ['in_trattativa', 'proposta_inviata', 'negoziazione'].includes(l.status) &&
        (l.probabilita_chiusura || 0) >= 50
      ).sort((a, b) => (b.valore_stimato || 0) - (a.valore_stimato || 0)).slice(0, 5);

      // Assets from contracts
      let allAssets = [];
      contracts.forEach(c => {
        if (c.assets) {
          allAssets = allAssets.concat(c.assets);
        }
      });
      const deliveredAssets = allAssets.filter(a => a.status === 'completato').length;
      const assetDeliveryRate = allAssets.length > 0
        ? Math.round((deliveredAssets / allAssets.length) * 100)
        : 0;

      // Monthly revenue
      const monthlyRevenue = generateMonthlyRevenue(contracts, 12);

      // Recent activities
      const activities = generateRecentActivities(sponsors, contracts, leads, events);

      // New sponsors this month
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newSponsorsMonth = sponsors.filter(s => s.created_at && new Date(s.created_at) >= thirtyDaysAgo).length;
      const activeSponsors = sponsors.filter(s => s.account_attivo).length;

      setData({
        // Overview
        totalValue,
        activeContracts: activeContracts.length,
        totalSponsors: sponsors.length,
        activeSponsors,
        newSponsorsMonth,
        totalLeads: leads.length,
        unreadMessages: messagesRes.data.unread_count || 0,

        // Sponsors
        sponsors,
        sponsorsBySector,
        sponsorsTimeline,
        topSponsorsByValue,

        // Contracts
        expiringContracts,
        contracts,
        monthlyRevenue,
        contractsByStatus: {
          active: activeContracts.length,
          expired: expiredContracts.length,
          draft: draftContracts.length
        },
        avgContractValue,

        // Leads
        leads,
        leadsByStatus,
        leadsBySource,
        conversionRate,
        pipelineValue,
        hotLeads,
        convertedCount: convertedLeads.length,
        lostCount: lostLeads.length,

        // Matches & Events
        matches,
        events,

        // Assets
        assets: allAssets,
        assetDeliveryRate,

        // Engagement
        messagesStats: {
          unread: messagesRes.data.unread_count || 0,
          conversations: sponsors.length
        },
        pressStats: {
          total: 0,
          last30Days: 0,
          totalViews: 0
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
  const generateTimeline = (items, dateField, months) => {
    const timeline = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });
      const count = items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate.getMonth() === date.getMonth() &&
               itemDate.getFullYear() === date.getFullYear();
      }).length;
      timeline.push({ month: monthName, count });
    }
    return timeline;
  };

  const generateMonthlyRevenue = (contracts, months) => {
    const revenue = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });

      // Calculate revenue for this month (contracts active during this month)
      let monthRevenue = 0;
      contracts.forEach(c => {
        const start = new Date(c.data_inizio);
        const end = new Date(c.data_fine);
        if (start <= date && end >= date && c.compenso) {
          // Distribute contract value across months
          const totalMonths = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));
          monthRevenue += c.compenso / totalMonths;
        }
      });

      revenue.push({ month: monthName, value: Math.round(monthRevenue) });
    }
    return revenue;
  };

  const generateRecentActivities = (sponsors, contracts, leads, events) => {
    const activities = [];

    // Recent sponsors
    sponsors.slice(0, 2).forEach(s => {
      activities.push({
        type: 'sponsor',
        title: `Nuovo sponsor: ${s.ragione_sociale}`,
        description: s.settore_merceologico || 'Settore non specificato',
        date: s.created_at,
        icon: 'green'
      });
    });

    // Recent contracts
    contracts.slice(0, 2).forEach(c => {
      activities.push({
        type: 'contract',
        title: `Contratto: ${c.nome_contratto}`,
        description: `Valore: ${formatCurrency(c.compenso)}`,
        date: c.created_at,
        icon: 'blue'
      });
    });

    // Recent leads
    leads.slice(0, 2).forEach(l => {
      activities.push({
        type: 'lead',
        title: `Lead: ${l.ragione_sociale}`,
        description: `Status: ${l.status}`,
        date: l.created_at,
        icon: 'purple'
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

  const tabs = [
    { id: 'overview', label: 'Panoramica', icon: <FaChartLine /> },
    { id: 'sponsors', label: 'Sponsor', icon: <FaUsers /> },
    { id: 'assets', label: 'Assets', icon: <FaCheckCircle /> },
    { id: 'financial', label: 'Finanze', icon: <FaEuroSign /> },
    { id: 'pipeline', label: 'Pipeline', icon: <FaFunnelDollar /> },
    { id: 'activations', label: 'Attivazioni', icon: <FaCalendarCheck /> },
    { id: 'engagement', label: 'Engagement', icon: <FaComments /> }
  ];

  // Status labels
  const statusLabels = {
    nuovo: 'Nuovo',
    contattato: 'Contattato',
    in_trattativa: 'In Trattativa',
    proposta_inviata: 'Proposta Inviata',
    negoziazione: 'Negoziazione',
    vinto: 'Vinto',
    perso: 'Perso'
  };

  const sourceLabels = {
    referral: 'Referral',
    evento: 'Evento',
    social: 'Social',
    cold_call: 'Cold Call',
    website: 'Website',
    altro: 'Altro'
  };

  const sectorColors = ['#85FF00', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899', '#6B7280'];

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">Caricamento analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">Panoramica completa delle performance del club</p>
        </div>
        <div className="analytics-period-selector">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">Ultimo mese</option>
            <option value="quarter">Ultimo trimestre</option>
            <option value="year">Ultimo anno</option>
            <option value="all">Tutto</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`analytics-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab data={data} formatCurrency={formatCurrency} navigate={navigate} />
      )}

      {activeTab === 'sponsors' && (
        <SponsorsTab
          data={data}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getDaysUntil={getDaysUntil}
          sectorColors={sectorColors}
          navigate={navigate}
        />
      )}

      {activeTab === 'assets' && (
        <AssetsTab
          data={data}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          navigate={navigate}
        />
      )}

      {activeTab === 'financial' && (
        <FinancialTab
          data={data}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          navigate={navigate}
        />
      )}

      {activeTab === 'pipeline' && (
        <PipelineTab
          data={data}
          formatCurrency={formatCurrency}
          statusLabels={statusLabels}
          sourceLabels={sourceLabels}
          navigate={navigate}
        />
      )}

      {activeTab === 'activations' && (
        <ActivationsTab
          data={data}
          formatDate={formatDate}
          getDaysUntil={getDaysUntil}
          navigate={navigate}
        />
      )}

      {activeTab === 'engagement' && (
        <EngagementTab
          data={data}
          formatDate={formatDate}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ data, formatCurrency, navigate }) {
  // Hot leads
  const hotLeads = data.hotLeads || [];

  return (
    <>
      {/* KPI Cards - Same style as SponsorListPage */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/contracts')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaEuroSign style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(data.totalValue)}</div>
            <div className="tp-stat-label">Revenue Contratti Attivi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/leads')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaFunnelDollar style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{formatCurrency(data.pipelineValue)}</div>
            <div className="tp-stat-label">Valore Pipeline</div>
          </div>
        </div>
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/sponsors')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaUsers style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.totalSponsors}</div>
            <div className="tp-stat-label">Sponsor Totali</div>
          </div>
        </div>
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/contracts')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaFileContract style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.activeContracts}</div>
            <div className="tp-stat-label">Contratti Attivi</div>
          </div>
        </div>
      </div>

      {/* Second Row of KPIs */}
      <div className="tp-stats-row" style={{ marginTop: '16px' }}>
        <div className="tp-stat-card-dark" onClick={() => navigate('/club/leads')} style={{ cursor: 'pointer' }}>
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaBullseye style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.totalLeads}</div>
            <div className="tp-stat-label">Lead in Pipeline</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaChartLine style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.conversionRate}%</div>
            <div className="tp-stat-label">Tasso Conversione</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaCheckCircle style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.convertedCount || 0}</div>
            <div className="tp-stat-label">Lead Convertiti</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <FaExclamationTriangle style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{data.expiringContracts?.length || 0}</div>
            <div className="tp-stat-label">Contratti in Scadenza</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Andamento Revenue</h3>
              <p className="chart-card-subtitle">Valore contratti negli ultimi 12 mesi</p>
            </div>
          </div>
          <div className="chart-container">
            <SimpleBarChart data={data.monthlyRevenue} color="#85FF00" />
          </div>
        </div>

        {/* Sponsor by Sector */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Sponsor per Settore</h3>
              <p className="chart-card-subtitle">Distribuzione partner</p>
            </div>
          </div>
          <div className="donut-chart-wrapper">
            <SimpleDonutChart data={data.sponsorsBySector} />
            <div className="donut-legend">
              {data.sponsorsBySector.slice(0, 5).map((item, idx) => (
                <div key={idx} className="donut-legend-item">
                  <div
                    className="donut-legend-color"
                    style={{ background: ['#85FF00', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][idx] }}
                  />
                  <span className="donut-legend-label">{item.name}</span>
                  <span className="donut-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row - Hot Leads + Expiring Contracts */}
      <div className="charts-grid-equal">
        {/* Hot Leads - Opportunities to focus on */}
        <div className="chart-card" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E293B 100%)', border: 'none' }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: '#FFFFFF' }}>🔥 Lead Caldi</h3>
            <p className="chart-card-subtitle" style={{ color: '#94A3B8' }}>Opportunità ad alta probabilità di chiusura</p>
          </div>
          {hotLeads.length === 0 ? (
            <div className="analytics-empty" style={{ color: '#94A3B8' }}>
              <div className="analytics-empty-icon" style={{ color: '#64748B' }}><FaBullseye /></div>
              <p className="analytics-empty-text" style={{ color: '#94A3B8' }}>Nessun lead caldo al momento</p>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>I lead con probabilità ≥50% appariranno qui</p>
            </div>
          ) : (
            <div className="stats-list">
              {hotLeads.map((lead, idx) => (
                <div key={idx} className="stats-list-item" onClick={() => navigate(`/club/leads/${lead.id}`)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', padding: '12px' }}>
                  <div className="stats-list-item-info">
                    <div className="stats-list-item-icon" style={{ background: '#85FF0020', color: '#85FF00' }}>
                      <FaBullseye />
                    </div>
                    <div>
                      <div className="stats-list-item-label" style={{ color: '#FFFFFF' }}>{lead.company || lead.ragione_sociale}</div>
                      <div className="stats-list-item-sublabel" style={{ color: '#94A3B8' }}>
                        {lead.status === 'negoziazione' ? 'Negoziazione' : lead.status === 'proposta_inviata' ? 'Proposta Inviata' : 'In Trattativa'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#85FF00' }}>{formatCurrency(lead.value || lead.valore_stimato)}</div>
                    <div style={{ fontSize: '12px', color: '#22C55E' }}>{lead.probability || lead.probabilita_chiusura}% prob.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">⚠️ Contratti in Scadenza</h3>
            <p className="chart-card-subtitle">Nei prossimi 60 giorni - da rinnovare</p>
          </div>
          {data.expiringContracts.length === 0 ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon" style={{ color: '#22C55E' }}><FaCheckCircle /></div>
              <p className="analytics-empty-text">Nessun contratto in scadenza</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>Ottimo! Nessun rinnovo urgente</p>
            </div>
          ) : (
            <div className="stats-list">
              {data.expiringContracts.slice(0, 5).map((contract, idx) => {
                const daysLeft = Math.ceil((new Date(contract.data_fine) - new Date()) / (1000 * 60 * 60 * 24));
                const urgencyColor = daysLeft <= 15 ? '#EF4444' : daysLeft <= 30 ? '#F59E0B' : '#3B82F6';
                return (
                  <div key={idx} className="stats-list-item" onClick={() => navigate(`/club/contracts/${contract.id}`)} style={{ cursor: 'pointer' }}>
                    <div className="stats-list-item-info">
                      <div className="stats-list-item-icon" style={{ background: urgencyColor + '20', color: urgencyColor }}>
                        <FaExclamationTriangle />
                      </div>
                      <div>
                        <div className="stats-list-item-label">{contract.nome_contratto}</div>
                        <div className="stats-list-item-sublabel">{contract.sponsor_name} · {formatCurrency(contract.compenso)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: urgencyColor }}>{daysLeft}g</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>rimanenti</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Activity + Top Sponsors */}
      <div className="charts-grid-equal">
        {/* Recent Activity */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">📋 Attività Recenti</h3>
          </div>
          <div className="activity-timeline">
            {data.activities.length === 0 ? (
              <div className="analytics-empty">
                <div className="analytics-empty-icon"><FaClock /></div>
                <p className="analytics-empty-text">Nessuna attività recente</p>
              </div>
            ) : (
              data.activities.map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className={`activity-icon ${activity.icon}`}>
                    {activity.type === 'sponsor' && <FaHandshake />}
                    {activity.type === 'contract' && <FaFileContract />}
                    {activity.type === 'lead' && <FaBullseye />}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">{activity.title}</div>
                    <div className="activity-description">{activity.description}</div>
                  </div>
                  <div className="activity-time">{new Date(activity.date).toLocaleDateString('it-IT')}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Sponsors by Value */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">🏆 Top Sponsor per Valore</h3>
            <p className="chart-card-subtitle">Partner con maggiore revenue</p>
          </div>
          {(!data.topSponsorsByValue || data.topSponsorsByValue.length === 0) ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon"><FaUsers /></div>
              <p className="analytics-empty-text">Nessun contratto attivo</p>
            </div>
          ) : (
            <div className="stats-list">
              {data.topSponsorsByValue.slice(0, 5).map((sponsor, idx) => (
                <div key={idx} className="stats-list-item" onClick={() => navigate(`/club/sponsors/${sponsor.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="stats-list-item-info">
                    <div className="stats-list-item-icon" style={{
                      background: idx === 0 ? '#85FF0020' : '#F3F4F6',
                      color: idx === 0 ? '#85FF00' : '#6B7280',
                      fontWeight: '700'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="stats-list-item-label">{sponsor.name}</div>
                      <div className="stats-list-item-sublabel">{sponsor.sector || 'N/D'} · {sponsor.contracts_count} contratti</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: '#1F2937' }}>{formatCurrency(sponsor.value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================
// SPONSORS TAB
// ============================================
function SponsorsTab({ data, formatCurrency, formatDate, getDaysUntil, sectorColors, navigate }) {
  // Use backend top sponsors or calculate from frontend data
  const sponsorsWithValue = data.topSponsorsByValue && data.topSponsorsByValue.length > 0
    ? data.topSponsorsByValue.map(s => ({
        id: s.id,
        ragione_sociale: s.name,
        settore_merceologico: s.sector,
        logo_url: s.logo_url,
        totalValue: s.value,
        contractsCount: s.contracts_count,
        account_attivo: true
      }))
    : data.sponsors.map(s => {
        const sponsorContracts = data.contracts.filter(c => c.sponsor_id === s.id);
        const totalValue = sponsorContracts.reduce((sum, c) => sum + (c.compenso || 0), 0);
        return { ...s, totalValue, contractsCount: sponsorContracts.length };
      }).sort((a, b) => b.totalValue - a.totalValue);

  // Calculate total revenue from sponsors
  const totalSponsorRevenue = sponsorsWithValue.reduce((sum, s) => sum + (s.totalValue || 0), 0);

  return (
    <>
      {/* Quick Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Sponsor Totali</div>
          <div className="tp-stat-value">{data.totalSponsors}</div>
          <div className="tp-stat-description">{data.activeSponsors || 0} con account attivo</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Revenue Totale</div>
          <div className="tp-stat-value" style={{ color: '#85FF00' }}>{formatCurrency(totalSponsorRevenue)}</div>
          <div className="tp-stat-description">da tutti i contratti</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Nuovi questo Mese</div>
          <div className="tp-stat-value" style={{ color: '#3B82F6' }}>{data.newSponsorsMonth || 0}</div>
          <div className="tp-stat-description">acquisiti negli ultimi 30gg</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">In Scadenza</div>
          <div className="tp-stat-value" style={{ color: data.expiringContracts.length > 0 ? '#F59E0B' : '#22C55E' }}>
            {data.expiringContracts.length}
          </div>
          <div className="tp-stat-description">contratti da rinnovare</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Settori Coperti</div>
          <div className="tp-stat-value">{data.sponsorsBySector.length}</div>
          <div className="tp-stat-description">diversificazione portfolio</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Sponsor Acquisition Timeline */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Acquisizione Sponsor</h3>
            <p className="chart-card-subtitle">Nuovi sponsor negli ultimi 12 mesi</p>
          </div>
          <div className="chart-container">
            <SimpleAreaChart data={data.sponsorsTimeline} color="#85FF00" />
          </div>
        </div>

        {/* Sectors Distribution - Pie Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Distribuzione Settori</h3>
          </div>
          <SimplePieChart data={data.sponsorsBySector} colors={sectorColors} total={data.totalSponsors} />
        </div>
      </div>

      {/* Top Sponsors Table */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Top Sponsor per Valore</h3>
        </div>
        {sponsorsWithValue.length === 0 ? (
          <div className="analytics-empty">
            <div className="analytics-empty-icon"><FaUsers /></div>
            <p className="analytics-empty-text">Nessuno sponsor presente</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Settore</th>
                <th>Contratti</th>
                <th>Valore Totale</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sponsorsWithValue.slice(0, 10).map((sponsor, idx) => (
                <tr key={idx} onClick={() => navigate(`/club/sponsors/${sponsor.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="data-table-name">
                      <img
                        src={sponsor.logo_url ? getImageUrl(sponsor.logo_url) : FavIcon}
                        alt=""
                        className="data-table-avatar"
                        onError={(e) => { e.target.src = FavIcon; }}
                      />
                      {sponsor.ragione_sociale}
                    </div>
                  </td>
                  <td>{sponsor.settore_merceologico || '-'}</td>
                  <td>{sponsor.contractsCount}</td>
                  <td><strong>{formatCurrency(sponsor.totalValue)}</strong></td>
                  <td>
                    <span className={`data-table-badge ${sponsor.account_attivo ? 'green' : 'gray'}`}>
                      {sponsor.account_attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ============================================
// FINANCIAL TAB
// ============================================
function FinancialTab({ data, formatCurrency, formatDate, navigate }) {
  const maxMonthlyRevenue = Math.max(...data.monthlyRevenue.map(m => m.value), 1);

  return (
    <>
      {/* Financial KPIs */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Valore Totale Attivo</div>
          <div className="tp-stat-value">{formatCurrency(data.totalValue)}</div>
          <div className="tp-stat-description">Contratti attivi</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Valore Medio Contratto</div>
          <div className="tp-stat-value">{formatCurrency(data.avgContractValue)}</div>
          <div className="tp-stat-description">Media per contratto</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Pipeline Lead</div>
          <div className="tp-stat-value">{formatCurrency(data.pipelineValue)}</div>
          <div className="tp-stat-description">Valore potenziale</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Contratti Attivi</div>
          <div className="tp-stat-value">{data.activeContracts}</div>
          <div className="tp-stat-description">In corso</div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Revenue Trend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Revenue Mensile</h3>
            <p className="chart-card-subtitle">Distribuzione valore contratti per mese</p>
          </div>
          <div className="chart-container">
            <SimpleBarChart data={data.monthlyRevenue} color="#85FF00" />
          </div>
          <div className="metric-cards-row">
            <div className="metric-card">
              <div className="metric-card-value">{formatCurrency(data.totalValue)}</div>
              <div className="metric-card-label">Totale Attivo</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-value">{data.activeContracts}</div>
              <div className="metric-card-label">Contratti Attivi</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-value">{data.contractsByStatus.draft || 0}</div>
              <div className="metric-card-label">Bozze</div>
            </div>
            <div className="metric-card">
              <div className="metric-card-value">{data.contractsByStatus.expired || 0}</div>
              <div className="metric-card-label">Scaduti</div>
            </div>
          </div>
        </div>

        {/* Contract Status Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Status Contratti</h3>
          </div>
          <div className="stats-list">
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                  <FaCheckCircle />
                </div>
                <div className="stats-list-item-label">Contratti Attivi</div>
              </div>
              <div className="progress-bar-wrapper" style={{ width: '50%' }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill green" style={{ width: `${(data.contractsByStatus.active / (data.contracts.length || 1)) * 100}%` }} />
                </div>
                <div className="progress-bar-value">{data.contractsByStatus.active}</div>
              </div>
            </div>
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <FaExclamationTriangle />
                </div>
                <div className="stats-list-item-label">Contratti Scaduti</div>
              </div>
              <div className="progress-bar-wrapper" style={{ width: '50%' }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill red" style={{ width: `${(data.contractsByStatus.expired / (data.contracts.length || 1)) * 100}%` }} />
                </div>
                <div className="progress-bar-value">{data.contractsByStatus.expired}</div>
              </div>
            </div>
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                  <FaFileSignature />
                </div>
                <div className="stats-list-item-label">Bozze</div>
              </div>
              <div className="progress-bar-wrapper" style={{ width: '50%' }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(data.contractsByStatus.draft / (data.contracts.length || 1)) * 100}%`, background: '#9CA3AF' }} />
                </div>
                <div className="progress-bar-value">{data.contractsByStatus.draft}</div>
              </div>
            </div>
          </div>

          {/* Expiring soon */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>In Scadenza (60gg)</h4>
            {data.expiringContracts.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '13px' }}>Nessun contratto in scadenza</p>
            ) : (
              data.expiringContracts.slice(0, 3).map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0F0F0' }}>
                  <span style={{ fontSize: '13px' }}>{c.nome_contratto}</span>
                  <span style={{ fontSize: '13px', color: '#D97706', fontWeight: '600' }}>
                    {Math.ceil((new Date(c.data_fine) - new Date()) / (1000 * 60 * 60 * 24))}g
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// PIPELINE TAB
// ============================================
function PipelineTab({ data, formatCurrency, statusLabels, sourceLabels, navigate }) {
  const statusColors = {
    nuovo: '#3B82F6',
    contattato: '#8B5CF6',
    in_trattativa: '#F59E0B',
    proposta_inviata: '#EC4899',
    negoziazione: '#14B8A6',
    vinto: '#22C55E',
    perso: '#EF4444'
  };

  const funnelData = [
    { status: 'nuovo', label: 'Nuovi' },
    { status: 'contattato', label: 'Contattati' },
    { status: 'in_trattativa', label: 'In Trattativa' },
    { status: 'proposta_inviata', label: 'Proposta Inviata' },
    { status: 'negoziazione', label: 'Negoziazione' },
    { status: 'vinto', label: 'Vinti' }
  ];

  const maxLeads = Math.max(...Object.values(data.leadsByStatus), 1);

  // Hot leads from backend or calculated
  const hotLeads = data.hotLeads || data.leads?.filter(l =>
    l.status && ['in_trattativa', 'proposta_inviata', 'negoziazione'].includes(l.status) &&
    (l.probabilita_chiusura || 0) >= 50
  ).sort((a, b) => (b.valore_stimato || 0) - (a.valore_stimato || 0)).slice(0, 5) || [];

  // Weighted pipeline (value * probability)
  const weightedPipeline = data.leads?.filter(l => !l.convertito && l.status !== 'perso')
    .reduce((sum, l) => sum + ((l.valore_stimato || 0) * ((l.probabilita_chiusura || 0) / 100)), 0) || 0;

  return (
    <>
      {/* Pipeline KPIs */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Lead Totali</div>
          <div className="tp-stat-value">{data.totalLeads}</div>
          <div className="tp-stat-description">in pipeline</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Valore Pipeline</div>
          <div className="tp-stat-value" style={{ color: '#3B82F6' }}>{formatCurrency(data.pipelineValue)}</div>
          <div className="tp-stat-description">potenziale totale</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Pipeline Pesata</div>
          <div className="tp-stat-value" style={{ color: '#85FF00' }}>{formatCurrency(weightedPipeline)}</div>
          <div className="tp-stat-description">valore × probabilità</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Conversione</div>
          <div className="tp-stat-value" style={{ color: data.conversionRate >= 30 ? '#22C55E' : data.conversionRate >= 15 ? '#F59E0B' : '#EF4444' }}>
            {data.conversionRate}%
          </div>
          <div className="tp-stat-description">{data.convertedCount || 0} vinti / {data.lostCount || 0} persi</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Lead Caldi</div>
          <div className="tp-stat-value" style={{ color: '#F59E0B' }}>{hotLeads.length}</div>
          <div className="tp-stat-description">probabilità ≥50%</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">In Negoziazione</div>
          <div className="tp-stat-value">{data.leadsByStatus.negoziazione || 0}</div>
          <div className="tp-stat-description">fase finale</div>
        </div>
      </div>

      {/* Hot Leads Section */}
      {hotLeads.length > 0 && (
        <div className="chart-card" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E293B 100%)', border: 'none', marginBottom: '24px' }}>
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: '#FFFFFF' }}>🔥 Lead Caldi - Azione Richiesta</h3>
            <p className="chart-card-subtitle" style={{ color: '#94A3B8' }}>Opportunità con alta probabilità di chiusura - da gestire prioritariamente</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {hotLeads.map((lead, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/club/leads/${lead.id}`)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid rgba(133,255,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#FFFFFF', fontSize: '15px' }}>{lead.company || lead.ragione_sociale}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      {statusLabels[lead.status] || lead.status}
                    </div>
                  </div>
                  <div style={{
                    background: '#85FF0020',
                    color: '#85FF00',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {lead.probability || lead.probabilita_chiusura}%
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#85FF00' }}>
                    {formatCurrency(lead.value || lead.valore_stimato)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {sourceLabels[lead.source || lead.fonte] || lead.source || lead.fonte || 'N/D'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-grid">
        {/* Lead Funnel */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Funnel di Conversione</h3>
            <p className="chart-card-subtitle">Distribuzione lead per fase</p>
          </div>
          <div className="funnel-chart">
            {funnelData.map((item, idx) => {
              const count = data.leadsByStatus[item.status] || 0;
              const width = Math.max(20, (count / maxLeads) * 100);
              return (
                <div key={idx} className="funnel-item">
                  <span className="funnel-label">{item.label}</span>
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${width}%`,
                      background: statusColors[item.status]
                    }}
                  >
                    <span>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Fonti Lead</h3>
          </div>
          <div className="stats-list">
            {Object.entries(data.leadsBySource).sort((a, b) => b[1] - a[1]).map(([source, count], idx) => (
              <div key={idx} className="stats-list-item">
                <div className="stats-list-item-info">
                  <div
                    className="stats-list-item-icon"
                    style={{ background: ['#D1FAE5', '#DBEAFE', '#EDE9FE', '#FEF3C7', '#FCE7F3', '#F3F4F6'][idx] || '#F3F4F6', color: ['#059669', '#2563EB', '#7C3AED', '#D97706', '#DB2777', '#6B7280'][idx] || '#6B7280' }}
                  >
                    {source === 'referral' && <FaUsers />}
                    {source === 'evento' && <FaCalendarAlt />}
                    {source === 'social' && <FaComments />}
                    {source === 'cold_call' && <FaPhoneAlt />}
                    {source === 'website' && <FaChartLine />}
                    {source === 'altro' && <FaBullseye />}
                  </div>
                  <div className="stats-list-item-label">{sourceLabels[source] || source}</div>
                </div>
                <div className="stats-list-item-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Lead Recenti</h3>
        </div>
        {data.leads.length === 0 ? (
          <div className="analytics-empty">
            <div className="analytics-empty-icon"><FaBullseye /></div>
            <p className="analytics-empty-text">Nessun lead presente</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Status</th>
                <th>Fonte</th>
                <th>Valore Stimato</th>
                <th>Probabilità</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.slice(0, 8).map((lead, idx) => (
                <tr key={idx} onClick={() => navigate(`/club/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                  <td><strong>{lead.ragione_sociale}</strong></td>
                  <td>
                    <span className={`data-table-badge`} style={{ background: statusColors[lead.status] + '20', color: statusColors[lead.status] }}>
                      {statusLabels[lead.status] || lead.status}
                    </span>
                  </td>
                  <td>{sourceLabels[lead.fonte] || lead.fonte || '-'}</td>
                  <td>{formatCurrency(lead.valore_stimato)}</td>
                  <td>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar" style={{ width: '60px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${lead.probabilita_chiusura || 0}%`,
                            background: (lead.probabilita_chiusura || 0) >= 70 ? '#22C55E' : (lead.probabilita_chiusura || 0) >= 40 ? '#F59E0B' : '#EF4444'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{lead.probabilita_chiusura || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ============================================
// ACTIVATIONS TAB
// ============================================
function ActivationsTab({ data, formatDate, getDaysUntil, navigate }) {
  const upcomingMatches = data.matches
    .filter(m => new Date(m.data_ora) > new Date())
    .sort((a, b) => new Date(a.data_ora) - new Date(b.data_ora))
    .slice(0, 5);

  const upcomingEvents = data.events
    .filter(e => new Date(e.data_ora_inizio) > new Date())
    .sort((a, b) => new Date(a.data_ora_inizio) - new Date(b.data_ora_inizio))
    .slice(0, 5);

  return (
    <>
      {/* Quick Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Partite Totali</div>
          <div className="tp-stat-value">{data.matches.length}</div>
          <div className="tp-stat-description">Stagione corrente</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Prossime Partite</div>
          <div className="tp-stat-value">{upcomingMatches.length}</div>
          <div className="tp-stat-description">In programma</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Eventi Totali</div>
          <div className="tp-stat-value">{data.events.length}</div>
          <div className="tp-stat-description">Organizzati</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Asset Consegnati</div>
          <div className="tp-stat-value">{data.assetDeliveryRate}%</div>
          <div className="tp-stat-description">Delivery rate</div>
        </div>
      </div>

      <div className="charts-grid-equal">
        {/* Upcoming Matches */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Prossime Partite</h3>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon"><FaTrophy /></div>
              <p className="analytics-empty-text">Nessuna partita in programma</p>
            </div>
          ) : (
            <div className="stats-list">
              {upcomingMatches.map((match, idx) => (
                <div key={idx} className="stats-list-item" onClick={() => navigate(`/matches/${match.id}`)}>
                  <div className="stats-list-item-info">
                    <div className="stats-list-item-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                      <FaTrophy />
                    </div>
                    <div>
                      <div className="stats-list-item-label">vs {match.avversario}</div>
                      <div className="stats-list-item-sublabel">{match.competizione} · {match.luogo === 'casa' ? 'Casa' : 'Trasferta'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                      {formatDate(match.data_ora)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      tra {getDaysUntil(match.data_ora)} giorni
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Prossimi Eventi</h3>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="analytics-empty">
              <div className="analytics-empty-icon"><FaCalendarAlt /></div>
              <p className="analytics-empty-text">Nessun evento in programma</p>
            </div>
          ) : (
            <div className="stats-list">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="stats-list-item" onClick={() => navigate(`/events/${event.id}`)}>
                  <div className="stats-list-item-info">
                    <div className="stats-list-item-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <div className="stats-list-item-label">{event.titolo}</div>
                      <div className="stats-list-item-sublabel">{event.tipo} · {event.luogo || 'Online'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                      {formatDate(event.data_ora_inizio)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Delivery Status */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Stato Consegna Asset</h3>
          <p className="chart-card-subtitle">Avanzamento consegna benefit ai sponsor</p>
        </div>
        {data.assets.length === 0 ? (
          <div className="analytics-empty">
            <div className="analytics-empty-icon"><FaCheckCircle /></div>
            <p className="analytics-empty-text">Nessun asset presente nei contratti</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="metric-card" style={{ background: '#D1FAE5' }}>
              <div className="metric-card-value" style={{ color: '#059669' }}>
                {data.assets.filter(a => a.status === 'completato').length}
              </div>
              <div className="metric-card-label">Completati</div>
            </div>
            <div className="metric-card" style={{ background: '#FEF3C7' }}>
              <div className="metric-card-value" style={{ color: '#D97706' }}>
                {data.assets.filter(a => a.status === 'in_corso').length}
              </div>
              <div className="metric-card-label">In Corso</div>
            </div>
            <div className="metric-card" style={{ background: '#F3F4F6' }}>
              <div className="metric-card-value" style={{ color: '#6B7280' }}>
                {data.assets.filter(a => a.status === 'da_consegnare').length}
              </div>
              <div className="metric-card-label">Da Consegnare</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// ASSETS TAB - ASSET PERFORMANCE DASHBOARD
// ============================================
function AssetsTab({ data, formatCurrency, formatDate, navigate }) {
  const [viewMode, setViewMode] = useState('performance'); // performance, inventory, delivery

  // Inventory assets and allocations
  const inventoryAssets = data.inventoryAssets || [];
  const inventoryAllocations = data.inventoryAllocations || [];

  // Contract-based assets (for delivery tracking)
  const contractAssets = data.contracts.flatMap(c =>
    (c.assets || []).map(a => ({
      ...a,
      contractId: c.id,
      contractName: c.nome_contratto || c.titolo,
      sponsorId: c.sponsor?.id || c.sponsor_id,
      sponsorName: c.sponsor?.ragione_sociale || c.sponsor_nome || 'Sponsor',
      contractStart: c.data_inizio,
      contractEnd: c.data_fine,
      contractValue: c.compenso || 0
    }))
  );

  // Calculate asset performance metrics
  const calculateAssetPerformance = () => {
    const assetPerformance = {};

    // Initialize with inventory assets
    inventoryAssets.forEach(asset => {
      assetPerformance[asset.id] = {
        id: asset.id,
        name: asset.nome || asset.name,
        category: asset.categoria || asset.category || 'Altro',
        listPrice: asset.prezzo_listino || asset.list_price || 0,
        totalRevenue: 0,
        allocationsCount: 0,
        allocations: [],
        seasons: {},
        occupancyDays: 0,
        availableDays: 365, // Default to 1 year
        avgPricePerAllocation: 0
      };
    });

    // Process allocations
    inventoryAllocations.forEach(alloc => {
      const assetId = alloc.asset_id || alloc.assetId;
      if (!assetPerformance[assetId]) {
        // Asset from allocation not in inventory, create entry
        assetPerformance[assetId] = {
          id: assetId,
          name: alloc.asset_name || alloc.assetName || `Asset #${assetId}`,
          category: alloc.asset_category || 'Altro',
          listPrice: 0,
          totalRevenue: 0,
          allocationsCount: 0,
          allocations: [],
          seasons: {},
          occupancyDays: 0,
          availableDays: 365
        };
      }

      const perf = assetPerformance[assetId];
      const price = alloc.prezzo || alloc.price || 0;
      const season = alloc.stagione || alloc.season || 'N/D';

      perf.totalRevenue += price;
      perf.allocationsCount += 1;
      perf.allocations.push(alloc);

      // Track by season
      if (!perf.seasons[season]) {
        perf.seasons[season] = { revenue: 0, count: 0 };
      }
      perf.seasons[season].revenue += price;
      perf.seasons[season].count += 1;

      // Calculate occupancy days
      if (alloc.data_inizio && alloc.data_fine) {
        const start = new Date(alloc.data_inizio);
        const end = new Date(alloc.data_fine);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        perf.occupancyDays += days;
      }
    });

    // Calculate averages and rates
    Object.values(assetPerformance).forEach(perf => {
      perf.avgPricePerAllocation = perf.allocationsCount > 0
        ? Math.round(perf.totalRevenue / perf.allocationsCount)
        : 0;
      perf.occupancyRate = perf.availableDays > 0
        ? Math.min(100, Math.round((perf.occupancyDays / perf.availableDays) * 100))
        : 0;
      perf.priceVariance = perf.listPrice > 0 && perf.avgPricePerAllocation > 0
        ? Math.round(((perf.avgPricePerAllocation - perf.listPrice) / perf.listPrice) * 100)
        : 0;
    });

    return Object.values(assetPerformance);
  };

  const assetPerformance = calculateAssetPerformance();

  // Overall KPIs
  const totalInventoryAssets = inventoryAssets.length;
  const totalRevenue = assetPerformance.reduce((sum, a) => sum + a.totalRevenue, 0);
  const totalAllocations = inventoryAllocations.length;
  const avgOccupancy = assetPerformance.length > 0
    ? Math.round(assetPerformance.reduce((sum, a) => sum + a.occupancyRate, 0) / assetPerformance.length)
    : 0;
  const allocatedAssets = assetPerformance.filter(a => a.allocationsCount > 0).length;

  // Top performers (by revenue)
  const topPerformers = [...assetPerformance]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Underperforming assets (low occupancy, has list price but low revenue)
  const underperformers = [...assetPerformance]
    .filter(a => a.listPrice > 0 && a.occupancyRate < 30)
    .sort((a, b) => a.occupancyRate - b.occupancyRate)
    .slice(0, 5);

  // Revenue by category
  const revenueByCategory = assetPerformance.reduce((acc, asset) => {
    const cat = asset.category;
    if (!acc[cat]) acc[cat] = { revenue: 0, count: 0, avgOccupancy: 0 };
    acc[cat].revenue += asset.totalRevenue;
    acc[cat].count += 1;
    acc[cat].avgOccupancy += asset.occupancyRate;
    return acc;
  }, {});

  const categoryPerformance = Object.entries(revenueByCategory)
    .map(([name, stats]) => ({
      name,
      revenue: stats.revenue,
      count: stats.count,
      avgOccupancy: stats.count > 0 ? Math.round(stats.avgOccupancy / stats.count) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Seasonal trend (last 4 seasons)
  const seasonalData = {};
  assetPerformance.forEach(asset => {
    Object.entries(asset.seasons).forEach(([season, stats]) => {
      if (!seasonalData[season]) seasonalData[season] = { revenue: 0, allocations: 0 };
      seasonalData[season].revenue += stats.revenue;
      seasonalData[season].allocations += stats.count;
    });
  });

  const seasonTrend = Object.entries(seasonalData)
    .map(([season, stats]) => ({ season, ...stats }))
    .sort((a, b) => b.season.localeCompare(a.season))
    .slice(0, 4)
    .reverse();

  // Contract delivery stats
  const deliveredAssets = contractAssets.filter(a => a.status === 'completato').length;
  const inProgressAssets = contractAssets.filter(a => a.status === 'in_corso').length;
  const pendingAssets = contractAssets.filter(a => a.status === 'da_consegnare').length;
  const deliveryRate = contractAssets.length > 0
    ? Math.round((deliveredAssets / contractAssets.length) * 100)
    : 0;

  const categoryColors = ['#85FF00', '#2563EB', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6'];

  const getOccupancyColor = (rate) => {
    if (rate >= 70) return '#22C55E';
    if (rate >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getVarianceStyle = (variance) => {
    if (variance > 0) return { color: '#22C55E', icon: <FaArrowUp style={{ fontSize: '10px' }} /> };
    if (variance < 0) return { color: '#EF4444', icon: <FaArrowDown style={{ fontSize: '10px' }} /> };
    return { color: '#6B7280', icon: <FaMinus style={{ fontSize: '10px' }} /> };
  };

  return (
    <>
      {/* View Mode Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        padding: '4px',
        background: '#F3F4F6',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { id: 'performance', label: 'Performance', icon: <FaChartLine /> },
          { id: 'inventory', label: 'Inventario', icon: <FaChartPie /> },
          { id: 'delivery', label: 'Consegne', icon: <FaCheckCircle /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: viewMode === tab.id ? '#1A1A1A' : 'transparent',
              color: viewMode === tab.id ? '#85FF00' : '#6B7280',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {viewMode === 'performance' && (
        <>
          {/* Performance KPIs */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Revenue Totale</div>
              <div className="tp-stat-value" style={{ color: '#85FF00' }}>{formatCurrency(totalRevenue)}</div>
              <div className="tp-stat-description">da {totalAllocations} allocazioni</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Occupazione Media</div>
              <div className="tp-stat-value" style={{ color: getOccupancyColor(avgOccupancy) }}>{avgOccupancy}%</div>
              <div className="tp-stat-description">{allocatedAssets}/{totalInventoryAssets} asset allocati</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Revenue/Asset</div>
              <div className="tp-stat-value">{formatCurrency(allocatedAssets > 0 ? Math.round(totalRevenue / allocatedAssets) : 0)}</div>
              <div className="tp-stat-description">media per asset allocato</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Asset Catalogo</div>
              <div className="tp-stat-value">{totalInventoryAssets}</div>
              <div className="tp-stat-description">{allocatedAssets} con allocazioni</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Tasso Consegna</div>
              <div className="tp-stat-value">{deliveryRate}%</div>
              <div className="tp-stat-description">{deliveredAssets}/{contractAssets.length} completati</div>
            </div>
          </div>

          <div className="charts-grid">
            {/* Top Performers */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">🏆 Top Performer</h3>
                <p className="chart-card-subtitle">Asset con maggiore revenue</p>
              </div>
              {topPerformers.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaTrophy /></div>
                  <p className="analytics-empty-text">Nessuna allocazione registrata</p>
                </div>
              ) : (
                <div className="stats-list">
                  {topPerformers.map((asset, idx) => {
                    const variance = getVarianceStyle(asset.priceVariance);
                    return (
                      <div key={asset.id} className="stats-list-item">
                        <div className="stats-list-item-info">
                          <div
                            className="stats-list-item-icon"
                            style={{
                              background: idx === 0 ? '#85FF0020' : '#F3F4F6',
                              color: idx === 0 ? '#85FF00' : '#6B7280',
                              fontWeight: '700',
                              fontSize: '14px'
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="stats-list-item-label">{asset.name}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {asset.category} · {asset.allocationsCount} allocazioni
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: '#1F2937' }}>{formatCurrency(asset.totalRevenue)}</div>
                          <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', color: variance.color }}>
                            {variance.icon} {Math.abs(asset.priceVariance)}% vs listino
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Occupancy by Asset */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">📊 Tasso Occupazione</h3>
                <p className="chart-card-subtitle">% tempo allocato per asset</p>
              </div>
              {assetPerformance.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaChartPie /></div>
                  <p className="analytics-empty-text">Nessun asset nel catalogo</p>
                </div>
              ) : (
                <div className="stats-list">
                  {[...assetPerformance]
                    .sort((a, b) => b.occupancyRate - a.occupancyRate)
                    .slice(0, 6)
                    .map((asset, idx) => (
                      <div key={asset.id} className="stats-list-item">
                        <div className="stats-list-item-info" style={{ flex: 1 }}>
                          <div>
                            <div className="stats-list-item-label">{asset.name}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{asset.category}</div>
                          </div>
                        </div>
                        <div className="progress-bar-wrapper" style={{ width: '50%' }}>
                          <div className="progress-bar" style={{ height: '8px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${asset.occupancyRate}%`,
                                background: getOccupancyColor(asset.occupancyRate)
                              }}
                            />
                          </div>
                          <div className="progress-bar-value" style={{ color: getOccupancyColor(asset.occupancyRate) }}>
                            {asset.occupancyRate}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="charts-grid">
            {/* Revenue by Category */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">💰 Revenue per Categoria</h3>
                <p className="chart-card-subtitle">Performance per tipologia asset</p>
              </div>
              {categoryPerformance.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaChartPie /></div>
                  <p className="analytics-empty-text">Nessun dato disponibile</p>
                </div>
              ) : (
                <div className="stats-list">
                  {categoryPerformance.slice(0, 6).map((cat, idx) => (
                    <div key={cat.name} className="stats-list-item">
                      <div className="stats-list-item-info">
                        <div
                          className="stats-list-item-icon"
                          style={{ background: categoryColors[idx % categoryColors.length] + '20', color: categoryColors[idx % categoryColors.length] }}
                        >
                          <FaChartPie />
                        </div>
                        <div>
                          <div className="stats-list-item-label">{cat.name}</div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {cat.count} asset · {cat.avgOccupancy}% occupazione
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', color: '#1F2937' }}>{formatCurrency(cat.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seasonal Trend */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">📈 Trend Stagionale</h3>
                <p className="chart-card-subtitle">Andamento revenue per stagione</p>
              </div>
              {seasonTrend.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaCalendarAlt /></div>
                  <p className="analytics-empty-text">Nessun dato stagionale</p>
                </div>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px', gap: '12px' }}>
                    {seasonTrend.map((s, idx) => {
                      const maxRevenue = Math.max(...seasonTrend.map(t => t.revenue));
                      const height = maxRevenue > 0 ? (s.revenue / maxRevenue) * 140 : 20;
                      return (
                        <div key={s.season} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '100%',
                            height: `${height}px`,
                            background: `linear-gradient(180deg, #85FF00 0%, #70E000 100%)`,
                            borderRadius: '8px 8px 0 0',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-28px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#1F2937',
                              whiteSpace: 'nowrap'
                            }}>
                              {formatCurrency(s.revenue)}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>{s.season}</div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{s.allocations} alloc.</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Underperformers Alert */}
          {underperformers.length > 0 && (
            <div className="chart-card" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
              <div className="chart-card-header">
                <h3 className="chart-card-title" style={{ color: '#92400E' }}>⚠️ Asset Sottoutilizzati</h3>
                <p className="chart-card-subtitle" style={{ color: '#B45309' }}>Asset con occupazione inferiore al 30%</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {underperformers.map(asset => (
                  <div key={asset.id} style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #FCD34D'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>{asset.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>{asset.category}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#EF4444', fontWeight: '500' }}>{asset.occupancyRate}% occupato</span>
                      <span style={{ color: '#6B7280' }}>{formatCurrency(asset.listPrice)} listino</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Asset Performance Table */}
          <div className="chart-card">
            <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="chart-card-title">📋 Performance Completa</h3>
                <p className="chart-card-subtitle">Dettaglio KPI per ogni asset</p>
              </div>
              <button
                onClick={() => navigate('/club/inventory')}
                style={{
                  padding: '8px 16px',
                  background: '#1A1A1A',
                  color: '#85FF00',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Vai al Catalogo →
              </button>
            </div>
            {assetPerformance.length === 0 ? (
              <div className="analytics-empty">
                <div className="analytics-empty-icon"><FaChartLine /></div>
                <p className="analytics-empty-text">Nessun asset nel catalogo</p>
                <button
                  onClick={() => navigate('/club/inventory/assets/new')}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    background: '#85FF00',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Crea Primo Asset
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Categoria</th>
                      <th style={{ textAlign: 'right' }}>Listino</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>Prezzo Medio</th>
                      <th style={{ textAlign: 'center' }}>Allocazioni</th>
                      <th style={{ textAlign: 'center' }}>Occupazione</th>
                      <th style={{ textAlign: 'center' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...assetPerformance]
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 15)
                      .map((asset, idx) => {
                        const variance = getVarianceStyle(asset.priceVariance);
                        return (
                          <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/club/inventory/assets/${asset.id}`)}>
                            <td>
                              <div style={{ fontWeight: '500' }}>{asset.name}</div>
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                                background: '#F3F4F6',
                                color: '#4B5563'
                              }}>
                                {asset.category}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: '#6B7280' }}>
                              {asset.listPrice > 0 ? formatCurrency(asset.listPrice) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '600', color: '#1F2937' }}>
                              {formatCurrency(asset.totalRevenue)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {asset.avgPricePerAllocation > 0 ? formatCurrency(asset.avgPricePerAllocation) : '-'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: asset.allocationsCount > 0 ? '#DBEAFE' : '#F3F4F6',
                                color: asset.allocationsCount > 0 ? '#2563EB' : '#9CA3AF'
                              }}>
                                {asset.allocationsCount}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <div style={{
                                  width: '50px',
                                  height: '6px',
                                  background: '#E5E7EB',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${asset.occupancyRate}%`,
                                    height: '100%',
                                    background: getOccupancyColor(asset.occupancyRate),
                                    borderRadius: '3px'
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  color: getOccupancyColor(asset.occupancyRate)
                                }}>
                                  {asset.occupancyRate}%
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {asset.priceVariance !== 0 ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: variance.color,
                                  fontWeight: '500',
                                  fontSize: '12px'
                                }}>
                                  {variance.icon} {Math.abs(asset.priceVariance)}%
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {viewMode === 'inventory' && (
        <>
          {/* Inventory Stats */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Asset Totali</div>
              <div className="tp-stat-value">{totalInventoryAssets}</div>
              <div className="tp-stat-description">nel catalogo</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Valore Listino</div>
              <div className="tp-stat-value">{formatCurrency(inventoryAssets.reduce((sum, a) => sum + (a.prezzo_listino || 0), 0))}</div>
              <div className="tp-stat-description">potenziale totale</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Categorie</div>
              <div className="tp-stat-value">{categoryPerformance.length}</div>
              <div className="tp-stat-description">tipologie asset</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Mai Allocati</div>
              <div className="tp-stat-value">{assetPerformance.filter(a => a.allocationsCount === 0).length}</div>
              <div className="tp-stat-description">opportunità perse</div>
            </div>
          </div>

          <div className="charts-grid">
            {/* Assets by Category Pie */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Distribuzione per Categoria</h3>
                <p className="chart-card-subtitle">Composizione catalogo</p>
              </div>
              {categoryPerformance.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaChartPie /></div>
                  <p className="analytics-empty-text">Nessun asset presente</p>
                </div>
              ) : (
                <SimplePieChart
                  data={categoryPerformance.map(c => ({ name: c.name, value: c.count }))}
                  colors={categoryColors}
                  total={totalInventoryAssets}
                />
              )}
            </div>

            {/* Inventory List */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Asset per Categoria</h3>
                <p className="chart-card-subtitle">Conteggio e valore per tipologia</p>
              </div>
              <div className="stats-list">
                {categoryPerformance.slice(0, 6).map((cat, idx) => (
                  <div key={cat.name} className="stats-list-item">
                    <div className="stats-list-item-info">
                      <div
                        className="stats-list-item-icon"
                        style={{ background: categoryColors[idx % categoryColors.length] + '20', color: categoryColors[idx % categoryColors.length] }}
                      >
                        <FaChartPie />
                      </div>
                      <div>
                        <div className="stats-list-item-label">{cat.name}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{cat.count} asset</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#1F2937' }}>{formatCurrency(cat.revenue)}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>revenue totale</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Inventory Table */}
          <div className="chart-card">
            <div className="chart-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="chart-card-title">Catalogo Completo</h3>
                <p className="chart-card-subtitle">Tutti gli asset disponibili</p>
              </div>
              <button
                onClick={() => navigate('/club/inventory/assets/new')}
                style={{
                  padding: '8px 16px',
                  background: '#85FF00',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                + Nuovo Asset
              </button>
            </div>
            {inventoryAssets.length === 0 ? (
              <div className="analytics-empty">
                <div className="analytics-empty-icon"><FaCheckCircle /></div>
                <p className="analytics-empty-text">Nessun asset nel catalogo</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Prezzo Listino</th>
                    <th style={{ textAlign: 'center' }}>Stato</th>
                    <th style={{ textAlign: 'center' }}>Allocazioni</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryAssets.slice(0, 15).map((asset, idx) => {
                    const perf = assetPerformance.find(a => a.id === asset.id) || { allocationsCount: 0 };
                    return (
                      <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/club/inventory/assets/${asset.id}`)}>
                        <td style={{ fontWeight: '500' }}>{asset.nome || asset.name}</td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#F3F4F6',
                            color: '#4B5563'
                          }}>
                            {asset.categoria || asset.category || 'N/D'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(asset.prezzo_listino || asset.list_price || 0)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: asset.disponibile !== false ? '#D1FAE5' : '#FEE2E2',
                            color: asset.disponibile !== false ? '#059669' : '#DC2626'
                          }}>
                            {asset.disponibile !== false ? 'Disponibile' : 'Non Disponibile'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: perf.allocationsCount > 0 ? '#DBEAFE' : '#F3F4F6',
                            color: perf.allocationsCount > 0 ? '#2563EB' : '#9CA3AF'
                          }}>
                            {perf.allocationsCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {viewMode === 'delivery' && (
        <>
          {/* Delivery Stats */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Asset Contratti</div>
              <div className="tp-stat-value">{contractAssets.length}</div>
              <div className="tp-stat-description">da {data.contracts.length} contratti</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Completati</div>
              <div className="tp-stat-value" style={{ color: '#22C55E' }}>{deliveredAssets}</div>
              <div className="tp-stat-description">consegnati</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">In Corso</div>
              <div className="tp-stat-value" style={{ color: '#3B82F6' }}>{inProgressAssets}</div>
              <div className="tp-stat-description">in lavorazione</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Da Consegnare</div>
              <div className="tp-stat-value" style={{ color: '#F59E0B' }}>{pendingAssets}</div>
              <div className="tp-stat-description">in attesa</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Tasso Consegna</div>
              <div className="tp-stat-value">{deliveryRate}%</div>
              <div className="tp-stat-description">completamento</div>
            </div>
          </div>

          <div className="charts-grid">
            {/* Delivery Status Pie */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Stato Consegne</h3>
                <p className="chart-card-subtitle">Avanzamento delivery</p>
              </div>
              {contractAssets.length === 0 ? (
                <div className="analytics-empty">
                  <div className="analytics-empty-icon"><FaCheckCircle /></div>
                  <p className="analytics-empty-text">Nessun asset nei contratti</p>
                </div>
              ) : (
                <SimplePieChart
                  data={[
                    { name: 'Completati', value: deliveredAssets },
                    { name: 'In Corso', value: inProgressAssets },
                    { name: 'Da Consegnare', value: pendingAssets }
                  ].filter(s => s.value > 0)}
                  colors={['#22C55E', '#3B82F6', '#F59E0B']}
                  total={contractAssets.length}
                />
              )}
            </div>

            {/* Delivery by Sponsor */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Consegne per Sponsor</h3>
                <p className="chart-card-subtitle">Avanzamento per partner</p>
              </div>
              {(() => {
                const sponsorDelivery = data.contracts.reduce((acc, c) => {
                  if (c.assets && c.assets.length > 0) {
                    const name = c.sponsor?.ragione_sociale || c.sponsor_nome || 'Sponsor';
                    if (!acc[name]) acc[name] = { total: 0, completed: 0 };
                    c.assets.forEach(a => {
                      acc[name].total += 1;
                      if (a.status === 'completato') acc[name].completed += 1;
                    });
                  }
                  return acc;
                }, {});
                const sponsorList = Object.entries(sponsorDelivery)
                  .map(([name, stats]) => ({ name, ...stats, rate: Math.round((stats.completed / stats.total) * 100) }))
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 6);

                return sponsorList.length === 0 ? (
                  <div className="analytics-empty">
                    <div className="analytics-empty-icon"><FaUsers /></div>
                    <p className="analytics-empty-text">Nessun asset presente</p>
                  </div>
                ) : (
                  <div className="stats-list">
                    {sponsorList.map((sponsor, idx) => (
                      <div key={sponsor.name} className="stats-list-item">
                        <div className="stats-list-item-info">
                          <div
                            className="stats-list-item-icon"
                            style={{ background: '#DBEAFE', color: '#2563EB' }}
                          >
                            <FaHandshake />
                          </div>
                          <div>
                            <div className="stats-list-item-label">{sponsor.name}</div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {sponsor.completed}/{sponsor.total} completati
                            </div>
                          </div>
                        </div>
                        <div className="progress-bar-wrapper" style={{ width: '35%' }}>
                          <div className="progress-bar">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${sponsor.rate}%`,
                                background: sponsor.rate === 100 ? '#22C55E' : '#3B82F6'
                              }}
                            />
                          </div>
                          <div className="progress-bar-value">{sponsor.rate}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Contract Assets Table */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Asset da Contratti</h3>
              <p className="chart-card-subtitle">Elenco completo con stato consegna</p>
            </div>
            {contractAssets.length === 0 ? (
              <div className="analytics-empty">
                <div className="analytics-empty-icon"><FaCheckCircle /></div>
                <p className="analytics-empty-text">Nessun asset presente nei contratti</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Categoria</th>
                    <th>Sponsor</th>
                    <th style={{ textAlign: 'right' }}>Valore</th>
                    <th style={{ textAlign: 'center' }}>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {contractAssets.slice(0, 15).map((asset, idx) => {
                    const statusColors = {
                      'completato': { bg: '#D1FAE5', text: '#059669' },
                      'in_corso': { bg: '#DBEAFE', text: '#2563EB' },
                      'da_consegnare': { bg: '#FEF3C7', text: '#D97706' }
                    };
                    const statusLabels = {
                      'completato': 'Completato',
                      'in_corso': 'In Corso',
                      'da_consegnare': 'Da Consegnare'
                    };
                    const style = statusColors[asset.status] || { bg: '#F3F4F6', text: '#6B7280' };
                    return (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => navigate(`/club/contracts/${asset.contractId}`)}>
                        <td>
                          <div style={{ fontWeight: '500' }}>{asset.nome}</div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{asset.contractName}</div>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#F3F4F6',
                            color: '#4B5563'
                          }}>
                            {asset.categoria || 'N/D'}
                          </span>
                        </td>
                        <td>{asset.sponsorName}</td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>
                          {asset.valore ? formatCurrency(asset.valore) : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: style.bg,
                            color: style.text
                          }}>
                            {statusLabels[asset.status] || asset.status || 'N/D'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ============================================
// ENGAGEMENT TAB
// ============================================
function EngagementTab({ data, formatDate, navigate }) {
  return (
    <>
      {/* Quick Stats */}
      <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Messaggi Non Letti</div>
          <div className="tp-stat-value">{data.messagesStats.unread}</div>
          <div className="tp-stat-description">Da leggere</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Conversazioni</div>
          <div className="tp-stat-value">{data.messagesStats.conversations}</div>
          <div className="tp-stat-description">Chat attive</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Pubblicazioni Press</div>
          <div className="tp-stat-value">{data.pressStats.total}</div>
          <div className="tp-stat-description">Articoli</div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Visualizzazioni</div>
          <div className="tp-stat-value">{data.pressStats.totalViews}</div>
          <div className="tp-stat-description">Totali</div>
        </div>
      </div>

      <div className="charts-grid-equal">
        {/* Messages Overview */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Messaggi</h3>
            <p className="chart-card-subtitle">Comunicazioni con gli sponsor</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="metric-card" style={{ background: '#FCE7F3' }}>
              <div className="metric-card-value" style={{ color: '#DB2777' }}>{data.messagesStats.unread}</div>
              <div className="metric-card-label">Non Letti</div>
            </div>
            <div className="metric-card" style={{ background: '#DBEAFE' }}>
              <div className="metric-card-value" style={{ color: '#2563EB' }}>{data.messagesStats.conversations}</div>
              <div className="metric-card-label">Conversazioni</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/messages')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1A1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Apri Messaggi
          </button>
        </div>

        {/* Press Overview */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Press Area</h3>
            <p className="chart-card-subtitle">Pubblicazioni e comunicati</p>
          </div>
          <div className="stats-list">
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#D1FAE5', color: '#059669' }}>
                  <FaNewspaper />
                </div>
                <div className="stats-list-item-label">Pubblicazioni Totali</div>
              </div>
              <div className="stats-list-item-value">{data.pressStats.total}</div>
            </div>
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <FaCalendarAlt />
                </div>
                <div className="stats-list-item-label">Ultimi 30 Giorni</div>
              </div>
              <div className="stats-list-item-value">{data.pressStats.last30Days}</div>
            </div>
            <div className="stats-list-item">
              <div className="stats-list-item-info">
                <div className="stats-list-item-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                  <FaChartLine />
                </div>
                <div className="stats-list-item-label">Visualizzazioni</div>
              </div>
              <div className="stats-list-item-value">{data.pressStats.totalViews}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-card-title">Attività Recenti</h3>
        </div>
        {data.activities.length === 0 ? (
          <div className="analytics-empty">
            <div className="analytics-empty-icon"><FaClock /></div>
            <p className="analytics-empty-text">Nessuna attività recente</p>
          </div>
        ) : (
          <div className="activity-timeline">
            {data.activities.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className={`activity-icon ${activity.icon}`}>
                  {activity.type === 'sponsor' && <FaUserPlus />}
                  {activity.type === 'contract' && <FaFileContract />}
                  {activity.type === 'lead' && <FaBullseye />}
                  {activity.type === 'message' && <FaEnvelope />}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">{activity.description}</div>
                </div>
                <div className="activity-time">{formatDate(activity.date)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// SIMPLE CHART COMPONENTS (CSS-based)
// ============================================
function SimpleBarChart({ data, color, formatValue }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;
  const [hoveredBar, setHoveredBar] = useState(null);

  const formatDisplayValue = (val) => {
    if (formatValue) return formatValue(val);
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Bars area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        gap: '8px',
        paddingBottom: '8px'
      }}>
        {data.map((item, idx) => {
          const barHeight = Math.max(8, (item.value / maxValue) * chartHeight);
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                maxWidth: '40px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              {hoveredBar === idx && (
                <div style={{
                  position: 'absolute',
                  bottom: `${barHeight + 8}px`,
                  background: '#2563EB',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {formatDisplayValue(item.value)}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #2563EB'
                  }} />
                </div>
              )}
              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: hoveredBar === idx ? '#3B82F6' : '#2563EB',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels area */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        gap: '8px',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '12px'
      }}>
        {data.map((item, idx) => (
          <span
            key={idx}
            style={{
              flex: 1,
              maxWidth: '40px',
              fontSize: '11px',
              color: '#9CA3AF',
              textAlign: 'center',
              textTransform: 'capitalize'
            }}
          >
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimplePieChart({ data, colors, total }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Calculate pie slices using conic-gradient
  let currentAngle = 0;
  const slices = data.slice(0, 6).map((item, idx) => {
    const percentage = (item.value / total) * 100;
    const startAngle = currentAngle;
    currentAngle += percentage * 3.6; // Convert to degrees
    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: colors[idx]
    };
  });

  // Build conic-gradient string
  let gradientParts = [];
  slices.forEach((slice, idx) => {
    gradientParts.push(`${slice.color} ${slice.startAngle}deg ${slice.endAngle}deg`);
  });
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px' }}>
      {/* Pie Chart */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: gradient,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        />
        {/* Center hole for donut effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937' }}>{total}</div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>Totale</div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {slices.map((slice, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: hoveredSlice === idx ? '#F3F4F6' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={() => setHoveredSlice(idx)}
            onMouseLeave={() => setHoveredSlice(null)}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: slice.color,
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{slice.name}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>{slice.value}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>({slice.percentage.toFixed(0)}%)</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleAreaChart({ data, color }) {
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 180;
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chart area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        gap: '8px',
        paddingBottom: '8px'
      }}>
        {data.map((item, idx) => {
          const barHeight = Math.max(8, (item.count / maxValue) * chartHeight);
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                maxWidth: '40px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip */}
              {hoveredBar === idx && (
                <div style={{
                  position: 'absolute',
                  bottom: `${barHeight + 8}px`,
                  background: '#2563EB',
                  color: '#fff',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {item.count} sponsor
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid #2563EB'
                  }} />
                </div>
              )}
              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: hoveredBar === idx ? '#3B82F6' : '#2563EB',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels area */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        gap: '8px',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '12px'
      }}>
        {data.map((item, idx) => (
          <span
            key={idx}
            style={{
              flex: 1,
              maxWidth: '40px',
              fontSize: '11px',
              color: '#9CA3AF',
              textAlign: 'center',
              textTransform: 'capitalize'
            }}
          >
            {item.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimpleDonutChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#85FF00', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  if (total === 0) {
    return (
      <div
        style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>0</span>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>Totale</span>
        </div>
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments = data.slice(0, 5).map((item, idx) => {
    const percent = (item.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { ...item, percent, startPercent, color: colors[idx] };
  });

  const gradient = segments.map(s =>
    `${s.color} ${s.startPercent}% ${s.startPercent + s.percent}%`
  ).join(', ');

  return (
    <div
      style={{
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: `conic-gradient(${gradient})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>{total}</span>
        <span style={{ fontSize: '11px', color: '#6B7280' }}>Totale</span>
      </div>
    </div>
  );
}

export default ClubAnalytics;
