import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClubProjectForm() {
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    data_inizio: '',
    data_fine: '',
    priorita: 'media',
    budget_allocato: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/club/projects`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Progetto creato con successo!');
      navigate(`/club/projects/${res.data.project.id}`);
    } catch (error) {
      console.error('Errore creazione progetto:', error);
      alert(error.response?.data?.error || 'Errore durante la creazione del progetto');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '12px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#666'
  };

  const sectionStyle = {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid #E0E0E0'
  };

  return (
    <>
      <div className="dashboard-new-container">
        {/* Back Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/club/projects')}
            className="stat-btn"
            style={{ padding: '10px 20px' }}
          >
            ← Indietro
          </button>
        </div>

        {/* Header */}
        <div className="welcome-header" style={{ marginBottom: '32px' }}>
          <h1 className="welcome-title">🚀 Crea Nuovo Progetto</h1>
        </div>

        {/* Form */}
        <div className="widget-white">
          <form onSubmit={handleSubmit}>
            {/* Informazioni Progetto */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Informazioni Progetto
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>
                  Titolo Progetto <span style={{ color: '#FF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  required
                  placeholder="es. Campagna Social Media 2024"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Descrizione</label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrivi obiettivi e attività del progetto..."
                  rows={5}
                  style={{
                    ...inputStyle,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Step 3: Timeline e Priorità */}
            <div style={sectionStyle}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: '#1A1A1A' }}>
                Timeline e Dettagli
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Data Inizio</label>
                  <input
                    type="date"
                    value={formData.data_inizio}
                    onChange={(e) => setFormData({ ...formData, data_inizio: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Data Fine</label>
                  <input
                    type="date"
                    value={formData.data_fine}
                    onChange={(e) => setFormData({ ...formData, data_fine: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Priorità</label>
                  <select
                    value={formData.priorita}
                    onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="bassa">🟢 Bassa</option>
                    <option value="media">🟡 Media</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Budget Allocato (€)</label>
                  <input
                    type="number"
                    value={formData.budget_allocato}
                    onChange={(e) => setFormData({ ...formData, budget_allocato: e.target.value })}
                    placeholder="10000"
                    min="0"
                    step="100"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid #E0E0E0'
            }}>
              <button
                type="button"
                onClick={() => navigate('/club/projects')}
                style={{
                  padding: '12px 32px',
                  background: '#F5F5F5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  background: loading ? '#E0E0E0' : '#7FFF00',
                  color: loading ? '#999' : '#1A1A1A',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                {loading ? 'Salvataggio...' : 'Salva Progetto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ClubProjectForm;
