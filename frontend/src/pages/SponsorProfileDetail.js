import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sponsorNetworkAPI, partnershipAPI, sponsorMessageAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/sponsor-network.css';

function SponsorProfileDetail() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState({
    titolo: '',
    descrizione: '',
    tipo_partnership: 'co-marketing',
    budget_proposto: '',
    durata_mesi: '',
    note: ''
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await sponsorNetworkAPI.getProfileDetail(profileId);
      setProfile(res.data.profile);
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
      alert('Errore nel caricamento del profilo');
      navigate('/sponsor-network');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    navigate(`/sponsor-messages/${profile.sponsor_id}`);
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();

    if (!proposalData.titolo || !proposalData.descrizione) {
      alert('Compila i campi obbligatori');
      return;
    }

    try {
      setSubmittingProposal(true);

      const payload = {
        ...proposalData,
        sponsor_ricevente_id: profile.sponsor_id,
        budget_proposto: proposalData.budget_proposto ? parseFloat(proposalData.budget_proposto) : null,
        durata_mesi: proposalData.durata_mesi ? parseInt(proposalData.durata_mesi) : null
      };

      await partnershipAPI.createProposal(payload);
      alert('Proposta inviata con successo!');
      setShowProposalModal(false);
      setProposalData({
        titolo: '',
        descrizione: '',
        tipo_partnership: 'co-marketing',
        budget_proposto: '',
        durata_mesi: '',
        note: ''
      });
    } catch (error) {
      console.error('Errore invio proposta:', error);
      alert(error.response?.data?.error || 'Errore nell\'invio della proposta');
    } finally {
      setSubmittingProposal(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">Profilo non trovato</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container sponsor-network-container">
        <div className="profile-detail-header">
          <button className="btn-secondary" onClick={() => navigate('/sponsor-network')}>
            ← Torna alla directory
          </button>

          <div className="profile-header-content">
            {profile.logo_url && (
              <img src={profile.logo_url} alt={profile.nome_azienda} className="profile-logo-large" />
            )}
            <div>
              <h1>{profile.nome_azienda}</h1>
              <div className="profile-meta">
                {profile.settore && <span className="badge">🏢 {profile.settore}</span>}
                {profile.dimensione_azienda && <span className="badge">👥 {profile.dimensione_azienda}</span>}
                {profile.target_audience && <span className="badge">🎯 {profile.target_audience}</span>}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-primary" onClick={handleSendMessage}>
              💬 Invia Messaggio
            </button>
            <button className="btn-secondary" onClick={() => setShowProposalModal(true)}>
              🤝 Proponi Partnership
            </button>
          </div>
        </div>

        <div className="profile-detail-content">
          {/* Bio/Descrizione */}
          {profile.bio && (
            <div className="info-card">
              <h2>Chi Siamo</h2>
              <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
            </div>
          )}

          {/* Contatti */}
          <div className="info-card">
            <h2>📞 Contatti</h2>
            <div className="contact-grid">
              {profile.email_contatto && (
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <a href={`mailto:${profile.email_contatto}`}>{profile.email_contatto}</a>
                </div>
              )}
              {profile.telefono && (
                <div className="contact-item">
                  <span className="contact-label">Telefono:</span>
                  <span>{profile.telefono}</span>
                </div>
              )}
              {profile.sito_web && (
                <div className="contact-item">
                  <span className="contact-label">Sito Web:</span>
                  <a href={profile.sito_web} target="_blank" rel="noopener noreferrer">{profile.sito_web}</a>
                </div>
              )}
              {profile.linkedin && (
                <div className="contact-item">
                  <span className="contact-label">LinkedIn:</span>
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">Profilo LinkedIn</a>
                </div>
              )}
            </div>
          </div>

          {/* Interessi Collaboration */}
          {profile.interessi_collaboration && profile.interessi_collaboration.length > 0 && (
            <div className="info-card">
              <h2>🤝 Interessi di Collaborazione</h2>
              <div className="tags-list">
                {profile.interessi_collaboration.map((interesse, idx) => (
                  <span key={idx} className="tag">{interesse}</span>
                ))}
              </div>
            </div>
          )}

          {/* Budget Range */}
          {(profile.budget_min || profile.budget_max) && (
            <div className="info-card">
              <h2>💰 Budget per Partnership</h2>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>
                €{profile.budget_min?.toLocaleString() || '0'} - €{profile.budget_max?.toLocaleString() || 'N/A'}
              </p>
            </div>
          )}

          {/* Obiettivi */}
          {profile.obiettivi_partnership && (
            <div className="info-card">
              <h2>🎯 Obiettivi Partnership</h2>
              <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{profile.obiettivi_partnership}</p>
            </div>
          )}

          {/* Case Studies */}
          {profile.case_studies_urls && profile.case_studies_urls.length > 0 && (
            <div className="info-card">
              <h2>📊 Case Studies</h2>
              <div className="links-list">
                {profile.case_studies_urls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="link-item">
                    📄 Case Study {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Settori Interesse */}
          {profile.settori_interesse && profile.settori_interesse.length > 0 && (
            <div className="info-card">
              <h2>🏷️ Settori di Interesse</h2>
              <div className="tags-list">
                {profile.settori_interesse.map((settore, idx) => (
                  <span key={idx} className="tag">{settore}</span>
                ))}
              </div>
            </div>
          )}

          {/* Disponibilità */}
          {profile.disponibilita_incontri !== undefined && (
            <div className="info-card">
              <h2>📅 Disponibilità Incontri</h2>
              <p>
                {profile.disponibilita_incontri ? (
                  <span style={{ color: '#4CAF50', fontWeight: '500' }}>✅ Disponibile per incontri</span>
                ) : (
                  <span style={{ color: '#999' }}>❌ Non disponibile al momento</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Proposal Modal */}
        {showProposalModal && (
          <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🤝 Proponi Partnership</h2>
                <button className="modal-close" onClick={() => setShowProposalModal(false)}>×</button>
              </div>

              <form onSubmit={handleProposalSubmit}>
                <div className="form-group">
                  <label>Titolo *</label>
                  <input
                    type="text"
                    value={proposalData.titolo}
                    onChange={(e) => setProposalData(prev => ({ ...prev, titolo: e.target.value }))}
                    required
                    placeholder="Es. Campagna co-marketing Autunno 2024"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo Partnership *</label>
                  <select
                    value={proposalData.tipo_partnership}
                    onChange={(e) => setProposalData(prev => ({ ...prev, tipo_partnership: e.target.value }))}
                    required
                  >
                    <option value="co-marketing">Co-Marketing</option>
                    <option value="cross-promotion">Cross-Promotion</option>
                    <option value="event">Evento Congiunto</option>
                    <option value="content">Content Collaboration</option>
                    <option value="product">Product Partnership</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Descrizione *</label>
                  <textarea
                    value={proposalData.descrizione}
                    onChange={(e) => setProposalData(prev => ({ ...prev, descrizione: e.target.value }))}
                    required
                    rows="5"
                    placeholder="Descrivi la tua proposta di partnership..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Budget Proposto (€)</label>
                    <input
                      type="number"
                      value={proposalData.budget_proposto}
                      onChange={(e) => setProposalData(prev => ({ ...prev, budget_proposto: e.target.value }))}
                      min="0"
                      step="100"
                      placeholder="5000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Durata (mesi)</label>
                    <input
                      type="number"
                      value={proposalData.durata_mesi}
                      onChange={(e) => setProposalData(prev => ({ ...prev, durata_mesi: e.target.value }))}
                      min="1"
                      max="36"
                      placeholder="6"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Note Aggiuntive</label>
                  <textarea
                    value={proposalData.note}
                    onChange={(e) => setProposalData(prev => ({ ...prev, note: e.target.value }))}
                    rows="3"
                    placeholder="Eventuali note o dettagli aggiuntivi..."
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowProposalModal(false)}
                    disabled={submittingProposal}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn-primary" disabled={submittingProposal}>
                    {submittingProposal ? 'Invio...' : '📤 Invia Proposta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorProfileDetail;
