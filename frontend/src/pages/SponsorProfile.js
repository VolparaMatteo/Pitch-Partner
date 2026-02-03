import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sponsorNetworkAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/sponsor-network.css';

function SponsorProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    descrizione_pubblica: '',
    dimensione_azienda: '',
    target_audience: '',
    anno_fondazione: '',
    interesse_eventi_congiunti: false,
    interesse_campagne_social: false,
    interesse_promo_incrociate: false,
    interesse_merchandising: false,
    interesse_altro: '',
    visibile_rete_sponsor: true,
    permetti_messaggi: true
  });

  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await sponsorNetworkAPI.getMyProfile();
      if (res.data.profile) {
        setProfile(res.data.profile);
        setFormData({
          descrizione_pubblica: res.data.profile.descrizione_pubblica || '',
          dimensione_azienda: res.data.profile.dimensione_azienda || '',
          target_audience: res.data.profile.target_audience || '',
          anno_fondazione: res.data.profile.anno_fondazione || '',
          interesse_eventi_congiunti: res.data.profile.interesse_eventi_congiunti || false,
          interesse_campagne_social: res.data.profile.interesse_campagne_social || false,
          interesse_promo_incrociate: res.data.profile.interesse_promo_incrociate || false,
          interesse_merchandising: res.data.profile.interesse_merchandising || false,
          interesse_altro: res.data.profile.interesse_altro || '',
          visibile_rete_sponsor: res.data.profile.visibile_rete_sponsor !== false,
          permetti_messaggi: res.data.profile.permetti_messaggi !== false
        });
      } else {
        // Profilo non esiste, modalità creazione
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setIsEditing(true); // Se errore, assume creazione
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (profile) {
        // Update
        await sponsorNetworkAPI.updateMyProfile(formData);
        alert('Profilo aggiornato con successo!');
      } else {
        // Create
        await sponsorNetworkAPI.createMyProfile(formData);
        alert('Profilo creato con successo!');
      }
      fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore nel salvataggio del profilo: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
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

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{profile ? 'Il Mio Profilo Pubblico' : 'Crea Profilo Pubblico'}</h1>
          <div className="dashboard-actions">
            <button className="btn-secondary" onClick={() => navigate('/sponsor-network')}>
              ← Torna alla Rete
            </button>
          </div>
        </div>

        {!isEditing && profile ? (
          // Visualizzazione profilo
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-header">
                <h2>Informazioni Pubbliche</h2>
                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  ✏️ Modifica
                </button>
              </div>

              <div className="profile-field">
                <label>Descrizione Pubblica</label>
                <p>{profile.descrizione_pubblica || 'Non specificata'}</p>
              </div>

              <div className="profile-row">
                <div className="profile-field">
                  <label>Dimensione Azienda</label>
                  <p>{profile.dimensione_azienda || 'Non specificata'}</p>
                </div>
                <div className="profile-field">
                  <label>Target Audience</label>
                  <p>{profile.target_audience || 'Non specificato'}</p>
                </div>
              </div>

              <div className="profile-field">
                <label>Anno Fondazione</label>
                <p>{profile.anno_fondazione || 'Non specificato'}</p>
              </div>

              <div className="profile-field">
                <label>Interessi Co-Marketing</label>
                <div className="interest-list">
                  {profile.interesse_eventi_congiunti && <span className="tag">🎪 Eventi Congiunti</span>}
                  {profile.interesse_campagne_social && <span className="tag">📱 Campagne Social</span>}
                  {profile.interesse_promo_incrociate && <span className="tag">🎁 Promo Incrociate</span>}
                  {profile.interesse_merchandising && <span className="tag">👕 Merchandising</span>}
                  {profile.interesse_altro && <span className="tag">➕ {profile.interesse_altro}</span>}
                </div>
              </div>

              <div className="profile-field">
                <label>Privacy</label>
                <div className="privacy-status">
                  <span className={profile.visibile_rete_sponsor ? 'status-active' : 'status-inactive'}>
                    {profile.visibile_rete_sponsor ? '✅ Visibile nella rete' : '❌ Non visibile'}
                  </span>
                  <span className={profile.permetti_messaggi ? 'status-active' : 'status-inactive'}>
                    {profile.permetti_messaggi ? '✅ Messaggi abilitati' : '❌ Messaggi disabilitati'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Form modifica/creazione
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Informazioni Azienda</h3>

              <div className="form-group">
                <label>Descrizione Pubblica *</label>
                <textarea
                  value={formData.descrizione_pubblica}
                  onChange={(e) => setFormData({ ...formData, descrizione_pubblica: e.target.value })}
                  placeholder="Racconta la tua azienda, cosa fate, i vostri valori..."
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dimensione Azienda</label>
                  <select
                    value={formData.dimensione_azienda}
                    onChange={(e) => setFormData({ ...formData, dimensione_azienda: e.target.value })}
                  >
                    <option value="">Seleziona...</option>
                    <option value="Startup">Startup</option>
                    <option value="PMI">PMI</option>
                    <option value="Grande Impresa">Grande Impresa</option>
                    <option value="Multinazionale">Multinazionale</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Audience</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  >
                    <option value="">Seleziona...</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                    <option value="B2B2C">B2B2C</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Anno Fondazione</label>
                <input
                  type="number"
                  value={formData.anno_fondazione}
                  onChange={(e) => setFormData({ ...formData, anno_fondazione: e.target.value })}
                  placeholder="Es: 2010"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Interessi Co-Marketing</h3>
              <p className="form-hint">Seleziona i tipi di collaborazione che ti interessano</p>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.interesse_eventi_congiunti}
                    onChange={(e) => setFormData({ ...formData, interesse_eventi_congiunti: e.target.checked })}
                  />
                  <span>🎪 Eventi Congiunti</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.interesse_campagne_social}
                    onChange={(e) => setFormData({ ...formData, interesse_campagne_social: e.target.checked })}
                  />
                  <span>📱 Campagne Social</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.interesse_promo_incrociate}
                    onChange={(e) => setFormData({ ...formData, interesse_promo_incrociate: e.target.checked })}
                  />
                  <span>🎁 Promozioni Incrociate</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.interesse_merchandising}
                    onChange={(e) => setFormData({ ...formData, interesse_merchandising: e.target.checked })}
                  />
                  <span>👕 Merchandising Co-Branded</span>
                </label>
              </div>

              <div className="form-group">
                <label>Altri Interessi</label>
                <input
                  type="text"
                  value={formData.interesse_altro}
                  onChange={(e) => setFormData({ ...formData, interesse_altro: e.target.value })}
                  placeholder="Es: Partnership tecnologiche, Sponsorizzazioni incrociate..."
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Privacy e Visibilità</h3>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.visibile_rete_sponsor}
                    onChange={(e) => setFormData({ ...formData, visibile_rete_sponsor: e.target.checked })}
                  />
                  <span>✅ Rendi visibile il mio profilo nella rete sponsor</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.permetti_messaggi}
                    onChange={(e) => setFormData({ ...formData, permetti_messaggi: e.target.checked })}
                  />
                  <span>💬 Permetti agli altri sponsor di contattarmi</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : (profile ? 'Salva Modifiche' : 'Crea Profilo')}
              </button>
              {profile && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                >
                  Annulla
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export default SponsorProfile;
