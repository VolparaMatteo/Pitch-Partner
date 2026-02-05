import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaCheck, FaTimes,
  FaCalendarAlt, FaCrown, FaFileInvoice,
  FaBuilding, FaInbox, FaFilePdf, FaExternalLinkAlt,
  FaFileContract, FaEuroSign, FaTrash
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PLAN_CONFIG = {
  basic: { name: 'Basic', color: '#6B7280', bg: '#F9FAFB' },
  Basic: { name: 'Basic', color: '#6B7280', bg: '#F9FAFB' },
  premium: { name: 'Premium', color: '#3B82F6', bg: '#EFF6FF' },
  Premium: { name: 'Premium', color: '#3B82F6', bg: '#EFF6FF' },
  elite: { name: 'Elite', color: '#F59E0B', bg: '#FFFBEB' },
  Elite: { name: 'Elite', color: '#F59E0B', bg: '#FFFBEB' }
};

const STATUS_CONFIG = {
  draft: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6', icon: <FaFileContract /> },
  active: { label: 'Attivo', color: '#059669', bg: '#ECFDF5', icon: <FaCheck /> },
  expired: { label: 'Scaduto', color: '#DC2626', bg: '#FEF2F2', icon: <FaTimes /> },
  cancelled: { label: 'Annullato', color: '#DC2626', bg: '#FEF2F2', icon: <FaTimes /> },
  renewed: { label: 'Rinnovato', color: '#3B82F6', bg: '#EFF6FF', icon: <FaCheck /> }
};

const PAYMENT_TERMS = {
  annual: 'Annuale',
  semi_annual: 'Semestrale',
  quarterly: 'Trimestrale',
  monthly: 'Mensile'
};

function AdminContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user, token } = getAuth();

  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${API_URL}/admin/contracts/${contractId}`, { headers });
      const data = res.data.contract || res.data;
      setContract(data);
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Errore caricamento contratto:', error);
      setToast({ message: 'Errore nel caricamento del contratto', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/admin/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Contratto eliminato con successo', type: 'success' });
      setTimeout(() => navigate('/admin/contratti'), 1500);
    } catch (error) {
      console.error('Errore eliminazione:', error);
      setToast({ message: error.response?.data?.error || 'Errore nell\'eliminazione', type: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="sd-page">
        <div className="tp-loading-container">
          <div className="tp-loading-spinner"></div>
          <p className="tp-loading-text">Caricamento contratto...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="sd-page">
        <div className="tp-empty-state">
          <h3>Contratto non trovato</h3>
          <button className="tp-btn tp-btn-primary" onClick={() => navigate('/admin/contratti')}>
            Torna alla lista
          </button>
        </div>
      </div>
    );
  }

  const planConfig = PLAN_CONFIG[contract.plan_type] || PLAN_CONFIG.basic;
  const statusConfig = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
  const contractTotalWithVat = contract.total_value_with_vat || contract.total_value || 0;
  const monthlyValue = Math.round(contractTotalWithVat / 12);

  const tabs = [
    { id: 'details', label: 'Dettagli', icon: <FaFileContract size={14} /> },
    { id: 'invoices', label: 'Fatture', icon: <FaFileInvoice size={14} />, count: invoices.length }
  ];

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* SIDEBAR */}
        <div className="sd-profile-card">
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/admin/contratti')}>
              <FaArrowLeft />
            </button>
            <div className="sd-header-actions">
              <button className="sd-header-btn edit" onClick={() => navigate(`/admin/contratti/${contractId}/edit`)}>
                <FaPen />
              </button>
            </div>
          </div>

          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar" style={{ background: contract.club_logo_url ? 'white' : undefined }}>
              {contract.club_logo_url ? (
                <img src={getImageUrl(contract.club_logo_url)} alt={contract.club_name} style={{ objectFit: 'contain', padding: '8px' }} />
              ) : (
                <div className="sd-profile-avatar-placeholder"><FaBuilding /></div>
              )}
            </div>
            <h1 className="sd-profile-name">{contract.club_name}</h1>
            <p className="sd-profile-sector">Piano {planConfig.name}</p>
            <span className="sd-profile-status" style={{ background: statusConfig.bg, color: statusConfig.color }}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>

          <div className="sd-profile-body">
            {/* Valore Contratto */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Valore Contratto</h3>
              <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#059669' }}>
                  {formatCurrency(contractTotalWithVat)}
                </div>
                <div style={{ fontSize: '13px', color: '#065F46', marginTop: '4px' }}>/anno (IVA incl.)</div>
                <div style={{ fontSize: '11px', color: '#065F46', marginTop: '2px' }}>Netto: {formatCurrency(contract.total_value)}</div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #A7F3D0', display: 'flex', justifyContent: 'center', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#059669' }}>{formatCurrency(monthlyValue)}</div>
                    <div style={{ fontSize: '11px', color: '#065F46' }}>MRR</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Periodo */}
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Periodo</h3>
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Inizio</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{formatDate(contract.start_date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Fine</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>{formatDate(contract.end_date)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>
                  Fatturazione: {PAYMENT_TERMS[contract.payment_terms] || '-'}
                </div>
              </div>
            </div>

            {/* PDF */}
            {contract.contract_document_url && (
              <div className="sd-profile-section">
                <h3 className="sd-section-title">Documento</h3>
                <a
                  href={getImageUrl(contract.contract_document_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    color: '#DC2626',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  <FaFilePdf size={18} />
                  Visualizza PDF
                  <FaExternalLinkAlt size={12} />
                </a>
              </div>
            )}

            {/* Elimina */}
            <div style={{ marginTop: '24px' }}>
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => setShowDeleteModal(true)}
                style={{ width: '100%', justifyContent: 'center', borderColor: '#DC2626', color: '#DC2626' }}
              >
                <FaTrash /> Elimina Contratto
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="sd-content-card">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
            {tabs.map(tab => (
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
                  cursor: 'pointer'
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    background: activeTab === tab.id ? '#FFFFFF' : '#E5E7EB',
                    color: activeTab === tab.id ? '#1A1A1A' : '#6B7280',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="sd-tab-content">
            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaFileContract /> Dettagli Contratto</h3>
                  <button
                    className="tp-btn tp-btn-outline"
                    onClick={() => navigate(`/admin/clubs/${contract.club_id}`)}
                  >
                    <FaBuilding /> Vai al Club
                  </button>
                </div>

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                      {formatCurrency(monthlyValue)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#065F46' }}>MRR</div>
                  </div>
                  <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>
                      {formatCurrency(contractTotalWithVat)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E40AF' }}>Valore Annuo (IVA incl.)</div>
                  </div>
                  <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#D97706' }}>
                      {formatDate(contract.end_date)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#92400E' }}>Scadenza</div>
                  </div>
                  <div style={{ background: planConfig.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: planConfig.color }}>
                      {planConfig.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Piano</div>
                  </div>
                </div>

                {/* Contract Info Card */}
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #E5E7EB',
                    background: 'white'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #85FF00 0%, #65D000 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCrown size={22} color="#1A1A1A" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '18px' }}>
                            Piano {planConfig.name}
                          </span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: statusConfig.bg,
                            color: statusConfig.color,
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                          {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(monthlyValue)}
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>/mese</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prezzo Piano</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                          {formatCurrency(contract.plan_price)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-ons</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                          {contract.addons?.length > 0 ? `${contract.addons.length} inclusi` : 'Nessuno'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fatturazione</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                          {PAYMENT_TERMS[contract.payment_terms] || '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Firmato da</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
                          {contract.signed_by || 'Non firmato'}
                        </div>
                      </div>
                    </div>

                    {/* Addons */}
                    {contract.addons?.length > 0 && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add-ons inclusi</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {contract.addons.map((addon, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                background: '#EFF6FF',
                                color: '#3B82F6',
                                fontSize: '13px',
                                fontWeight: 500
                              }}
                            >
                              {addon.name} ({formatCurrency(addon.price)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {contract.notes && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Note</div>
                        <p style={{ fontSize: '14px', color: '#4B5563', margin: 0, lineHeight: '1.6' }}>{contract.notes}</p>
                      </div>
                    )}

                    {/* Signature Info */}
                    {contract.signed_by && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Firmato da</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{contract.signed_by}</div>
                          </div>
                          {contract.signed_date && (
                            <div>
                              <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data firma</div>
                              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>{formatDate(contract.signed_date)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
              <div className="sd-tab-grid">
                <div className="sd-tab-header">
                  <h3 className="sd-tab-title"><FaFileInvoice /> Fatture</h3>
                </div>

                {invoices.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FaInbox size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 8px 0' }}>Nessuna fattura</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>Non ci sono fatture associate a questo contratto</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {invoices.map(invoice => (
                      <div
                        key={invoice.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: 'white',
                          borderRadius: '10px',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#F3F4F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FaFileInvoice size={18} color="#6B7280" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{invoice.invoice_number}</div>
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(invoice.issue_date)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(invoice.total_amount)}</div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: invoice.status === 'paid' ? '#ECFDF5' : '#FEF3C7',
                            color: invoice.status === 'paid' ? '#059669' : '#D97706'
                          }}>
                            {invoice.status === 'paid' ? 'Pagata' : invoice.status === 'sent' ? 'Inviata' : 'Bozza'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Elimina Contratto">
          <div style={{ padding: '20px' }}>
            <p style={{ marginBottom: '20px', color: '#4B5563' }}>
              Sei sicuro di voler eliminare questo contratto per <strong>{contract.club_name}</strong>?
              Questa azione non può essere annullata.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="tp-btn tp-btn-outline" onClick={() => setShowDeleteModal(false)}>
                Annulla
              </button>
              <button
                className="tp-btn"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#DC2626', color: 'white' }}
              >
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminContractDetail;
