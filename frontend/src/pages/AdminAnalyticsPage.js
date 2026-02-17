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
  HiOutlineArrowTrendingDown
} from 'react-icons/hi2';
import '../styles/admin-dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// --- Helpers ---

const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

const STAGE_LABELS = {
  nuovo: 'Nuovo', contattato: 'Contattato', qualificato: 'Qualificato',
  demo: 'Demo', proposta: 'Proposta', negoziazione: 'Negoziazione',
  vinto: 'Vinto', perso: 'Perso'
};

const STAGE_COLORS = {
  nuovo: '#6B7280', contattato: '#3B82F6', qualificato: '#8B5CF6',
  demo: '#F59E0B', proposta: '#F97316', negoziazione: '#EC4899',
  vinto: '#059669', perso: '#DC2626'
};

const FUNNEL_STAGES = ['nuovo', 'contattato', 'qualificato', 'demo', 'proposta', 'negoziazione', 'vinto'];

const PRIORITY_COLORS = { bassa: '#6B7280', media: '#3B82F6', alta: '#F59E0B', urgente: '#DC2626' };
const PRIORITY_LABELS = { bassa: 'Bassa', media: 'Media', alta: 'Alta', urgente: 'Urgente' };

const TASK_TYPE_LABELS = {
  generale: 'Generale', lead_followup: 'Follow-up', club_onboarding: 'Onboarding',
  rinnovo_contratto: 'Rinnovo', fattura: 'Fattura', supporto: 'Supporto'
};

const PLAN_COLORS = { basic: '#6B7280', premium: '#3B82F6', elite: '#8B5CF6', kickoff: '#F59E0B' };

const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const TABS = [
  { id: 'panoramica', label: 'Panoramica', icon: HiOutlineChartBarSquare },
  { id: 'revenue', label: 'Revenue', icon: HiOutlineBanknotes },
  { id: 'crm', label: 'CRM', icon: HiOutlineCursorArrowRays },
  { id: 'operativo', label: 'Operativo', icon: HiOutlineClipboardDocumentList },
  { id: 'comunicazioni', label: 'Comunicazioni', icon: HiOutlineMegaphone },
];

const timeAgo = (isoDate) => {
  if (!isoDate) return '';
  const diffMs = new Date() - new Date(isoDate);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'ora';
  if (diffMin < 60) return `${diffMin} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays === 1) return 'ieri';
  if (diffDays < 30) return `${diffDays} giorni fa`;
  return new Date(isoDate).toLocaleDateString('it-IT');
};

// --- Sub-components ---

function KpiCardDark({ icon: Icon, label, value, sublabel, tag }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-900" />
        </div>
        {tag && (
          <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">{tag}</span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
      {sublabel && <div className="text-gray-500 text-xs mt-1">{sublabel}</div>}
    </div>
  );
}

function HBar({ label, value, max, color, rightLabel }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-24 text-sm text-gray-600 font-medium flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-lg h-7 overflow-hidden">
        <div
          className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color || '#059669' }}
        >
          {value > 0 && <span className="text-xs font-bold text-white">{value}</span>}
        </div>
      </div>
      {rightLabel && <span className="w-20 text-xs text-gray-500 text-right flex-shrink-0">{rightLabel}</span>}
    </div>
  );
}

function VBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-500 mb-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
        {formatCurrency(value)}
      </div>
      <div className="w-3/4 bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-end" style={{ height: 140 }}>
        <div
          className="w-full rounded-b-lg transition-all duration-500"
          style={{ height: `${pct}%`, backgroundColor: color || '#059669', minHeight: value > 0 ? 4 : 0 }}
        />
      </div>
      <div className="text-xs font-semibold text-gray-600 mt-1.5">{label}</div>
    </div>
  );
}

function DeltaRow({ label, current, previous }) {
  const delta = previous > 0 ? ((current - previous) / previous * 100) : (current > 0 ? 100 : 0);
  const isUp = delta >= 0;
  const TrendIcon = isUp ? HiOutlineArrowTrendingUp : HiOutlineArrowTrendingDown;
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <span className="text-gray-600 font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-gray-900">
          {typeof current === 'number' && current % 1 !== 0 ? formatCurrency(current) : current}
        </span>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// --- Main Component ---

function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;

  const [activeTab, setActiveTab] = useState('panoramica');
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [calendarStats, setCalendarStats] = useState(null);
  const [workflowStats, setWorkflowStats] = useState(null);
  const [newsletterStats, setNewsletterStats] = useState(null);

  const headers = useMemo(() => ({ 'Authorization': `Bearer ${token}` }), [token]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const currentYear = new Date().getFullYear();
      const [dashRes, analyticsRes, finRes, contractRes, taskRes, calRes, wfRes, nlRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/analytics?period=${period}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/finance/dashboard?year=${currentYear}`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/contracts/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/tasks/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/calendar/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/workflows/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/admin/newsletter/stats`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (dashRes) setDashboard(dashRes);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (finRes) setFinance(finRes);
      if (contractRes) setContracts(contractRes);
      if (taskRes) setTaskStats(taskRes);
      if (calRes) setCalendarStats(calRes);
      if (wfRes) setWorkflowStats(wfRes);
      if (nlRes) setNewsletterStats(nlRes);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, headers, period]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAll();
  }, [fetchAll, user, navigate]);

  // Re-fetch analytics when period changes
  useEffect(() => {
    if (!loading && token) {
      fetch(`${API_URL}/admin/analytics?period=${period}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setAnalytics(data); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Derived values
  const kpis = dashboard?.kpis || {};
  const pipelineData = dashboard?.pipeline || {};
  const recentActivities = dashboard?.recent_activities || [];
  const mrr = finance?.arr?.mrr || kpis.mrr || 0;
  const arr = finance?.arr?.total || finance?.arr?.arr || kpis.arr || 0;
  const activeClubs = kpis.active_clubs || 0;
  const totalLeads = kpis.total_leads || 0;
  const hotLeads = kpis.hot_leads || 0;
  const leadsThisMonth = kpis.leads_this_month || 0;

  const growth = analytics?.growth || {};
  const leadFunnel = analytics?.lead_funnel || {};
  const churned = analytics?.churned || 0;
  const clubsByType = analytics?.clubs_by_type || {};
  const subsByPlan = analytics?.subscriptions_by_plan || {};

  const arrByPlan = finance?.arr?.by_plan || {};
  const cashIn = finance?.cash_in || {};
  const pending = finance?.pending || {};
  const forecast = finance?.forecast || {};
  const byClub = finance?.by_club || [];

  const contractsByPlan = contracts?.contracts_by_plan || {};
  const tasks = taskStats || {};
  const cal = calendarStats || {};
  const wf = workflowStats || {};
  const nl = newsletterStats || {};

  const funnelMax = Math.max(...FUNNEL_STAGES.map(s => leadFunnel[s] || 0), 1);

  const pipelineStages = useMemo(() => {
    return FUNNEL_STAGES.map(stage => ({
      stage,
      count: pipelineData[stage]?.count || leadFunnel[stage] || 0,
      value: pipelineData[stage]?.value || 0
    }));
  }, [pipelineData, leadFunnel]);
  const maxPipelineCount = Math.max(...pipelineStages.map(s => s.count), 1);

  const cashByMonth = cashIn.by_month || {};
  const maxCashMonth = Math.max(...Object.values(cashByMonth).map(v => v || 0), 1);

  const taskPrioMax = Math.max(...Object.values(tasks.per_priorita || {}).map(v => v || 0), 1);
  const taskTypeMax = Math.max(...Object.values(tasks.per_tipo || {}).map(v => v || 0), 1);

  if (!user || user.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[60vh] text-gray-400 gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span>Caricamento Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Metriche e analisi approfondite della piattaforma</p>
        </div>
        <div className="flex items-center gap-3">
          {(activeTab === 'panoramica' || activeTab === 'crm') && (
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value={7}>7 giorni</option>
              <option value={30}>30 giorni</option>
              <option value={90}>90 giorni</option>
            </select>
          )}
          <button
            onClick={() => fetchAll(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: PANORAMICA === */}
      {activeTab === 'panoramica' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCardDark icon={HiOutlineBanknotes} label="MRR" value={formatCurrency(mrr)}
              sublabel={`ARR: ${formatCurrency(arr)}`} tag="MRR" />
            <KpiCardDark icon={HiOutlineBanknotes} label="ARR" value={formatCurrency(arr)}
              sublabel={`${contracts?.active_contracts || 0} contratti attivi`} tag="ARR" />
            <KpiCardDark icon={HiOutlineUserGroup} label="Club Attivi" value={activeClubs}
              sublabel={`su ${kpis.total_clubs || 0} totali`} tag="CLUB" />
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Lead in Pipeline" value={totalLeads}
              sublabel={`${hotLeads} hot`} tag="LEAD" />
          </div>

          {/* Trend Crescita */}
          <div className="bg-white rounded-2xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Trend Crescita ({period} giorni)</h3>
            </div>
            <div className="p-6 space-y-3">
              <DeltaRow label="Club" current={growth.clubs?.current || 0} previous={growth.clubs?.previous || 0} />
              <DeltaRow label="Revenue" current={growth.revenue?.current || 0} previous={growth.revenue?.previous || 0} />
              <DeltaRow label="Lead" current={growth.sponsors?.current || totalLeads} previous={growth.sponsors?.previous || 0} />
            </div>
          </div>

          {/* Two columns: Funnel + Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Funnel Lead */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineCursorArrowRays className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Funnel Lead</h3>
              </div>
              <div className="p-6">
                {FUNNEL_STAGES.map(stage => (
                  <HBar
                    key={stage}
                    label={STAGE_LABELS[stage]}
                    value={leadFunnel[stage] || pipelineData[stage]?.count || 0}
                    max={funnelMax}
                    color={STAGE_COLORS[stage]}
                  />
                ))}
              </div>
            </div>

            {/* Attivita Recenti */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineClipboardDocumentList className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Attivita Recenti</h3>
              </div>
              <div className="p-6">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nessuna attivita recente
                  </div>
                ) : (
                  <div className="space-y-0">
                    {recentActivities.slice(0, 10).map((act, idx) => (
                      <div key={idx} className={`flex items-center gap-3 py-3 ${idx < Math.min(recentActivities.length, 10) - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 font-medium truncate">
                            {act.azione || act.action || ''}{act.entita_nome ? ` - ${act.entita_nome}` : ''}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {timeAgo(act.timestamp || act.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB: REVENUE === */}
      {activeTab === 'revenue' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KpiCardDark icon={HiOutlineBanknotes} label="ARR Totale" value={formatCurrency(arr)}
              sublabel={`MRR: ${formatCurrency(mrr)}`} tag="ARR" />
            <KpiCardDark icon={HiOutlineBanknotes} label="Cash-in Anno" value={formatCurrency(cashIn.year_total || 0)}
              sublabel={`Questo mese: ${formatCurrency(cashIn.this_month || 0)}`} tag="CASH-IN" />
            <KpiCardDark icon={HiOutlineBanknotes} label="Da Incassare" value={formatCurrency(pending.total || 0)}
              sublabel={`Scaduto: ${formatCurrency(pending.overdue_total || 0)}`} tag="PENDING" />
          </div>

          {/* Two columns: ARR per Piano + Previsione */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* ARR per Piano */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineChartBarSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">ARR per Piano</h3>
              </div>
              <div className="p-6">
                {Object.entries(arrByPlan).length > 0 ? (
                  Object.entries(arrByPlan).map(([plan, value]) => {
                    const maxPlan = Math.max(...Object.values(arrByPlan), 1);
                    return (
                      <HBar
                        key={plan}
                        label={plan.charAt(0).toUpperCase() + plan.slice(1)}
                        value={value || 0}
                        max={maxPlan}
                        color={PLAN_COLORS[plan] || '#6B7280'}
                        rightLabel={formatCurrency(value)}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">Nessun dato</div>
                )}
              </div>
            </div>

            {/* Previsione 30 giorni */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineArrowTrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Previsione 30 Giorni</h3>
              </div>
              <div className="p-6 flex items-center justify-center min-h-[140px]">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {formatCurrency(forecast.expected_30_days || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Basato su fatture in scadenza e contratti attivi
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash-in Mensile */}
          <div className="bg-white rounded-2xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineBanknotes className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Cash-in Mensile {new Date().getFullYear()}</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-1 items-end">
                {MONTH_NAMES.map((name, idx) => (
                  <VBar
                    key={idx}
                    label={name}
                    value={cashByMonth[idx + 1] || 0}
                    max={maxCashMonth}
                    color={idx + 1 === new Date().getMonth() + 1 ? '#059669' : '#86EFAC'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top Clubs per Valore Contratto */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineUserGroup className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Top Club per Valore Contratto</h3>
            </div>
            {byClub.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Club</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Piano</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Valore</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagato</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byClub.slice(0, 10).map((club, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 text-sm">{club.club_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-lg"
                          style={{ backgroundColor: `${PLAN_COLORS[club.plan] || '#6B7280'}15`, color: PLAN_COLORS[club.plan] || '#6B7280' }}
                        >
                          {(club.plan || 'N/A').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-sm">{formatCurrency(club.contract_value)}</td>
                      <td className="px-6 py-4 text-right text-green-600 text-sm">{formatCurrency(club.paid)}</td>
                      <td className={`px-6 py-4 text-right font-bold text-sm ${club.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(club.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-400 text-sm">Nessun dato disponibile</div>
            )}
          </div>
        </>
      )}

      {/* === TAB: CRM === */}
      {activeTab === 'crm' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Lead Totali" value={totalLeads} tag="TOTALI" />
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Lead Caldi" value={hotLeads} tag="HOT" />
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Nuovi Mese" value={leadsThisMonth} tag="NUOVI" />
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Conversioni" value={leadFunnel.vinto || pipelineData.vinto?.count || 0} tag="VINTI" />
            <KpiCardDark icon={HiOutlineCursorArrowRays} label="Churned" value={churned} tag="CHURN" />
          </div>

          {/* Pipeline per stage */}
          <div className="bg-white rounded-2xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineChartBarSquare className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900">Pipeline per Stage</h3>
            </div>
            <div className="p-6">
              {pipelineStages.map(({ stage, count, value }) => (
                <div key={stage} className="flex items-center gap-3 mb-3">
                  <span className="w-24 text-sm text-gray-600 font-medium flex-shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 bg-gray-100 rounded-lg h-7 overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                      style={{
                        width: `${Math.max((count / maxPipelineCount) * 100, count > 0 ? 4 : 0)}%`,
                        backgroundColor: STAGE_COLORS[stage]
                      }}
                    >
                      {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                    </div>
                  </div>
                  <span className="w-20 text-xs text-gray-500 text-right flex-shrink-0">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lead per temperatura */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineCursorArrowRays className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Lead per Temperatura</h3>
              </div>
              <div className="p-6">
                {[
                  { label: 'Hot', value: hotLeads, color: '#DC2626' },
                  { label: 'Warm', value: Math.max(totalLeads - hotLeads - (leadFunnel.nuovo || 0), 0), color: '#F59E0B' },
                  { label: 'Cold', value: leadFunnel.nuovo || 0, color: '#6B7280' },
                ].map(item => (
                  <HBar key={item.label} label={item.label} value={item.value} max={Math.max(totalLeads, 1)} color={item.color} />
                ))}
              </div>
            </div>

            {/* Club per tipologia */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineUserGroup className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Club per Tipologia</h3>
              </div>
              <div className="p-6">
                {Object.keys(clubsByType).length > 0 ? (
                  Object.entries(clubsByType).map(([type, count]) => {
                    const maxType = Math.max(...Object.values(clubsByType), 1);
                    return <HBar key={type} label={type} value={count} max={maxType} color="#7C3AED" />;
                  })
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">Nessun dato</div>
                )}
              </div>
            </div>

            {/* Abbonamenti per piano */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineChartBarSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Abbonamenti per Piano</h3>
              </div>
              <div className="p-6">
                {(() => {
                  const planData = Object.keys(subsByPlan).length > 0 ? subsByPlan : contractsByPlan;
                  const maxPlan = Math.max(...Object.values(planData).map(v => v || 0), 1);
                  return Object.keys(planData).length > 0 ? (
                    Object.entries(planData).map(([plan, count]) => (
                      <HBar key={plan} label={plan.charAt(0).toUpperCase() + plan.slice(1)} value={count} max={maxPlan} color={PLAN_COLORS[plan] || '#6B7280'} />
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-sm">Nessun dato</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB: OPERATIVO === */}
      {activeTab === 'operativo' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCardDark icon={HiOutlineClipboardDocumentList} label="Da Fare" value={tasks.da_fare || 0} tag="TODO" />
            <KpiCardDark icon={HiOutlineClipboardDocumentList} label="In Corso" value={tasks.in_corso || 0} tag="WIP" />
            <KpiCardDark icon={HiOutlineClipboardDocumentList} label="Completati Oggi" value={tasks.completati_oggi || 0} tag="DONE" />
            <KpiCardDark icon={HiOutlineClipboardDocumentList} label="Scaduti" value={tasks.scaduti || 0} tag="LATE" />
          </div>

          {/* Two columns: Priorita + Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineClipboardDocumentList className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Task per Priorita</h3>
              </div>
              <div className="p-6">
                {Object.entries(tasks.per_priorita || {}).length > 0 ? (
                  Object.entries(tasks.per_priorita).map(([prio, count]) => (
                    <HBar key={prio} label={PRIORITY_LABELS[prio] || prio} value={count} max={taskPrioMax} color={PRIORITY_COLORS[prio] || '#6B7280'} />
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">Nessun dato</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineClipboardDocumentList className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Task per Tipo</h3>
              </div>
              <div className="p-6">
                {Object.entries(tasks.per_tipo || {}).length > 0 ? (
                  Object.entries(tasks.per_tipo).map(([tipo, count]) => (
                    <HBar key={tipo} label={TASK_TYPE_LABELS[tipo] || tipo} value={count} max={taskTypeMax} color="#3B82F6" />
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">Nessun dato</div>
                )}
              </div>
            </div>
          </div>

          {/* Two columns: Calendario + Automazioni */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendario */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineCalendarDays className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Calendario</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-blue-50 rounded-xl text-center border border-blue-100">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Appuntamenti Oggi</div>
                    <div className="text-3xl font-bold text-blue-700">{cal.appuntamenti_oggi || 0}</div>
                  </div>
                  <div className="p-5 bg-orange-50 rounded-xl text-center border border-orange-100">
                    <div className="text-sm text-orange-600 font-semibold mb-1">Demo Settimana</div>
                    <div className="text-3xl font-bold text-orange-700">{cal.demo_settimana || 0}</div>
                  </div>
                  <div className="p-5 bg-purple-50 rounded-xl text-center border border-purple-100 col-span-2">
                    <div className="text-sm text-purple-600 font-semibold mb-1">Bookings Pendenti</div>
                    <div className="text-3xl font-bold text-purple-700">{cal.bookings_pendenti || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Automazioni */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineBolt className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Automazioni</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-xl text-center border border-green-100">
                    <div className="text-sm text-green-600 font-semibold mb-1">Workflow Totali</div>
                    <div className="text-3xl font-bold text-green-700">{wf.totali || 0}</div>
                  </div>
                  <div className="p-5 bg-blue-50 rounded-xl text-center border border-blue-100">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Attivi</div>
                    <div className="text-3xl font-bold text-blue-700">{wf.attivi || 0}</div>
                  </div>
                  <div className="p-5 bg-orange-50 rounded-xl text-center border border-orange-100">
                    <div className="text-sm text-orange-600 font-semibold mb-1">Esecuzioni</div>
                    <div className="text-3xl font-bold text-orange-700">{wf.esecuzioni_totali || 0}</div>
                  </div>
                  <div className="p-5 bg-green-50 rounded-xl text-center border border-green-100">
                    <div className="text-sm text-green-600 font-semibold mb-1">Successo</div>
                    <div className="text-3xl font-bold text-green-700">{(wf.percentuale_successo || 0).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB: COMUNICAZIONI === */}
      {activeTab === 'comunicazioni' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCardDark icon={HiOutlineMegaphone} label="Campagne Inviate" value={nl.campaigns_sent || 0} tag="INVIATE" />
            <KpiCardDark icon={HiOutlineMegaphone} label="Gruppi" value={nl.total_groups || 0} tag="GRUPPI" />
            <KpiCardDark icon={HiOutlineMegaphone} label="Destinatari Unici" value={nl.total_unique_recipients || 0} tag="EMAIL" />
            <KpiCardDark icon={HiOutlineMegaphone} label="Tasso Consegna"
              value={nl.campaigns_sent > 0 ? '100%' : 'N/A'}
              sublabel="Basato su campagne inviate" tag="RATE" />
          </div>

          {/* Ultima Campagna */}
          <div className="bg-white rounded-2xl border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineMegaphone className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Ultima Campagna</h3>
            </div>
            <div className="p-6">
              {nl.last_campaign ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">{nl.last_campaign.titolo || nl.last_campaign.oggetto || 'Senza titolo'}</span>
                    <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      {nl.last_campaign.status || 'inviata'}
                    </span>
                  </div>
                  {nl.last_campaign.oggetto && (
                    <div className="text-sm text-gray-500">Oggetto: {nl.last_campaign.oggetto}</div>
                  )}
                  {nl.last_campaign.sent_at && (
                    <div className="text-xs text-gray-400">
                      Inviata: {new Date(nl.last_campaign.sent_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Nessuna campagna inviata
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo Invii */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <HiOutlineMegaphone className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Riepilogo Invii</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 font-medium">Inviate OK</span>
                <div className="flex-1 bg-gray-100 rounded-lg h-8 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-lg flex items-center justify-center" style={{ width: '100%' }}>
                    <span className="text-xs font-bold text-white">{nl.campaigns_sent || 0} campagne</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-28 text-sm text-gray-600 font-medium">Destinatari</span>
                <div className="flex-1 bg-gray-100 rounded-lg h-8 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-lg flex items-center justify-center"
                    style={{ width: nl.total_unique_recipients > 0 ? '100%' : '0%' }}
                  >
                    <span className="text-xs font-bold text-white">{nl.total_unique_recipients || 0} email uniche</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAnalyticsPage;
