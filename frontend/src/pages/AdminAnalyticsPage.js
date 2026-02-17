import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import {
  HiOutlineChartBarSquare,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineCursorArrowRays,
  HiOutlineClipboardDocumentList,
  HiOutlineMegaphone,
  HiOutlineCalendarDays,
  HiOutlineBolt,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBellAlert,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlineSignal,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineFunnel,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2
} from 'react-icons/hi2';
import '../styles/template-style.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// ─── Helpers ───────────────────────────────────────────────

const fmt = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const fmtN = (v) => new Intl.NumberFormat('it-IT').format(v || 0);
const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

const STAGE_LABELS = { nuovo: 'Nuovo', contattato: 'Contattato', qualificato: 'Qualificato', demo_schedulata: 'Demo', proposta_inviata: 'Proposta', in_trattativa: 'Trattativa', vinto: 'Vinto', perso: 'Perso' };
const STAGE_COLORS = { nuovo: '#6B7280', contattato: '#3B82F6', qualificato: '#8B5CF6', demo_schedulata: '#F59E0B', proposta_inviata: '#F97316', in_trattativa: '#EC4899', vinto: '#059669', perso: '#DC2626' };
const FUNNEL_ORDER = ['nuovo', 'contattato', 'qualificato', 'demo_schedulata', 'proposta_inviata', 'in_trattativa', 'vinto'];
const PRIORITY_COLORS = { bassa: '#6B7280', media: '#3B82F6', alta: '#F59E0B', urgente: '#DC2626' };
const PRIORITY_LABELS = { bassa: 'Bassa', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
const TASK_TYPE_LABELS = { generale: 'Generale', lead_followup: 'Follow-up', club_onboarding: 'Onboarding', rinnovo_contratto: 'Rinnovo', fattura: 'Fattura', supporto: 'Supporto' };
const PLAN_COLORS = { basic: '#6B7280', premium: '#3B82F6', elite: '#8B5CF6', kickoff: '#F59E0B' };
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const NOTIF_TYPE_LABELS = { contratto_scadenza: 'Contratti in Scadenza', fattura_scaduta: 'Fatture Scadute', nuovo_club: 'Nuovi Club', lead_followup: 'Follow-up Lead', licenza_scadenza: 'Licenze in Scadenza' };
const NOTIF_TYPE_COLORS = { contratto_scadenza: '#F59E0B', fattura_scaduta: '#DC2626', nuovo_club: '#059669', lead_followup: '#3B82F6', licenza_scadenza: '#F97316' };

const TABS = [
  { id: 'panoramica', label: 'Panoramica', icon: HiOutlineChartBarSquare },
  { id: 'revenue', label: 'Revenue', icon: HiOutlineBanknotes },
  { id: 'crm', label: 'CRM', icon: HiOutlineCursorArrowRays },
  { id: 'operativo', label: 'Operativo', icon: HiOutlineClipboardDocumentList },
  { id: 'comunicazioni', label: 'Comunicazioni', icon: HiOutlineMegaphone },
];

const timeAgo = (d) => {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), dd = Math.floor(ms / 86400000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m} min fa`;
  if (h < 24) return `${h}h fa`;
  if (dd === 1) return 'ieri';
  if (dd < 30) return `${dd}g fa`;
  return new Date(d).toLocaleDateString('it-IT');
};

const ACTIVITY_ICONS = {
  lead: { icon: HiOutlineCursorArrowRays, color: '#3B82F6', bg: '#EFF6FF' },
  club: { icon: HiOutlineBuildingOffice2, color: '#8B5CF6', bg: '#F5F3FF' },
  contract: { icon: HiOutlineDocumentText, color: '#059669', bg: '#ECFDF5' },
  invoice: { icon: HiOutlineBanknotes, color: '#F59E0B', bg: '#FFFBEB' },
  task: { icon: HiOutlineClipboardDocumentList, color: '#EC4899', bg: '#FDF2F8' },
  default: { icon: HiOutlineBolt, color: '#6B7280', bg: '#F9FAFB' },
};

// ─── Chart Components ──────────────────────────────────────

function AreaChart({ data, height = 200, color = '#059669' }) {
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>Dati insufficienti per il grafico</div>;

  const pad = { t: 20, r: 16, b: 32, l: 50 };
  const w = 800, h = height;
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const vals = data.map(d => d.value);
  const maxV = Math.max(...vals, 1);
  const minV = 0;

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * cw,
    y: pad.t + ch - ((d.value - minV) / (maxV - minV || 1)) * ch,
    label: d.label,
    value: d.value
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${pad.t + ch} L${pts[0].x},${pad.t + ch} Z`;

  const gridLines = 4;
  const gridVals = Array.from({ length: gridLines + 1 }, (_, i) => minV + (maxV - minV) * (i / gridLines));

  const labelStep = Math.max(1, Math.floor(data.length / 8));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {gridVals.map((v, i) => {
        const y = pad.t + ch - ((v - minV) / (maxV - minV || 1)) * ch;
        return (
          <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" fill="#9CA3AF" fontSize={11} fontFamily="system-ui">{v >= 1000 ? `${(v/1000).toFixed(0)}k` : Math.round(v)}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={2} />
      ))}
      {/* X labels */}
      {pts.filter((_, i) => i % labelStep === 0 || i === pts.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={h - 6} textAnchor="middle" fill="#9CA3AF" fontSize={11} fontFamily="system-ui">{p.label}</text>
      ))}
    </svg>
  );
}

function MiniStat({ icon: Icon, label, value, sub, color = '#1A1A1A', bg = '#F9FAFB' }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '20px', border: `1px solid ${color}15`, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon style={{ width: 18, height: 18, color }} />
        <span style={{ fontSize: 13, fontWeight: 600, color, opacity: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, tag, accent }) {
  const accentColor = accent || '#85FF00';
  return (
    <div className="tp-analytics-kpi-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 22, height: 22, color: '#fff' }} />
        </div>
        {tag && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: `${accentColor}20`, color: accentColor, borderRadius: 8, letterSpacing: 0.5 }}>{tag}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 2, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function HBar({ label, value, max, color, rightLabel }) {
  const p = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 100, fontSize: 13, color: '#4B5563', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 8, height: 28, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color || '#059669', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, transition: 'width 0.5s ease' }}>
          {value > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{value}</span>}
        </div>
      </div>
      {rightLabel && <span style={{ width: 80, fontSize: 12, color: '#9CA3AF', textAlign: 'right', flexShrink: 0 }}>{rightLabel}</span>}
    </div>
  );
}

function VBar({ label, value, max, color, highlight }) {
  const p = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{fmt(value)}</div>
      <div style={{ width: '70%', background: '#F3F4F6', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 140 }}>
        <div style={{ width: '100%', borderRadius: '0 0 8px 8px', transition: 'height 0.5s ease', height: `${p}%`, background: highlight ? color : `${color}80`, minHeight: value > 0 ? 4 : 0 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: highlight ? '#1A1A1A' : '#9CA3AF', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function DeltaRow({ label, current, previous, isCurrency }) {
  const delta = previous > 0 ? ((current - previous) / previous * 100) : (current > 0 ? 100 : 0);
  const isUp = delta >= 0;
  const Icon = isUp ? HiOutlineArrowTrendingUp : HiOutlineArrowTrendingDown;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#FAFAFA', borderRadius: 12, marginBottom: 8 }}>
      <span style={{ color: '#4B5563', fontWeight: 500, fontSize: 14 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{isCurrency ? fmt(current) : fmtN(current)}</span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
          background: isUp ? '#ECFDF5' : '#FEF2F2', color: isUp ? '#059669' : '#DC2626'
        }}>
          <Icon style={{ width: 14, height: 14 }} />
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function AlertCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: bg, borderRadius: 14, border: `1px solid ${color}25` }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      </div>
    </div>
  );
}

function ConversionFunnel({ rates }) {
  if (!rates) return null;
  const steps = [
    { label: 'Contatto → Demo', value: rates.contact_to_demo, color: '#3B82F6' },
    { label: 'Demo → Proposta', value: rates.demo_to_proposal, color: '#8B5CF6' },
    { label: 'Proposta → Contratto', value: rates.proposal_to_contract, color: '#059669' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 140, fontSize: 13, color: '#4B5563', fontWeight: 500, flexShrink: 0 }}>{s.label}</span>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 20, height: 32, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${Math.min(s.value || 0, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${s.color}, ${s.color}CC)`, borderRadius: 20, transition: 'width 0.6s ease', minWidth: s.value > 0 ? 32 : 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{(s.value || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, iconColor, children, action }) {
  return (
    <div className="tp-analytics-section">
      <div className="tp-analytics-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon style={{ width: 20, height: 20, color: iconColor || '#6B7280' }} />
          <h3 style={{ fontWeight: 700, color: '#111827', fontSize: 15, margin: 0 }}>{title}</h3>
        </div>
        {action}
      </div>
      <div className="tp-analytics-section-body">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>{text || 'Nessun dato disponibile'}</div>;
}

// ─── Main Component ────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;

  const [tab, setTab] = useState('panoramica');
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [calendarStats, setCalendarStats] = useState(null);
  const [workflowStats, setWorkflowStats] = useState(null);
  const [newsletterStats, setNewsletterStats] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [notifSummary, setNotifSummary] = useState(null);
  const [emailUnread, setEmailUnread] = useState(null);
  const [waStatus, setWaStatus] = useState(null);

  const headers = useMemo(() => ({ 'Authorization': `Bearer ${token}` }), [token]);
  const f = useCallback((url) => fetch(`${API}${url}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null), [headers]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const yr = new Date().getFullYear();
      const [dash, anal, fin, contr, tasks, cal, wf, nl, kpi, notif, email, wa] = await Promise.all([
        f('/admin/dashboard'),
        f(`/admin/analytics?period=${period}`),
        f(`/admin/finance/dashboard?year=${yr}`),
        f('/admin/contracts/stats'),
        f('/admin/tasks/stats'),
        f('/admin/calendar/stats'),
        f('/admin/workflows/stats'),
        f('/admin/newsletter/stats'),
        f(`/admin/kpi/dashboard?year=${yr}`),
        f('/admin/notifications/summary'),
        f('/admin/email/unread-counts'),
        f('/admin/whatsapp/status'),
      ]);
      if (dash) setDashboard(dash);
      if (anal) setAnalytics(anal);
      if (fin) setFinance(fin);
      if (contr) setContracts(contr);
      if (tasks) setTaskStats(tasks);
      if (cal) setCalendarStats(cal);
      if (wf) setWorkflowStats(wf);
      if (nl) setNewsletterStats(nl);
      if (kpi) setKpiData(kpi);
      if (notif) setNotifSummary(notif);
      setEmailUnread(email);
      setWaStatus(wa);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, period, f]);

  useEffect(() => { if (!user || user.role !== 'admin') { navigate('/'); return; } fetchAll(); }, [fetchAll, user, navigate]);

  useEffect(() => {
    if (!loading && token) {
      f(`/admin/analytics?period=${period}`).then(d => { if (d) setAnalytics(d); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // ─── Derived data ───

  const kpis = dashboard?.kpis || {};
  const pipeline = dashboard?.pipeline || {};
  const activities = dashboard?.recent_activities || [];
  const growth = analytics?.growth || {};
  const daily = analytics?.daily || [];
  const leadFunnel = analytics?.lead_funnel || {};
  const clubsByType = analytics?.clubs_by_type || {};
  const subsByPlan = analytics?.subscriptions_by_plan || {};
  const churned = analytics?.churned || 0;

  const mrr = finance?.arr?.mrr || kpis.mrr || 0;
  const arr = finance?.arr?.total || kpis.arr || 0;
  const cashIn = finance?.cash_in || {};
  const pending = finance?.pending || {};
  const forecast = finance?.forecast || {};
  const byClub = finance?.by_club || [];
  const arrByPlan = finance?.arr?.by_plan || {};
  const cashByMonth = cashIn.by_month || {};

  const contr = contracts || {};
  const tasks = taskStats || {};
  const cal = calendarStats || {};
  const wf = workflowStats || {};
  const nl = newsletterStats || {};
  const notif = notifSummary || {};
  const convRates = kpiData?.conversion_rates || null;
  const kpiFunnel = kpiData?.auto_calculated?.funnel || {};

  // Chart data from daily
  const revenueChartData = useMemo(() => daily.map(d => ({
    label: new Date(d.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
    value: d.revenue || 0
  })), [daily]);

  const clubsChartData = useMemo(() => daily.map(d => ({
    label: new Date(d.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }),
    value: d.new_clubs || 0
  })), [daily]);

  // Pipeline stages
  const pipelineStages = useMemo(() => FUNNEL_ORDER.map(s => ({
    stage: s,
    count: pipeline[s]?.count || leadFunnel[s] || 0,
    value: pipeline[s]?.value || 0
  })), [pipeline, leadFunnel]);
  const maxPipeline = Math.max(...pipelineStages.map(s => s.count), 1);

  // Monthly cash
  const maxCash = Math.max(...Object.values(cashByMonth).map(v => v || 0), 1);
  const currentMonth = new Date().getMonth() + 1;

  // Task maxes
  const taskPrioMax = Math.max(...Object.values(tasks.per_priorita || {}).map(v => v || 0), 1);
  const taskTypeMax = Math.max(...Object.values(tasks.per_tipo || {}).map(v => v || 0), 1);

  // Email totals
  const totalEmailUnread = useMemo(() => {
    if (!emailUnread || typeof emailUnread !== 'object') return 0;
    return Object.values(emailUnread).reduce((s, v) => s + (v || 0), 0);
  }, [emailUnread]);

  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="tp-page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#9CA3AF', gap: 12 }}>
          <div style={{ width: 24, height: 24, border: '2px solid #D1D5DB', borderTopColor: '#4B5563', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Caricamento Analytics...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container tp-analytics-page">
      <style>{`
        .tp-analytics-page { max-width: 1400px; margin: 0 auto; }
        .tp-analytics-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .tp-analytics-kpi-card { background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%); border-radius: 16px; padding: 20px; }
        .tp-analytics-section { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; margin-bottom: 20px; overflow: hidden; }
        .tp-analytics-section-header { padding: 16px 24px; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; }
        .tp-analytics-section-body { padding: 20px 24px; }
        .tp-analytics-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .tp-analytics-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .tp-analytics-alerts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .tp-analytics-tabs { display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
        .tp-analytics-tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: 1px solid #E5E7EB; background: #fff; color: #6B7280; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tp-analytics-tab:hover { background: #F9FAFB; }
        .tp-analytics-tab.active { background: #1A1A1A; color: #fff; border-color: #1A1A1A; }
        .tp-analytics-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .tp-analytics-header h1 { font-size: 24px; font-weight: 800; color: #111827; margin: 0; }
        .tp-analytics-header p { font-size: 14px; color: #9CA3AF; margin: 4px 0 0; }
        .tp-analytics-controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .tp-analytics-select { padding: 8px 14px; border: 1px solid #E5E7EB; border-radius: 10px; font-size: 13px; font-weight: 600; color: #4B5563; background: #fff; cursor: pointer; outline: none; }
        .tp-analytics-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #1A1A1A; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .tp-analytics-refresh:hover { background: #333; }
        .tp-analytics-table { width: 100%; border-collapse: collapse; }
        .tp-analytics-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; background: #FAFAFA; }
        .tp-analytics-table th:last-child, .tp-analytics-table td:last-child { text-align: right; }
        .tp-analytics-table td { padding: 14px 20px; font-size: 14px; color: #374151; border-top: 1px solid #F3F4F6; }
        .tp-analytics-table tr:hover td { background: #FAFAFA; }
        .tp-comm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .tp-comm-channel { display: flex; align-items: center; gap: 16px; padding: 20px; background: #FAFAFA; border-radius: 14px; border: 1px solid #E5E7EB; }
        .tp-comm-channel-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        @media (max-width: 1024px) {
          .tp-analytics-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .tp-analytics-grid-2 { grid-template-columns: 1fr; }
          .tp-analytics-grid-3 { grid-template-columns: 1fr; }
          .tp-analytics-alerts { grid-template-columns: repeat(2, 1fr); }
          .tp-comm-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .tp-analytics-page { padding: 16px !important; }
          .tp-analytics-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .tp-analytics-kpi-card { padding: 14px; }
          .tp-analytics-kpi-card > div:last-child { font-size: 22px !important; }
          .tp-analytics-alerts { grid-template-columns: 1fr; }
          .tp-analytics-section-body { padding: 16px; }
          .tp-analytics-section-header { padding: 14px 16px; }
          .tp-analytics-header h1 { font-size: 20px; }
          .tp-analytics-table th, .tp-analytics-table td { padding: 10px 12px; font-size: 12px; }
          .tp-analytics-tab { padding: 8px 14px; font-size: 13px; }
        }
      `}</style>

      {/* Header */}
      <div className="tp-analytics-header">
        <div>
          <h1>Analytics</h1>
          <p>Panoramica completa della piattaforma in tempo reale</p>
        </div>
        <div className="tp-analytics-controls">
          <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="tp-analytics-select">
            <option value={7}>7 giorni</option>
            <option value={30}>30 giorni</option>
            <option value={90}>90 giorni</option>
          </select>
          <button onClick={() => fetchAll(true)} className="tp-analytics-refresh">
            <HiOutlineArrowPath style={{ width: 16, height: 16, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tp-analytics-tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tp-analytics-tab ${tab === t.id ? 'active' : ''}`}>
            <t.icon style={{ width: 18, height: 18 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ PANORAMICA ═══════════════ */}
      {tab === 'panoramica' && (
        <>
          {/* KPIs */}
          <div className="tp-analytics-kpi-grid">
            <KpiCard icon={HiOutlineBanknotes} label="MRR" value={fmt(mrr)} sub={`ARR: ${fmt(arr)}`} tag="REVENUE" accent="#85FF00" />
            <KpiCard icon={HiOutlineUserGroup} label="Club Attivi" value={kpis.active_clubs || 0} sub={`${kpis.total_clubs || 0} totali · ${kpis.new_clubs_month || 0} nuovi questo mese`} tag="CLUB" accent="#A855F7" />
            <KpiCard icon={HiOutlineCursorArrowRays} label="Lead in Pipeline" value={kpis.total_leads || 0} sub={`${kpis.hot_leads || 0} hot · ${kpis.leads_this_month || 0} nuovi mese`} tag="LEAD" accent="#3B82F6" />
            <KpiCard icon={HiOutlineBuildingOffice2} label="Sponsor Totali" value={kpis.total_sponsors || 0} sub={`${kpis.active_subscriptions || 0} abbonamenti attivi`} tag="SPONSOR" accent="#F59E0B" />
          </div>

          {/* Alerts */}
          <div className="tp-analytics-alerts">
            <AlertCard icon={HiOutlineExclamationTriangle} label="Contratti in Scadenza" value={contr.expiring_soon || kpis.expiring_soon || 0} color="#F59E0B" bg="#FFFBEB" />
            <AlertCard icon={HiOutlineXCircle} label="Fatture Scadute" value={pending.overdue_count || 0} color="#DC2626" bg="#FEF2F2" />
            <AlertCard icon={HiOutlineBellAlert} label="Notifiche Non Lette" value={notif.non_lette || 0} color="#8B5CF6" bg="#F5F3FF" />
            <AlertCard icon={HiOutlineClock} label="Task Scaduti" value={tasks.scaduti || 0} color="#F97316" bg="#FFF7ED" />
          </div>

          {/* Trend Crescita */}
          <Section icon={HiOutlineArrowTrendingUp} title={`Trend Crescita (${period} giorni)`} iconColor="#059669">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DeltaRow label="Club" current={growth.clubs?.current || 0} previous={growth.clubs?.previous || 0} />
              <DeltaRow label="Sponsor" current={growth.sponsors?.current || 0} previous={growth.sponsors?.previous || 0} />
              <DeltaRow label="Revenue" current={growth.revenue?.current || 0} previous={growth.revenue?.previous || 0} isCurrency />
            </div>
          </Section>

          {/* Revenue Chart */}
          <Section icon={HiOutlineBanknotes} title={`Andamento Revenue (${period} giorni)`} iconColor="#059669">
            <AreaChart data={revenueChartData} height={220} color="#059669" />
          </Section>

          {/* Two cols: Funnel + Activities */}
          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineFunnel} title="Funnel Lead" iconColor="#F97316">
              {FUNNEL_ORDER.map(s => (
                <HBar key={s} label={STAGE_LABELS[s] || s} value={leadFunnel[s] || pipeline[s]?.count || 0} max={Math.max(...FUNNEL_ORDER.map(x => leadFunnel[x] || 0), 1)} color={STAGE_COLORS[s]} />
              ))}
            </Section>

            <Section icon={HiOutlineClipboardDocumentList} title="Attività Recenti" iconColor="#6366F1">
              {activities.length === 0 ? <EmptyState text="Nessuna attività recente" /> : (
                <div>
                  {activities.slice(0, 10).map((act, i) => {
                    const type = act.entita?.toLowerCase() || 'default';
                    const iconCfg = ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
                    const ActIcon = iconCfg.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < Math.min(activities.length, 10) - 1 ? '1px solid #F3F4F6' : 'none' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ActIcon style={{ width: 16, height: 16, color: iconCfg.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.azione || act.action || ''}{act.entita_nome ? ` — ${act.entita_nome}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{timeAgo(act.timestamp || act.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        </>
      )}

      {/* ═══════════════ REVENUE ═══════════════ */}
      {tab === 'revenue' && (
        <>
          <div className="tp-analytics-kpi-grid">
            <KpiCard icon={HiOutlineBanknotes} label="ARR Totale" value={fmt(arr)} sub={`MRR: ${fmt(mrr)}`} tag="ARR" accent="#85FF00" />
            <KpiCard icon={HiOutlineBanknotes} label="Cash-in Anno" value={fmt(cashIn.year_total || 0)} sub={`Questo mese: ${fmt(cashIn.this_month || 0)}`} tag="CASH-IN" accent="#059669" />
            <KpiCard icon={HiOutlineExclamationTriangle} label="Da Incassare" value={fmt(pending.total || 0)} sub={`${pending.overdue_count || 0} fatture scadute · ${fmt(pending.overdue_total || 0)}`} tag="PENDING" accent="#F59E0B" />
            <KpiCard icon={HiOutlineArrowTrendingUp} label="Previsione 30gg" value={fmt(forecast.expected_30_days || 0)} sub={`${contr.active_contracts || 0} contratti attivi`} tag="FORECAST" accent="#3B82F6" />
          </div>

          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineChartBarSquare} title="ARR per Piano" iconColor="#3B82F6">
              {Object.entries(arrByPlan).length > 0 ? Object.entries(arrByPlan).map(([plan, value]) => (
                <HBar key={plan} label={plan.charAt(0).toUpperCase() + plan.slice(1)} value={value || 0} max={Math.max(...Object.values(arrByPlan), 1)} color={PLAN_COLORS[plan] || '#6B7280'} rightLabel={fmt(value)} />
              )) : <EmptyState />}
            </Section>

            <Section icon={HiOutlineDocumentText} title="Contratti" iconColor="#059669">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MiniStat icon={HiOutlineCheckCircle} label="Attivi" value={contr.active_contracts || 0} color="#059669" bg="#ECFDF5" />
                <MiniStat icon={HiOutlineBolt} label="Nuovi Mese" value={contr.new_this_month || 0} color="#3B82F6" bg="#EFF6FF" />
                <MiniStat icon={HiOutlineExclamationTriangle} label="In Scadenza" value={contr.expiring_soon || 0} color="#F59E0B" bg="#FFFBEB" />
                <MiniStat icon={HiOutlineBanknotes} label="Valore Medio" value={fmt(contr.avg_contract_value || 0)} color="#8B5CF6" bg="#F5F3FF" />
              </div>
            </Section>
          </div>

          {/* Cash-in Mensile */}
          <Section icon={HiOutlineBanknotes} title={`Cash-in Mensile ${new Date().getFullYear()}`} iconColor="#059669">
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              {MONTHS.map((name, i) => (
                <VBar key={i} label={name} value={cashByMonth[i + 1] || 0} max={maxCash} color="#059669" highlight={i + 1 === currentMonth} />
              ))}
            </div>
          </Section>

          {/* Top Clubs */}
          <Section icon={HiOutlineUserGroup} title="Top Club per Valore Contratto" iconColor="#8B5CF6">
            {byClub.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="tp-analytics-table">
                  <thead>
                    <tr>
                      <th>Club</th>
                      <th>Piano</th>
                      <th style={{ textAlign: 'right' }}>Valore</th>
                      <th style={{ textAlign: 'right' }}>Pagato</th>
                      <th style={{ textAlign: 'right' }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byClub.slice(0, 10).map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.club_name}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: `${PLAN_COLORS[c.plan] || '#6B7280'}15`, color: PLAN_COLORS[c.plan] || '#6B7280' }}>
                            {(c.plan || 'N/A').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(c.contract_value)}</td>
                        <td style={{ textAlign: 'right', color: '#059669' }}>{fmt(c.paid)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: c.balance > 0 ? '#DC2626' : '#059669' }}>{fmt(c.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState />}
          </Section>
        </>
      )}

      {/* ═══════════════ CRM ═══════════════ */}
      {tab === 'crm' && (
        <>
          <div className="tp-analytics-kpi-grid">
            <KpiCard icon={HiOutlineCursorArrowRays} label="Lead Totali" value={kpis.total_leads || 0} sub={`${kpis.hot_leads || 0} hot · ${kpis.leads_this_month || 0} nuovi mese`} tag="PIPELINE" accent="#3B82F6" />
            <KpiCard icon={HiOutlineCheckCircle} label="Vinti" value={leadFunnel.vinto || pipeline.vinto?.count || 0} tag="VINTI" accent="#059669" />
            <KpiCard icon={HiOutlineXCircle} label="Persi" value={leadFunnel.perso || pipeline.perso?.count || 0} tag="PERSI" accent="#DC2626" />
            <KpiCard icon={HiOutlineArrowTrendingDown} label="Churned" value={churned} sub={`Periodo: ${period} giorni`} tag="CHURN" accent="#F97316" />
          </div>

          {/* Conversion Rates */}
          {convRates && (
            <Section icon={HiOutlineFunnel} title="Tassi di Conversione" iconColor="#8B5CF6">
              <ConversionFunnel rates={convRates} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
                <MiniStat icon={HiOutlineCursorArrowRays} label="Contatti" value={fmtN(kpiFunnel.contacts || 0)} color="#6B7280" bg="#F9FAFB" />
                <MiniStat icon={HiOutlineCalendarDays} label="Demo" value={fmtN(kpiFunnel.demos || 0)} color="#3B82F6" bg="#EFF6FF" />
                <MiniStat icon={HiOutlineDocumentText} label="Proposte" value={fmtN(kpiFunnel.proposals || 0)} color="#8B5CF6" bg="#F5F3FF" />
                <MiniStat icon={HiOutlineCheckCircle} label="Contratti" value={fmtN(kpiFunnel.contracts || 0)} color="#059669" bg="#ECFDF5" />
              </div>
            </Section>
          )}

          {/* Pipeline + New clubs chart */}
          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineChartBarSquare} title="Pipeline per Stage" iconColor="#6366F1">
              {pipelineStages.map(({ stage, count, value }) => (
                <HBar key={stage} label={STAGE_LABELS[stage] || stage} value={count} max={maxPipeline} color={STAGE_COLORS[stage]} rightLabel={fmt(value)} />
              ))}
            </Section>

            <Section icon={HiOutlineUserGroup} title={`Nuovi Club (${period}gg)`} iconColor="#8B5CF6">
              <AreaChart data={clubsChartData} height={200} color="#8B5CF6" />
            </Section>
          </div>

          {/* Three cols */}
          <div className="tp-analytics-grid-3">
            <Section icon={HiOutlineCursorArrowRays} title="Lead per Temperatura" iconColor="#DC2626">
              {[
                { label: 'Hot', value: kpis.hot_leads || 0, color: '#DC2626' },
                { label: 'Warm', value: Math.max((kpis.total_leads || 0) - (kpis.hot_leads || 0) - (leadFunnel.nuovo || 0), 0), color: '#F59E0B' },
                { label: 'Cold', value: leadFunnel.nuovo || 0, color: '#6B7280' },
              ].map(item => <HBar key={item.label} label={item.label} value={item.value} max={Math.max(kpis.total_leads || 0, 1)} color={item.color} />)}
            </Section>

            <Section icon={HiOutlineUserGroup} title="Club per Tipologia" iconColor="#8B5CF6">
              {Object.keys(clubsByType).length > 0 ? Object.entries(clubsByType).map(([type, count]) => (
                <HBar key={type} label={type} value={count} max={Math.max(...Object.values(clubsByType), 1)} color="#7C3AED" />
              )) : <EmptyState />}
            </Section>

            <Section icon={HiOutlineChartBarSquare} title="Abbonamenti per Piano" iconColor="#3B82F6">
              {(() => {
                const data = Object.keys(subsByPlan).length > 0 ? subsByPlan : (contracts?.contracts_by_plan || {});
                const max = Math.max(...Object.values(data).map(v => v || 0), 1);
                return Object.keys(data).length > 0 ? Object.entries(data).map(([plan, count]) => (
                  <HBar key={plan} label={plan.charAt(0).toUpperCase() + plan.slice(1)} value={count} max={max} color={PLAN_COLORS[plan] || '#6B7280'} />
                )) : <EmptyState />;
              })()}
            </Section>
          </div>
        </>
      )}

      {/* ═══════════════ OPERATIVO ═══════════════ */}
      {tab === 'operativo' && (
        <>
          <div className="tp-analytics-kpi-grid">
            <KpiCard icon={HiOutlineClipboardDocumentList} label="Da Fare" value={tasks.da_fare || 0} sub={`${tasks.totale || 0} task totali`} tag="TODO" accent="#3B82F6" />
            <KpiCard icon={HiOutlineClock} label="In Corso" value={tasks.in_corso || 0} tag="WIP" accent="#F59E0B" />
            <KpiCard icon={HiOutlineCheckCircle} label="Completati Oggi" value={tasks.completati_oggi || 0} tag="DONE" accent="#059669" />
            <KpiCard icon={HiOutlineExclamationTriangle} label="Scaduti" value={tasks.scaduti || 0} tag="LATE" accent="#DC2626" />
          </div>

          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineClipboardDocumentList} title="Task per Priorità" iconColor="#F59E0B">
              {Object.entries(tasks.per_priorita || {}).length > 0
                ? Object.entries(tasks.per_priorita).map(([p, c]) => <HBar key={p} label={PRIORITY_LABELS[p] || p} value={c} max={taskPrioMax} color={PRIORITY_COLORS[p]} />)
                : <EmptyState />}
            </Section>
            <Section icon={HiOutlineClipboardDocumentList} title="Task per Tipo" iconColor="#3B82F6">
              {Object.entries(tasks.per_tipo || {}).length > 0
                ? Object.entries(tasks.per_tipo).map(([t, c]) => <HBar key={t} label={TASK_TYPE_LABELS[t] || t} value={c} max={taskTypeMax} color="#3B82F6" />)
                : <EmptyState />}
            </Section>
          </div>

          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineCalendarDays} title="Calendario" iconColor="#8B5CF6">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MiniStat icon={HiOutlineCalendarDays} label="Oggi" value={cal.appuntamenti_oggi || 0} color="#3B82F6" bg="#EFF6FF" />
                <MiniStat icon={HiOutlineCursorArrowRays} label="Demo Settimana" value={cal.demo_settimana || 0} color="#F59E0B" bg="#FFFBEB" />
                <MiniStat icon={HiOutlineClock} label="Booking Pendenti" value={cal.bookings_pendenti || 0} color="#8B5CF6" bg="#F5F3FF" />
                {cal.prossimo_evento && (
                  <div style={{ background: '#F0FDF4', borderRadius: 16, padding: 16, border: '1px solid #BBF7D015' }}>
                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginBottom: 4 }}>Prossimo Evento</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cal.prossimo_evento.titolo}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {cal.prossimo_evento.data_ora_inizio ? new Date(cal.prossimo_evento.data_ora_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <Section icon={HiOutlineBolt} title="Automazioni" iconColor="#F59E0B">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MiniStat icon={HiOutlineBolt} label="Totali" value={wf.totali || 0} color="#6B7280" bg="#F9FAFB" />
                <MiniStat icon={HiOutlineCheckCircle} label="Attivi" value={wf.attivi || 0} color="#059669" bg="#ECFDF5" />
                <MiniStat icon={HiOutlineArrowPath} label="Esecuzioni" value={fmtN(wf.esecuzioni_totali || 0)} color="#3B82F6" bg="#EFF6FF" />
                <MiniStat icon={HiOutlineSignal} label="Successo" value={`${(wf.percentuale_successo || 0).toFixed(0)}%`} color={wf.percentuale_successo >= 80 ? '#059669' : '#F59E0B'} bg={wf.percentuale_successo >= 80 ? '#ECFDF5' : '#FFFBEB'} />
              </div>
            </Section>
          </div>
        </>
      )}

      {/* ═══════════════ COMUNICAZIONI ═══════════════ */}
      {tab === 'comunicazioni' && (
        <>
          {/* Channel Overview */}
          <div className="tp-analytics-kpi-grid">
            <KpiCard icon={HiOutlineMegaphone} label="Campagne Newsletter" value={nl.campaigns_sent || 0} sub={`${nl.total_groups || 0} gruppi · ${nl.total_unique_recipients || 0} destinatari`} tag="NEWSLETTER" accent="#059669" />
            <KpiCard icon={HiOutlineEnvelope} label="Email Non Lette" value={totalEmailUnread} sub="Across tutti gli account" tag="EMAIL" accent="#3B82F6" />
            <KpiCard icon={HiOutlineChatBubbleLeftRight} label="WhatsApp" value={waStatus?.connected ? 'Connesso' : 'Disconnesso'} sub={waStatus?.info?.pushname || 'Non autenticato'} tag="WHATSAPP" accent={waStatus?.connected ? '#059669' : '#DC2626'} />
            <KpiCard icon={HiOutlineBellAlert} label="Notifiche Totali" value={notif.totale || 0} sub={`${notif.non_lette || 0} non lette`} tag="NOTIFICHE" accent="#8B5CF6" />
          </div>

          {/* Channels detail */}
          <div className="tp-analytics-grid-2">
            {/* Newsletter */}
            <Section icon={HiOutlineMegaphone} title="Newsletter" iconColor="#059669">
              {nl.last_campaign ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 4 }}>ULTIMA CAMPAGNA</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{nl.last_campaign.titolo || nl.last_campaign.oggetto || 'Senza titolo'}</div>
                    {nl.last_campaign.oggetto && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Oggetto: {nl.last_campaign.oggetto}</div>}
                    {nl.last_campaign.sent_at && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{new Date(nl.last_campaign.sent_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <MiniStat icon={HiOutlineMegaphone} label="Inviate" value={nl.campaigns_sent || 0} color="#059669" bg="#ECFDF5" />
                    <MiniStat icon={HiOutlineUserGroup} label="Gruppi" value={nl.total_groups || 0} color="#3B82F6" bg="#EFF6FF" />
                    <MiniStat icon={HiOutlineEnvelope} label="Destinatari" value={fmtN(nl.total_unique_recipients || 0)} color="#8B5CF6" bg="#F5F3FF" />
                  </div>
                </div>
              ) : <EmptyState text="Nessuna campagna inviata" />}
            </Section>

            {/* Notifications by type */}
            <Section icon={HiOutlineBellAlert} title="Notifiche per Tipo" iconColor="#8B5CF6">
              {notif.per_tipo && Object.keys(notif.per_tipo).length > 0 ? (
                <>
                  {Object.entries(notif.per_tipo).map(([type, count]) => (
                    <HBar key={type} label={NOTIF_TYPE_LABELS[type] || type} value={count} max={Math.max(...Object.values(notif.per_tipo), 1)} color={NOTIF_TYPE_COLORS[type] || '#6B7280'} />
                  ))}
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {Object.entries(notif.per_priorita || {}).map(([p, c]) => (
                      <MiniStat key={p} icon={HiOutlineBellAlert} label={p.charAt(0).toUpperCase() + p.slice(1)} value={c}
                        color={p === 'urgente' ? '#DC2626' : p === 'alta' ? '#F59E0B' : '#6B7280'}
                        bg={p === 'urgente' ? '#FEF2F2' : p === 'alta' ? '#FFFBEB' : '#F9FAFB'} />
                    ))}
                  </div>
                </>
              ) : <EmptyState text="Nessuna notifica non letta" />}
            </Section>
          </div>

          {/* Email accounts + WhatsApp */}
          <div className="tp-analytics-grid-2">
            <Section icon={HiOutlineEnvelope} title="Account Email" iconColor="#3B82F6">
              {emailUnread && typeof emailUnread === 'object' && Object.keys(emailUnread).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(emailUnread).map(([account, count]) => (
                    <div key={account} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F9FAFB', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <HiOutlineEnvelope style={{ width: 18, height: 18, color: '#3B82F6' }} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{account}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: count > 0 ? '#DC2626' : '#059669', background: count > 0 ? '#FEF2F2' : '#ECFDF5', padding: '3px 12px', borderRadius: 20 }}>
                        {count} non lette
                      </span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="Nessun account email configurato" />}
            </Section>

            <Section icon={HiOutlineChatBubbleLeftRight} title="WhatsApp" iconColor="#25D366">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: waStatus?.connected ? '#ECFDF5' : '#FEF2F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {waStatus?.connected
                    ? <HiOutlineCheckCircle style={{ width: 32, height: 32, color: '#059669' }} />
                    : <HiOutlineXCircle style={{ width: 32, height: 32, color: '#DC2626' }} />
                  }
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  {waStatus?.connected ? 'Connesso' : 'Disconnesso'}
                </div>
                {waStatus?.connected && waStatus?.info && (
                  <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
                    <div>{waStatus.info.pushname}</div>
                    {waStatus.info.wid?.user && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>+{waStatus.info.wid.user}</div>}
                  </div>
                )}
                {!waStatus?.connected && (
                  <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
                    Vai alla sezione WhatsApp per connettere il dispositivo
                  </div>
                )}
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
