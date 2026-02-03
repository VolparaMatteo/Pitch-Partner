import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/admin-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineWallet,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
  HiOutlineCalendarDays,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTrendingUp,
  HiOutlineEllipsisVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentText
} from 'react-icons/hi2';

function AdminSubscriptions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    plan_id: searchParams.get('plan_id') || '',
    expiring: searchParams.get('expiring') || '',
    search: ''
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Form data for create
  const [formData, setFormData] = useState({
    club_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    is_trial: true,
    note: ''
  });

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    trial: 0,
    expiring: 0,
    expired: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [filters.status, filters.plan_id, filters.expiring]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsResponse, plansResponse] = await Promise.all([
        api.get('/admin/subscriptions', { params: filters }),
        api.get('/admin/plans')
      ]);

      setSubscriptions(subsResponse.data);
      setPlans(plansResponse.data);

      // Calculate stats
      const all = subsResponse.data;
      setStats({
        active: all.filter(s => s.status === 'active').length,
        trial: all.filter(s => s.status === 'trial').length,
        expiring: all.filter(s => {
          if (!s.data_fine) return false;
          const daysLeft = Math.ceil((new Date(s.data_fine) - new Date()) / (1000 * 60 * 60 * 24));
          return daysLeft > 0 && daysLeft <= 30;
        }).length,
        expired: all.filter(s => s.status === 'expired' || s.status === 'cancelled').length
      });

    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    try {
      if (!formData.club_id || !formData.plan_id) {
        alert('Seleziona un club e un piano');
        return;
      }

      await api.post('/admin/subscriptions', formData);
      setShowCreateModal(false);
      setFormData({
        club_id: '',
        plan_id: '',
        billing_cycle: 'monthly',
        is_trial: true,
        note: ''
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nella creazione');
    }
  };

  const handleRenew = async (subId) => {
    try {
      await api.post(`/admin/subscriptions/${subId}/renew`);
      fetchData();
      setShowActionModal(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nel rinnovo');
    }
  };

  const handleCancel = async (subId, immediate = false) => {
    if (!window.confirm(`Sei sicuro di voler ${immediate ? 'cancellare immediatamente' : 'disattivare'} questo abbonamento?`)) {
      return;
    }

    try {
      await api.post(`/admin/subscriptions/${subId}/cancel`, {
        immediate,
        motivo: 'Cancellato da admin'
      });
      fetchData();
      setShowActionModal(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nella cancellazione');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
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

  const getDaysLeft = (dateString) => {
    if (!dateString) return null;
    return Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (status) => {
    const statuses = {
      active: { label: 'Attivo', color: '#10B981', bg: '#ECFDF5', icon: HiOutlineCheckCircle },
      trial: { label: 'Trial', color: '#3B82F6', bg: '#EFF6FF', icon: HiOutlineClock },
      past_due: { label: 'Scaduto', color: '#F59E0B', bg: '#FFFBEB', icon: HiOutlineExclamationTriangle },
      cancelled: { label: 'Cancellato', color: '#6B7280', bg: '#F3F4F6', icon: HiOutlineXCircle },
      expired: { label: 'Terminato', color: '#EF4444', bg: '#FEF2F2', icon: HiOutlineXCircle }
    };
    return statuses[status] || statuses.active;
  };

  const getBillingLabel = (cycle) => {
    const labels = {
      monthly: 'Mensile',
      quarterly: 'Trimestrale',
      yearly: 'Annuale'
    };
    return labels[cycle] || cycle;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return sub.club?.nome?.toLowerCase().includes(searchLower) ||
             sub.plan?.nome?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento abbonamenti...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Abbonamenti</h1>
          <p className="page-subtitle">Gestione licenze e abbonamenti dei club</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary" onClick={fetchData}>
            <HiOutlineArrowPath size={18} />
            Aggiorna
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <HiOutlinePlusCircle size={18} />
            Nuovo Abbonamento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat-card" onClick={() => setFilters({ ...filters, status: 'active' })}>
          <div className="stat-icon subscriptions">
            <HiOutlineCheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Attivi</span>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => setFilters({ ...filters, status: 'trial' })}>
          <div className="stat-icon trials">
            <HiOutlineClock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.trial}</span>
            <span className="stat-label">In Trial</span>
          </div>
        </div>

        <div className="admin-stat-card warning" onClick={() => setFilters({ ...filters, expiring: '30' })}>
          <div className="stat-icon expiring">
            <HiOutlineExclamationTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.expiring}</span>
            <span className="stat-label">In Scadenza</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon hot-leads">
            <HiOutlineXCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.expired}</span>
            <span className="stat-label">Scaduti/Cancellati</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca club o piano..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-buttons">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tutti gli stati</option>
            <option value="active">Attivo</option>
            <option value="trial">Trial</option>
            <option value="past_due">Scaduto</option>
            <option value="cancelled">Cancellato</option>
            <option value="expired">Terminato</option>
          </select>

          <select
            className="filter-select"
            value={filters.plan_id}
            onChange={(e) => setFilters({ ...filters, plan_id: e.target.value })}
          >
            <option value="">Tutti i piani</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.nome}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.expiring}
            onChange={(e) => setFilters({ ...filters, expiring: e.target.value })}
          >
            <option value="">Scadenza</option>
            <option value="7">Prossimi 7 giorni</option>
            <option value="14">Prossimi 14 giorni</option>
            <option value="30">Prossimi 30 giorni</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Piano</th>
              <th>Stato</th>
              <th>Ciclo</th>
              <th>Importo</th>
              <th>Scadenza</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  <HiOutlineWallet size={32} />
                  <span>Nessun abbonamento trovato</span>
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => {
                const statusInfo = getStatusInfo(sub.status);
                const StatusIcon = statusInfo.icon;
                const daysLeft = getDaysLeft(sub.data_fine);
                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

                return (
                  <tr key={sub.id}>
                    <td>
                      <div className="cell-with-icon">
                        <HiOutlineBuildingOffice2 size={18} className="cell-icon" />
                        <div className="cell-content">
                          <span className="primary-text">{sub.club?.nome || 'N/A'}</span>
                          <span className="secondary-text">{sub.club?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="plan-badge">{sub.plan?.nome || 'N/A'}</span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                      >
                        <StatusIcon size={14} />
                        {statusInfo.label}
                        {sub.is_trial && ' (Trial)'}
                      </span>
                    </td>
                    <td>{getBillingLabel(sub.billing_cycle)}</td>
                    <td>{formatCurrency(sub.importo_corrente)}</td>
                    <td>
                      <div className="cell-content">
                        <span className={`primary-text ${isExpiringSoon ? 'warning' : ''}`}>
                          {formatDate(sub.data_fine)}
                        </span>
                        {daysLeft !== null && (
                          <span className={`secondary-text ${daysLeft <= 0 ? 'error' : isExpiringSoon ? 'warning' : ''}`}>
                            {daysLeft <= 0 ? 'Scaduto' : `${daysLeft} giorni`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn success"
                          onClick={() => handleRenew(sub.id)}
                          title="Rinnova"
                        >
                          <HiOutlineArrowPath size={16} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => navigate(`/admin/subscriptions/${sub.id}`)}
                          title="Dettagli"
                        >
                          <HiOutlineDocumentText size={16} />
                        </button>
                        <button
                          className="action-btn danger"
                          onClick={() => handleCancel(sub.id, true)}
                          title="Cancella"
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuovo Abbonamento</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <HiOutlineXCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Club ID</label>
                <input
                  type="number"
                  value={formData.club_id}
                  onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                  placeholder="ID del club"
                />
              </div>

              <div className="form-group">
                <label>Piano</label>
                <select
                  value={formData.plan_id}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                >
                  <option value="">Seleziona piano</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome} - {formatCurrency(plan.prezzo_mensile)}/mese
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ciclo di Fatturazione</label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                >
                  <option value="monthly">Mensile</option>
                  <option value="quarterly">Trimestrale</option>
                  <option value="yearly">Annuale</option>
                </select>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_trial}
                    onChange={(e) => setFormData({ ...formData, is_trial: e.target.checked })}
                  />
                  Inizia con Trial
                </label>
              </div>

              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Note opzionali..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Annulla
              </button>
              <button className="btn-primary" onClick={handleCreateSubscription}>
                Crea Abbonamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubscriptions;
