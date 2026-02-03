import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('economica');
  const [loading, setLoading] = useState(true);
  const [pagamenti, setPagamenti] = useState([]);
  const [fatture, setFatture] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Filtri avanzati
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, quarter, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

      const [pagamentiRes, fattureRes, clubsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pagamenti`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/fatture`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/clubs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPagamenti(Array.isArray(pagamentiRes.data) ? pagamentiRes.data : []);
      setFatture(Array.isArray(fattureRes.data) ? fattureRes.data : []);
      setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : []);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per filtrare i dati in base al periodo selezionato
  const getFilteredData = () => {
    const now = new Date();
    let startDate = null;
    let endDate = now;

    if (dateFilter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateFilter === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (dateFilter === 'month') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateFilter === 'quarter') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    } else if (dateFilter === 'year') {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else if (dateFilter === 'all') {
      return { pagamenti, fatture };
    }

    if (!startDate) return { pagamenti, fatture };

    const filteredPagamenti = pagamenti.filter(p => {
      const date = new Date(p.data_pagamento);
      return date >= startDate && date <= endDate;
    });

    const filteredFatture = fatture.filter(f => {
      const date = new Date(f.data_fattura);
      return date >= startDate && date <= endDate;
    });

    return { pagamenti: filteredPagamenti, fatture: filteredFatture };
  };

  // Calcola KPI Economici Avanzati
  const calculateEconomicKPIs = () => {
    const { pagamenti: filteredPagamenti, fatture: filteredFatture } = getFilteredData();

    // Totale incassato
    const totaleIncassato = filteredPagamenti.reduce((sum, p) => sum + (p.importo || 0), 0);

    // Totale fatturato
    const totaleFatturato = filteredFatture.reduce((sum, f) => sum + (f.importo || 0), 0);

    // Numero transazioni
    const numeroTransazioni = filteredPagamenti.length;

    // Media per transazione
    const mediaTransazione = numeroTransazioni > 0 ? totaleIncassato / numeroTransazioni : 0;

    // MRR (Monthly Recurring Revenue) - media ultimi 3 mesi
    const last3Months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthRevenue = pagamenti.filter(p => {
        const pd = new Date(p.data_pagamento);
        return pd.getMonth() === date.getMonth() && pd.getFullYear() === date.getFullYear();
      }).reduce((sum, p) => sum + (p.importo || 0), 0);
      last3Months.push(monthRevenue);
    }
    const mrr = last3Months.reduce((sum, val) => sum + val, 0) / 3;

    // ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Incasso per metodo di pagamento
    const incassoPerMetodo = {};
    filteredPagamenti.forEach(p => {
      const metodo = p.metodo_pagamento || 'Non specificato';
      incassoPerMetodo[metodo] = (incassoPerMetodo[metodo] || 0) + (p.importo || 0);
    });

    // Progressione mensile ultimi 12 mesi (per grafico linea)
    const progressioneMensile = [];
    for (let i = 11; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const anno = data.getFullYear();
      const mese = data.getMonth();

      const incassoMese = pagamenti.filter(p => {
        const dataPag = new Date(p.data_pagamento);
        return dataPag.getFullYear() === anno && dataPag.getMonth() === mese;
      }).reduce((sum, p) => sum + (p.importo || 0), 0);

      progressioneMensile.push({
        mese: data.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        incasso: incassoMese,
        timestamp: data.getTime()
      });
    }

    // Incasso per club (top 10)
    const incassoPerClub = {};
    filteredPagamenti.forEach(p => {
      const clubNome = p.club_nome || 'Sconosciuto';
      incassoPerClub[clubNome] = (incassoPerClub[clubNome] || 0) + (p.importo || 0);
    });
    const topClubs = Object.entries(incassoPerClub)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([nome, importo]) => ({ nome, importo }));

    // Confronto mese corrente vs precedente (MoM)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const incassoMeseCorrente = pagamenti.filter(p => {
      const date = new Date(p.data_pagamento);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + (p.importo || 0), 0);

    const incassoMesePrecedente = pagamenti.filter(p => {
      const date = new Date(p.data_pagamento);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, p) => sum + (p.importo || 0), 0);

    const crescitaMoM = incassoMesePrecedente > 0
      ? ((incassoMeseCorrente - incassoMesePrecedente) / incassoMesePrecedente) * 100
      : 0;

    // Confronto anno corrente vs precedente (YoY)
    const incassoAnnoCorrente = pagamenti.filter(p => {
      const date = new Date(p.data_pagamento);
      return date.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + (p.importo || 0), 0);

    const incassoAnnoPrecedente = pagamenti.filter(p => {
      const date = new Date(p.data_pagamento);
      return date.getFullYear() === currentYear - 1;
    }).reduce((sum, p) => sum + (p.importo || 0), 0);

    const crescitaYoY = incassoAnnoPrecedente > 0
      ? ((incassoAnnoCorrente - incassoAnnoPrecedente) / incassoAnnoPrecedente) * 100
      : 0;

    // Analisi licenze club
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const clubsLicenzaAttiva = clubs.filter(c => {
      if (!c.data_scadenza_licenza) return false;
      const scadenza = new Date(c.data_scadenza_licenza);
      return scadenza > in30Days;
    }).length;

    const clubsLicenzaInScadenza = clubs.filter(c => {
      if (!c.data_scadenza_licenza) return false;
      const scadenza = new Date(c.data_scadenza_licenza);
      return scadenza > today && scadenza <= in30Days;
    }).length;

    const clubsLicenzaScaduta = clubs.filter(c => {
      if (!c.data_scadenza_licenza) return false;
      const scadenza = new Date(c.data_scadenza_licenza);
      return scadenza <= today;
    }).length;

    // Previsione prossimi 3 mesi (media ultimi 3 mesi)
    const previsione3Mesi = mrr * 3;

    // Churn Rate (club con licenza scaduta / totale club)
    const churnRate = clubs.length > 0 ? (clubsLicenzaScaduta / clubs.length) * 100 : 0;

    return {
      totaleIncassato,
      totaleFatturato,
      numeroTransazioni,
      mediaTransazione,
      mrr,
      arr,
      incassoPerMetodo,
      progressioneMensile,
      topClubs,
      incassoMeseCorrente,
      incassoMesePrecedente,
      crescitaMoM,
      incassoAnnoCorrente,
      incassoAnnoPrecedente,
      crescitaYoY,
      clubsLicenzaAttiva,
      clubsLicenzaInScadenza,
      clubsLicenzaScaduta,
      previsione3Mesi,
      churnRate
    };
  };

  // Export data to CSV
  const exportToCSV = () => {
    const { pagamenti: filteredPagamenti } = getFilteredData();

    let csv = 'Data,Club,Importo,Metodo Pagamento,Descrizione\n';
    filteredPagamenti.forEach(p => {
      const date = new Date(p.data_pagamento).toLocaleDateString('it-IT');
      const row = [
        date,
        p.club_nome || '',
        p.importo || 0,
        p.metodo_pagamento || '',
        (p.descrizione || '').replace(/,/g, ';')
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento...</div>
        </div>
      </>
    );
  }

  const economicKPIs = activeTab === 'economica' ? calculateEconomicKPIs() : null;

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title">📊 Analytics</h1>
            <p className="welcome-subtitle">Analisi e metriche della piattaforma</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '2px solid #F0F0F0',
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('economica')}
            style={{
              padding: '16px 24px',
              background: activeTab === 'economica' ? 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)' : 'transparent',
              color: activeTab === 'economica' ? '#1A1A1A' : '#666',
              border: 'none',
              borderBottom: activeTab === 'economica' ? '3px solid #7FFF00' : '3px solid transparent',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              borderRadius: '8px 8px 0 0'
            }}
          >
            💰 Economica
          </button>

          <button
            onClick={() => setActiveTab('club')}
            style={{
              padding: '16px 24px',
              background: activeTab === 'club' ? 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)' : 'transparent',
              color: activeTab === 'club' ? '#1A1A1A' : '#666',
              border: 'none',
              borderBottom: activeTab === 'club' ? '3px solid #7FFF00' : '3px solid transparent',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              borderRadius: '8px 8px 0 0'
            }}
          >
            🏟️ Club
          </button>

          <button
            onClick={() => setActiveTab('engagement')}
            style={{
              padding: '16px 24px',
              background: activeTab === 'engagement' ? 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)' : 'transparent',
              color: activeTab === 'engagement' ? '#1A1A1A' : '#666',
              border: 'none',
              borderBottom: activeTab === 'engagement' ? '3px solid #7FFF00' : '3px solid transparent',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              borderRadius: '8px 8px 0 0'
            }}
          >
            📈 Engagement
          </button>
        </div>

        {/* TAB: Economica */}
        {activeTab === 'economica' && economicKPIs && (
          <>
            {/* Filtri Periodo */}
            <div className="widget-white" style={{ marginBottom: '24px' }}>
              <div className="widget-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h3>🔍 Filtri Periodo</h3>
                  <button
                    onClick={exportToCSV}
                    style={{
                      padding: '10px 20px',
                      background: '#1A1A1A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#000000'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}
                  >
                    📥 Esporta CSV
                  </button>
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {[
                    { value: 'all', label: 'Tutto' },
                    { value: 'today', label: 'Oggi' },
                    { value: 'week', label: 'Ultima Settimana' },
                    { value: 'month', label: 'Ultimo Mese' },
                    { value: 'quarter', label: 'Ultimi 3 Mesi' },
                    { value: 'year', label: 'Ultimo Anno' },
                    { value: 'custom', label: 'Personalizzato' }
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setDateFilter(filter.value)}
                      style={{
                        padding: '10px 20px',
                        background: dateFilter === filter.value ? 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)' : 'white',
                        color: dateFilter === filter.value ? '#1A1A1A' : '#666',
                        border: dateFilter === filter.value ? '2px solid #7FFF00' : '2px solid #E0E0E0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {dateFilter === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                        Data Inizio
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '2px solid #E0E0E0',
                          fontSize: '15px',
                          color: '#3D3D3D'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                        Data Fine
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '2px solid #E0E0E0',
                          fontSize: '15px',
                          color: '#3D3D3D'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Cards Row 1 - Metriche Principali */}
            <div className="stats-header">
              <div className="stat-card-green">
                <div className="stat-card-content">
                  <div className="stat-label">Totale Incassato</div>
                  <div className="stat-description">Periodo selezionato</div>
                  <div className="stat-value">€{economicKPIs.totaleIncassato.toLocaleString()}</div>
                </div>
              </div>

              <div className="stat-card-dark">
                <div className="stat-card-content">
                  <div className="stat-label">Totale Fatturato</div>
                  <div className="stat-description">Periodo selezionato</div>
                  <div className="stat-value-green">€{economicKPIs.totaleFatturato.toLocaleString()}</div>
                </div>
              </div>

              <div className="stat-card-pink">
                <div className="stat-card-content">
                  <div className="stat-label">MRR</div>
                  <div className="stat-description">Monthly Recurring Revenue</div>
                  <div className="stat-value-dark">€{economicKPIs.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>

              <div className="stat-card-dark">
                <div className="stat-card-content">
                  <div className="stat-label">ARR</div>
                  <div className="stat-description">Annual Recurring Revenue</div>
                  <div className="stat-value-green">€{economicKPIs.arr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            </div>

            {/* KPI Cards Row 2 - Transazioni e Medie */}
            <div className="stats-header" style={{ marginTop: '24px' }}>
              <div className="stat-card-dark">
                <div className="stat-card-content">
                  <div className="stat-label">Numero Transazioni</div>
                  <div className="stat-description">Periodo selezionato</div>
                  <div className="stat-value-green">{economicKPIs.numeroTransazioni}</div>
                </div>
              </div>

              <div className="stat-card-pink">
                <div className="stat-card-content">
                  <div className="stat-label">Media Transazione</div>
                  <div className="stat-description">Valore medio per pagamento</div>
                  <div className="stat-value-dark">€{economicKPIs.mediaTransazione.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="stat-card-green">
                <div className="stat-card-content">
                  <div className="stat-label">Previsione 3 Mesi</div>
                  <div className="stat-description">Basata su MRR</div>
                  <div className="stat-value">€{economicKPIs.previsione3Mesi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>

              <div className="stat-card-dark">
                <div className="stat-card-content">
                  <div className="stat-label">Churn Rate</div>
                  <div className="stat-description">Club con licenza scaduta</div>
                  <div className="stat-value-green">{economicKPIs.churnRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Comparazioni MoM e YoY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
              {/* MoM Growth */}
              <div className="widget-white">
                <div className="widget-header">
                  <h3>📊 Crescita MoM</h3>
                  <div className="widget-subtitle">Month over Month</div>
                </div>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    Mese Corrente
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
                    €{economicKPIs.incassoMeseCorrente.toLocaleString()}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: 700,
                    background: economicKPIs.crescitaMoM >= 0 ? '#E8F5E9' : '#FFEBEE',
                    color: economicKPIs.crescitaMoM >= 0 ? '#2E7D32' : '#C62828'
                  }}>
                    {economicKPIs.crescitaMoM >= 0 ? '↗' : '↘'} {Math.abs(economicKPIs.crescitaMoM).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
                    vs Mese Precedente (€{economicKPIs.incassoMesePrecedente.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* YoY Growth */}
              <div className="widget-white">
                <div className="widget-header">
                  <h3>📈 Crescita YoY</h3>
                  <div className="widget-subtitle">Year over Year</div>
                </div>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    Anno Corrente
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
                    €{economicKPIs.incassoAnnoCorrente.toLocaleString()}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: 700,
                    background: economicKPIs.crescitaYoY >= 0 ? '#E8F5E9' : '#FFEBEE',
                    color: economicKPIs.crescitaYoY >= 0 ? '#2E7D32' : '#C62828'
                  }}>
                    {economicKPIs.crescitaYoY >= 0 ? '↗' : '↘'} {Math.abs(economicKPIs.crescitaYoY).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
                    vs Anno Precedente (€{economicKPIs.incassoAnnoPrecedente.toLocaleString()})
                  </div>
                </div>
              </div>

              {/* Status Licenze */}
              <div className="widget-white">
                <div className="widget-header">
                  <h3>🎫 Status Licenze Club</h3>
                  <div className="widget-subtitle">Stato abbonamenti</div>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#2E7D32' }}>
                        ✅ Attive
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#2E7D32' }}>
                        {economicKPIs.clubsLicenzaAttiva}
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#F0F0F0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${clubs.length > 0 ? (economicKPIs.clubsLicenzaAttiva / clubs.length) * 100 : 0}%`,
                        height: '100%',
                        background: '#2E7D32'
                      }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#F57C00' }}>
                        ⚠️ In Scadenza (30gg)
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#F57C00' }}>
                        {economicKPIs.clubsLicenzaInScadenza}
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#F0F0F0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${clubs.length > 0 ? (economicKPIs.clubsLicenzaInScadenza / clubs.length) * 100 : 0}%`,
                        height: '100%',
                        background: '#F57C00'
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#C62828' }}>
                        ❌ Scadute
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#C62828' }}>
                        {economicKPIs.clubsLicenzaScaduta}
                      </div>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#F0F0F0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${clubs.length > 0 ? (economicKPIs.clubsLicenzaScaduta / clubs.length) * 100 : 0}%`,
                        height: '100%',
                        background: '#C62828'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progressione Revenue - Line Chart */}
            <div className="widget-white" style={{ marginTop: '24px' }}>
              <div className="widget-header">
                <h3>📈 Progressione Revenue - Ultimi 12 Mesi</h3>
                <div className="widget-subtitle">Evoluzione temporale degli incassi</div>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ position: 'relative', height: '350px' }}>
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ borderTop: '1px dashed #E0E0E0', width: '100%' }} />
                    ))}
                  </div>

                  {/* Line Chart */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height: '320px', gap: '0' }}>
                    {economicKPIs.progressioneMensile.map((item, index) => {
                      const maxIncasso = Math.max(...economicKPIs.progressioneMensile.map(m => m.incasso));
                      const heightPercentage = maxIncasso > 0 ? (item.incasso / maxIncasso) * 100 : 0;
                      const nextItem = economicKPIs.progressioneMensile[index + 1];

                      return (
                        <div
                          key={index}
                          style={{
                            flex: 1,
                            position: 'relative',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                          }}
                        >
                          {/* Point */}
                          <div style={{
                            position: 'absolute',
                            bottom: `${heightPercentage}%`,
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                            border: '3px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title={`${item.mese}: €${item.incasso.toLocaleString()}`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          />

                          {/* Line to next point */}
                          {nextItem && (
                            <svg
                              style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 0,
                                width: '100%',
                                height: '100%',
                                overflow: 'visible',
                                pointerEvents: 'none'
                              }}
                            >
                              <line
                                x1="0"
                                y1={`${100 - heightPercentage}%`}
                                x2="100%"
                                y2={`${100 - (maxIncasso > 0 ? (nextItem.incasso / maxIncasso) * 100 : 0)}%`}
                                stroke="#7FFF00"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}

                          {/* Value */}
                          <div style={{
                            position: 'absolute',
                            bottom: `calc(${heightPercentage}% + 20px)`,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#666',
                            whiteSpace: 'nowrap'
                          }}>
                            €{(item.incasso / 1000).toFixed(0)}k
                          </div>

                          {/* Month label */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-25px',
                            fontSize: '10px',
                            color: '#999',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            transform: 'rotate(-45deg)',
                            transformOrigin: 'top left'
                          }}>
                            {item.mese}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Due colonne */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>

              {/* Incassi per Metodo di Pagamento */}
              <div className="widget-white">
                <div className="widget-header">
                  <h3>💳 Incassi per Metodo</h3>
                  <div className="widget-subtitle">Distribuzione per tipo di pagamento</div>
                </div>
                <div style={{ padding: '24px' }}>
                  {Object.entries(economicKPIs.incassoPerMetodo)
                    .sort(([, a], [, b]) => b - a)
                    .map(([metodo, importo], index) => {
                      const totale = economicKPIs.totaleIncassato;
                      const percentuale = totale > 0 ? (importo / totale) * 100 : 0;

                      return (
                        <div key={index} style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                              {metodo}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>
                              €{importo.toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            background: '#F0F0F0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentuale}%`,
                              height: '100%',
                              background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {percentuale.toFixed(1)}% del totale
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Top 10 Club per Incasso */}
              <div className="widget-white">
                <div className="widget-header">
                  <h3>🏆 Top 10 Club</h3>
                  <div className="widget-subtitle">Club con maggiori incassi</div>
                </div>
                <div style={{ padding: '24px' }}>
                  {economicKPIs.topClubs.length > 0 ? economicKPIs.topClubs.map((club, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: index < 3 ? '#FFFEF0' : 'white',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        border: index < 3 ? '2px solid #7FFF00' : '1px solid #F0F0F0'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index < 3 ? 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)' : '#F0F0F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: index < 3 ? '#1A1A1A' : '#666'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                          {club.nome}
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
                        €{club.importo.toLocaleString()}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      Nessun dato disponibile
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* TAB: Club (Placeholder) */}
        {activeTab === 'club' && (
          <div className="widget-white">
            <div className="widget-header">
              <h3>🏟️ Analytics Club</h3>
            </div>
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏟️</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Sezione in sviluppo
              </div>
              <div style={{ fontSize: '14px' }}>
                Qui verranno mostrate le analytics sui club
              </div>
            </div>
          </div>
        )}

        {/* TAB: Engagement (Placeholder) */}
        {activeTab === 'engagement' && (
          <div className="widget-white">
            <div className="widget-header">
              <h3>📈 Analytics Engagement</h3>
            </div>
            <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📈</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Sezione in sviluppo
              </div>
              <div style={{ fontSize: '14px' }}>
                Qui verranno mostrate le analytics sull'engagement
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default AdminAnalytics;
