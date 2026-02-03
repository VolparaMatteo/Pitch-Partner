import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminResourceAPI } from '../services/resourceAPI';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

function AdminResourceAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminResourceAPI.getAnalyticsOverview();
      setAnalytics(res.data);
    } catch (error) {
      console.error('Errore caricamento analytics:', error);
    } finally {
      setLoading(false);
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

  if (!analytics) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">Errore nel caricamento analytics</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>📊 Analytics Portale Risorse</h1>
          <button className="btn-secondary" onClick={() => navigate('/admin/resources')}>
            ← Torna alle Risorse
          </button>
        </div>

        {/* Overview Stats */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.total_resources}</div>
              <div className="stat-label">Risorse Totali</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.total_views.toLocaleString()}</div>
              <div className="stat-label">Visualizzazioni</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⬇️</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.total_downloads.toLocaleString()}</div>
              <div className="stat-label">Download</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔖</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.total_bookmarks}</div>
              <div className="stat-label">Bookmark</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.avg_rating_overall}</div>
              <div className="stat-label">Rating Medio</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-value">{analytics.overview.total_reviews}</div>
              <div className="stat-label">Recensioni</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Top Viewed */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>👁️ Top 10 Più Viste</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analytics.top_viewed.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>Nessun dato</p>
              ) : (
                analytics.top_viewed.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: index < 3 ? '#85FF00' : '#e0e0e0',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '14px' }}>{item.titolo}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#2196F3' }}>{item.views.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Downloaded */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>⬇️ Top 10 Più Scaricate</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analytics.top_downloaded.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>Nessun dato</p>
              ) : (
                analytics.top_downloaded.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: index < 3 ? '#85FF00' : '#e0e0e0',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '14px' }}>{item.titolo}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#4CAF50' }}>{item.downloads.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Rated */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>⭐ Top 10 Miglior Rating</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analytics.top_rated.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>Nessun dato</p>
              ) : (
                analytics.top_rated.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: index < 3 ? '#85FF00' : '#e0e0e0',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '14px' }}>{item.titolo}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: '#FF9800' }}>
                      ⭐ {item.rating.toFixed(1)} ({item.reviews})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* By Category */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>📂 Risorse per Categoria</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analytics.by_category.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>Nessun dato</p>
              ) : (
                analytics.by_category.map((item) => (
                  <div
                    key={item.nome}
                    style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{item.nome}</span>
                    <span style={{
                      background: '#2196F3',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* By Type */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '20px' }}>📋 Risorse per Tipo</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {analytics.by_type.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center' }}>Nessun dato</p>
              ) : (
                analytics.by_type.map((item) => {
                  const icons = {
                    'ricerca': '📊',
                    'case-study': '💼',
                    'guida': '📖',
                    'template': '📄',
                    'video': '🎥',
                    'articolo': '📰',
                    'whitepaper': '📑',
                    'toolkit': '🧰'
                  };
                  return (
                    <div
                      key={item.tipo}
                      style={{
                        padding: '12px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        {icons[item.tipo] || '📄'} {item.tipo}
                      </span>
                      <span style={{
                        background: '#4CAF50',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {item.count}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminResourceAnalytics;
