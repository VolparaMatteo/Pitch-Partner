import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import {
  HiOutlineCursorArrowRays,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineWallet,
  HiOutlineBell,
  HiOutlineEnvelope,
  HiOutlineNewspaper,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays
} from 'react-icons/hi2';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// --- Constants ---

const STAGE_COLORS = {
  nuovo: '#6B7280', contattato: '#3B82F6', qualificato: '#8B5CF6',
  demo: '#F59E0B', proposta: '#F97316', negoziazione: '#EC4899',
  vinto: '#059669', perso: '#DC2626'
};

const STAGE_LABELS = {
  nuovo: 'Nuovo', contattato: 'Contattato', qualificato: 'Qualificato',
  demo: 'Demo', proposta: 'Proposta', negoziazione: 'Negoziazione',
  vinto: 'Vinto', perso: 'Perso'
};

const ACTIVE_STAGES = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione'];

const ENTITY_STYLES = {
  lead: { color: '#F59E0B', bg: '#FFFBEB', icon: HiOutlineCursorArrowRays },
  club: { color: '#8B5CF6', bg: '#F5F3FF', icon: HiOutlineUserGroup },
  contract: { color: '#3B82F6', bg: '#EFF6FF', icon: HiOutlineDocumentText },
  invoice: { color: '#059669', bg: '#ECFDF5', icon: HiOutlineBanknotes },
  email: { color: '#6366F1', bg: '#EEF2FF', icon: HiOutlineEnvelope }
};

const NOTIFICATION_TYPE_LABELS = {
  contratto_scadenza: 'Contratti in scadenza', fattura_scaduta: 'Fatture scadute',
  lead_followup: 'Follow-up lead', lead_inattivo: 'Lead inattivi',
  rinnovo: 'Rinnovi', pagamento: 'Pagamenti'
};

// --- Helpers ---

const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);

const timeAgo = (isoDate) => {
  if (!isoDate) return '';
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'ora';
  if (diffMin < 60) return `${diffMin} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return 'ieri';
  if (diffDays < 30) return `${diffDays} giorni fa`;
  return date.toLocaleDateString('it-IT');
};

const formatActivity = (activity) => {
  const azione = activity.azione || activity.action || '';
  const nome = activity.entita_nome || activity.entity_name || '';
  const entita = activity.entita_tipo || activity.entity_type || '';
  if (nome) return `${azione} - ${nome}`;
  if (entita) return `${azione} (${entita})`;
  return azione;
};

// --- Component ---

function AdminDashboard() {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [finance, setFinance] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [emailCounts, setEmailCounts] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [calendarStats, setCalendarStats] = useState(null);
  const [activities, setActivities] = useState([]);

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const headers = useMemo(() => ({ 'Authorization': `Bearer ${token}` }), [token]);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const currentYear = new Date().getFullYear();
      const [dashRes, pipeRes, contractRes, finRes, notifRes, emailRes, taskRes, calRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/leads/pipeline`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/contracts/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/finance/dashboard?year=${currentYear}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/notifications/summary`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/email/unread-counts`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/tasks/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/calendar/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (dashRes) { setKpis(dashRes); setActivities(dashRes.recent_activities || []); }
      if (pipeRes) setPipeline(pipeRes);
      if (contractRes) setContracts(contractRes);
      if (finRes) setFinance(finRes);
      if (notifRes) setNotifications(notifRes);
      if (emailRes) setEmailCounts(emailRes);
      if (taskRes) setTaskStats(taskRes);
      if (calRes) setCalendarStats(calRes);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, headers]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);
  useEffect(() => {
    const interval = setInterval(() => fetchAllData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Derived values
  const mrr = finance?.arr?.mrr || kpis?.mrr || 0;
  const arr = finance?.arr?.arr || kpis?.arr || 0;
  const activeClubs = kpis?.active_clubs ?? kpis?.clubs ?? 0;
  const totalClubs = kpis?.total_clubs ?? kpis?.clubs ?? 0;
  const totalLeads = pipeline?.stats?.total_leads ?? kpis?.leads ?? 0;
  const hotLeads = pipeline?.stats?.hot_leads ?? kpis?.hot_leads ?? 0;
  const wonMonth = pipeline?.stats?.won_month ?? 0;
  const lostMonth = pipeline?.stats?.lost_month ?? 0;
  const activeContracts = contracts?.active_contracts ?? kpis?.contratti ?? 0;
  const unreadNotifications = notifications?.non_lette ?? 0;
  const expiringContracts = contracts?.expiring_soon?.length ?? contracts?.expiring_soon ?? 0;
  const overdueInvoices = finance?.pending?.overdue ?? 0;
  const totalEmailUnread = emailCounts?.counts
    ? Object.values(emailCounts.counts).reduce((sum, c) => sum + (c || 0), 0) : 0;
  const cashInMonth = finance?.cash_in?.this_month ?? 0;
  const pendingTotal = finance?.pending?.total ?? 0;
  const taskScaduti = taskStats?.scaduti ?? 0;
  const taskDaFare = taskStats?.da_fare ?? 0;
  const demoOggi = calendarStats?.appuntamenti_oggi ?? 0;

  const pipelineStages = useMemo(() => {
    if (!pipeline?.pipeline) return [];
    return ACTIVE_STAGES.map(stage => {
      const d = pipeline.pipeline.find(s => s.stage === stage) || {};
      return { stage, count: d.count || 0, value: d.value || 0 };
    });
  }, [pipeline]);
  const maxPipelineCount = Math.max(...pipelineStages.map(s => s.count), 1);

  const notifByType = notifications?.per_tipo || {};
  const notifByPriority = notifications?.per_priorita || {};

  const sections = [
    { label: 'Lead', path: '/admin/leads', icon: HiOutlineCursorArrowRays, color: '#F59E0B', badge: totalLeads },
    { label: 'Club', path: '/admin/clubs', icon: HiOutlineUserGroup, color: '#8B5CF6', badge: activeClubs },
    { label: 'Contratti', path: '/admin/contratti', icon: HiOutlineDocumentText, color: '#3B82F6', badge: activeContracts },
    { label: 'Finanze', path: '/admin/finanze', icon: HiOutlineWallet, color: '#059669', badge: pendingTotal ? formatCurrency(pendingTotal) : null },
    { label: 'Email', path: '/admin/email', icon: HiOutlineEnvelope, color: '#6366F1', badge: totalEmailUnread || null },
    { label: 'Newsletter', path: '/admin/newsletter', icon: HiOutlineNewspaper, color: '#06B6D4', badge: null },
    { label: 'Task', path: '/admin/tasks', icon: HiOutlineClipboardDocumentList, color: '#8B5CF6', badge: taskDaFare || null },
    { label: 'Calendario', path: '/admin/calendario', icon: HiOutlineCalendarDays, color: '#6366F1', badge: demoOggi || null },
  ];

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading" style={{ minHeight: '60vh' }}>
          <div className="tp-spinner"></div>
          <span>Caricamento Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">

      {/* === SECTION 1: Page Header (tp-page-header pattern) === */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title" style={{ textTransform: 'capitalize' }}>
            Benvenuto, {user?.full_name || 'Admin'}
          </h1>
          <p className="tp-page-subtitle" style={{ textTransform: 'capitalize' }}>
            {today} &middot; Ecco il riepilogo della tua attivita
          </p>
        </div>
        <div className="tp-page-actions">
          <button className="tp-btn tp-btn-sm" onClick={() => navigate('/admin/leads?action=new')}
            style={{ background: '#F59E0B', color: '#fff', border: 'none' }}>
            <HiOutlinePlusCircle size={15} /> Nuovo Lead
          </button>
          <button className="tp-btn tp-btn-sm" onClick={() => navigate('/admin/email')}
            style={{ background: '#3B82F6', color: '#fff', border: 'none' }}>
            <HiOutlineEnvelope size={15} /> Nuova Email
          </button>
          <button className="tp-btn tp-btn-sm" onClick={() => navigate('/admin/clubs?action=new')}
            style={{ background: '#8B5CF6', color: '#fff', border: 'none' }}>
            <HiOutlineBuildingOffice2 size={15} /> Nuovo Club
          </button>
          <button className="tp-btn tp-btn-outline tp-btn-sm" onClick={() => fetchAllData(true)}
            title="Aggiorna dati" style={{ padding: '0 10px' }}>
            <HiOutlineArrowPath size={16} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* === SECTION 2: KPI Stat Cards (tp-stats-row pattern) === */}
      <div className="tp-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* MRR */}
        <div className="tp-stat-card">
          <div className="tp-stat-icon green">
            <HiOutlineBanknotes size={22} />
          </div>
          <div className="tp-stat-info">
            <div className="tp-stat-label">Revenue MRR</div>
            <div className="tp-stat-value" style={{ fontSize: 24, color: '#059669' }}>{formatCurrency(mrr)}</div>
            <div className="tp-stat-description">ARR: {formatCurrency(arr)}</div>
          </div>
        </div>

        {/* Club Attivi */}
        <div className="tp-stat-card">
          <div className="tp-stat-icon purple">
            <HiOutlineUserGroup size={22} />
          </div>
          <div className="tp-stat-info">
            <div className="tp-stat-label">Club Attivi</div>
            <div className="tp-stat-value" style={{ fontSize: 24, color: '#7C3AED' }}>{activeClubs}</div>
            <div className="tp-stat-description">su {totalClubs} totali</div>
          </div>
        </div>

        {/* Lead Pipeline */}
        <div className="tp-stat-card">
          <div className="tp-stat-icon orange">
            <HiOutlineCursorArrowRays size={22} />
          </div>
          <div className="tp-stat-info">
            <div className="tp-stat-label">Lead Pipeline</div>
            <div className="tp-stat-value" style={{ fontSize: 24, color: '#EA580C' }}>{totalLeads}</div>
            <div className="tp-stat-description">{hotLeads} hot, {wonMonth} vinti questo mese</div>
          </div>
        </div>

      </div>

      {/* === SECTION 3: Alert Bar (tp-stat-card-dark pattern) === */}
      <div className="tp-stat-card-dark" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
        <AlertBadge icon={<HiOutlineBell size={18} />} label="Notifiche non lette"
          count={unreadNotifications} badgeColor="#DC2626" onClick={() => navigate('/admin/notifiche')} />
        <AlertBadge icon={<HiOutlineDocumentText size={18} />} label="Contratti in scadenza"
          count={expiringContracts} badgeColor="#F97316" onClick={() => navigate('/admin/contratti')} />
        <AlertBadge icon={<HiOutlineExclamationTriangle size={18} />} label="Fatture scadute"
          count={overdueInvoices} badgeColor="#DC2626" onClick={() => navigate('/admin/finanze')} />
        <AlertBadge icon={<HiOutlineEnvelope size={18} />} label="Email non lette"
          count={totalEmailUnread} badgeColor="#6366F1" onClick={() => navigate('/admin/email')} />
        <AlertBadge icon={<HiOutlineClipboardDocumentList size={18} />} label="Task scaduti"
          count={taskScaduti} badgeColor="#DC2626" onClick={() => navigate('/admin/tasks')} />
        <AlertBadge icon={<HiOutlineCalendarDays size={18} />} label="Demo oggi"
          count={demoOggi} badgeColor="#F59E0B" onClick={() => navigate('/admin/calendario')} />
      </div>

      {/* === SECTION 4: Two-Column Content === */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 4a: Pipeline Lead (tp-card) */}
          <div className="tp-card">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="tp-card-title">Pipeline Lead</h3>
              <p className="tp-card-subtitle">Distribuzione lead per fase</p>
            </div>
            <div className="tp-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pipelineStages.map(({ stage, count }) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 90, fontSize: 13, color: '#4B5563', fontWeight: 500, flexShrink: 0 }}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 6, height: 26, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max((count / maxPipelineCount) * 100, count > 0 ? 6 : 0)}%`,
                        height: '100%', background: STAGE_COLORS[stage], borderRadius: 6,
                        transition: 'width 0.5s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8
                      }}>
                        {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{count}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 13, fontWeight: 600 }}>
                <span className="tp-badge tp-badge-success" style={{ gap: 4 }}>Vinti: {wonMonth}</span>
                <span className="tp-badge tp-badge-danger" style={{ gap: 4 }}>Persi: {lostMonth}</span>
              </div>
            </div>
          </div>

          {/* 4b: Revenue Overview (tp-card) */}
          <div className="tp-card">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="tp-card-title">Panoramica Revenue</h3>
              <p className="tp-card-subtitle">Situazione finanziaria del mese</p>
            </div>
            <div className="tp-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '18px 14px', textAlign: 'center', border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, marginBottom: 6 }}>Incassato mese</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{formatCurrency(cashInMonth)}</div>
                </div>
                <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '18px 14px', textAlign: 'center', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginBottom: 6 }}>Da incassare</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#D97706' }}>{formatCurrency(pendingTotal)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 4c: Recent Activities (tp-card + tp-alert-list pattern) */}
          <div className="tp-card">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <h3 className="tp-card-title">Attivita Recenti</h3>
            </div>
            <div className="tp-card-body" style={{ padding: activities.length === 0 ? 24 : '12px 16px' }}>
              {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
                  Nessuna attivita recente
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {activities.slice(0, 8).map((act, idx) => {
                    const entita = act.entita_tipo || act.entity_type || 'lead';
                    const es = ENTITY_STYLES[entita] || ENTITY_STYLES.lead;
                    const Icon = es.icon;
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 8px', borderRadius: 8,
                        borderBottom: idx < Math.min(activities.length, 8) - 1 ? '1px solid #F3F4F6' : 'none',
                        transition: 'background 0.1s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: es.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Icon size={15} style={{ color: es.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, color: '#1F2937', fontWeight: 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {formatActivity(act)}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                          {timeAgo(act.created_at || act.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4d: Notifications Summary (tp-card) */}
          <div className="tp-card">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="tp-card-title" style={{ margin: 0 }}>Notifiche</h3>
              <button className="tp-btn tp-btn-sm tp-btn-outline" onClick={() => navigate('/admin/notifiche')}
                style={{ height: 32, fontSize: 12 }}>
                Vedi tutte
              </button>
            </div>
            <div className="tp-card-body">
              {/* Priority badges */}
              {notifByPriority.urgente > 0 && (
                <div className="tp-badge tp-badge-danger" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
                  {notifByPriority.urgente} urgenti
                </div>
              )}
              {notifByPriority.alta > 0 && (
                <div className="tp-badge tp-badge-warning" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
                  {notifByPriority.alta} alta priorita
                </div>
              )}

              {/* Type breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {Object.entries(notifByType).map(([tipo, count]) => (
                  count > 0 && (
                    <div key={tipo} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: '1px solid #F3F4F6'
                    }}>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>
                        {NOTIFICATION_TYPE_LABELS[tipo] || tipo}
                      </span>
                      <span className="tp-badge tp-badge-neutral" style={{ padding: '2px 10px', fontSize: 12 }}>
                        {count}
                      </span>
                    </div>
                  )
                ))}
                {Object.keys(notifByType).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#9CA3AF', fontSize: 13 }}>
                    Nessuna notifica
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 5: Quick Navigation (tp-stat-card pattern with badges) === */}
      <div className="tp-stats-grid">
        {sections.map((s) => (
          <div key={s.path} className="tp-stat-card" onClick={() => navigate(s.path)}
            style={{ cursor: 'pointer' }}>
            <div className="tp-stat-icon" style={{ background: `${s.color}18`, color: s.color }}>
              <s.icon size={22} />
            </div>
            <div className="tp-stat-info" style={{ flex: 1 }}>
              <div className="tp-stat-label" style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>{s.label}</div>
            </div>
            {s.badge != null && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: s.color,
                background: `${s.color}15`, padding: '4px 12px', borderRadius: 20
              }}>
                {s.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Responsive override for two-column layout */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 900px) {
          .tp-page-container > div:nth-of-type(4) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- Sub-components ---

function AlertBadge({ icon, label, count, badgeColor, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 10px',
      borderRadius: 8, transition: 'background 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{label}</span>
      <span style={{
        minWidth: 24, height: 24, borderRadius: 12,
        background: count > 0 ? badgeColor : 'rgba(255,255,255,0.15)',
        color: '#fff', fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 7px'
      }}>
        {count}
      </span>
    </button>
  );
}

export default AdminDashboard;
