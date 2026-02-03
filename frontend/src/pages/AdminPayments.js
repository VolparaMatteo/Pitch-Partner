import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AdminPayments() {
  const [pagamenti, setPagamenti] = useState([]);
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClub, setFilterClub] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [pagamentiRes, fattureRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pagamenti`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/fatture`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPagamenti(Array.isArray(pagamentiRes.data) ? pagamentiRes.data : []);
      setFatture(Array.isArray(fattureRes.data) ? fattureRes.data : []);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalePagamenti = pagamenti.reduce((sum, p) => sum + (p.importo || 0), 0);
    const totaleFatture = fatture.reduce((sum, f) => sum + (f.importo || 0), 0);
    const numeroClubs = new Set(pagamenti.map(p => p.club_id)).size;

    // Calcola incasso del mese corrente
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const incassoMeseCorrente = pagamenti
      .filter(p => {
        const date = new Date(p.data_pagamento);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.importo || 0), 0);

    return { totalePagamenti, totaleFatture, numeroClubs, incassoMeseCorrente };
  };

  // Combina pagamenti con fatture
  const combinedData = pagamenti.map(pagamento => {
    const numeroFattura = pagamento.descrizione?.match(/Fattura N\. ([\w-]+)/)?.[1];
    const fattura = numeroFattura ? fatture.find(f => f.numero_fattura === numeroFattura) : null;
    return {
      ...pagamento,
      fattura
    };
  });

  // Filtri
  const filteredData = combinedData.filter(item => {
    const date = new Date(item.data_pagamento);
    const matchClub = !filterClub || item.club_nome?.toLowerCase().includes(filterClub.toLowerCase());
    const matchMonth = !filterMonth || (date.getMonth() + 1).toString() === filterMonth;
    const matchYear = !filterYear || date.getFullYear().toString() === filterYear;
    return matchClub && matchMonth && matchYear;
  });

  // Lista unica di club per il filtro
  const uniqueClubs = [...new Set(pagamenti.map(p => p.club_nome))].filter(Boolean).sort();

  // Raggruppa per club
  const groupedByClub = filteredData.reduce((acc, item) => {
    const clubName = item.club_nome || 'Sconosciuto';
    if (!acc[clubName]) {
      acc[clubName] = [];
    }
    acc[clubName].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  const stats = calculateStats();

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title">💰 Gestione Pagamenti Globale</h1>
            <p className="welcome-subtitle">Tutti i pagamenti e fatture di tutti i club</p>
          </div>
        </div>

        {/* Link to Analytics */}
        <div
          onClick={() => navigate('/admin/analytics')}
          style={{
            padding: '40px',
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '16px',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            border: '2px solid #1A1A1A',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
                KPI e Metriche Economiche
              </div>
              <div style={{ fontSize: '16px', color: '#3D3D3D', marginBottom: '16px' }}>
                Tutti i KPI economici, grafici e analytics sono disponibili nella dashboard dedicata
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#1A1A1A',
                color: 'white',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600
              }}>
                Vai alla Dashboard Analytics
                <span style={{ fontSize: '18px' }}>→</span>
              </div>
            </div>
            <div style={{ fontSize: '80px', opacity: 0.3 }}>
              📈
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="widget-white" style={{ marginBottom: '24px' }}>
          <div className="widget-header">
            <h3>🔍 Filtri</h3>
          </div>
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                Cerca Club
              </label>
              <input
                type="text"
                placeholder="Nome club..."
                value={filterClub}
                onChange={(e) => setFilterClub(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '15px',
                  color: '#3D3D3D',
                  background: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                Mese
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '15px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti i mesi</option>
                <option value="1">Gennaio</option>
                <option value="2">Febbraio</option>
                <option value="3">Marzo</option>
                <option value="4">Aprile</option>
                <option value="5">Maggio</option>
                <option value="6">Giugno</option>
                <option value="7">Luglio</option>
                <option value="8">Agosto</option>
                <option value="9">Settembre</option>
                <option value="10">Ottobre</option>
                <option value="11">Novembre</option>
                <option value="12">Dicembre</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                Anno
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '15px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti gli anni</option>
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilterClub('');
                  setFilterMonth('');
                  setFilterYear(new Date().getFullYear().toString());
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#E0E0E0',
                  color: '#3D3D3D',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔄 Reset Filtri
              </button>
            </div>
          </div>
        </div>

        {/* Lista Pagamenti Raggruppati per Club */}
        <div className="widget-white">
          <div className="widget-header">
            <h3>📊 Pagamenti per Club</h3>
            <div className="widget-subtitle">
              {filteredData.length} pagament{filteredData.length !== 1 ? 'i' : 'o'} trovato
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {Object.keys(groupedByClub).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                Nessun pagamento trovato con i filtri selezionati
              </div>
            ) : (
              Object.entries(groupedByClub).map(([clubName, items]) => {
                const clubTotal = items.reduce((sum, item) => sum + (item.importo || 0), 0);

                return (
                  <div key={clubName} style={{ marginBottom: '32px' }}>
                    {/* Club Header */}
                    <div style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                      borderRadius: '12px 12px 0 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0'
                    }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
                          🏟️ {clubName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#3D3D3D' }}>
                          {items.length} pagament{items.length !== 1 ? 'i' : 'o'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A' }}>
                          €{clubTotal.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '13px', color: '#3D3D3D' }}>
                          Totale
                        </div>
                      </div>
                    </div>

                    {/* Payments List */}
                    <div style={{
                      border: '2px solid #7FFF00',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      overflow: 'hidden'
                    }}>
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '20px',
                            background: '#FFFFFF',
                            borderBottom: index < items.length - 1 ? '1px solid #F0F0F0' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
                                €{item.importo.toLocaleString()}
                              </div>
                              <div style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: '#E3F2FD',
                                color: '#2196F3'
                              }}>
                                {item.metodo_pagamento}
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                              {item.descrizione || 'Pagamento'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#999' }}>
                              📅 {new Date(item.data_pagamento).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            {item.fattura && (
                              <div style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: '#E8F5E9',
                                color: '#2E7D32',
                                marginTop: '8px'
                              }}>
                                📄 {item.fattura.numero_fattura}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            {item.fattura?.file_url && (
                              <a
                                href={`${API_URL.replace('/api', '')}${item.fattura.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  padding: '10px 20px',
                                  background: '#1A1A1A',
                                  color: 'white',
                                  borderRadius: '10px',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#000000'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}
                              >
                                📥 Fattura
                              </a>
                            )}
                            <button
                              onClick={() => navigate(`/admin/clubs/${item.club_id}`)}
                              style={{
                                padding: '10px 20px',
                                background: 'transparent',
                                color: '#7FFF00',
                                border: '2px solid #7FFF00',
                                borderRadius: '10px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#7FFF00';
                                e.currentTarget.style.color = '#1A1A1A';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#7FFF00';
                              }}
                            >
                              👁️ Vedi Club
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminPayments;
