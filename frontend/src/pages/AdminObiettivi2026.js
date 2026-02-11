import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import '../styles/admin-dashboard.css';

// Icons - Heroicons style (hi2)
import {
  HiOutlineFlag,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineCurrencyEuro,
  HiOutlineCalendarDays,
  HiOutlineRocketLaunch,
  HiOutlineShieldCheck,
  HiOutlineChartPie,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineLightBulb,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineTrophy,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineScale,
  HiOutlineGlobeAlt,
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineChevronDown,
  HiOutlineChevronRight
} from 'react-icons/hi2';

function AdminObiettivi2026() {
  const navigate = useNavigate();
  const { user } = getAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeScenario, setActiveScenario] = useState('base');
  const [expandedQuarter, setExpandedQuarter] = useState('Q1');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // Dati obiettivi dal documento
  const northStarGoals = [
    {
      id: 1,
      title: 'Product-Market Fit',
      description: 'Product-Market Fit iniziale nel segmento club sportivi',
      icon: HiOutlineChartPie,
      color: '#6366F1',
      bg: '#EEF2FF'
    },
    {
      id: 2,
      title: 'Costruzione Credibilità',
      description: 'Casi pilota reali, utilizzabili come proof of value',
      icon: HiOutlineShieldCheck,
      color: '#10B981',
      bg: '#ECFDF5'
    },
    {
      id: 3,
      title: 'Revenue Ricorrenti',
      description: 'Avvio revenue ricorrenti (ARR) con modello SaaS',
      icon: HiOutlineArrowTrendingUp,
      color: '#F59E0B',
      bg: '#FFFBEB'
    },
    {
      id: 4,
      title: 'Preparazione Fundraising',
      description: 'Metriche sane, narrativa chiara per 2027',
      icon: HiOutlineRocketLaunch,
      color: '#EC4899',
      bg: '#FDF2F8'
    }
  ];

  const pricingPlans = [
    { name: 'Basic', price: 10000, color: '#6B7280', bgColor: '#F9FAFB' },
    { name: 'Premium', price: 15000, color: '#3B82F6', bgColor: '#EFF6FF' },
    { name: 'Elite', price: 25000, color: '#F59E0B', bgColor: '#FFFBEB' }
  ];

  const scenarios = {
    conservative: {
      name: 'Conservativo',
      clubs: 10,
      mix: { basic: 5, premium: 4, elite: 1 },
      arrSaas: 135000,
      addOn: { min: 30000, max: 40000 },
      totalMin: 165000,
      totalMax: 175000,
      color: '#6B7280'
    },
    base: {
      name: 'Base (Target)',
      clubs: 15,
      mix: { basic: 6, premium: 6, elite: 3 },
      arrSaas: 225000,
      addOn: { min: 60000, max: 80000 },
      totalMin: 285000,
      totalMax: 305000,
      color: '#10B981'
    },
    aggressive: {
      name: 'Aggressivo',
      clubs: 20,
      mix: { basic: 7, premium: 9, elite: 4 },
      arrSaas: 305000,
      addOn: { min: 90000, max: 110000 },
      totalMin: 395000,
      totalMax: 415000,
      color: '#6366F1'
    }
  };

  const quarterlyTimeline = {
    Q1: {
      period: 'Feb - Mar 2026',
      goals: [
        { text: 'MVP funzionante', completed: false },
        { text: '10-15 demo effettuate', completed: false },
        { text: '1° club pilota in closing', completed: false }
      ],
      contracts: 1,
      booking: 0
    },
    Q2: {
      period: 'Apr - Giu 2026',
      goals: [
        { text: '3 club attivi', completed: false },
        { text: 'Prime revenue (€30-50k)', completed: false },
        { text: 'Feedback prodotto strutturato', completed: false }
      ],
      contracts: 4,
      booking: 75000
    },
    Q3: {
      period: 'Lug - Set 2026',
      goals: [
        { text: '7 club totali', completed: false },
        { text: 'ARR run-rate €120k', completed: false },
        { text: '1 caso studio solido', completed: false }
      ],
      contracts: 4,
      booking: 150000
    },
    Q4: {
      period: 'Ott - Dic 2026',
      goals: [
        { text: '15 club attivi', completed: false },
        { text: 'ARR €225k+', completed: false },
        { text: '3 case study pubblicati', completed: false },
        { text: 'Investor narrative pronta', completed: false }
      ],
      contracts: 6,
      booking: 225000
    }
  };

  const salesFunnel = [
    { stage: 'Club Contattati', value: 120, color: '#E5E7EB', textColor: '#1F2937' },
    { stage: 'Demo Effettuate', value: 45, color: '#93C5FD', textColor: '#1E40AF', rate: '37%' },
    { stage: 'Proposte Inviate', value: 30, color: '#6366F1', textColor: '#ffffff', rate: '67%' },
    { stage: 'Contratti Chiusi', value: 15, color: '#10B981', textColor: '#ffffff', rate: '50%' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineChartPie },
    { id: 'revenue', label: 'Revenue', icon: HiOutlineCurrencyEuro },
    { id: 'sales', label: 'Go-To-Market', icon: HiOutlineRocketLaunch },
    { id: 'timeline', label: 'Timeline', icon: HiOutlineCalendarDays },
    { id: 'scenarios', label: 'Scenari', icon: HiOutlineChartBar }
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Obiettivi 2026</h1>
              <p className="text-gray-500 mt-1">KPI & Target strategici per la validazione di mercato</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm">
              <HiOutlineCalendarDays className="w-4 h-4" />
              <span>4 Feb 2026</span>
            </div>
          </div>

          {/* Context Banner */}
          <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-900 relative overflow-hidden">
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wide">
                  Fase Pre-Revenue
                </span>
              </div>
              <p className="text-gray-900 text-lg">
                <span className="font-semibold">0 clienti • 0 fatturato</span>
                <span className="mx-3">→</span>
                <span className="font-semibold">Validazione + Revenue ricorrenti + Credibilità investitori</span>
              </p>
            </div>
          </div>

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
              {/* North Star Goals */}
              <div className="bg-white rounded-2xl border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <HiOutlineStar className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold text-gray-900">Obiettivi Strategici (North Star)</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {northStarGoals.map(goal => (
                      <div
                        key={goal.id}
                        className="p-5 rounded-xl border-2 border-gray-100 hover:border-gray-300 transition-all cursor-default"
                        style={{ backgroundColor: goal.bg }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                          style={{ backgroundColor: goal.color }}
                        >
                          <goal.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">{goal.id}. {goal.title}</h4>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
                      <HiOutlineUserGroup className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">TARGET</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">15</div>
                  <div className="text-gray-400 text-sm">Club Target 2026</div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
                      <HiOutlineCurrencyEuro className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">ARR</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">€225k</div>
                  <div className="text-gray-400 text-sm">ARR Target</div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
                      <HiOutlineBanknotes className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">REVENUE</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">€285-305k</div>
                  <div className="text-gray-400 text-sm">Fatturato Totale</div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center">
                      <HiOutlineArrowTrendingUp className="w-6 h-6 text-gray-900" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-lg">CASH</span>
                  </div>
                  <div className="text-3xl font-bold mb-1">€220-240k</div>
                  <div className="text-gray-400 text-sm">Cash-in Reale</div>
                </div>
              </div>

              {/* Investor Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <HiOutlineBuildingOffice2 className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Sintesi per Investitori</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target 2026</div>
                      <div className="text-sm font-semibold text-gray-900">Validazione + Prime revenue</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">ARR Atteso</div>
                      <div className="text-2xl font-bold text-green-600">€225k</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cash-in</div>
                      <div className="text-2xl font-bold text-blue-600">€220-240k</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Break-even</div>
                      <div className="text-sm font-semibold text-yellow-600">Non richiesto 2026</div>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-5 text-center">
                    <div className="text-gray-400 text-sm mb-2">Obiettivo Reale</div>
                    <div className="text-white text-lg font-semibold">
                      Dimostrare che i club <span className="text-lime-400">pagano</span>, <span className="text-lime-400">usano</span> e <span className="text-lime-400">rinnovano</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI da NON inseguire */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiOutlineXCircle className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-gray-900">KPI da NON Inseguire nel 2026</h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-red-100 text-red-700 rounded-full">
                    Focus: Trazione Reale
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Fatturato marketplace', icon: HiOutlineGlobeAlt },
                      { label: 'Scalabilità internazionale', icon: HiOutlineGlobeAlt },
                      { label: 'Margini perfetti', icon: HiOutlineScale },
                      { label: 'Automazioni enterprise', icon: HiOutlineCog6Tooth }
                    ].map((kpi, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <kpi.icon className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-red-800">{kpi.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center gap-3">
                    <HiOutlineLightBulb className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      <strong>Focus 2026:</strong> Trazione reale, non vanity metrics.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: REVENUE */}
          {activeTab === 'revenue' && (
            <>
              {/* Pricing Plans */}
              <div className="bg-white rounded-2xl border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiOutlineSparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Pricing di Riferimento (ARR)</h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                    ARPA medio: ~€15.000
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {pricingPlans.map((plan, index) => (
                      <div
                        key={index}
                        className={`rounded-2xl p-6 text-center ${index === 2 ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'border-2 border-gray-200'}`}
                        style={{ backgroundColor: index !== 2 ? plan.bgColor : undefined }}
                      >
                        {index === 2 && (
                          <span className="inline-block px-2 py-1 bg-lime-400 text-gray-900 rounded-lg text-xs font-bold mb-4">
                            PREMIUM
                          </span>
                        )}
                        <div className="text-lg font-bold mb-2" style={{ color: index !== 2 ? plan.color : 'white' }}>
                          {plan.name}
                        </div>
                        <div className="text-4xl font-extrabold mb-1" style={{ color: index === 2 ? '#a3e635' : plan.color }}>
                          {formatCurrency(plan.price)}
                        </div>
                        <div className={`text-sm ${index === 2 ? 'text-gray-400' : 'text-gray-500'}`}>/anno</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* SaaS */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOutlineDocumentText className="w-5 h-5 text-blue-500" />
                    Ricavi SaaS (Abbonamenti)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">6 Basic × €10.000</span>
                      <span className="font-bold">€60.000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">6 Premium × €15.000</span>
                      <span className="font-bold">€90.000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">3 Elite × €25.000</span>
                      <span className="font-bold">€75.000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-500 text-white rounded-xl mt-4">
                      <span className="font-semibold">Totale ARR SaaS</span>
                      <span className="text-xl font-bold">€225.000</span>
                    </div>
                  </div>
                </div>

                {/* Add-on */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOutlineBanknotes className="w-5 h-5 text-yellow-500" />
                    Ricavi Add-on (One-off)
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Setup & onboarding (8×€2.5k)</span>
                      <span className="font-bold">€20.000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Formazione (10×€2k)</span>
                      <span className="font-bold">€20.000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 text-sm">Custom / integrazioni</span>
                      <span className="font-bold">€20-40k</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-yellow-500 text-white rounded-xl mt-4">
                      <span className="font-semibold">Totale Add-on</span>
                      <span className="text-xl font-bold">€60-80k</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8">
                <div className="grid grid-cols-5 gap-4 items-center text-center">
                  <div>
                    <div className="text-gray-400 text-sm mb-2">ARR SaaS</div>
                    <div className="text-3xl font-bold text-green-400">€225k</div>
                  </div>
                  <div className="text-4xl text-gray-600">+</div>
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Add-on</div>
                    <div className="text-3xl font-bold text-yellow-400">€60-80k</div>
                  </div>
                  <div className="text-4xl text-gray-600">=</div>
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Fatturato Totale</div>
                    <div className="text-3xl font-bold text-lime-400">€285-305k</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: SALES / GO-TO-MARKET */}
          {activeTab === 'sales' && (
            <>
              {/* Sales Funnel */}
              <div className="bg-white rounded-2xl border border-gray-200 mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <HiOutlineChartPie className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Funnel Commerciale (Annuo)</h3>
                </div>
                <div className="p-6">
                  <div className="max-w-xl mx-auto space-y-4">
                    {salesFunnel.map((stage, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-5 rounded-xl transition-all"
                        style={{
                          backgroundColor: stage.color,
                          width: `${100 - (index * 12)}%`,
                          marginLeft: `${index * 6}%`
                        }}
                      >
                        <span className="font-semibold" style={{ color: stage.textColor }}>{stage.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold" style={{ color: stage.textColor }}>{stage.value}</span>
                          {stage.rate && (
                            <span className="text-xs px-2 py-1 bg-white/20 rounded-lg text-white">
                              {stage.rate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conversion Rates */}
                  <div className="grid grid-cols-2 gap-8 mt-8 max-w-md mx-auto">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">Contatto → Demo</div>
                      <div className="text-3xl font-bold text-indigo-600">37%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-2">Proposta → Chiusura</div>
                      <div className="text-3xl font-bold text-green-600">50%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales KPIs */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOutlineFlag className="w-5 h-5 text-red-500" />
                    Obiettivi Vendita Annuali
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Contratti chiusi</span>
                      <span className="text-2xl font-bold">15</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Valore medio contratto</span>
                      <span className="text-2xl font-bold">€15k</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Booking mensile medio</span>
                      <span className="text-2xl font-bold">€18-20k</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HiOutlineClock className="w-5 h-5 text-blue-500" />
                    Ciclo di Vendita
                  </h4>
                  <div className="space-y-4">
                    <div className="p-5 bg-blue-50 rounded-xl text-center">
                      <div className="text-sm text-blue-600 font-semibold mb-1">Sales Cycle Target</div>
                      <div className="text-4xl font-bold text-blue-700">60-90</div>
                      <div className="text-sm text-gray-500">giorni</div>
                    </div>
                    <div className="p-5 bg-yellow-50 rounded-xl text-center">
                      <div className="text-sm text-yellow-700 font-semibold mb-1">Primi Pilot</div>
                      <div className="text-4xl font-bold text-yellow-700">90-120</div>
                      <div className="text-sm text-gray-500">giorni</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <HiOutlineCalendarDays className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Timeline per Trimestre</h3>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(quarterlyTimeline).map(([quarter, data]) => (
                  <div
                    key={quarter}
                    className={`rounded-2xl overflow-hidden transition-all ${
                      expandedQuarter === quarter
                        ? 'bg-gradient-to-r from-gray-900 to-gray-800'
                        : 'bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedQuarter(expandedQuarter === quarter ? null : quarter)}
                      className="w-full p-5 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${
                          expandedQuarter === quarter
                            ? 'bg-white text-gray-900'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {quarter}
                        </div>
                        <div className="text-left">
                          <div className={`font-bold ${expandedQuarter === quarter ? 'text-white' : 'text-gray-900'}`}>
                            {quarter} 2026
                          </div>
                          <div className={`text-sm ${expandedQuarter === quarter ? 'text-gray-400' : 'text-gray-500'}`}>
                            {data.period}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${expandedQuarter === quarter ? 'text-white' : 'text-gray-900'}`}>
                            {data.contracts}
                          </div>
                          <div className={`text-xs ${expandedQuarter === quarter ? 'text-gray-400' : 'text-gray-500'}`}>
                            contratti
                          </div>
                        </div>
                        {data.booking > 0 && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-500">
                              €{(data.booking / 1000).toFixed(0)}k
                            </div>
                            <div className={`text-xs ${expandedQuarter === quarter ? 'text-gray-400' : 'text-gray-500'}`}>
                              booking
                            </div>
                          </div>
                        )}
                        <HiOutlineChevronDown className={`w-5 h-5 transition-transform ${
                          expandedQuarter === quarter ? 'text-white rotate-180' : 'text-gray-400'
                        }`} />
                      </div>
                    </button>

                    {expandedQuarter === quarter && (
                      <div className="px-5 pb-5">
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-sm text-gray-400 mb-3 font-semibold">Obiettivi:</div>
                          <div className="space-y-2">
                            {data.goals.map((goal, gIndex) => (
                              <div key={gIndex} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                  goal.completed ? 'bg-green-500' : 'bg-white/10'
                                }`}>
                                  {goal.completed && <HiOutlineCheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-white text-sm">{goal.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Progress Bar */}
                <div className="mt-6 p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold text-gray-900">Booking Cumulato Target</span>
                    <span className="font-bold text-green-600">€225k</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="w-[5%] bg-gray-500" title="Q1: €0" />
                    <div className="w-[28%] bg-blue-500" title="Q2: €75k" />
                    <div className="w-[34%] bg-purple-500" title="Q3: €150k" />
                    <div className="w-[33%] bg-green-500" title="Q4: €225k" />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Q1</span>
                    <span>Q2: ~€75k</span>
                    <span>Q3: ~€150k</span>
                    <span>Q4: ~€225k</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SCENARIOS */}
          {activeTab === 'scenarios' && (
            <>
              {/* Scenario Selector */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {Object.entries(scenarios).map(([key, scenario]) => (
                  <button
                    key={key}
                    onClick={() => setActiveScenario(key)}
                    className={`p-5 rounded-2xl border-3 transition-all ${
                      activeScenario === key
                        ? 'border-current bg-opacity-10'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: activeScenario === key ? scenario.color : undefined,
                      backgroundColor: activeScenario === key ? `${scenario.color}10` : undefined
                    }}
                  >
                    <div className="font-bold mb-1" style={{ color: activeScenario === key ? scenario.color : '#1F2937' }}>
                      {scenario.name}
                    </div>
                    <div className="text-3xl font-bold" style={{ color: activeScenario === key ? scenario.color : '#6B7280' }}>
                      {scenario.clubs} club
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Scenario */}
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color: scenarios[activeScenario].color }}>
                    {scenarios[activeScenario].name}
                  </h3>
                  {activeScenario === 'base' && (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                      TARGET
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {/* Club Mix */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-5 bg-gray-50 rounded-xl text-center">
                      <HiOutlineStar className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <div className="text-3xl font-bold mb-1">{scenarios[activeScenario].mix.basic}</div>
                      <div className="text-gray-500">Basic</div>
                      <div className="text-xs text-gray-400 mt-1">× €10k = €{scenarios[activeScenario].mix.basic * 10}k</div>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl text-center">
                      <HiOutlineSparkles className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <div className="text-3xl font-bold mb-1">{scenarios[activeScenario].mix.premium}</div>
                      <div className="text-blue-600">Premium</div>
                      <div className="text-xs text-gray-400 mt-1">× €15k = €{scenarios[activeScenario].mix.premium * 15}k</div>
                    </div>
                    <div className="p-5 bg-yellow-50 rounded-xl text-center">
                      <HiOutlineTrophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                      <div className="text-3xl font-bold mb-1">{scenarios[activeScenario].mix.elite}</div>
                      <div className="text-yellow-600">Elite</div>
                      <div className="text-xs text-gray-400 mt-1">× €25k = €{scenarios[activeScenario].mix.elite * 25}k</div>
                    </div>
                  </div>

                  {/* Revenue Summary */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-gray-400 text-sm mb-2">Club</div>
                        <div className="text-3xl font-bold text-white">{scenarios[activeScenario].clubs}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-2">ARR SaaS</div>
                        <div className="text-3xl font-bold text-green-400">€{(scenarios[activeScenario].arrSaas / 1000).toFixed(0)}k</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-2">Add-on</div>
                        <div className="text-3xl font-bold text-yellow-400">
                          €{(scenarios[activeScenario].addOn.min / 1000).toFixed(0)}-{(scenarios[activeScenario].addOn.max / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-2">Totale</div>
                        <div className="text-3xl font-bold text-lime-400">
                          €{(scenarios[activeScenario].totalMin / 1000).toFixed(0)}-{(scenarios[activeScenario].totalMax / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-2xl border border-gray-200 mt-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                  <HiOutlineScale className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Confronto Scenari</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Metrica</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Conservativo</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-green-600 bg-green-50">Base (Target)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-600">Aggressivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 font-medium">Club Attivi</td>
                      <td className="px-6 py-4 text-center">10</td>
                      <td className="px-6 py-4 text-center bg-green-50 font-bold">15</td>
                      <td className="px-6 py-4 text-center">20</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium">Mix (B/P/E)</td>
                      <td className="px-6 py-4 text-center">5/4/1</td>
                      <td className="px-6 py-4 text-center bg-green-50 font-bold">6/6/3</td>
                      <td className="px-6 py-4 text-center">7/9/4</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium">ARR SaaS</td>
                      <td className="px-6 py-4 text-center">€135k</td>
                      <td className="px-6 py-4 text-center bg-green-50 font-bold text-green-600">€225k</td>
                      <td className="px-6 py-4 text-center">€305k</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium">Add-on</td>
                      <td className="px-6 py-4 text-center">€30-40k</td>
                      <td className="px-6 py-4 text-center bg-green-50 font-bold">€60-80k</td>
                      <td className="px-6 py-4 text-center">€90-110k</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 font-bold">Fatturato Totale</td>
                      <td className="px-6 py-4 text-center font-bold">€165-175k</td>
                      <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-100">€285-305k</td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">€395-415k</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminObiettivi2026;
