import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnershipAPI, sponsorNetworkAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/sponsor-network.css';

function Partnerships() {
  const [activeTab, setActiveTab] = useState('active');
  const [partnerships, setPartnerships] = useState([]);
  const [sentProposals, setSentProposals] = useState([]);
  const [receivedProposals, setReceivedProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [formData, setFormData] = useState({
    target_sponsor_id: '',
    tipo: '',
    titolo: '',
    descrizione: '',
    budget_stimato: '',
    data_inizio: '',
    data_fine: ''
  });

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnershipsRes, sentRes, receivedRes] = await Promise.all([
        partnershipAPI.getPartnerships(),
        partnershipAPI.getSentProposals(),
        partnershipAPI.getReceivedProposals()
      ]);
      setPartnerships(partnershipsRes.data.partnerships || []);
      setSentProposals(sentRes.data.proposals || []);
      setReceivedProposals(receivedRes.data.proposals || []);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSponsors = async () => {
    try {
      const res = await sponsorNetworkAPI.getProfiles();
      setAvailableSponsors(res.data.profiles || []);
    } catch (error) {
      console.error('Errore caricamento sponsor:', error);
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      await partnershipAPI.createProposal(formData);
      alert('Proposta inviata con successo!');
      setShowNewProposal(false);
      setFormData({
        target_sponsor_id: '',
        tipo: '',
        titolo: '',
        descrizione: '',
        budget_stimato: '',
        data_inizio: '',
        data_fine: ''
      });
      fetchData();
    } catch (error) {
      console.error('Errore creazione proposta:', error);
      alert('Errore: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm('Confermi di voler accettare questa proposta di partnership?')) return;
    try {
      await partnershipAPI.acceptProposal(proposalId);
      alert('Proposta accettata! Partnership creata.');
      fetchData();
    } catch (error) {
      console.error('Errore accettazione:', error);
      alert('Errore: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRejectProposal = async (proposalId) => {
    const note = window.prompt('Motivo del rifiuto (opzionale):');
    if (note === null) return; // Cancellato
    try {
      await partnershipAPI.rejectProposal(proposalId, { risposta_note: note });
      alert('Proposta rifiutata.');
      fetchData();
    } catch (error) {
      console.error('Errore rifiuto:', error);
      alert('Errore: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleWithdrawProposal = async (proposalId) => {
    if (!window.confirm('Sei sicuro di voler ritirare questa proposta?')) return;
    try {
      await partnershipAPI.withdrawProposal(proposalId);
      alert('Proposta ritirata.');
      fetchData();
    } catch (error) {
      console.error('Errore ritiro:', error);
      alert('Errore: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'In Attesa', color: '#FFA500' },
      accepted: { label: 'Accettata', color: '#85FF00' },
      rejected: { label: 'Rifiutata', color: '#FF4444' },
      withdrawn: { label: 'Ritirata', color: '#999' },
      attiva: { label: 'Attiva', color: '#85FF00' },
      completata: { label: 'Completata', color: '#4CAF50' },
      annullata: { label: 'Annullata', color: '#999' }
    };
    const s = statusMap[status] || { label: status, color: '#999' };
    return <span className="status-badge" style={{ background: s.color }}>{s.label}</span>;
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

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Partnership & Proposte</h1>
          <button
            className="btn-primary"
            onClick={() => {
              setShowNewProposal(true);
              fetchAvailableSponsors();
            }}
          >
            + Nuova Proposta
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🤝</div>
            <div className="stat-content">
              <div className="stat-value">{partnerships.length}</div>
              <div className="stat-label">Partnership Attive</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📤</div>
            <div className="stat-content">
              <div className="stat-value">{sentProposals.filter(p => p.status === 'pending').length}</div>
              <div className="stat-label">Proposte Inviate</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📥</div>
            <div className="stat-content">
              <div className="stat-value">{receivedProposals.filter(p => p.status === 'pending').length}</div>
              <div className="stat-label">Da Valutare</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Partnership Attive
          </button>
          <button
            className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Proposte Inviate ({sentProposals.length})
          </button>
          <button
            className={`tab ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Proposte Ricevute ({receivedProposals.length})
          </button>
        </div>

        {/* Modal Nuova Proposta */}
        {showNewProposal && (
          <div className="modal-overlay" onClick={() => setShowNewProposal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Nuova Proposta di Partnership</h2>
                <button className="modal-close" onClick={() => setShowNewProposal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateProposal}>
                <div className="form-group">
                  <label>Sponsor Destinatario *</label>
                  <select
                    value={formData.target_sponsor_id}
                    onChange={(e) => setFormData({ ...formData, target_sponsor_id: e.target.value })}
                    required
                  >
                    <option value="">Seleziona sponsor...</option>
                    {availableSponsors.map(s => (
                      <option key={s.sponsor_id} value={s.sponsor_id}>
                        {s.ragione_sociale} - {s.settore_merceologico}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo Partnership *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    <option value="evento_congiunto">Evento Congiunto</option>
                    <option value="campagna_social">Campagna Social</option>
                    <option value="promo_incrociata">Promozione Incrociata</option>
                    <option value="merchandising">Merchandising Co-Branded</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Titolo *</label>
                  <input
                    type="text"
                    value={formData.titolo}
                    onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                    placeholder="Es: Campagna Social Congiunta Estate 2025"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descrizione</label>
                  <textarea
                    value={formData.descrizione}
                    onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                    placeholder="Descrivi la proposta di partnership..."
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Budget Stimato (€)</label>
                    <input
                      type="number"
                      value={formData.budget_stimato}
                      onChange={(e) => setFormData({ ...formData, budget_stimato: e.target.value })}
                      placeholder="Es: 5000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data Inizio</label>
                    <input
                      type="date"
                      value={formData.data_inizio}
                      onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Data Fine</label>
                    <input
                      type="date"
                      value={formData.data_fine}
                      onChange={(e) => setFormData({ ...formData, data_fine: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Invia Proposta</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowNewProposal(false)}>
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'active' && (
            <div className="partnerships-list">
              {partnerships.length === 0 ? (
                <div className="empty-state">
                  <h3>Nessuna partnership attiva</h3>
                  <p>Invia una proposta di partnership ad altri sponsor della rete!</p>
                </div>
              ) : (
                partnerships.map(p => (
                  <div key={p.id} className="partnership-card">
                    {p.partner_sponsor.logo_url && (
                      <img src={p.partner_sponsor.logo_url} alt={p.partner_sponsor.ragione_sociale} className="partner-logo" />
                    )}
                    <div className="partnership-info">
                      <h3>{p.titolo}</h3>
                      <p className="partner-name">con {p.partner_sponsor.ragione_sociale}</p>
                      <p className="partnership-type">{p.tipo.replace('_', ' ')}</p>
                      {p.descrizione && <p className="partnership-desc">{p.descrizione}</p>}
                      <div className="partnership-meta">
                        {p.data_inizio && <span>📅 {new Date(p.data_inizio).toLocaleDateString('it-IT')}</span>}
                        {p.data_fine && <span> - {new Date(p.data_fine).toLocaleDateString('it-IT')}</span>}
                      </div>
                    </div>
                    <div className="partnership-status">
                      {getStatusBadge(p.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="proposals-list">
              {sentProposals.length === 0 ? (
                <div className="empty-state">
                  <h3>Nessuna proposta inviata</h3>
                </div>
              ) : (
                sentProposals.map(p => (
                  <div key={p.id} className="proposal-card">
                    <div className="proposal-header">
                      <h3>{p.titolo}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="proposal-target">A: {p.target_sponsor.ragione_sociale}</p>
                    <p className="proposal-type">{p.tipo.replace('_', ' ')}</p>
                    {p.descrizione && <p className="proposal-desc">{p.descrizione}</p>}
                    {p.budget_stimato && <p className="proposal-budget">Budget: €{parseFloat(p.budget_stimato).toLocaleString()}</p>}
                    <div className="proposal-meta">
                      <span>Inviata il {new Date(p.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                    {p.status === 'pending' && (
                      <div className="proposal-actions">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleWithdrawProposal(p.id)}
                        >
                          Ritira
                        </button>
                      </div>
                    )}
                    {p.status === 'rejected' && p.risposta_note && (
                      <div className="proposal-response">
                        <strong>Motivo rifiuto:</strong> {p.risposta_note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="proposals-list">
              {receivedProposals.length === 0 ? (
                <div className="empty-state">
                  <h3>Nessuna proposta ricevuta</h3>
                </div>
              ) : (
                receivedProposals.map(p => (
                  <div key={p.id} className="proposal-card">
                    <div className="proposal-header">
                      <h3>{p.titolo}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <p className="proposal-from">Da: {p.proposer_sponsor.ragione_sociale}</p>
                    <p className="proposal-type">{p.tipo.replace('_', ' ')}</p>
                    {p.descrizione && <p className="proposal-desc">{p.descrizione}</p>}
                    {p.budget_stimato && <p className="proposal-budget">Budget: €{parseFloat(p.budget_stimato).toLocaleString()}</p>}
                    <div className="proposal-meta">
                      <span>Ricevuta il {new Date(p.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                    {p.status === 'pending' && (
                      <div className="proposal-actions">
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleAcceptProposal(p.id)}
                        >
                          ✅ Accetta
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleRejectProposal(p.id)}
                        >
                          ❌ Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Partnerships;
