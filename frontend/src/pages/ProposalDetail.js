import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { clubAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import {
  FaArrowLeft, FaPen, FaTrashAlt, FaEye, FaPaperPlane, FaLink,
  FaCopy, FaCheck, FaTimes, FaEuroSign, FaClock, FaCalendarAlt,
  FaEnvelope, FaPhone, FaBuilding, FaUserTie, FaFileAlt, FaHistory,
  FaChartLine, FaDownload, FaExternalLinkAlt, FaBoxOpen, FaPercent,
  FaExchangeAlt, FaFileContract, FaStar, FaEllipsisH
} from 'react-icons/fa';

const STATO_CONFIG = {
  bozza: { label: 'Bozza', color: '#6B7280', bg: '#F3F4F6' },
  inviata: { label: 'Inviata', color: '#3B82F6', bg: '#DBEAFE' },
  visualizzata: { label: 'Visualizzata', color: '#8B5CF6', bg: '#EDE9FE' },
  in_trattativa: { label: 'In Trattativa', color: '#F59E0B', bg: '#FEF3C7' },
  accettata: { label: 'Accettata', color: '#10B981', bg: '#D1FAE5' },
  rifiutata: { label: 'Rifiutata', color: '#EF4444', bg: '#FEE2E2' },
  scaduta: { label: 'Scaduta', color: '#6B7280', bg: '#F3F4F6' }
};

function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      const response = await clubAPI.getProposal(id);
      const data = response.data;
      data.items = data.items || [];
      data.tracking_events = data.tracking_events || [];
      setProposal(data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setToast({ type: 'error', message: 'Errore nel caricamento della proposta' });
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntilExpiry = () => {
    if (!proposal?.data_scadenza) return null;
    return Math.ceil((new Date(proposal.data_scadenza) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/${proposal.link_condivisione}`;
    navigator.clipboard.writeText(link);
    setToast({ type: 'success', message: 'Link copiato!' });
  };

  const handleSendProposal = async () => {
    try {
      await clubAPI.sendProposal(id);
      setToast({ type: 'success', message: 'Proposta inviata!' });
      fetchProposal();
    } catch (error) {
      setToast({ type: 'error', message: 'Errore nell\'invio' });
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await clubAPI.updateProposalStatus(id, { stato: newStatus });
      setToast({ type: 'success', message: 'Stato aggiornato!' });
      setShowStatusModal(false);
      fetchProposal();
    } catch (error) {
      setToast({ type: 'error', message: 'Errore nell\'aggiornamento' });
    }
  };

  const handleDelete = async () => {
    try {
      await clubAPI.deleteProposal(id);
      setToast({ type: 'success', message: 'Proposta eliminata' });
      setTimeout(() => navigate('/club/proposals'), 1000);
    } catch (error) {
      setToast({ type: 'error', message: 'Errore nell\'eliminazione' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: '#85FF00', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280' }}>Caricamento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FaFileAlt style={{ fontSize: '48px', color: '#D1D5DB', marginBottom: '16px' }} />
          <p style={{ color: '#6B7280', fontSize: '18px' }}>Proposta non trovata</p>
          <button
            onClick={() => navigate('/club/proposals')}
            style={{
              marginTop: '16px', padding: '10px 24px', background: '#1A1A1A', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 500
            }}
          >
            Torna alle proposte
          </button>
        </div>
      </div>
    );
  }

  const statoConfig = STATO_CONFIG[proposal.stato] || STATO_CONFIG.bozza;
  const daysUntilExpiry = getDaysUntilExpiry();
  const initials = (proposal.destinatario_azienda || 'P').charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB' }}>
      {/* Header */}
      <div style={{ background: '#0D0D0D', padding: '24px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <Link to="/club/proposals" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Proposte</Link>
            <span style={{ color: '#4B5563' }}>/</span>
            <span style={{ color: 'white' }}>{proposal.codice || `#${proposal.id}`}</span>
          </div>

          {/* Title Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>{proposal.titolo}</h1>
                <span style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  background: statoConfig.bg, color: statoConfig.color
                }}>
                  {statoConfig.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#9CA3AF', fontSize: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaBuilding /> {proposal.destinatario_azienda || '-'}
                </span>
                {proposal.destinatario_nome && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaUserTie /> {proposal.destinatario_nome}
                  </span>
                )}
                {proposal.destinatario_email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaEnvelope /> {proposal.destinatario_email}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {proposal.link_condivisione && (
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '14px'
                  }}
                >
                  <FaCopy /> Copia Link
                </button>
              )}
              <button
                onClick={() => navigate(`/club/proposals/${id}/edit`)}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '14px'
                }}
              >
                <FaPen /> Modifica
              </button>
              {proposal.link_condivisione && (
                <button
                  onClick={() => window.open(`/p/${proposal.link_condivisione}`, '_blank')}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent', color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, fontSize: '14px'
                  }}
                >
                  <FaExternalLinkAlt /> Anteprima
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaEuroSign style={{ color: '#059669', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
                  {formatCurrency(proposal.valore_finale || proposal.valore_totale)}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Valore</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaBoxOpen style={{ color: '#2563EB', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{proposal.items?.length || 0}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Elementi</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaClock style={{ color: '#D97706', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>{proposal.durata_mesi || '-'}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Mesi durata</p>
              </div>
            </div>
          </div>

          <div style={{
            background: daysUntilExpiry && daysUntilExpiry <= 5 ? '#FEF2F2' : 'white',
            borderRadius: '16px', padding: '20px',
            border: daysUntilExpiry && daysUntilExpiry <= 5 ? '1px solid #FECACA' : '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: daysUntilExpiry && daysUntilExpiry <= 5 ? '#FEE2E2' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FaCalendarAlt style={{ color: daysUntilExpiry && daysUntilExpiry <= 5 ? '#DC2626' : '#6B7280', fontSize: '18px' }} />
              </div>
              <div>
                <p style={{
                  fontSize: '20px', fontWeight: 700, margin: 0,
                  color: daysUntilExpiry && daysUntilExpiry <= 5 ? '#DC2626' : '#1F2937'
                }}>
                  {daysUntilExpiry !== null ? `${daysUntilExpiry}g` : '-'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Alla scadenza</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* Left Column - Tabs Content */}
          <div>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: '4px', marginBottom: '16px', background: '#F3F4F6',
              padding: '4px', borderRadius: '12px', width: 'fit-content'
            }}>
              {[
                { id: 'items', label: 'Elementi', count: proposal.items?.length || 0 },
                { id: 'content', label: 'Contenuto' },
                { id: 'tracking', label: 'Attività', count: proposal.tracking_events?.length || 0 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px', border: 'none', borderRadius: '10px',
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 500, fontSize: '14px',
                    color: activeTab === tab.id ? '#1F2937' : '#6B7280'
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{
                      background: activeTab === tab.id ? '#1F2937' : '#E5E7EB',
                      color: activeTab === tab.id ? 'white' : '#6B7280',
                      padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 600
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
              {/* Items Tab */}
              {activeTab === 'items' && (
                <div style={{ padding: '24px' }}>
                  {proposal.items?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaBoxOpen style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessun elemento nella proposta</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {proposal.items?.map((item, idx) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '16px 20px', background: idx % 2 === 0 ? '#F9FAFB' : 'white',
                              borderRadius: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 600, color: '#6B7280', fontSize: '14px'
                              }}>
                                {idx + 1}
                              </div>
                              <div>
                                <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>{item.nome_display}</p>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                                  {item.gruppo || item.asset?.categoria || 'Altro'} • Qtà: {item.quantita}
                                </p>
                              </div>
                            </div>
                            <p style={{ fontWeight: 700, color: '#1F2937', margin: 0, fontSize: '16px' }}>
                              {formatCurrency(item.valore_totale)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ color: '#6B7280', fontSize: '15px' }}>Subtotale</span>
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{formatCurrency(proposal.valore_totale)}</span>
                        </div>
                        {proposal.sconto_percentuale > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#DC2626', fontSize: '15px' }}>Sconto ({proposal.sconto_percentuale}%)</span>
                            <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '15px' }}>-{formatCurrency(proposal.sconto_valore)}</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          paddingTop: '16px', borderTop: '1px solid #E5E7EB'
                        }}>
                          <span style={{ fontWeight: 700, fontSize: '18px', color: '#1F2937' }}>Totale</span>
                          <span style={{ fontWeight: 700, fontSize: '24px', color: '#059669' }}>
                            {formatCurrency(proposal.valore_finale || proposal.valore_totale)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div style={{ padding: '24px' }}>
                  {proposal.messaggio_introduttivo && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Messaggio Introduttivo
                      </h4>
                      <p style={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {proposal.messaggio_introduttivo}
                      </p>
                    </div>
                  )}
                  {proposal.proposta_valore && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Value Proposition
                      </h4>
                      <p style={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {proposal.proposta_valore}
                      </p>
                    </div>
                  )}
                  {proposal.termini_condizioni && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Termini e Condizioni
                      </h4>
                      <p style={{ color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {proposal.termini_condizioni}
                      </p>
                    </div>
                  )}
                  {proposal.note_interne && (
                    <div style={{
                      background: '#FFFBEB', border: '1px solid #FCD34D',
                      borderRadius: '12px', padding: '16px'
                    }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', marginBottom: '10px', textTransform: 'uppercase' }}>
                        Note Interne
                      </h4>
                      <p style={{ color: '#78350F', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {proposal.note_interne}
                      </p>
                    </div>
                  )}
                  {!proposal.messaggio_introduttivo && !proposal.proposta_valore && !proposal.termini_condizioni && !proposal.note_interne && (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaFileAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessun contenuto testuale</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tracking Tab */}
              {activeTab === 'tracking' && (
                <div style={{ padding: '24px' }}>
                  {proposal.tracking_events?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>
                      <FaHistory style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                      <p style={{ margin: 0 }}>Nessuna attività registrata</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {proposal.tracking_events?.map(event => (
                        <div
                          key={event.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            padding: '16px', background: '#F9FAFB', borderRadius: '12px'
                          }}
                        >
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: event.evento === 'view' ? '#EDE9FE' :
                                       event.evento === 'download' ? '#FEF3C7' : '#DBEAFE'
                          }}>
                            {event.evento === 'view' && <FaEye style={{ color: '#7C3AED' }} />}
                            {event.evento === 'download' && <FaDownload style={{ color: '#D97706' }} />}
                            {event.evento === 'section_view' && <FaChartLine style={{ color: '#2563EB' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>
                              {event.evento === 'view' && 'Visualizzazione'}
                              {event.evento === 'download' && 'Download PDF'}
                              {event.evento === 'section_view' && `Sezione: ${event.sezione}`}
                            </p>
                            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                              {formatDateTime(event.created_at)}
                              {event.device_type && ` • ${event.device_type}`}
                              {event.citta && ` • ${event.citta}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Actions */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Azioni Rapide
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowStatusModal(true)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                  }}
                >
                  <FaExchangeAlt style={{ color: '#6B7280' }} /> Cambia Stato
                </button>
                {proposal.link_condivisione && (
                  <button
                    onClick={handleCopyLink}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '10px',
                      border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontWeight: 500, fontSize: '14px', color: '#374151', textAlign: 'left'
                    }}
                  >
                    <FaLink style={{ color: '#6B7280' }} /> Copia Link
                  </button>
                )}
                {proposal.stato === 'accettata' && (
                  <button
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '10px',
                      border: 'none', background: '#059669', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontWeight: 600, fontSize: '14px', color: 'white', textAlign: 'left'
                    }}
                  >
                    <FaFileContract /> Converti in Contratto
                  </button>
                )}
                {['bozza', 'scaduta', 'rifiutata'].includes(proposal.stato) && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '10px',
                      border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      fontWeight: 500, fontSize: '14px', color: '#DC2626', textAlign: 'left'
                    }}
                  >
                    <FaTrashAlt /> Elimina Proposta
                  </button>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dettagli
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Codice</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{proposal.codice || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Creata il</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatDate(proposal.created_at)}</span>
                </div>
                {proposal.data_invio && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>Inviata il</span>
                    <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatDate(proposal.data_invio)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Scadenza</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{formatDate(proposal.data_scadenza)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Validità</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>{proposal.giorni_validita || 30} giorni</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280', fontSize: '14px' }}>Versione</span>
                  <span style={{ color: '#1F2937', fontSize: '14px', fontWeight: 500 }}>v{proposal.versione_corrente || 1}</span>
                </div>
              </div>
            </div>

            {/* Lead/Destinatario Card */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Destinatario
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#6B7280', fontSize: '18px'
                }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1F2937', margin: 0 }}>{proposal.destinatario_azienda || '-'}</p>
                  {proposal.settore_merceologico && (
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>{proposal.settore_merceologico}</p>
                  )}
                </div>
              </div>
              {(proposal.destinatario_nome || proposal.destinatario_email || proposal.destinatario_telefono) && (
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {proposal.destinatario_nome && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                      <FaUserTie style={{ color: '#9CA3AF', fontSize: '14px' }} />
                      <span style={{ color: '#374151' }}>{proposal.destinatario_nome}</span>
                    </div>
                  )}
                  {proposal.destinatario_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                      <FaEnvelope style={{ color: '#9CA3AF', fontSize: '14px' }} />
                      <a href={`mailto:${proposal.destinatario_email}`} style={{ color: '#4F46E5', textDecoration: 'none' }}>
                        {proposal.destinatario_email}
                      </a>
                    </div>
                  )}
                  {proposal.destinatario_telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                      <FaPhone style={{ color: '#9CA3AF', fontSize: '14px' }} />
                      <span style={{ color: '#374151' }}>{proposal.destinatario_telefono}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Elimina Proposta">
        <p style={{ color: '#6B7280', marginBottom: '24px' }}>
          Sei sicuro di voler eliminare questa proposta? L'azione non può essere annullata.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowDeleteModal(false)}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: 'white',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: '#DC2626', color: 'white', cursor: 'pointer', fontWeight: 500
            }}
          >
            Elimina
          </button>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Cambia Stato">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {Object.entries(STATO_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setNewStatus(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                border: newStatus === key ? '2px solid #85FF00' : '1px solid #E5E7EB',
                background: newStatus === key ? '#F0FDF4' : 'white',
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: config.color
              }} />
              <span style={{ fontWeight: 500, color: '#1F2937' }}>{config.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowStatusModal(false)}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              border: '1px solid #E5E7EB', background: 'white',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleUpdateStatus}
            disabled={!newStatus}
            style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: newStatus ? '#1A1A1A' : '#E5E7EB',
              color: newStatus ? 'white' : '#9CA3AF',
              cursor: newStatus ? 'pointer' : 'not-allowed', fontWeight: 500
            }}
          >
            Conferma
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ProposalDetail;
