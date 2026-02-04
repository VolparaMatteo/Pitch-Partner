import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAuth } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import {
  HiOutlineCurrencyEuro,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash
} from 'react-icons/hi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const STATUS_CONFIG = {
  draft: { label: 'Bozza', color: 'bg-gray-100 text-gray-800', icon: HiOutlineClock },
  pending: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800', icon: HiOutlineClock },
  paid: { label: 'Pagata', color: 'bg-green-100 text-green-800', icon: HiOutlineCheckCircle },
  overdue: { label: 'Scaduta', color: 'bg-red-100 text-red-800', icon: HiOutlineExclamationCircle },
  cancelled: { label: 'Annullata', color: 'bg-gray-100 text-gray-800', icon: HiOutlineX }
};

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const AdminFinance = () => {
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;
  const hasFetched = useRef(false);

  const [dashboard, setDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    contract_id: '',
    amount: '',
    vat_rate: 22,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    notes: ''
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (token && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [dashboardRes, invoicesRes, contractsRes] = await Promise.all([
        fetch(`${API_URL}/admin/finance/dashboard?year=${selectedYear}`, { headers }),
        fetch(`${API_URL}/admin/invoices`, { headers }),
        fetch(`${API_URL}/admin/contracts?status=active`, { headers })
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboard(data);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nella creazione della fattura');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione della fattura');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      const response = await fetch(`${API_URL}/admin/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_date: new Date().toISOString().split('T')[0] })
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'aggiornamento');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa fattura?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'eliminazione');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!window.confirm('Generare fatture automatiche per tutti i contratti attivi?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/finance/generate-invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Generate ${data.generated?.length || 0} fatture`);
        fetchData();
      } else {
        alert(data.error || 'Errore nella generazione');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nella generazione delle fatture');
    }
  };

  const resetForm = () => {
    setFormData({
      contract_id: '',
      amount: '',
      vat_rate: 22,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      notes: ''
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const calculateTotal = () => {
    const amount = parseFloat(formData.amount) || 0;
    const vatRate = parseFloat(formData.vat_rate) || 22;
    const vat = amount * (vatRate / 100);
    return amount + vat;
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus && inv.status !== filterStatus) return false;
    return true;
  });

  const getMaxCashIn = () => {
    if (!dashboard?.cash_in?.by_month) return 1;
    return Math.max(...Object.values(dashboard.cash_in.by_month), 1);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-red-500">Accesso non autorizzato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finanze & Fatturazione</h1>
              <p className="text-gray-600 mt-1">Gestisci ARR, fatture e incassi</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateInvoices}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <HiOutlineRefresh className="w-5 h-5" />
                Genera Fatture
              </button>
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <HiOutlinePlus className="w-5 h-5" />
                Nuova Fattura
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Fatture
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* KPI Cards */}
              {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* ARR */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">ARR</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.arr?.total)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HiOutlineTrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">MRR: {formatCurrency(dashboard.arr?.mrr)}</p>
                  </div>

                  {/* Cash-in YTD */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cash-in {selectedYear}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.cash_in?.year_total)}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiOutlineCurrencyEuro className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Questo mese: {formatCurrency(dashboard.cash_in?.this_month)}</p>
                  </div>

                  {/* Pending */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Da Incassare</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(dashboard.pending?.total)}</p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <HiOutlineClock className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{dashboard.pending?.count} fatture in attesa</p>
                  </div>

                  {/* Overdue */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Scadute</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(dashboard.pending?.overdue_total)}</p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{dashboard.pending?.overdue_count} fatture scadute</p>
                  </div>
                </div>
              )}

              {/* ARR by Plan */}
              {dashboard?.arr?.by_plan && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ARR per Piano</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-2">Basic</span>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard.arr.by_plan.basic)}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">Premium</span>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard.arr.by_plan.premium)}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-2">Elite</span>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(dashboard.arr.by_plan.elite)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Cash-in Chart */}
              {dashboard?.cash_in?.by_month && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Cash-in Mensile</h3>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        hasFetched.current = false;
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 h-48">
                    {MONTHS.map((month, idx) => {
                      const value = dashboard.cash_in.by_month[idx + 1] || 0;
                      const maxValue = getMaxCashIn();
                      const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      const currentMonth = new Date().getMonth();
                      const isPast = idx < currentMonth;
                      const isCurrent = idx === currentMonth;

                      return (
                        <div key={month} className="flex-1 flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">{value > 0 ? formatCurrency(value).replace('EUR', '').trim() : ''}</div>
                          <div
                            className={`w-full rounded-t transition-all ${
                              isCurrent ? 'bg-blue-600' : isPast ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${month}: ${formatCurrency(value)}`}
                          />
                          <div className={`text-xs mt-2 ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-500'}`}>{month}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Club Balance Table */}
              {dashboard?.by_club?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Situazione per Club</h3>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Piano</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valore Contratto</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagato</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Da Pagare</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboard.by_club.map((club, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{club.club_name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              club.plan === 'elite' ? 'bg-purple-100 text-purple-800' :
                              club.plan === 'premium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {club.plan?.charAt(0).toUpperCase() + club.plan?.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">{formatCurrency(club.contract_value)}</td>
                          <td className="px-6 py-4 text-right text-green-600">{formatCurrency(club.paid)}</td>
                          <td className="px-6 py-4 text-right text-yellow-600">{formatCurrency(club.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Invoice Filters */}
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
                <div className="flex gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tutti gli stati</option>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredInvoices.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Nessuna fattura trovata</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N. Fattura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emissione</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.map((invoice) => {
                        const StatusIcon = STATUS_CONFIG[invoice.status]?.icon || HiOutlineClock;
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoice_number}</td>
                            <td className="px-6 py-4">{invoice.club_name}</td>
                            <td className="px-6 py-4 text-right font-semibold">{formatCurrency(invoice.total_amount)}</td>
                            <td className="px-6 py-4 text-sm">{formatDate(invoice.issue_date)}</td>
                            <td className="px-6 py-4 text-sm">{formatDate(invoice.due_date)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[invoice.status]?.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {STATUS_CONFIG[invoice.status]?.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                {invoice.status === 'pending' && (
                                  <button
                                    onClick={() => handleMarkPaid(invoice.id)}
                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                    title="Segna come pagata"
                                  >
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => { setSelectedInvoice(invoice); setShowDetailModal(true); }}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Visualizza"
                                >
                                  <HiOutlineEye className="w-5 h-5" />
                                </button>
                                {invoice.status !== 'paid' && (
                                  <button
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Elimina"
                                  >
                                    <HiOutlineTrash className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
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
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Nuova Fattura</h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contract Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contratto</label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => {
                    const contract = contracts.find(c => c.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      contract_id: e.target.value,
                      amount: contract ? contract.total_value : ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona un contratto...</option>
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.club_name} - {contract.plan_type} ({formatCurrency(contract.total_value)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Importo Netto</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IVA %</label>
                  <input
                    type="number"
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Total Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Totale (IVA inclusa)</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Emissione</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Scadenza</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo Da</label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo A</label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crea Fattura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Fattura {selectedInvoice.invoice_number}</h2>
                <button onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }} className="text-gray-400 hover:text-gray-600">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Club</span>
                <span className="font-semibold">{selectedInvoice.club_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Importo Netto</span>
                <span>{formatCurrency(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IVA ({selectedInvoice.vat_rate}%)</span>
                <span>{formatCurrency(selectedInvoice.vat_amount)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-medium">Totale</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Emissione</span>
                <span>{formatDate(selectedInvoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scadenza</span>
                <span>{formatDate(selectedInvoice.due_date)}</span>
              </div>
              {selectedInvoice.payment_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="text-green-600">{formatDate(selectedInvoice.payment_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Stato</span>
                <span className={`px-2 py-1 rounded-full text-sm ${STATUS_CONFIG[selectedInvoice.status]?.color}`}>
                  {STATUS_CONFIG[selectedInvoice.status]?.label}
                </span>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <span className="text-gray-500">Note</span>
                  <p className="mt-1 text-sm">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => { handleMarkPaid(selectedInvoice.id); setShowDetailModal(false); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Segna come Pagata
                </button>
              )}
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
