import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SponsorBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.user_type !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/sponsor/budgets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(res.data.budgets || []);
    } catch (error) {
      console.error('Errore caricamento budget:', error);
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

  const totalPending = budgets.reduce((sum, b) => {
    return sum + b.prossimi_pagamenti.reduce((s, p) => s + p.importo, 0);
  }, 0);

  if (loading) {
    return (
      <>
        <div className="dashboard-container">
          <div className="loading">Caricamento budget...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>💰 I Miei Budget</h1>
        </div>

        {/* Summary */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Prossimi Pagamenti</h3>
          <div style={{ fontSize: '40px', fontWeight: 'bold' }}>
            {formatCurrency(totalPending)}
          </div>
        </div>

        {budgets.length === 0 ? (
          <div className="empty-state">Nessun budget disponibile</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {budgets.map(budget => (
              <div
                key={budget.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onClick={() => navigate(`/sponsor/budgets/${budget.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  background: '#2196F3',
                  color: 'white',
                  padding: '16px 20px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {budget.contract_name}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    {budget.club?.nome} • Anno {budget.anno_fiscale}
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Budget Totale</div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>
                      {formatCurrency(budget.importo_totale)}
                    </div>
                  </div>

                  {budget.prossimi_pagamenti.length > 0 && (
                    <div style={{
                      background: '#f0f8ff',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        Prossimi Pagamenti:
                      </div>
                      {budget.prossimi_pagamenti.map(p => (
                        <div key={p.id} style={{ fontSize: '13px', marginBottom: '4px' }}>
                          {formatCurrency(p.importo)} - {new Date(p.data_prevista).toLocaleDateString('it-IT')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorBudgets;
