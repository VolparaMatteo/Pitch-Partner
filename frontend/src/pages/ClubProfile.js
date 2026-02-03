import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import {
  FaArrowLeft, FaBuilding, FaUser, FaPhone, FaEnvelope, FaGlobe,
  FaMapMarkerAlt, FaIdCard, FaUsers, FaTrophy, FaCreditCard,
  FaFileInvoice, FaCheckCircle, FaTimesCircle, FaDownload,
  FaFacebook, FaInstagram, FaTiktok, FaCalendarAlt, FaCamera, FaTrash
} from 'react-icons/fa';
import '../styles/template-style.css';
import '../styles/sponsor-detail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function ClubProfile() {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('anagrafica');
  const [pagamenti, setPagamenti] = useState([]);
  const [fatture, setFatture] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchClubProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClubProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/club/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClub(response.data);
    } catch (error) {
      console.error('Errore nel caricamento profilo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsAndInvoices = async () => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem('token');

      const [pagamentiRes, fattureRes] = await Promise.all([
        axios.get(`${API_URL}/club/pagamenti`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/fatture`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPagamenti(Array.isArray(pagamentiRes.data) ? pagamentiRes.data : []);
      setFatture(Array.isArray(fattureRes.data) ? fattureRes.data : []);
    } catch (error) {
      console.error('Errore nel caricamento pagamenti e fatture:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pagamenti') {
      fetchPaymentsAndInvoices();
    }
  }, [activeTab]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Formato non supportato. Usa JPG, PNG, GIF o WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Il file è troppo grande. Massimo 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post(`${API_URL}/club/upload-logo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update club state with new logo
      setClub(prev => ({ ...prev, logo_url: response.data.logo_url }));

      // Update user in localStorage if updateUser is available
      if (updateUser && response.data.logo_url) {
        updateUser({ logo_url: response.data.logo_url });
      }
    } catch (error) {
      console.error('Errore upload logo:', error);
      alert('Errore durante il caricamento del logo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Sei sicuro di voler rimuovere il logo?')) return;

    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/club/delete-logo`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update club state
      setClub(prev => ({ ...prev, logo_url: null }));

      // Update user in localStorage
      if (updateUser) {
        updateUser({ logo_url: null });
      }
    } catch (error) {
      console.error('Errore eliminazione logo:', error);
      alert('Errore durante l\'eliminazione del logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const tabs = [
    { id: 'anagrafica', label: 'Anagrafica', icon: <FaBuilding /> },
    { id: 'contatti', label: 'Contatti', icon: <FaPhone /> },
    { id: 'operativo', label: 'Operativo', icon: <FaUsers /> },
    { id: 'abbonamento', label: 'Abbonamento', icon: <FaTrophy /> },
    { id: 'pagamenti', label: 'Fatture & Pagamenti', icon: <FaCreditCard /> }
  ];

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tp-loading">Caricamento...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="tp-page">
        <div className="tp-empty">Errore nel caricamento del profilo</div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      <div className="sd-layout">
        {/* Sidebar Profile Card */}
        <div className="sd-profile-card">
          <div className="sd-profile-header">
            <button className="sd-header-btn back" onClick={() => navigate(-1)}>
              <FaArrowLeft />
            </button>
          </div>

          <div className="sd-profile-avatar-section">
            <div className="sd-profile-avatar-wrapper">
              <div className={`sd-profile-avatar ${uploadingLogo ? 'uploading' : ''}`}>
                {club.logo_url ? (
                  <img src={getImageUrl(club.logo_url)} alt={club.nome} />
                ) : (
                  <div className="sd-profile-avatar-placeholder">
                    <FaTrophy />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="sd-avatar-loading">
                    <span>Caricamento...</span>
                  </div>
                )}
              </div>
              <div className="sd-avatar-actions">
                <label className="sd-avatar-btn upload" title="Carica logo">
                  <FaCamera />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingLogo}
                  />
                </label>
                {club.logo_url && (
                  <button
                    className="sd-avatar-btn delete"
                    onClick={handleLogoDelete}
                    disabled={uploadingLogo}
                    title="Rimuovi logo"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
            <h1 className="sd-profile-name">{club.nome}</h1>
            <p className="sd-profile-sector">{club.tipologia || 'Club Sportivo'}</p>
            <span className={`sd-profile-status ${club.account_attivo ? 'status-active' : 'status-expired'}`}>
              {club.account_attivo ? <FaCheckCircle /> : <FaTimesCircle />}
              {club.account_attivo ? 'Account Attivo' : 'Non Attivo'}
            </span>
          </div>

          <div className="sd-profile-body">
            <div className="sd-profile-section">
              <h3 className="sd-section-title">Informazioni Rapide</h3>
              <div className="sd-info-list">
                {club.email && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Email</span>
                    <span className="sd-info-value">{club.email}</span>
                  </div>
                )}
                {club.telefono && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Telefono</span>
                    <span className="sd-info-value">{club.telefono}</span>
                  </div>
                )}
                {club.categoria_campionato && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Categoria</span>
                    <span className="sd-info-value">{club.categoria_campionato}</span>
                  </div>
                )}
                {club.nome_abbonamento && (
                  <div className="sd-info-item">
                    <span className="sd-info-label">Piano</span>
                    <span className="sd-info-value">{club.nome_abbonamento}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="sd-main">
          {/* Content Card */}
          <div className="sd-content-card">
            {/* Tabs */}
            <div className="sd-tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sd-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sd-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="sd-tab-content">
              {/* Anagrafica */}
              {activeTab === 'anagrafica' && (
                <div className="sd-tab-grid">
                  <div className="sd-detail-section">
                    <h3 className="sd-section-title">Dati Anagrafici</h3>
                    <div className="sd-info-list">
                      <div className="sd-info-item">
                        <span className="sd-info-label">Nome Club</span>
                        <span className="sd-info-value">{club.nome}</span>
                      </div>
                      <div className="sd-info-item">
                        <span className="sd-info-label">Tipologia</span>
                        <span className="sd-info-value">{club.tipologia || '-'}</span>
                      </div>
                      {club.codice_fiscale && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Codice Fiscale</span>
                          <span className="sd-info-value">{club.codice_fiscale}</span>
                        </div>
                      )}
                      {club.partita_iva && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Partita IVA</span>
                          <span className="sd-info-value">{club.partita_iva}</span>
                        </div>
                      )}
                      {club.numero_affiliazione && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Numero Affiliazione</span>
                          <span className="sd-info-value">{club.numero_affiliazione}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(club.referente_nome || club.referente_cognome) && (
                    <div className="sd-detail-section">
                      <h3 className="sd-section-title">Referente</h3>
                      <div className="sd-info-list">
                        <div className="sd-info-item">
                          <span className="sd-info-label">Nome</span>
                          <span className="sd-info-value">
                            {`${club.referente_nome || ''} ${club.referente_cognome || ''}`.trim()}
                          </span>
                        </div>
                        {club.referente_ruolo && (
                          <div className="sd-info-item">
                            <span className="sd-info-label">Ruolo</span>
                            <span className="sd-info-value">{club.referente_ruolo}</span>
                          </div>
                        )}
                        {club.referente_contatto && (
                          <div className="sd-info-item">
                            <span className="sd-info-label">Contatto</span>
                            <span className="sd-info-value">{club.referente_contatto}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contatti */}
              {activeTab === 'contatti' && (
                <div className="sd-tab-grid">
                  <div className="sd-detail-section">
                    <h3 className="sd-section-title">Contatti</h3>
                    <div className="sd-info-list">
                      {club.email && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Email</span>
                          <span className="sd-info-value">{club.email}</span>
                        </div>
                      )}
                      {club.telefono && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Telefono</span>
                          <span className="sd-info-value">{club.telefono}</span>
                        </div>
                      )}
                      {club.sito_web && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Sito Web</span>
                          <span className="sd-info-value">
                            <a href={club.sito_web} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>
                              {club.sito_web}
                            </a>
                          </span>
                        </div>
                      )}
                      {club.indirizzo_sede_legale && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Sede Legale</span>
                          <span className="sd-info-value">{club.indirizzo_sede_legale}</span>
                        </div>
                      )}
                      {club.indirizzo_sede_operativa && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Sede Operativa</span>
                          <span className="sd-info-value">{club.indirizzo_sede_operativa}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(club.facebook || club.instagram || club.tiktok) && (
                    <div className="sd-detail-section">
                      <h3 className="sd-section-title">Social Media</h3>
                      <div className="sd-info-list">
                        {club.facebook && (
                          <div className="sd-info-item">
                            <span className="sd-info-label">Facebook</span>
                            <span className="sd-info-value">
                              <a href={club.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>
                                {club.facebook}
                              </a>
                            </span>
                          </div>
                        )}
                        {club.instagram && (
                          <div className="sd-info-item">
                            <span className="sd-info-label">Instagram</span>
                            <span className="sd-info-value">
                              <a href={club.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>
                                {club.instagram}
                              </a>
                            </span>
                          </div>
                        )}
                        {club.tiktok && (
                          <div className="sd-info-item">
                            <span className="sd-info-label">TikTok</span>
                            <span className="sd-info-value">
                              <a href={club.tiktok} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>
                                {club.tiktok}
                              </a>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Operativo */}
              {activeTab === 'operativo' && (
                <div className="sd-detail-section">
                  <h3 className="sd-section-title">Informazioni Operative</h3>
                  <div className="sd-info-list">
                    {club.numero_tesserati && (
                      <div className="sd-info-item">
                        <span className="sd-info-label">Numero Tesserati</span>
                        <span className="sd-info-value">{club.numero_tesserati}</span>
                      </div>
                    )}
                    {club.categoria_campionato && (
                      <div className="sd-info-item">
                        <span className="sd-info-label">Categoria Campionato</span>
                        <span className="sd-info-value">{club.categoria_campionato}</span>
                      </div>
                    )}
                    {club.pubblico_medio && (
                      <div className="sd-info-item">
                        <span className="sd-info-label">Pubblico Medio</span>
                        <span className="sd-info-value">{club.pubblico_medio.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Abbonamento */}
              {activeTab === 'abbonamento' && (
                <div className="sd-tab-grid">
                  <div className="sd-detail-section">
                    <h3 className="sd-section-title">Dettagli Abbonamento</h3>
                    <div className="sd-info-list">
                      <div className="sd-info-item">
                        <span className="sd-info-label">Stato Account</span>
                        <span className="sd-info-value">
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: club.account_attivo ? '#22C55E' : '#EF4444'
                          }}>
                            {club.account_attivo ? <FaCheckCircle /> : <FaTimesCircle />}
                            {club.account_attivo ? 'Attivo' : 'Non Attivo'}
                          </span>
                        </span>
                      </div>
                      {club.nome_abbonamento && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Piano</span>
                          <span className="sd-info-value">{club.nome_abbonamento}</span>
                        </div>
                      )}
                      {club.tipologia_abbonamento && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Tipologia</span>
                          <span className="sd-info-value" style={{ textTransform: 'capitalize' }}>
                            {club.tipologia_abbonamento}
                          </span>
                        </div>
                      )}
                      {club.costo_abbonamento && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Costo</span>
                          <span className="sd-info-value">€{club.costo_abbonamento}</span>
                        </div>
                      )}
                      {club.data_scadenza_licenza && (
                        <div className="sd-info-item">
                          <span className="sd-info-label">Scadenza</span>
                          <span className="sd-info-value">
                            {new Date(club.data_scadenza_licenza).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sd-detail-section" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: club.account_attivo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      fontSize: '32px',
                      color: club.account_attivo ? '#22C55E' : '#EF4444'
                    }}>
                      {club.account_attivo ? <FaCheckCircle /> : <FaTimesCircle />}
                    </div>
                    <h3 style={{ margin: '0 0 8px', color: club.account_attivo ? '#22C55E' : '#EF4444' }}>
                      {club.account_attivo ? 'Account Attivo' : 'Account Non Attivo'}
                    </h3>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                      {club.account_attivo
                        ? 'Il tuo account è attivo e funzionante'
                        : 'Contatta l\'amministratore per attivare l\'account'}
                    </p>
                  </div>
                </div>
              )}

              {/* Pagamenti */}
              {activeTab === 'pagamenti' && (
                <>
                  {loadingPayments ? (
                    <div className="tp-loading">Caricamento...</div>
                  ) : (
                    <div className="sd-tab-grid">
                      {/* Pagamenti */}
                      <div className="sd-detail-section">
                        <h3 className="sd-section-title">
                          Pagamenti
                          <span style={{ fontSize: '13px', fontWeight: 400, color: '#6B7280', marginLeft: '8px' }}>
                            ({pagamenti.length})
                          </span>
                        </h3>
                        {pagamenti.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                            Nessun pagamento registrato
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pagamenti.map((pagamento) => (
                              <div
                                key={pagamento.id}
                                style={{
                                  padding: '16px',
                                  background: '#F9FAFB',
                                  borderRadius: '12px',
                                  border: '1px solid #E5E7EB'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                                    €{pagamento.importo.toLocaleString()}
                                  </span>
                                  <span style={{
                                    padding: '4px 10px',
                                    background: '#E0F2FE',
                                    color: '#0284C7',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    {pagamento.metodo_pagamento}
                                  </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                  {pagamento.descrizione || 'Pagamento'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaCalendarAlt />
                                  {new Date(pagamento.data_pagamento).toLocaleDateString('it-IT')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fatture */}
                      <div className="sd-detail-section">
                        <h3 className="sd-section-title">
                          Fatture
                          <span style={{ fontSize: '13px', fontWeight: 400, color: '#6B7280', marginLeft: '8px' }}>
                            ({fatture.length})
                          </span>
                        </h3>
                        {fatture.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                            Nessuna fattura emessa
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {fatture.map((fattura) => (
                              <div
                                key={fattura.id}
                                style={{
                                  padding: '16px',
                                  background: '#F9FAFB',
                                  borderRadius: '12px',
                                  border: '1px solid #E5E7EB'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', marginBottom: '4px' }}>
                                      {fattura.numero_fattura}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#22C55E' }}>
                                      €{fattura.importo.toLocaleString()}
                                    </div>
                                  </div>
                                  {fattura.file_url && (
                                    <a
                                      href={`${API_URL.replace('/api', '')}${fattura.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        background: '#1A1A1A',
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <FaDownload /> Scarica
                                    </a>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaCalendarAlt />
                                  {new Date(fattura.data_fattura).toLocaleDateString('it-IT')}
                                </div>
                                {fattura.note && (
                                  <div style={{
                                    fontSize: '13px',
                                    color: '#6B7280',
                                    marginTop: '12px',
                                    padding: '10px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E7EB'
                                  }}>
                                    {fattura.note}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubProfile;
