import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function AdminBudgetAnalytics() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes, healthRes] = await Promise.all([
        axios.get(`${API_URL}/admin/budgets/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/budgets/analytics?anno=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/budgets/health-check`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOverview(overviewRes.data.overview);
      setAnalytics(analyticsRes.data.analytics);
      setHealth(healthRes.data.health);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento analytics...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>📊 Budget Analytics</h1>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Budget Club Totale</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
              {formatCurrency(overview?.club_budgets?.totale || 0)}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {overview?.club_budgets?.numero || 0} budget
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Budget Sponsor Totale</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
              {formatCurrency(overview?.sponsor_budgets?.totale || 0)}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {overview?.sponsor_budgets?.numero || 0} budget
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Pagamenti in Ritardo</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F44336' }}>
              {overview?.alerts?.pagamenti_in_ritardo || 0}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Spese in Sospeso</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9800' }}>
              {overview?.alerts?.spese_in_sospeso || 0}
            </div>
          </div>
        </div>

        {/* Health Check Alerts */}
        {health && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '16px' }}>⚠️ Alert</h3>

            {health.high_usage_budgets && health.high_usage_budgets.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Budget con Utilizzo > 90%</h4>
                {health.high_usage_budgets.map((budget, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    background: '#ffebee',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: '600' }}>{budget.owner_name} - {budget.contract_name}</div>
                    <div style={{ fontSize: '13px', color: '#c62828' }}>
                      Utilizzo: {budget.percentuale_utilizzo}% • Rimanente: {formatCurrency(budget.importo_rimanente)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {health.late_payments && health.late_payments.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Pagamenti in Ritardo</h4>
                {health.late_payments.map((payment, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    background: '#fff3e0',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: '600' }}>{payment.contract_name}</div>
                    <div style={{ fontSize: '13px', color: '#e65100' }}>
                      {formatCurrency(payment.importo)} • {payment.giorni_ritardo} giorni di ritardo
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Top Clubs */}
        {overview?.top_clubs && overview.top_clubs.length > 0 && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Top Club per Budget</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {overview.top_clubs.map((club, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f9f9f9',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{club.club_nome}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {club.num_budgets} budget • {club.percentuale_utilizzo}% utilizzato
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(club.budget_totale)}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      Speso: {formatCurrency(club.speso)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminBudgetAnalytics;
