import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import '../styles/admin-dashboard.css';

// Icons - Heroicons style (hi2)
import {
  HiOutlineChartBar,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineCurrencyEuro,
  HiOutlineFlag,
  HiOutlineTrophy,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineChartPie,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineVideoCamera,
  HiOutlineHandRaised,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineServerStack,
  HiOutlinePencilSquare,
  HiOutlineInformationCircle,
  HiOutlineCpuChip,
  HiOutlineChevronDown,
  HiOutlineXMark,
  HiOutlineCursorArrowRays
} from 'react-icons/hi2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Badge component for data type indicator
const DataTypeBadge = ({ type, small = false }) => {
  const isAuto = type === 'auto';
  return (
    <span className={`inline-flex items-center gap-1 ${small ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} rounded-full font-bold uppercase tracking-wide ${
      isAuto
        ? 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border border-emerald-200'
        : 'bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 border border-amber-300'
    }`}>
      {isAuto ? <HiOutlineCpuChip className={small ? 'w-2 h-2' : 'w-3 h-3'} /> : <HiOutlinePencilSquare className={small ? 'w-2 h-2' : 'w-3 h-3'} />}
      {isAuto ? 'Auto' : 'Manuale'}
    </span>
  );
};

function AdminAndamento() {
  const navigate = useNavigate();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;
  const hasFetched = useRef(false);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingCredibility, setEditingCredibility] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [expandedQuarter, setExpandedQuarter] = useState('Q1');

  const months = [
    { value: 1, label: 'Gennaio', short: 'Gen' },
    { value: 2, label: 'Febbraio', short: 'Feb' },
    { value: 3, label: 'Marzo', short: 'Mar' },
    { value: 4, label: 'Aprile', short: 'Apr' },
    { value: 5, label: 'Maggio', short: 'Mag' },
    { value: 6, label: 'Giugno', short: 'Giu' },
    { value: 7, label: 'Luglio', short: 'Lug' },
    { value: 8, label: 'Agosto', short: 'Ago' },
    { value: 9, label: 'Settembre', short: 'Set' },
    { value: 10, label: 'Ottobre', short: 'Ott' },
    { value: 11, label: 'Novembre', short: 'Nov' },
    { value: 12, label: 'Dicembre', short: 'Dic' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchDashboard();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/kpi/dashboard?year=2026`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      showToast('Errore nel caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedInitialData = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/admin/kpi/seed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      showToast('Dati iniziali creati con successo', 'success');
    } catch (error) {
      console.error('Error seeding data:', error);
      showToast('Errore nella creazione dei dati', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateMilestone = async (id, updates) => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/kpi/milestones/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      setEditingMilestone(null);
      showToast('Milestone aggiornata', 'success');
    } catch (error) {
      console.error('Error updating milestone:', error);
      showToast('Errore nell\'aggiornamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateCredibility = async (id, updates) => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/admin/kpi/credibility/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboard();
      setEditingCredibility(null);
      showToast('KPI aggiornato', 'success');
    } catch (error) {
      console.error('Error updating credibility:', error);
      showToast('Errore nell\'aggiornamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getProgressColor = (actual, target) => {
    if (!target) return '#6B7280';
    const pct = (actual / target) * 100;
    if (pct >= 100) return '#10B981';
    if (pct >= 70) return '#F59E0B';
    if (pct >= 40) return '#3B82F6';
    return '#EF4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'at_risk': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'in_progress': return 'In Corso';
      case 'not_started': return 'Da Iniziare';
      case 'at_risk': return 'A Rischio';
      default: return status;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineChartPie },
    { id: 'monthly', label: 'Mensile', icon: HiOutlineCalendarDays },
    { id: 'funnel', label: 'Funnel', icon: HiOutlineChartBar },
    { id: 'milestones', label: 'Milestone', icon: HiOutlineFlag },
    { id: 'credibility', label: 'Credibilità', icon: HiOutlineTrophy }
  ];

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Caricamento dati...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const { auto_calculated, ytd_totals, targets, quarterly_actuals, conversion_rates, milestones, credibility, monthly_auto_data } = dashboardData || {};

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-5 right-5 px-6 py-4 rounded-xl font-semibold z-50 shadow-lg flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {toast.type === 'success' ? <HiOutlineCheckCircle className="w-5 h-5" /> : <HiOutlineExclamationTriangle className="w-5 h-5" />}
              {toast.message}
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Andamento 2026</h1>
              <p className="text-gray-500 mt-1">Monitoraggio KPI in tempo reale</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboard}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <HiOutlineArrowPath className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                Aggiorna
              </button>
              {(!dashboardData?.milestones?.items?.length) && (
                <button
                  onClick={seedInitialData}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
                >
                  <HiOutlineServerStack className="w-4 h-4" />
                  Inizializza Dati
                </button>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm">
                <HiOutlineCalendarDays className="w-4 h-4" />
                <span>4 Feb 2026</span>
              </div>
            </div>
          </div>

          {/* Context Banner - Auto Data */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                    <HiOutlineCpuChip className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-white font-bold">Dati Automatici</span>
                    <div className="flex items-center gap-2 mt-1">
                      <DataTypeBadge type="auto" small />
                      <span className="text-gray-400 text-xs">Aggiornati in tempo reale</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <HiOutlineServerStack className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold">Sincronizzazione live</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <HiOutlineUserGroup className="w-5 h-5 text-lime-400" />
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-lime-400/20 text-lime-400 rounded-md">LIVE</span>
                  </div>
                  <div className="text-3xl font-extrabold text-lime-400">{auto_calculated?.total_clubs || 0}</div>
                  <div className="text-sm text-gray-400 mt-1">Club Attivi</div>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <HiOutlineCurrencyEuro className="w-5 h-5 text-green-500" />
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-500/20 text-green-500 rounded-md">LIVE</span>
                  </div>
                  <div className="text-3xl font-extrabold text-green-500">{formatCurrency(auto_calculated?.total_arr || 0)}</div>
                  <div className="text-sm text-gray-400 mt-1">ARR Attuale</div>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-500 rounded-md">LIVE</span>
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-500">{auto_calculated?.converted_leads || 0}</div>
                  <div className="text-sm text-gray-400 mt-1">Lead Convertiti</div>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <HiOutlineHandRaised className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-md">LIVE</span>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-500">{auto_calculated?.total_sponsors || 0}</div>
                  <div className="text-sm text-gray-400 mt-1">Sponsor Attivi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend Banner */}
          {showLegend && (
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 border-2 border-gray-200 relative">
              <button
                onClick={() => setShowLegend(false)}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <HiOutlineInformationCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-bold text-gray-900">Come leggere i dati</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-emerald-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                      <HiOutlineCpuChip className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700 text-sm">Dati Automatici</div>
                      <DataTypeBadge type="auto" small />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Calcolati in tempo reale: <strong>Funnel</strong> da Lead stages, <strong>ARR</strong> da Contratti attivi.
                    <span className="text-emerald-700 font-semibold"> Non modificabili.</span>
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border-2 border-amber-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
                      <HiOutlinePencilSquare className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-700 text-sm">Dati Manuali</div>
                      <DataTypeBadge type="manual" small />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Solo per <strong>Milestone</strong> e <strong>Credibilità</strong> (obiettivi qualitativi).
                    <span className="text-amber-700 font-semibold"> Clicca per modificare.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showLegend && (
            <button
              onClick={() => setShowLegend(true)}
              className="flex items-center gap-2 px-4 py-2.5 mb-6 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              <HiOutlineInformationCircle className="w-4 h-4" />
              Mostra legenda dati
            </button>
          )}

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map(tab => (
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

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* KPI Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Club Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center">
                      <HiOutlineUserGroup className="w-6 h-6 text-gray-900" />
                    </div>
                    <DataTypeBadge type="auto" small />
                  </div>
                  <div className="text-3xl font-bold mb-1">{auto_calculated?.total_clubs || 0} / {targets?.clubs}</div>
                  <div className="text-gray-400 text-sm">Club Target</div>
                  <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((auto_calculated?.total_clubs || 0) / targets?.clubs) * 100, 100)}%`,
                        backgroundColor: getProgressColor(auto_calculated?.total_clubs, targets?.clubs)
                      }}
                    />
                  </div>
                </div>

                {/* ARR Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center">
                      <HiOutlineCurrencyEuro className="w-6 h-6 text-gray-900" />
                    </div>
                    <DataTypeBadge type="auto" small />
                  </div>
                  <div className="text-3xl font-bold mb-1">{formatPercent(auto_calculated?.total_arr, targets?.arr)}</div>
                  <div className="text-gray-400 text-sm">ARR vs Target €225k</div>
                  <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((auto_calculated?.total_arr || 0) / targets?.arr) * 100, 100)}%`,
                        backgroundColor: getProgressColor(auto_calculated?.total_arr, targets?.arr)
                      }}
                    />
                  </div>
                </div>

                {/* Contracts Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center">
                      <HiOutlineHandRaised className="w-6 h-6 text-gray-900" />
                    </div>
                    <DataTypeBadge type="auto" small />
                  </div>
                  <div className="text-3xl font-bold mb-1">{auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0} / {targets?.contracts}</div>
                  <div className="text-gray-400 text-sm">Contratti Chiusi</div>
                  <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(((auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0) / targets?.contracts) * 100, 100)}%`,
                        backgroundColor: getProgressColor(auto_calculated?.funnel?.contracts || ytd_totals?.contracts, targets?.contracts)
                      }}
                    />
                  </div>
                </div>

                {/* Milestones Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center">
                      <HiOutlineFlag className="w-6 h-6 text-gray-900" />
                    </div>
                    <DataTypeBadge type="manual" small />
                  </div>
                  <div className="text-3xl font-bold mb-1">{milestones?.completed || 0} / {milestones?.total || 0}</div>
                  <div className="text-gray-400 text-sm">Milestone Completate</div>
                  <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${milestones?.total ? (milestones.completed / milestones.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quarterly Progress */}
              <div className="bg-white rounded-2xl border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiOutlineCalendarDays className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Andamento Trimestrale</h3>
                  </div>
                  <DataTypeBadge type="auto" />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                      const target = targets?.quarterly?.[q];
                      const actual = quarterly_actuals?.[q];
                      const isCurrentQuarter = (q === 'Q1' && new Date().getMonth() < 3) ||
                        (q === 'Q2' && new Date().getMonth() >= 3 && new Date().getMonth() < 6) ||
                        (q === 'Q3' && new Date().getMonth() >= 6 && new Date().getMonth() < 9) ||
                        (q === 'Q4' && new Date().getMonth() >= 9);

                      return (
                        <div
                          key={q}
                          className={`rounded-2xl p-5 ${
                            isCurrentQuarter
                              ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-lime-400'
                              : 'bg-gray-50 border-2 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className={`text-lg font-bold ${isCurrentQuarter ? 'text-white' : 'text-gray-900'}`}>
                              {q}
                            </span>
                            {isCurrentQuarter && (
                              <span className="px-2 py-1 bg-lime-400 text-gray-900 rounded-lg text-[10px] font-bold">
                                ATTUALE
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className={`flex justify-between text-xs mb-1 ${isCurrentQuarter ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>Club</span>
                                <span>{actual?.new_clubs || 0} / {target?.clubs}</span>
                              </div>
                              <div className={`h-1 rounded-full ${isCurrentQuarter ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(((actual?.new_clubs || 0) / (target?.clubs || 1)) * 100, 100)}%`,
                                    backgroundColor: getProgressColor(actual?.new_clubs, target?.clubs)
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className={`flex justify-between text-xs mb-1 ${isCurrentQuarter ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>Demo</span>
                                <span>{actual?.demos || 0} / {target?.demos}</span>
                              </div>
                              <div className={`h-1 rounded-full ${isCurrentQuarter ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(((actual?.demos || 0) / (target?.demos || 1)) * 100, 100)}%`,
                                    backgroundColor: getProgressColor(actual?.demos, target?.demos)
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className={`flex justify-between text-xs mb-1 ${isCurrentQuarter ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>Contratti</span>
                                <span>{actual?.contracts || 0} / {target?.contracts}</span>
                              </div>
                              <div className={`h-1 rounded-full ${isCurrentQuarter ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(((actual?.contracts || 0) / (target?.contracts || 1)) * 100, 100)}%`,
                                    backgroundColor: getProgressColor(actual?.contracts, target?.contracts)
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Club Mix */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiOutlineSparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Distribuzione Club per Piano</h3>
                  </div>
                  <DataTypeBadge type="auto" />
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-6 text-center border-2 border-gray-200">
                      <HiOutlineStar className="w-8 h-8 mx-auto text-gray-500 mb-3" />
                      <div className="text-4xl font-extrabold text-gray-900 mb-2">
                        {auto_calculated?.clubs_by_plan?.basic || 0}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">Basic / Kickoff</div>
                      <span className="inline-block px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                        Target: {targets?.clubs_basic}
                      </span>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-6 text-center border-2 border-indigo-200">
                      <HiOutlineSparkles className="w-8 h-8 mx-auto text-indigo-500 mb-3" />
                      <div className="text-4xl font-extrabold text-gray-900 mb-2">
                        {auto_calculated?.clubs_by_plan?.premium || 0}
                      </div>
                      <div className="text-sm text-indigo-600 mb-2">Premium</div>
                      <span className="inline-block px-3 py-1 bg-indigo-200 text-indigo-700 rounded-full text-xs font-semibold">
                        Target: {targets?.clubs_premium}
                      </span>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-6 text-center border-2 border-amber-300">
                      <HiOutlineBolt className="w-8 h-8 mx-auto text-amber-500 mb-3" />
                      <div className="text-4xl font-extrabold text-gray-900 mb-2">
                        {auto_calculated?.clubs_by_plan?.elite || 0}
                      </div>
                      <div className="text-sm text-amber-600 mb-2">Elite</div>
                      <span className="inline-block px-3 py-1 bg-amber-300 text-amber-800 rounded-full text-xs font-semibold">
                        Target: {targets?.clubs_elite}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: MONTHLY DATA - 100% AUTOMATICO */}
          {activeTab === 'monthly' && (
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiOutlineCalendarDays className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Andamento Mensile</h3>
                  <DataTypeBadge type="auto" />
                </div>
                <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold">
                  <HiOutlineCpuChip className="w-4 h-4" />
                  Aggregato automaticamente da Lead, Contratti e Fatture
                </span>
              </div>
              <div className="p-6">
                {/* Month Selector */}
                <div className="grid grid-cols-12 gap-2 mb-6">
                  {months.map(m => {
                    const monthData = monthly_auto_data?.find(d => d.month === m.value);
                    const hasActivity = monthData && (monthData.contacts > 0 || monthData.demos > 0 || monthData.contracts > 0 || monthData.booking > 0);

                    return (
                      <button
                        key={m.value}
                        onClick={() => setSelectedMonth(m.value)}
                        className={`relative py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
                          selectedMonth === m.value
                            ? 'bg-gray-900 text-white border-2 border-gray-900'
                            : hasActivity
                              ? 'bg-emerald-50 text-gray-900 border-2 border-emerald-200 hover:border-emerald-300'
                              : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {m.short}
                        {hasActivity && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Month Data View - Automatic */}
                {(() => {
                  const monthData = monthly_auto_data?.find(d => d.month === selectedMonth) || {};
                  const hasAnyData = monthData.contacts > 0 || monthData.demos > 0 || monthData.contracts > 0 || monthData.booking > 0;

                  return (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-gray-900">
                            {months.find(m => m.value === selectedMonth)?.label} 2026
                          </h4>
                          <DataTypeBadge type="auto" small />
                        </div>
                        {!hasAnyData && (
                          <span className="text-sm text-gray-400 italic">Nessuna attività registrata</span>
                        )}
                      </div>

                      {/* Funnel Section */}
                      <div className="mb-6">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <HiOutlineChartBar className="w-4 h-4" /> Funnel Vendite (da Lead CRM)
                        </h5>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                            <HiOutlinePhone className="w-5 h-5 mx-auto text-gray-500 mb-2" />
                            <div className="text-2xl font-extrabold text-gray-900">{monthData.contacts || 0}</div>
                            <div className="text-xs text-gray-500">Contatti</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                            <HiOutlineVideoCamera className="w-5 h-5 mx-auto text-blue-500 mb-2" />
                            <div className="text-2xl font-extrabold text-gray-900">{monthData.demos || 0}</div>
                            <div className="text-xs text-gray-500">Demo</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                            <HiOutlineDocumentText className="w-5 h-5 mx-auto text-purple-500 mb-2" />
                            <div className="text-2xl font-extrabold text-gray-900">{monthData.proposals || 0}</div>
                            <div className="text-xs text-gray-500">Proposte</div>
                          </div>
                          <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                            <HiOutlineHandRaised className="w-5 h-5 mx-auto text-green-500 mb-2" />
                            <div className="text-2xl font-extrabold text-gray-900">{monthData.contracts || 0}</div>
                            <div className="text-xs text-gray-500">Contratti</div>
                          </div>
                        </div>
                      </div>

                      {/* Revenue Section */}
                      <div className="mb-6">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <HiOutlineCurrencyEuro className="w-4 h-4" /> Revenue (da Contratti e Fatture)
                        </h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-4 rounded-xl text-center border border-emerald-200">
                            <div className="text-xs text-emerald-700 mb-1 font-semibold">Cash-in</div>
                            <div className="text-xl font-extrabold text-emerald-600">{formatCurrency(monthData.booking || 0)}</div>
                            <div className="text-[10px] text-emerald-500 mt-1">Fatture pagate</div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl text-center border border-blue-200">
                            <div className="text-xs text-blue-700 mb-1 font-semibold">ARR Nuovo</div>
                            <div className="text-xl font-extrabold text-blue-600">{formatCurrency(monthData.arr_new || 0)}</div>
                            <div className="text-[10px] text-blue-500 mt-1">Contratti firmati</div>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-4 rounded-xl text-center border border-amber-200">
                            <div className="text-xs text-amber-700 mb-1 font-semibold">Add-on Totale</div>
                            <div className="text-xl font-extrabold text-amber-600">{formatCurrency(monthData.addon_total || 0)}</div>
                            <div className="text-[10px] text-amber-500 mt-1">Setup + Training + Custom</div>
                          </div>
                        </div>
                      </div>

                      {/* Add-on Breakdown */}
                      {(monthData.addon_setup > 0 || monthData.addon_training > 0 || monthData.addon_custom > 0) && (
                        <div className="mb-6">
                          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <HiOutlineSparkles className="w-4 h-4" /> Dettaglio Add-on
                          </h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded-xl text-center border border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Setup/Onboarding</div>
                              <div className="text-lg font-bold text-gray-700">{formatCurrency(monthData.addon_setup || 0)}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl text-center border border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Formazione</div>
                              <div className="text-lg font-bold text-gray-700">{formatCurrency(monthData.addon_training || 0)}</div>
                            </div>
                            <div className="bg-white p-3 rounded-xl text-center border border-gray-100">
                              <div className="text-xs text-gray-500 mb-1">Custom/Integrazioni</div>
                              <div className="text-lg font-bold text-gray-700">{formatCurrency(monthData.addon_custom || 0)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Clubs */}
                      {(monthData.new_clubs_total > 0) && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <HiOutlineUserGroup className="w-4 h-4" /> Nuovi Club Acquisiti
                          </h5>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl text-center">
                              <div className="text-xs text-gray-400 mb-1">Totale</div>
                              <div className="text-2xl font-extrabold text-lime-400">{monthData.new_clubs_total || 0}</div>
                            </div>
                            <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
                              <HiOutlineStar className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                              <div className="text-lg font-bold text-gray-700">{monthData.new_clubs_basic || 0}</div>
                              <div className="text-xs text-gray-500">Basic</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl text-center border border-indigo-200">
                              <HiOutlineSparkles className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
                              <div className="text-lg font-bold text-indigo-600">{monthData.new_clubs_premium || 0}</div>
                              <div className="text-xs text-indigo-500">Premium</div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-300">
                              <HiOutlineBolt className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                              <div className="text-lg font-bold text-amber-600">{monthData.new_clubs_elite || 0}</div>
                              <div className="text-xs text-amber-500">Elite</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Data Source Info */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <HiOutlineInformationCircle className="w-4 h-4" />
                          <span>Dati aggregati automaticamente da: <strong>CRMLead</strong> (funnel), <strong>AdminContract</strong> (ARR, club), <strong>AdminInvoice</strong> (cash-in)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Monthly Summary Table */}
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">Riepilogo Annuale</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 rounded-l-lg">Mese</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Contatti</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Demo</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Proposte</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Contratti</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">Cash-in</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600">ARR Nuovo</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600 rounded-r-lg">Club</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthly_auto_data?.map((m, idx) => {
                          const hasData = m.contacts > 0 || m.demos > 0 || m.contracts > 0 || m.booking > 0;
                          return (
                            <tr
                              key={m.month}
                              className={`border-b border-gray-100 ${selectedMonth === m.month ? 'bg-blue-50' : hasData ? 'bg-emerald-50/50' : ''}`}
                            >
                              <td className="px-3 py-2 font-medium text-gray-900">{months[idx]?.short}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{m.contacts || '-'}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{m.demos || '-'}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{m.proposals || '-'}</td>
                              <td className="px-3 py-2 text-center font-semibold text-green-600">{m.contracts || '-'}</td>
                              <td className="px-3 py-2 text-center text-emerald-600">{m.booking > 0 ? formatCurrency(m.booking) : '-'}</td>
                              <td className="px-3 py-2 text-center text-blue-600">{m.arr_new > 0 ? formatCurrency(m.arr_new) : '-'}</td>
                              <td className="px-3 py-2 text-center font-semibold text-gray-900">{m.new_clubs_total || '-'}</td>
                            </tr>
                          );
                        })}
                        {/* Totals Row */}
                        <tr className="bg-gray-900 text-white font-semibold">
                          <td className="px-3 py-3 rounded-l-lg">TOTALE YTD</td>
                          <td className="px-3 py-3 text-center">{monthly_auto_data?.reduce((sum, m) => sum + (m.contacts || 0), 0)}</td>
                          <td className="px-3 py-3 text-center">{monthly_auto_data?.reduce((sum, m) => sum + (m.demos || 0), 0)}</td>
                          <td className="px-3 py-3 text-center">{monthly_auto_data?.reduce((sum, m) => sum + (m.proposals || 0), 0)}</td>
                          <td className="px-3 py-3 text-center text-lime-400">{monthly_auto_data?.reduce((sum, m) => sum + (m.contracts || 0), 0)}</td>
                          <td className="px-3 py-3 text-center text-emerald-400">{formatCurrency(monthly_auto_data?.reduce((sum, m) => sum + (m.booking || 0), 0))}</td>
                          <td className="px-3 py-3 text-center text-blue-400">{formatCurrency(monthly_auto_data?.reduce((sum, m) => sum + (m.arr_new || 0), 0))}</td>
                          <td className="px-3 py-3 text-center text-lime-400 rounded-r-lg">{monthly_auto_data?.reduce((sum, m) => sum + (m.new_clubs_total || 0), 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FUNNEL */}
          {activeTab === 'funnel' && (
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiOutlineChartBar className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Funnel Vendite YTD</h3>
                  <DataTypeBadge type="auto" />
                </div>
                <span className="text-sm text-gray-500">Calcolato automaticamente dagli stage dei Lead CRM</span>
              </div>
              <div className="p-6">
                {/* Funnel Visual */}
                <div className="max-w-xl mx-auto mb-8 space-y-4">
                  {[
                    { stage: 'Contatti Qualificati', value: auto_calculated?.funnel?.contacts || ytd_totals?.contacts || 0, target: targets?.contacts, color: 'bg-gray-200', textColor: 'text-gray-900' },
                    { stage: 'Demo Effettuate', value: auto_calculated?.funnel?.demos || ytd_totals?.demos || 0, target: targets?.demos, color: 'bg-blue-400', textColor: 'text-white', rate: conversion_rates?.contact_to_demo },
                    { stage: 'Proposte Inviate', value: auto_calculated?.funnel?.proposals || ytd_totals?.proposals || 0, target: targets?.proposals, color: 'bg-indigo-500', textColor: 'text-white', rate: conversion_rates?.demo_to_proposal },
                    { stage: 'Contratti Chiusi', value: auto_calculated?.funnel?.contracts || ytd_totals?.contracts || 0, target: targets?.contracts, color: 'bg-green-500', textColor: 'text-white', rate: conversion_rates?.proposal_to_contract }
                  ].map((stage, index) => (
                    <div key={index} className="relative">
                      <div
                        className={`flex items-center justify-between p-5 rounded-xl ${stage.color} ${stage.textColor} transition-all`}
                        style={{ width: `${100 - (index * 12)}%`, marginLeft: `${index * 6}%` }}
                      >
                        <span className="font-semibold">{stage.stage}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-extrabold">{stage.value}</span>
                          <span className={`text-sm ${index > 0 ? 'opacity-70' : 'text-gray-500'}`}>/ {stage.target}</span>
                          {stage.rate !== undefined && (
                            <span className="text-xs px-2.5 py-1 bg-white/20 rounded-lg">
                              {stage.rate}% conv.
                            </span>
                          )}
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="absolute left-1/2 -bottom-3 transform -translate-x-1/2 z-10">
                          <HiOutlineArrowTrendingDown className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Conversion Rates */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">Contatto → Demo</div>
                      <div className={`text-4xl font-extrabold ${conversion_rates?.contact_to_demo >= 37 ? 'text-green-500' : 'text-red-500'}`}>
                        {conversion_rates?.contact_to_demo || 0}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Target: 37%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">Demo → Proposta</div>
                      <div className={`text-4xl font-extrabold ${conversion_rates?.demo_to_proposal >= 67 ? 'text-green-500' : 'text-red-500'}`}>
                        {conversion_rates?.demo_to_proposal || 0}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Target: 67%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">Proposta → Chiusura</div>
                      <div className={`text-4xl font-extrabold ${conversion_rates?.proposal_to_contract >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                        {conversion_rates?.proposal_to_contract || 0}%
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Target: 50%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiOutlineFlag className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Milestone 2026</h3>
                  <DataTypeBadge type="manual" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
                    <HiOutlineCursorArrowRays className="w-3 h-3" />
                    Clicca per cambiare stato
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    milestones?.completed === milestones?.total
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {milestones?.completed || 0} / {milestones?.total || 0} completate
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                  const quarterMilestones = milestones?.items?.filter(m => m.quarter === quarter) || [];
                  if (quarterMilestones.length === 0) return null;

                  return (
                    <div key={quarter}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold">
                          {quarter}
                        </span>
                        <span className="text-sm text-gray-500">
                          {quarterMilestones.filter(m => m.status === 'completed').length} / {quarterMilestones.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {quarterMilestones.map(milestone => (
                          <div
                            key={milestone.id}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              milestone.status === 'completed'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => updateMilestone(milestone.id, {
                                  status: milestone.status === 'completed' ? 'not_started' : 'completed'
                                })}
                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  milestone.status === 'completed'
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                }`}
                                title="Clicca per cambiare stato"
                              >
                                {milestone.status === 'completed' && (
                                  <HiOutlineCheckCircle className="w-4 h-4 text-white" />
                                )}
                              </button>
                              <span className={`text-sm font-medium ${
                                milestone.status === 'completed'
                                  ? 'text-green-700 line-through'
                                  : 'text-gray-900'
                              }`}>
                                {milestone.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <select
                                value={milestone.status}
                                onChange={(e) => updateMilestone(milestone.id, { status: e.target.value })}
                                className="px-3 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-semibold bg-white cursor-pointer"
                                style={{ color: getStatusColor(milestone.status) }}
                              >
                                <option value="not_started">Da Iniziare</option>
                                <option value="in_progress">In Corso</option>
                                <option value="completed">Completato</option>
                              </select>

                              {milestone.completion_date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(milestone.completion_date).toLocaleDateString('it-IT')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CREDIBILITY */}
          {activeTab === 'credibility' && (
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HiOutlineTrophy className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">KPI Credibilità (Investor-Ready)</h3>
                  <DataTypeBadge type="manual" />
                </div>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
                  <HiOutlineCursorArrowRays className="w-3 h-3" />
                  Clicca sul valore "Attuale" per modificarlo
                </span>
              </div>
              <div className="p-6 space-y-3">
                {credibility?.map(kpi => (
                  <div
                    key={kpi.id}
                    className="grid grid-cols-5 items-center gap-4 p-5 bg-gray-50 rounded-xl border-2 border-gray-200"
                    style={{ gridTemplateColumns: '1fr 120px 140px 140px 100px' }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{kpi.name}</div>
                      {kpi.notes && (
                        <div className="text-xs text-gray-500 mt-1">{kpi.notes}</div>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] text-gray-400 mb-0.5">Target</div>
                      <div className="text-base font-bold text-gray-900">{kpi.target}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-[10px] text-gray-400 mb-0.5">Attuale</div>
                      {editingCredibility === kpi.id ? (
                        <input
                          type="text"
                          defaultValue={kpi.current_value}
                          onBlur={(e) => updateCredibility(kpi.id, { current_value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateCredibility(kpi.id, { current_value: e.target.value });
                            if (e.key === 'Escape') setEditingCredibility(null);
                          }}
                          autoFocus
                          className="w-24 px-3 py-2 rounded-lg border-2 border-amber-400 text-sm font-semibold text-center bg-amber-50"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingCredibility(kpi.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 font-bold text-base rounded-lg border-2 border-dashed border-green-200 hover:border-green-300 transition-all"
                          title="Clicca per modificare"
                        >
                          {kpi.current_value}
                          <HiOutlinePencilSquare className="w-3 h-3 opacity-50" />
                        </button>
                      )}
                    </div>

                    <div className="text-center">
                      <select
                        value={kpi.status}
                        onChange={(e) => updateCredibility(kpi.id, { status: e.target.value })}
                        className="px-3 py-2 rounded-lg border-2 border-gray-200 text-xs font-semibold bg-white cursor-pointer"
                        style={{ color: getStatusColor(kpi.status) }}
                      >
                        <option value="in_progress">In Corso</option>
                        <option value="completed">Completato</option>
                        <option value="at_risk">A Rischio</option>
                      </select>
                    </div>

                    <div className="text-center">
                      <span className="inline-block px-3 py-1.5 bg-gray-200 text-gray-600 rounded-full text-[11px] font-semibold">
                        {kpi.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAndamento;
