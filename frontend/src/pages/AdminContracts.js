import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAuth } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineCalendar,
  HiOutlineCurrencyEuro,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineRefresh
} from 'react-icons/hi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

// Plan configuration
const PLAN_CONFIG = {
  basic: { name: 'Basic', price: 10000, color: 'bg-gray-100 text-gray-800' },
  kickoff: { name: 'Kickoff', price: 10000, color: 'bg-gray-100 text-gray-800' },
  premium: { name: 'Premium', price: 15000, color: 'bg-blue-100 text-blue-800' },
  elite: { name: 'Elite', price: 25000, color: 'bg-purple-100 text-purple-800' }
};

const ADDON_OPTIONS = [
  { id: 'setup', name: 'Setup & Onboarding', price: 2500 },
  { id: 'training', name: 'Training Avanzato', price: 2000 },
  { id: 'custom', name: 'Sviluppo Custom', price: 5000 },
  { id: 'support_premium', name: 'Supporto Premium', price: 3000 },
  { id: 'integration', name: 'Integrazioni API', price: 4000 }
];

const STATUS_CONFIG = {
  draft: { label: 'Bozza', color: 'bg-gray-100 text-gray-800', icon: HiOutlineClock },
  active: { label: 'Attivo', color: 'bg-green-100 text-green-800', icon: HiOutlineCheckCircle },
  expired: { label: 'Scaduto', color: 'bg-red-100 text-red-800', icon: HiOutlineExclamationCircle },
  cancelled: { label: 'Annullato', color: 'bg-red-100 text-red-800', icon: HiOutlineX },
  renewed: { label: 'Rinnovato', color: 'bg-blue-100 text-blue-800', icon: HiOutlineRefresh }
};

const AdminContracts = () => {
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;
  const hasFetched = useRef(false);

  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    club_id: '',
    plan_type: 'premium',
    plan_price: 15000,
    addons: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    payment_terms: 'annual',
    payment_method: 'bank_transfer',
    notes: '',
    signed_by: '',
    signed_date: ''
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

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

      const [contractsRes, statsRes, clubsRes] = await Promise.all([
        fetch(`${API_URL}/admin/contracts`, { headers }),
        fetch(`${API_URL}/admin/contracts/stats`, { headers }),
        fetch(`${API_URL}/admin/contracts/clubs-without-contract`, { headers })
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.contracts || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (clubsRes.ok) {
        const data = await clubsRes.json();
        setClubs(data.clubs || []);
      }
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/contracts`, {
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
        alert(data.error || 'Errore nella creazione del contratto');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nella creazione del contratto');
    }
  };

  const handleUpdateContract = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/contracts/${selectedContract.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedContract(null);
        resetForm();
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'aggiornamento del contratto');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nell\'aggiornamento del contratto');
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo contratto?')) return;

    try {
      const response = await fetch(`${API_URL}/admin/contracts/${contractId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Errore nell\'eliminazione del contratto');
      }
    } catch (err) {
      console.error(err);
      alert('Errore nell\'eliminazione del contratto');
    }
  };

  const resetForm = () => {
    setFormData({
      club_id: '',
      plan_type: 'premium',
      plan_price: 15000,
      addons: [],
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      payment_terms: 'annual',
      payment_method: 'bank_transfer',
      notes: '',
      signed_by: '',
      signed_date: ''
    });
  };

  const openEditModal = (contract) => {
    setSelectedContract(contract);
    setFormData({
      club_id: contract.club_id,
      plan_type: contract.plan_type,
      plan_price: contract.plan_price,
      addons: contract.addons || [],
      start_date: contract.start_date,
      end_date: contract.end_date,
      renewal_date: contract.renewal_date || '',
      payment_terms: contract.payment_terms,
      payment_method: contract.payment_method || '',
      notes: contract.notes || '',
      signed_by: contract.signed_by || '',
      signed_date: contract.signed_date || '',
      status: contract.status
    });
    setShowModal(true);
  };

  const handlePlanChange = (planType) => {
    setFormData({
      ...formData,
      plan_type: planType,
      plan_price: PLAN_CONFIG[planType]?.price || 10000
    });
  };

  const toggleAddon = (addon) => {
    // Usa l'ID per match coerente con backend
    const exists = formData.addons.find(a => a.id === addon.id || a.name === addon.name);
    if (exists) {
      setFormData({
        ...formData,
        addons: formData.addons.filter(a => a.id !== addon.id && a.name !== addon.name)
      });
    } else {
      setFormData({
        ...formData,
        addons: [...formData.addons, { id: addon.id, name: addon.name, price: addon.price }]
      });
    }
  };

  const calculateTotal = () => {
    const planPrice = formData.plan_price || 0;
    const addonsTotal = formData.addons.reduce((sum, a) => sum + (a.price || 0), 0);
    return planPrice + addonsTotal;
  };

  const filteredContracts = contracts.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPlan && c.plan_type !== filterPlan) return false;
    return true;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT');
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
              <h1 className="text-2xl font-bold text-gray-900">Gestione Contratti</h1>
              <p className="text-gray-600 mt-1">Gestisci i contratti con i Club</p>
            </div>
            <button
              onClick={() => { resetForm(); setSelectedContract(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Nuovo Contratto
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ARR Totale</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total_arr)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <HiOutlineCurrencyEuro className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">MRR: {formatCurrency(stats.mrr)}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contratti Attivi</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active_contracts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HiOutlineDocumentText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valore Medio</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.avg_contract_value)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <HiOutlineCalendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">In Scadenza</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.expiring_soon}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <HiOutlineExclamationCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Prossimi 90 giorni</p>
              </div>
            </div>
          )}

          {/* ARR by Plan */}
          {stats && stats.arr_by_plan && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ARR per Piano</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(stats.arr_by_plan).map(([plan, arr]) => (
                  <div key={plan} className="text-center p-4 bg-gray-50 rounded-lg">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${PLAN_CONFIG[plan]?.color || 'bg-gray-100'} mb-2`}>
                      {PLAN_CONFIG[plan]?.name || plan}
                    </span>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(arr)}</p>
                    <p className="text-sm text-gray-500">{stats.contracts_by_plan?.[plan] || 0} contratti</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti gli stati</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i piani</option>
                {Object.entries(PLAN_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Caricamento...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredContracts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nessun contratto trovato</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valore</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => {
                    const StatusIcon = STATUS_CONFIG[contract.status]?.icon || HiOutlineClock;
                    return (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{contract.club_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PLAN_CONFIG[contract.plan_type]?.color || 'bg-gray-100'}`}>
                            {PLAN_CONFIG[contract.plan_type]?.name || contract.plan_type}
                          </span>
                          {contract.addons?.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">+{contract.addons.length} addon</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(contract.total_value)}</div>
                          <div className="text-xs text-gray-500">/anno</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(contract.start_date)}</div>
                          <div className="text-xs text-gray-500">→ {formatDate(contract.end_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[contract.status]?.color || 'bg-gray-100'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[contract.status]?.label || contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setSelectedContract(contract); setShowDetailModal(true); }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Visualizza"
                            >
                              <HiOutlineEye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openEditModal(contract)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Modifica"
                            >
                              <HiOutlinePencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContract(contract.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Elimina"
                            >
                              <HiOutlineTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Club senza contratto */}
          {clubs.length > 0 && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Club senza contratto attivo</h3>
              <div className="flex flex-wrap gap-2">
                {clubs.map(club => (
                  <span key={club.id} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {club.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedContract ? 'Modifica Contratto' : 'Nuovo Contratto'}
                </h2>
                <button onClick={() => { setShowModal(false); setSelectedContract(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Club Selection */}
              {!selectedContract && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Club</label>
                  <select
                    value={formData.club_id}
                    onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleziona un club...</option>
                    {clubs.map(club => (
                      <option key={club.id} value={club.id}>{club.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Piano</label>
                <div className="grid grid-cols-3 gap-4">
                  {['basic', 'premium', 'elite'].map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => handlePlanChange(plan)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.plan_type === plan
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{PLAN_CONFIG[plan].name}</div>
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(PLAN_CONFIG[plan].price)}</div>
                      <div className="text-xs text-gray-500">/anno</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Addons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
                <div className="space-y-2">
                  {ADDON_OPTIONS.map(addon => (
                    <label
                      key={addon.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.addons.find(a => a.id === addon.id || a.name === addon.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!formData.addons.find(a => a.id === addon.id || a.name === addon.name)}
                          onChange={() => toggleAddon(addon)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-medium text-gray-900">{addon.name}</span>
                      </div>
                      <span className="text-blue-600 font-semibold">{formatCurrency(addon.price)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Valore Totale Contratto</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Inizio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fine</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Termini di Pagamento</label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="annual">Annuale</option>
                    <option value="semi_annual">Semestrale</option>
                    <option value="quarterly">Trimestrale</option>
                    <option value="monthly">Mensile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metodo di Pagamento</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bank_transfer">Bonifico Bancario</option>
                    <option value="credit_card">Carta di Credito</option>
                    <option value="sepa">SEPA</option>
                  </select>
                </div>
              </div>

              {/* Signature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firmato da</label>
                  <input
                    type="text"
                    value={formData.signed_by}
                    onChange={(e) => setFormData({ ...formData, signed_by: e.target.value })}
                    placeholder="Nome del firmatario"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Firma</label>
                  <input
                    type="date"
                    value={formData.signed_date}
                    onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status (only for edit) */}
              {selectedContract && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Note aggiuntive..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setSelectedContract(null); resetForm(); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={selectedContract ? handleUpdateContract : handleCreateContract}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedContract ? 'Aggiorna' : 'Crea Contratto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Dettaglio Contratto</h2>
                <button onClick={() => { setShowDetailModal(false); setSelectedContract(null); }} className="text-gray-400 hover:text-gray-600">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Club</span>
                <span className="font-semibold">{selectedContract.club_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Piano</span>
                <span className={`px-2 py-1 rounded-full text-sm ${PLAN_CONFIG[selectedContract.plan_type]?.color}`}>
                  {PLAN_CONFIG[selectedContract.plan_type]?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prezzo Piano</span>
                <span className="font-semibold">{formatCurrency(selectedContract.plan_price)}</span>
              </div>
              {selectedContract.addons?.length > 0 && (
                <div>
                  <span className="text-gray-500">Add-ons</span>
                  <div className="mt-2 space-y-1">
                    {selectedContract.addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{addon.name}</span>
                        <span>{formatCurrency(addon.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between">
                <span className="text-gray-700 font-medium">Valore Totale</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(selectedContract.total_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Periodo</span>
                <span>{formatDate(selectedContract.start_date)} → {formatDate(selectedContract.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stato</span>
                <span className={`px-2 py-1 rounded-full text-sm ${STATUS_CONFIG[selectedContract.status]?.color}`}>
                  {STATUS_CONFIG[selectedContract.status]?.label}
                </span>
              </div>
              {selectedContract.signed_by && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Firmato da</span>
                  <span>{selectedContract.signed_by} ({formatDate(selectedContract.signed_date)})</span>
                </div>
              )}
              {selectedContract.notes && (
                <div>
                  <span className="text-gray-500">Note</span>
                  <p className="mt-1 text-sm text-gray-700">{selectedContract.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedContract(null); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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

export default AdminContracts;
