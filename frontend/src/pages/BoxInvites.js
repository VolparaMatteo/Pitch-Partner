import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import {
  FaArrowLeft, FaTicketAlt, FaUsers, FaCheck, FaQrcode,
  FaTrash, FaStar, FaCar, FaEnvelope, FaPhone, FaBuilding,
  FaCalendarAlt, FaCircle, FaClock, FaTimes, FaDownload,
  FaSearch, FaFilter
} from 'react-icons/fa';
import '../styles/sponsor-detail.css';
import '../styles/template-style.css';
import '../styles/modal.css';
import '../styles/form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function BoxInvites() {
  const { id: boxId } = useParams();
  const navigate = useNavigate();
  const { token } = getAuth();

  const [invites, setInvites] = useState([]);
  const [boxInfo, setBoxInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');

  useEffect(() => {
    fetchInvites();
  }, [boxId]);

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`${API_URL}/business-boxes/${boxId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(response.data.invites || []);
      setBoxInfo(response.data.box || null);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setToast({ message: 'Errore nel caricamento degli inviti', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`${API_URL}/box-invites/check-in`,
        { codice_invito: checkInCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: 'Check-in effettuato con successo!', type: 'success' });
      setShowCheckInModal(false);
      setCheckInCode('');
      fetchInvites();
    } catch (error) {
      setToast({ message: error.response?.data?.error || 'Errore nel check-in', type: 'error' });
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!window.confirm('Sei sicuro di voler annullare questo invito?')) return;

    try {
      await axios.delete(`${API_URL}/box-invites/${inviteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: 'Invito annullato', type: 'success' });
      fetchInvites();
    } catch (error) {
      setToast({ message: 'Errore nell\'annullamento', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      inviato: { label: 'Inviato', color: '#3B82F6', bg: '#EFF6FF' },
      confermato: { label: 'Confermato', color: '#059669', bg: '#ECFDF5' },
      rifiutato: { label: 'Rifiutato', color: '#DC2626', bg: '#FEF2F2' },
      check_in: { label: 'Check-in', color: '#7C3AED', bg: '#F5F3FF' },
      no_show: { label: 'No Show', color: '#6B7280', bg: '#F3F4F6' }
    };
    return configs[status] || configs.inviato;
  };

  if (loading) {
    return <div className="sd-page"><div className="sd-loading">Caricamento...</div></div>;
  }

  const stats = {
    total: invites.length,
    confirmed: invites.filter(i => i.status === 'confermato').length,
    checkedIn: invites.filter(i => i.status === 'check_in').length,
    vip: invites.filter(i => i.vip).length
  };

  const filteredInvites = activeTab === 'all'
    ? invites
    : activeTab === 'vip'
      ? invites.filter(i => i.vip)
      : invites.filter(i => i.status === activeTab);

  const tabs = [
    { id: 'all', label: 'Tutti', count: stats.total },
    { id: 'confermato', label: 'Confermati', count: stats.confirmed },
    { id: 'check_in', label: 'Check-in', count: stats.checkedIn },
    { id: 'vip', label: 'VIP', count: stats.vip }
  ];

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* LEFT SIDEBAR */}
        <div className="sd-profile-card">
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate('/club/business-boxes')}>
              <FaArrowLeft />
            </button>
            <button
              className="sd-header-btn"
              onClick={() => setShowCheckInModal(true)}
              style={{ background: 'rgba(133, 255, 0, 0.2)', color: '#85FF00' }}
              title="Check-in Ospite"
            >
              <FaQrcode />
            </button>
          </div>

          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar" style={{ background: 'var(--tp-dark)' }}>
              <FaTicketAlt style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <h1 className="sd-profile-name">{boxInfo?.nome || 'Business Box'}</h1>
            <p className="sd-profile-sector">{boxInfo?.settore || 'Gestione Inviti'}</p>
            <span className="sd-profile-status active">
              <FaCircle /> {boxInfo?.numero_posti || 0} posti
            </span>
          </div>

          <div className="sd-profile-body">
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Riepilogo</h3>
              <div className="sd-info-list">
                <div className="sd-info-item">
                  <span className="sd-info-label">Inviti Totali</span>
                  <span className="sd-info-value">{stats.total}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Confermati</span>
                  <span className="sd-info-value" style={{ color: '#059669' }}>{stats.confirmed}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Check-in Effettuati</span>
                  <span className="sd-info-value" style={{ color: '#7C3AED' }}>{stats.checkedIn}</span>
                </div>
                <div className="sd-info-item">
                  <span className="sd-info-label">Ospiti VIP</span>
                  <span className="sd-info-value" style={{ color: '#F59E0B' }}>{stats.vip}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="sd-main">
          {/* Stats Row */}
          <div className="tp-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Inviti Totali</div>
              <div className="tp-stat-value">{stats.total}</div>
              <div className="tp-stat-description">registrati</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Confermati</div>
              <div className="tp-stat-value">{stats.confirmed}</div>
              <div className="tp-stat-description">parteciperanno</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">Check-in</div>
              <div className="tp-stat-value">{stats.checkedIn}</div>
              <div className="tp-stat-description">arrivati</div>
            </div>
            <div className="tp-stat-card-dark">
              <div className="tp-stat-label">VIP</div>
              <div className="tp-stat-value">{stats.vip}</div>
              <div className="tp-stat-description">ospiti speciali</div>
            </div>
          </div>

          {/* Content Card with Tabs */}
          <div className="sd-content-card">
            <div className="sd-tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.count > 0 && <span className="sd-tab-count">{tab.count}</span>}
                </button>
              ))}
            </div>

            <div className="sd-tab-content">
              {filteredInvites.length === 0 ? (
                <div className="sd-empty">
                  <div className="sd-empty-icon"><FaTicketAlt /></div>
                  <h3 className="sd-empty-title">Nessun invito</h3>
                  <p className="sd-empty-desc">Gli inviti appariranno qui</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredInvites.map(invite => {
                    const statusConfig = getStatusConfig(invite.status);
                    return (
                      <div key={invite.id} style={{
                        padding: '20px',
                        background: '#F9FAFB',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'flex-start'
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '50%',
                          background: invite.vip ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'white',
                          border: invite.vip ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {invite.vip ? (
                            <FaStar style={{ color: '#F59E0B', fontSize: '20px' }} />
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>
                              {invite.nome?.[0]}{invite.cognome?.[0]}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
                                {invite.nome} {invite.cognome}
                              </h3>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
                                {invite.azienda && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaBuilding /> {invite.azienda}
                                  </span>
                                )}
                                {invite.ruolo && <span>• {invite.ruolo}</span>}
                              </div>
                            </div>
                            <span style={{
                              background: statusConfig.bg,
                              color: statusConfig.color,
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Contact & Match Info */}
                          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaEnvelope /> {invite.email}
                            </span>
                            {invite.telefono && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaPhone /> {invite.telefono}
                              </span>
                            )}
                          </div>

                          {/* Match Info */}
                          {invite.match_info && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'white',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              border: '1px solid #E5E7EB'
                            }}>
                              <FaCalendarAlt style={{ color: '#6B7280' }} />
                              <span style={{ fontWeight: 600 }}>{formatDate(invite.match_info.data_ora)}</span>
                              <span style={{ color: '#6B7280' }}>vs {invite.match_info.avversario}</span>
                            </div>
                          )}

                          {/* Tags */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {invite.vip && (
                              <span style={{
                                background: '#FEF3C7', color: '#92400E',
                                padding: '4px 10px', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}>
                                <FaStar /> VIP
                              </span>
                            )}
                            {invite.parcheggio_richiesto && (
                              <span style={{
                                background: '#E0E7FF', color: '#3730A3',
                                padding: '4px 10px', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}>
                                <FaCar /> Parcheggio
                              </span>
                            )}
                            {invite.check_in_at && (
                              <span style={{
                                background: '#F3E8FF', color: '#7C3AED',
                                padding: '4px 10px', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '4px'
                              }}>
                                <FaClock /> {formatDateTime(invite.check_in_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { setSelectedInvite(invite); setShowQRModal(true); }}
                            style={{
                              width: '40px', height: '40px', borderRadius: '10px',
                              background: '#1A1A1A', color: 'white', border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Visualizza QR"
                          >
                            <FaQrcode />
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            style={{
                              width: '40px', height: '40px', borderRadius: '10px',
                              background: '#FEE2E2', color: '#DC2626', border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Annulla invito"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedInvite && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>QR Code Invito</h2>
              <button className="modal-close" onClick={() => setShowQRModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0' }}>{selectedInvite.nome} {selectedInvite.cognome}</h3>
                {selectedInvite.azienda && <p style={{ color: '#6B7280', margin: 0 }}>{selectedInvite.azienda}</p>}
              </div>

              {selectedInvite.qr_code_url ? (
                <img
                  src={`${API_URL.replace('/api', '')}${selectedInvite.qr_code_url}`}
                  alt="QR Code"
                  style={{ width: '200px', height: '200px', borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
              ) : (
                <div style={{ padding: '40px', background: '#F3F4F6', borderRadius: '12px', color: '#6B7280' }}>
                  QR Code non disponibile
                </div>
              )}

              <div style={{ marginTop: '20px', padding: '12px', background: '#F3F4F6', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Codice Invito</div>
                <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{selectedInvite.codice_invito}</code>
              </div>

              {selectedInvite.badge_nome && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#FEF3C7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>Nome Badge</div>
                  <strong style={{ color: '#92400E' }}>{selectedInvite.badge_nome}</strong>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="tp-btn tp-btn-primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `${API_URL.replace('/api', '')}${selectedInvite.qr_code_url}`;
                  link.download = `qr_${selectedInvite.nome}_${selectedInvite.cognome}.png`;
                  link.click();
                }}
              >
                <FaDownload style={{ marginRight: '6px' }} />
                Scarica QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Check-in Ospite</h2>
              <button className="modal-close" onClick={() => setShowCheckInModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#6B7280', marginBottom: '20px' }}>
                Inserisci il codice dell'invito o scansiona il QR code
              </p>
              <div className="form-group">
                <label>Codice Invito</label>
                <input
                  type="text"
                  value={checkInCode}
                  onChange={(e) => setCheckInCode(e.target.value)}
                  placeholder="Inserisci o scansiona codice..."
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="tp-btn tp-btn-outline"
                onClick={() => setShowCheckInModal(false)}
              >
                Annulla
              </button>
              <button
                className="tp-btn tp-btn-primary"
                onClick={handleCheckIn}
                disabled={!checkInCode}
              >
                <FaCheck style={{ marginRight: '6px' }} />
                Effettua Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default BoxInvites;
