import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sponsorNetworkAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/sponsor-network.css';

function SponsorNetwork() {
  const [profiles, setProfiles] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    settore: '',
    dimensione: '',
    interesse: ''
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
      const [profilesRes, myProfileRes] = await Promise.all([
        sponsorNetworkAPI.getProfiles(filters),
        sponsorNetworkAPI.getMyProfile()
      ]);
      setProfiles(profilesRes.data.profiles || []);
      setMyProfile(myProfileRes.data.profile);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const res = await sponsorNetworkAPI.getProfiles(filters);
      setProfiles(res.data.profiles || []);
    } catch (error) {
      console.error('Errore filtri:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ settore: '', dimensione: '', interesse: '' });
    setTimeout(fetchData, 100);
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
          <h1>Rete Sponsor</h1>
          <div className="dashboard-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate('/sponsor-network/my-profile')}
            >
              {myProfile ? '⚙️ Modifica Profilo' : '➕ Crea Profilo'}
            </button>
          </div>
        </div>

        {/* Alert se profilo non creato */}
        {!myProfile && (
          <div className="alert-warning">
            <strong>⚠️ Profilo pubblico non creato.</strong> Crea il tuo profilo per apparire nella rete sponsor e ricevere messaggi.
            <button className="btn-link" onClick={() => navigate('/sponsor-network/my-profile')}>
              Crea ora →
            </button>
          </div>
        )}

        {/* Filtri */}
        <div className="filter-section">
          <h3>🔍 Filtra Sponsor</h3>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Settore</label>
              <input
                type="text"
                placeholder="Es: Tecnologia, Food..."
                value={filters.settore}
                onChange={(e) => setFilters({ ...filters, settore: e.target.value })}
              />
            </div>
            <div className="filter-item">
              <label>Dimensione Azienda</label>
              <select
                value={filters.dimensione}
                onChange={(e) => setFilters({ ...filters, dimensione: e.target.value })}
              >
                <option value="">Tutte</option>
                <option value="Startup">Startup</option>
                <option value="PMI">PMI</option>
                <option value="Grande Impresa">Grande Impresa</option>
                <option value="Multinazionale">Multinazionale</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Interesse Co-Marketing</label>
              <select
                value={filters.interesse}
                onChange={(e) => setFilters({ ...filters, interesse: e.target.value })}
              >
                <option value="">Tutti</option>
                <option value="eventi">Eventi Congiunti</option>
                <option value="social">Campagne Social</option>
                <option value="promo">Promo Incrociate</option>
                <option value="merchandising">Merchandising</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary" onClick={applyFilters}>Applica Filtri</button>
            <button className="btn-secondary" onClick={clearFilters}>Reset</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{profiles.length}</span>
            <span className="stat-label">Sponsor nella rete</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {profiles.filter(p => p.permetti_messaggi).length}
            </span>
            <span className="stat-label">Disponibili al contatto</span>
          </div>
        </div>

        {/* Grid Sponsor */}
        <div className="sponsor-grid">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="sponsor-card"
              onClick={() => navigate(`/sponsor-network/profile/${profile.id}`)}
            >
              {profile.logo_url && (
                <img src={profile.logo_url} alt={profile.ragione_sociale} className="sponsor-logo" />
              )}
              <h3>{profile.ragione_sociale}</h3>
              <p className="sponsor-sector">{profile.settore_merceologico}</p>

              {profile.descrizione_pubblica && (
                <p className="sponsor-description">
                  {profile.descrizione_pubblica.substring(0, 100)}
                  {profile.descrizione_pubblica.length > 100 ? '...' : ''}
                </p>
              )}

              <div className="sponsor-meta">
                {profile.dimensione_azienda && (
                  <span className="badge">{profile.dimensione_azienda}</span>
                )}
                {profile.target_audience && (
                  <span className="badge">{profile.target_audience}</span>
                )}
              </div>

              {/* Interessi */}
              {(profile.interessi.eventi_congiunti || profile.interessi.campagne_social ||
                profile.interessi.promo_incrociate || profile.interessi.merchandising) && (
                <div className="sponsor-interests">
                  <strong>Interessi:</strong>
                  <div className="interest-tags">
                    {profile.interessi.eventi_congiunti && <span className="tag">🎪 Eventi</span>}
                    {profile.interessi.campagne_social && <span className="tag">📱 Social</span>}
                    {profile.interessi.promo_incrociate && <span className="tag">🎁 Promo</span>}
                    {profile.interessi.merchandising && <span className="tag">👕 Merch</span>}
                  </div>
                </div>
              )}

              <div className="sponsor-actions">
                {profile.permetti_messaggi ? (
                  <button
                    className="btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/sponsor-messages/${profile.sponsor_id}`);
                    }}
                  >
                    💬 Contatta
                  </button>
                ) : (
                  <span className="text-muted">Messaggi disabilitati</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div className="empty-state">
            <h3>Nessuno sponsor trovato</h3>
            <p>Prova a modificare i filtri di ricerca.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorNetwork;
