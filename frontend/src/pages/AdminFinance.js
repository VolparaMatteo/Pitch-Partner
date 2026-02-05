import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import {
  FaEuroSign,
  FaFileInvoiceDollar,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaTimes,
  FaChartLine,
  FaEye,
  FaTrash,
  FaChevronDown,
  FaBuilding,
  FaCrown,
  FaChevronLeft,
  FaChevronRight,
  FaInbox
} from 'react-icons/fa';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const STATUS_CONFIG = {
  draft: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6', icon: FaClock },
  pending: { label: 'In Attesa', color: '#F59E0B', bg: '#FFFBEB', icon: FaClock },
  paid: { label: 'Pagata', color: '#059669', bg: '#ECFDF5', icon: FaCheckCircle },
  overdue: { label: 'Scaduta', color: '#DC2626', bg: '#FEF2F2', icon: FaExclamationCircle },
  cancelled: { label: 'Annullata', color: '#6B7280', bg: '#F3F4F6', icon: FaTimes }
};

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const AdminFinance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authData = useMemo(() => getAuth(), []);
  const { user, token } = authData;

  const [dashboard, setDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, selectedYear]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [dashboardRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/admin/finance/dashboard?year=${selectedYear}`, { headers }),
        fetch(`${API_URL}/admin/invoices`, { headers })
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboard(data);
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error(err);
    } finally {
      setLoading(false);
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const getMaxCashIn = () => {
    if (!dashboard?.cash_in?.by_month) return 1;
    return Math.max(...Object.values(dashboard.cash_in.by_month), 1);
  };

  const getStatusLabel = () => {
    if (filterStatus === 'all') return 'Tutti gli stati';
    return STATUS_CONFIG[filterStatus]?.label || 'Tutti gli stati';
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
    { id: 'invoices', label: 'Fatture', icon: FaFileInvoiceDollar }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <p style={{ color: '#DC2626' }}>Accesso non autorizzato</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento Finanze...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Finanze & Fatturazione</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            Gestisci ARR, fatture e incassi
          </p>
        </div>
        <div className="tp-page-actions">
          <button
            className="tp-btn tp-btn-primary"
            onClick={() => navigate('/admin/fatture/new')}
          >
            <FaPlus /> Nuova Fattura
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      {dashboard && (
        <div className="tp-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaChartLine style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{formatCurrency(dashboard.arr?.total)}</div>
              <div className="tp-stat-label">ARR (MRR: {formatCurrency(dashboard.arr?.mrr)})</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaEuroSign style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{formatCurrency(dashboard.cash_in?.year_total)}</div>
              <div className="tp-stat-label">Cash-in {selectedYear}</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaClock style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value">{formatCurrency(dashboard.pending?.total)}</div>
              <div className="tp-stat-label">Da Incassare ({dashboard.pending?.count || 0})</div>
            </div>
          </div>

          <div className="tp-stat-card-dark">
            <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
              <FaExclamationCircle style={{ color: '#1F2937' }} />
            </div>
            <div className="tp-stat-content">
              <div className="tp-stat-value" style={{ color: dashboard.pending?.overdue_total > 0 ? '#FCA5A5' : undefined }}>
                {formatCurrency(dashboard.pending?.overdue_total)}
              </div>
              <div className="tp-stat-label">Scadute ({dashboard.pending?.overdue_count || 0})</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="tp-card">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? '#1A1A1A' : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : '#6B7280',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="tp-card-body">
          {error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#DC2626' }}>{error}</div>
          ) : activeTab === 'dashboard' ? (
            <>
              {/* ARR by Plan */}
              {dashboard?.arr?.by_plan && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>ARR per Piano</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                      { key: 'basic', label: 'Basic', color: '#6B7280', bg: '#F9FAFB' },
                      { key: 'premium', label: 'Premium', color: '#3B82F6', bg: '#EFF6FF' },
                      { key: 'elite', label: 'Elite', color: '#F59E0B', bg: '#FFFBEB' }
                    ].map(plan => (
                      <div key={plan.key} style={{
                        background: plan.bg,
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: 'white',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: plan.color,
                          marginBottom: '12px'
                        }}>
                          <FaCrown size={10} color={plan.color} />
                          {plan.label}
                        </span>
                        <p style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '8px 0 0' }}>
                          {formatCurrency(dashboard.arr.by_plan[plan.key])}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Cash-in Chart */}
              {dashboard?.cash_in?.by_month && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>Cash-in Mensile</h3>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                      }}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    height: '200px',
                    padding: '20px',
                    background: '#FAFAFA',
                    borderRadius: '12px'
                  }}>
                    {MONTHS.map((month, idx) => {
                      const value = dashboard.cash_in.by_month[idx + 1] || 0;
                      const maxValue = getMaxCashIn();
                      const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      const currentMonth = new Date().getMonth();
                      const isPast = idx < currentMonth;
                      const isCurrent = idx === currentMonth;

                      return (
                        <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px', height: '16px' }}>
                            {value > 0 ? `€${(value / 1000).toFixed(0)}k` : ''}
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: `${Math.max(height, 4)}%`,
                              borderRadius: '4px 4px 0 0',
                              background: isCurrent ? '#85FF00' : isPast ? '#059669' : '#E5E7EB',
                              transition: 'all 0.3s'
                            }}
                            title={`${month}: ${formatCurrency(value)}`}
                          />
                          <div style={{
                            fontSize: '11px',
                            marginTop: '8px',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? '#1A1A1A' : '#6B7280'
                          }}>
                            {month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Club Balance Table */}
              {dashboard?.by_club?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                    Situazione per Club
                  </h3>
                  <div className="tp-table-container">
                    <table className="tp-table">
                      <thead>
                        <tr>
                          <th>Club</th>
                          <th>Piano</th>
                          <th style={{ textAlign: 'right' }}>Valore Contratto</th>
                          <th style={{ textAlign: 'right' }}>Pagato</th>
                          <th style={{ textAlign: 'right' }}>Da Pagare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.by_club.map((club, idx) => {
                          const planColors = {
                            basic: { bg: '#F9FAFB', color: '#6B7280' },
                            premium: { bg: '#EFF6FF', color: '#3B82F6' },
                            elite: { bg: '#FFFBEB', color: '#F59E0B' }
                          };
                          const colors = planColors[club.plan?.toLowerCase()] || planColors.basic;

                          return (
                            <tr key={idx}>
                              <td>
                                <div className="tp-table-user">
                                  <div className="tp-table-avatar" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                                    {club.club_logo_url ? (
                                      <img
                                        src={getImageUrl(club.club_logo_url)}
                                        alt={club.club_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <FaBuilding size={16} color="#9CA3AF" />
                                    )}
                                  </div>
                                  <span className="tp-table-name">{club.club_name}</span>
                                </div>
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: colors.bg,
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: colors.color
                                }}>
                                  <FaCrown size={10} color={colors.color} />
                                  {club.plan?.charAt(0).toUpperCase() + club.plan?.slice(1)}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(club.contract_value)}</td>
                              <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>{formatCurrency(club.paid)}</td>
                              <td style={{ textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{formatCurrency(club.pending)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Invoice Filters */}
              <div style={{ marginBottom: '20px' }}>
                <div ref={statusDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      border: filterStatus !== 'all' ? '2px solid #85FF00' : '2px solid #E5E7EB',
                      borderRadius: '8px',
                      background: filterStatus !== 'all' ? 'rgba(133, 255, 0, 0.08)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '180px'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: filterStatus === 'all' ? '#6B7280' : STATUS_CONFIG[filterStatus]?.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {filterStatus === 'all' ? <FaFileInvoiceDollar size={12} /> : (() => {
                        const Icon = STATUS_CONFIG[filterStatus]?.icon;
                        return Icon ? <Icon size={12} /> : null;
                      })()}
                    </div>
                    <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      {getStatusLabel()}
                    </span>
                    <FaChevronDown
                      size={12}
                      color="#6B7280"
                      style={{
                        transition: 'transform 0.2s',
                        transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0)'
                      }}
                    />
                  </button>
                  {statusDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      minWidth: '200px',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => { setFilterStatus('all'); setStatusDropdownOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: filterStatus === 'all' ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                          borderLeft: filterStatus === 'all' ? '3px solid #85FF00' : '3px solid transparent'
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <FaFileInvoiceDollar size={14} />
                        </div>
                        <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                          Tutti gli stati
                        </span>
                        {filterStatus === 'all' && <FaCheckCircle size={12} color="#85FF00" />}
                      </div>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const isSelected = filterStatus === key;
                        const Icon = config.icon;
                        return (
                          <div
                            key={key}
                            onClick={() => { setFilterStatus(key); setStatusDropdownOpen(false); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(133, 255, 0, 0.1)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #85FF00' : '3px solid transparent'
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: config.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <Icon size={14} />
                            </div>
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                              {config.label}
                            </span>
                            {isSelected && <FaCheckCircle size={12} color="#85FF00" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices Table */}
              <div className="tp-table-container">
                {paginatedInvoices.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px',
                    color: '#6B7280'
                  }}>
                    <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Nessuna fattura trovata</p>
                  </div>
                ) : (
                  <table className="tp-table">
                    <thead>
                      <tr>
                        <th>N. Fattura</th>
                        <th>Club</th>
                        <th style={{ textAlign: 'right' }}>Importo</th>
                        <th>Emissione</th>
                        <th>Scadenza</th>
                        <th>Stato</th>
                        <th style={{ textAlign: 'right' }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((invoice) => {
                        const StatusIcon = STATUS_CONFIG[invoice.status]?.icon || FaClock;
                        const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;

                        return (
                          <tr key={invoice.id}>
                            <td style={{ fontWeight: 600 }}>{invoice.invoice_number}</td>
                            <td>
                              <div className="tp-table-user">
                                <div className="tp-table-avatar" style={{ borderRadius: '50%' }}>
                                  <FaBuilding size={14} color="#9CA3AF" />
                                </div>
                                <span className="tp-table-name">{invoice.club_name}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.total_amount)}</td>
                            <td>{formatDate(invoice.issue_date)}</td>
                            <td>{formatDate(invoice.due_date)}</td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                background: statusConfig.bg,
                                color: statusConfig.color,
                                fontSize: '12px',
                                fontWeight: 500
                              }}>
                                <StatusIcon size={10} />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td>
                              <div className="tp-table-actions">
                                {invoice.status === 'pending' && (
                                  <button
                                    className="tp-btn-icon"
                                    onClick={() => handleMarkPaid(invoice.id)}
                                    title="Segna come pagata"
                                    style={{ color: '#059669' }}
                                  >
                                    <FaCheckCircle />
                                  </button>
                                )}
                                <button
                                  className="tp-btn-icon tp-btn-icon-view"
                                  onClick={() => { setSelectedInvoice(invoice); setShowDetailModal(true); }}
                                  title="Visualizza"
                                >
                                  <FaEye />
                                </button>
                                {invoice.status !== 'paid' && (
                                  <button
                                    className="tp-btn-icon"
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    title="Elimina"
                                    style={{ color: '#DC2626' }}
                                  >
                                    <FaTrash />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="tp-pagination">
                  <button
                    className="tp-pagination-btn"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="tp-pagination-info">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <button
                    className="tp-pagination-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                Fattura {selectedInvoice.invoice_number}
              </h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#6B7280'
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Club</span>
                <span style={{ fontWeight: 600 }}>{selectedInvoice.club_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Importo Netto</span>
                <span>{formatCurrency(selectedInvoice.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>IVA ({selectedInvoice.vat_rate}%)</span>
                <span>{formatCurrency(selectedInvoice.vat_amount)}</span>
              </div>
              <div style={{
                borderTop: '1px solid #E5E7EB',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 600 }}>Totale</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#059669' }}>
                  {formatCurrency(selectedInvoice.total_amount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Emissione</span>
                <span>{formatDate(selectedInvoice.issue_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Scadenza</span>
                <span>{formatDate(selectedInvoice.due_date)}</span>
              </div>
              {selectedInvoice.payment_date && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280' }}>Pagamento</span>
                  <span style={{ color: '#059669' }}>{formatDate(selectedInvoice.payment_date)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B7280' }}>Stato</span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: STATUS_CONFIG[selectedInvoice.status]?.bg,
                  color: STATUS_CONFIG[selectedInvoice.status]?.color,
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {STATUS_CONFIG[selectedInvoice.status]?.label}
                </span>
              </div>
              {selectedInvoice.notes && (
                <div>
                  <span style={{ color: '#6B7280' }}>Note</span>
                  <p style={{ marginTop: '8px', fontSize: '14px' }}>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              {selectedInvoice.status === 'pending' && (
                <button
                  onClick={() => { handleMarkPaid(selectedInvoice.id); setShowDetailModal(false); }}
                  style={{
                    padding: '10px 20px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Segna come Pagata
                </button>
              )}
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                style={{
                  padding: '10px 20px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
