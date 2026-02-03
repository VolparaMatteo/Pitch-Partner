import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import Toast from '../components/Toast';
import {
  FaTicketAlt,
  FaUsers,
  FaChair,
  FaEnvelope,
  FaClipboardList,
  FaMapMarkerAlt,
  FaUtensils,
  FaCar,
  FaHandshake,
  FaGift,
  FaStar,
  FaTimes,
  FaQrcode
} from 'react-icons/fa';
import '../styles/template-style.css';
import '../styles/sponsor-detail.css';
import '../styles/modal.css';
import '../styles/form.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BusinessBoxes = () => {
  const navigate = useNavigate();
  const { user, token } = getAuth();
  const [boxes, setBoxes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [toast, setToast] = useState(null);

  const [inviteForm, setInviteForm] = useState({
    match_id: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    azienda: '',
    ruolo: '',
    vip: false,
    parcheggio_richiesto: false,
    note_ospite: '',
    badge_nome: ''
  });

  const isClub = user?.role === 'club';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBoxes();
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBoxes = async () => {
    try {
      const response = await axios.get(`${API_URL}/business-boxes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoxes(response.data.boxes || []);
    } catch (error) {
      console.error('Errore nel caricamento dei box:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API_URL}/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Errore nel caricamento delle partite:', error);
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      const inviteData = {
        ...inviteForm,
        badge_nome: inviteForm.badge_nome || `${inviteForm.nome} ${inviteForm.cognome}`
      };

      await axios.post(`${API_URL}/business-boxes/${selectedBox.id}/invites`, inviteData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({
        message: 'Invito creato con successo! QR code generato.',
        type: 'success'
      });
      setShowInviteModal(false);
      resetInviteForm();
      fetchBoxes();
    } catch (error) {
      console.error('Errore nella creazione dell\'invito:', error);
      setToast({
        message: error.response?.data?.error || 'Errore nella creazione dell\'invito',
        type: 'error'
      });
    }
  };

  const openInviteModal = (box) => {
    setSelectedBox(box);
    setShowInviteModal(true);
  };

  const resetInviteForm = () => {
    setInviteForm({
      match_id: '',
      nome: '',
      cognome: '',
      email: '',
      telefono: '',
      azienda: '',
      ruolo: '',
      vip: false,
      parcheggio_richiesto: false,
      note_ospite: '',
      badge_nome: ''
    });
  };

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading">Caricamento business boxes...</div>
      </div>
    );
  }

  // Calcola statistiche
  const totalBoxes = boxes.length;
  const totalInvites = boxes.reduce((sum, b) => sum + (b.total_invites || 0), 0);
  const totalSeats = boxes.reduce((sum, b) => sum + (parseInt(b.numero_posti) || 0), 0);

  return (
    <div className="tp-page-container">
      {/* Page Header */}
      <div className="tp-page-header">
        <h1 className="tp-page-title">Business Box</h1>
        {isClub && (
          <div className="tp-page-actions">
            <button
              className="tp-btn tp-btn-primary"
              onClick={() => navigate('/club/business-boxes/new')}
            >
              <span>+ Nuovo Business Box</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats */}
      <div className="tp-stats-grid">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Totale Box</div>
          <div className="tp-stat-value">{totalBoxes}</div>
          <div className="tp-stat-description">Business box configurati</div>
        </div>

        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Inviti Totali</div>
          <div className="tp-stat-value">{totalInvites}</div>
          <div className="tp-stat-description">Inviti generati per tutti i box</div>
        </div>

        <div className="tp-stat-card-dark">
          <div className="tp-stat-label">Posti Totali</div>
          <div className="tp-stat-value">{totalSeats}</div>
          <div className="tp-stat-description">Capacità complessiva disponibile</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="tp-card">
        <div className="tp-card-header">
          <div className="tp-card-header-left">
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              I tuoi Business Box
            </h2>
          </div>
          <div className="tp-card-header-right">
            <span style={{ fontSize: '14px', color: 'var(--tp-gray-500)' }}>
              {totalBoxes} {totalBoxes === 1 ? 'box' : 'box'}
            </span>
          </div>
        </div>

        <div className="tp-card-body">
          {boxes.length === 0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon"><FaTicketAlt /></div>
              <h3 className="tp-empty-title">Nessun business box configurato</h3>
              <p className="tp-empty-description">
                Crea il primo business box per iniziare a gestire gli inviti
              </p>
              {isClub && (
                <button
                  className="tp-btn tp-btn-primary"
                  onClick={() => navigate('/club/business-boxes/new')}
                >
                  Crea primo box
                </button>
              )}
            </div>
          ) : (
            <div className="tp-grid">
              {boxes.map((box) => (
                <div key={box.id} className="tp-sponsor-card">
                  {/* Header */}
                  <div className="tp-sponsor-header">
                    <div className="tp-sponsor-logo" style={{
                      background: 'var(--tp-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaTicketAlt style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <span className={`tp-badge ${box.tipo === 'stagionale' ? 'tp-badge-success' : 'tp-badge-warning'}`}>
                      {box.tipo === 'stagionale' ? 'Stagionale' : 'Match Singolo'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="tp-sponsor-content">
                    {box.settore && (
                      <div className="tp-sponsor-sector">
                        <FaMapMarkerAlt style={{ marginRight: '4px' }} />
                        Settore: {box.settore}
                      </div>
                    )}
                    <h3 className="tp-sponsor-name">{box.nome}</h3>

                    {/* Capacity Badge */}
                    <div className="tp-sponsor-tags">
                      <span className="tp-sponsor-tag">
                        <FaChair style={{ marginRight: '4px' }} />
                        {box.numero_posti} posti
                      </span>
                      <span className="tp-sponsor-tag">
                        <FaUsers style={{ marginRight: '4px' }} />
                        {box.total_invites || 0} inviti
                      </span>
                    </div>

                    {/* Services */}
                    {(box.catering || box.parcheggio || box.meet_and_greet || box.merchandising) && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '12px'
                      }}>
                        {box.catering && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'var(--tp-gray-100)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--tp-gray-700)'
                          }}>
                            <FaUtensils /> Catering
                          </span>
                        )}
                        {box.parcheggio && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'var(--tp-gray-100)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--tp-gray-700)'
                          }}>
                            <FaCar /> Parcheggio
                          </span>
                        )}
                        {box.meet_and_greet && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'var(--tp-gray-100)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--tp-gray-700)'
                          }}>
                            <FaHandshake /> Meet & Greet
                          </span>
                        )}
                        {box.merchandising && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            background: 'var(--tp-gray-100)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--tp-gray-700)'
                          }}>
                            <FaGift /> Merchandising
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="tp-sponsor-footer">
                    <button
                      className="tp-btn tp-btn-primary"
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openInviteModal(box);
                      }}
                    >
                      <FaEnvelope style={{ marginRight: '6px' }} />
                      Nuovo Invito
                    </button>
                    <button
                      className="tp-btn tp-btn-outline"
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/club/business-boxes/${box.id}/invites`);
                      }}
                    >
                      <FaClipboardList style={{ marginRight: '6px' }} />
                      Gestisci
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Creazione Invito */}
      {showInviteModal && selectedBox && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuovo Invito - {selectedBox.nome}</h2>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateInvite}>
              <div className="modal-body">
                {/* Partita */}
                <div className="form-group">
                  <label>Partita *</label>
                  <select
                    className="tp-select"
                    style={{ width: '100%' }}
                    value={inviteForm.match_id}
                    onChange={(e) => setInviteForm({ ...inviteForm, match_id: e.target.value })}
                    required
                  >
                    <option value="">Seleziona partita...</option>
                    {matches.map((match) => (
                      <option key={match.id} value={match.id}>
                        {new Date(match.data_ora).toLocaleDateString('it-IT')} - vs {match.avversario}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dati Ospite */}
                <div style={{
                  marginTop: '20px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--tp-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaUsers />
                  Dati Ospite
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      value={inviteForm.nome}
                      onChange={(e) => setInviteForm({ ...inviteForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cognome *</label>
                    <input
                      type="text"
                      value={inviteForm.cognome}
                      onChange={(e) => setInviteForm({ ...inviteForm, cognome: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefono</label>
                    <input
                      type="tel"
                      value={inviteForm.telefono}
                      onChange={(e) => setInviteForm({ ...inviteForm, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Azienda</label>
                    <input
                      type="text"
                      value={inviteForm.azienda}
                      onChange={(e) => setInviteForm({ ...inviteForm, azienda: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ruolo</label>
                    <input
                      type="text"
                      value={inviteForm.ruolo}
                      onChange={(e) => setInviteForm({ ...inviteForm, ruolo: e.target.value })}
                      placeholder="Es. CEO, Direttore Marketing"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nome Badge (opzionale)</label>
                  <input
                    type="text"
                    value={inviteForm.badge_nome}
                    onChange={(e) => setInviteForm({ ...inviteForm, badge_nome: e.target.value })}
                    placeholder="Lascia vuoto per usare Nome Cognome"
                  />
                </div>

                {/* Opzioni */}
                <div style={{
                  marginTop: '20px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--tp-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaStar />
                  Opzioni
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="checkbox"
                      checked={inviteForm.vip}
                      onChange={(e) => setInviteForm({ ...inviteForm, vip: e.target.checked })}
                    />
                    <FaStar style={{ color: 'var(--tp-warning-500)' }} />
                    Ospite VIP
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}>
                    <input
                      type="checkbox"
                      checked={inviteForm.parcheggio_richiesto}
                      onChange={(e) => setInviteForm({ ...inviteForm, parcheggio_richiesto: e.target.checked })}
                    />
                    <FaCar style={{ color: 'var(--tp-gray-500)' }} />
                    Richiede Parcheggio
                  </label>
                </div>

                <div className="form-group">
                  <label>Note</label>
                  <textarea
                    value={inviteForm.note_ospite}
                    onChange={(e) => setInviteForm({ ...inviteForm, note_ospite: e.target.value })}
                    placeholder="Note sull'ospite..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="tp-btn tp-btn-outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Annulla
                </button>
                <button type="submit" className="tp-btn tp-btn-primary">
                  <FaQrcode style={{ marginRight: '6px' }} />
                  Crea Invito & Genera QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BusinessBoxes;
