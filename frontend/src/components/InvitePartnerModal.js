import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

/**
 * Modale per invitare partner (club o sponsor) a un'opportunità
 *
 * Props:
 * - isOpen: boolean per mostrare/nascondere
 * - onClose: callback chiusura
 * - opportunityId: ID dell'opportunità
 * - opportunityTitle: titolo opportunità (per display)
 * - onInviteSent: callback dopo invio invito
 */
function InvitePartnerModal({ isOpen, onClose, opportunityId, opportunityTitle, onInviteSent }) {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'club', 'sponsor'

  // Selezione e messaggio
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [message, setMessage] = useState('');

  const { token } = getAuth();

  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchPartners();
    }
  }, [isOpen, opportunityId]);

  useEffect(() => {
    // Applica filtri
    let filtered = partners;

    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.settore?.toLowerCase().includes(search) ||
        p.tipologia?.toLowerCase().includes(search)
      );
    }

    setFilteredPartners(filtered);
  }, [partners, searchTerm, filterType]);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_URL}/club/marketplace/invitable-partners?opportunity_id=${opportunityId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPartners(res.data.partners || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Errore caricamento partner');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedPartner) return;

    setSending(true);
    setError(null);
    try {
      await axios.post(
        `${API_URL}/club/marketplace/opportunities/${opportunityId}/invite`,
        {
          recipient_type: selectedPartner.type,
          recipient_id: selectedPartner.id,
          messaggio: message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Invito inviato a ${selectedPartner.name}!`);

      // Rimuovi partner dalla lista
      setPartners(prev => prev.filter(p => !(p.id === selectedPartner.id && p.type === selectedPartner.type)));
      setSelectedPartner(null);
      setMessage('');

      // Callback
      if (onInviteSent) {
        onInviteSent(selectedPartner);
      }

      // Nascondi success dopo 3 secondi
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Errore invio invito');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSelectedPartner(null);
    setMessage('');
    setSearchTerm('');
    setFilterType('all');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
              Invita Partner
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
              Per: {opportunityTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '8px'
            }}
          >
            ×
          </button>
        </div>

        {/* Contenuto */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Lista Partner */}
          <div style={{
            flex: 1,
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Filtri */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <input
                type="text"
                placeholder="Cerca partner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '12px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { key: 'all', label: 'Tutti' },
                  { key: 'club', label: 'Club' },
                  { key: 'sponsor', label: 'Sponsor' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilterType(f.key)}
                    style={{
                      padding: '8px 16px',
                      border: filterType === f.key ? '2px solid #85FF00' : '2px solid #e0e0e0',
                      background: filterType === f.key ? '#f0fff0' : 'white',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: filterType === f.key ? 600 : 400,
                      cursor: 'pointer',
                      color: filterType === f.key ? '#166534' : '#666'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  Caricamento...
                </div>
              ) : filteredPartners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                  <p>Nessun partner trovato</p>
                  <p style={{ fontSize: '13px' }}>
                    {partners.length === 0
                      ? 'Tutti i partner sono già stati invitati o hanno già una candidatura'
                      : 'Prova a modificare i filtri'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredPartners.map(partner => (
                    <div
                      key={`${partner.type}-${partner.id}`}
                      onClick={() => setSelectedPartner(partner)}
                      style={{
                        padding: '16px',
                        background: selectedPartner?.id === partner.id && selectedPartner?.type === partner.type
                          ? '#f0fff0'
                          : '#f8f8f8',
                        border: selectedPartner?.id === partner.id && selectedPartner?.type === partner.type
                          ? '2px solid #85FF00'
                          : '1px solid #e0e0e0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Logo */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {partner.logo ? (
                            <img
                              src={partner.logo.startsWith('http') ? partner.logo : `${API_URL.replace('/api', '')}${partner.logo}`}
                              alt={partner.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span style={{ fontSize: '20px' }}>
                              {partner.type === 'club' ? '🏆' : '🏢'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                            {partner.name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: partner.type === 'club' ? '#dbeafe' : '#fef3c7',
                              color: partner.type === 'club' ? '#1e40af' : '#92400e',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 500
                            }}>
                              {partner.type === 'club' ? 'Club' : 'Sponsor'}
                            </span>
                            {partner.tipologia && (
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {partner.tipologia}
                              </span>
                            )}
                            {partner.settore && (
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {partner.settore}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Checkmark se selezionato */}
                        {selectedPartner?.id === partner.id && selectedPartner?.type === partner.type && (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#22c55e',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel Invito */}
          <div style={{
            width: '320px',
            padding: '24px',
            background: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedPartner ? (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
                    Invita {selectedPartner.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                    Aggiungi un messaggio personalizzato per aumentare le probabilità di risposta
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Messaggio (opzionale)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Scrivi un messaggio personalizzato..."
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '14px',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {message.length}/500 caratteri
                  </div>
                </div>

                {/* Errore */}
                {error && (
                  <div style={{
                    padding: '12px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}>
                    {error}
                  </div>
                )}

                {/* Successo */}
                {success && (
                  <div style={{
                    padding: '12px',
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    color: '#166534',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}>
                    {success}
                  </div>
                )}

                <button
                  onClick={handleSendInvite}
                  disabled={sending}
                  style={{
                    padding: '14px 24px',
                    background: sending ? '#ccc' : '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    marginTop: 'auto'
                  }}
                >
                  {sending ? 'Invio in corso...' : '📩 Invia Invito'}
                </button>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
                <p style={{ fontSize: '15px', fontWeight: 500 }}>
                  Seleziona un partner
                </p>
                <p style={{ fontSize: '13px' }}>
                  Scegli dalla lista a sinistra chi vuoi invitare
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa'
        }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {partners.length} partner disponibili
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#666'
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvitePartnerModal;
