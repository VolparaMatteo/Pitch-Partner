import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SponsorBudgetDetail() {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.user_type !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetRes, expensesRes, paymentsRes] = await Promise.all([
        axios.get(`${API_URL}/sponsor/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/sponsor/budgets/${id}/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/sponsor/budgets/${id}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setBudget(budgetRes.data.budget);
      setExpenses(expensesRes.data.expenses || []);
      setPayments(paymentsRes.data.payments || []);
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

  const handleConfirmPayment = async (paymentId) => {
    if (!window.confirm('Confermare invio pagamento?')) return;

    try {
      await axios.post(`${API_URL}/sponsor/payments/${paymentId}/confirm-sent`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pagamento confermato');
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la conferma');
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

  if (!budget) {
    return (
      <>
        <div className="dashboard-container">
          <div className="empty-state">Budget non trovato</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/sponsor/budgets')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          >
            ← Torna ai budget
          </button>

          <h1 style={{ margin: '0 0 8px 0' }}>
            Budget: {budget.contract?.nome_contratto}
          </h1>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {budget.club?.nome} • Anno {budget.anno_fiscale}
          </div>
        </div>

        {/* Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Da Pagare Totale</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
              {formatCurrency(budget.payments_stats?.pending_amount || 0)}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Pagamenti Completati</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
              {budget.payments_stats?.completed_payments || 0}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #f0f0f0',
          marginBottom: '24px'
        }}>
          {['overview', 'payments', 'expenses'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #85FF00' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#000' : '#666',
                marginBottom: '-2px'
              }}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'payments' && `💰 Pagamenti (${payments.length})`}
              {tab === 'expenses' && `💸 Spese (${expenses.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Riepilogo Budget</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>Budget Totale</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(budget.importo_totale)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>Speso</span>
                <span style={{ fontWeight: '600', color: '#FF9800' }}>{formatCurrency(budget.importo_speso)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Rimanente</span>
                <span style={{ fontWeight: '600', color: '#4CAF50' }}>{formatCurrency(budget.importo_rimanente)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Pagamenti</h3>
            {payments.length === 0 ? (
              <div className="empty-state">Nessun pagamento</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {payments.map(payment => (
                  <div key={payment.id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '4px' }}>
                        {formatCurrency(payment.importo)}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        Previsto: {new Date(payment.data_prevista).toLocaleDateString('it-IT')}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span style={{
                          background: payment.stato === 'completato' ? '#4CAF50' : '#FF9800',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          textTransform: 'capitalize'
                        }}>
                          {payment.stato.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {payment.stato === 'pianificato' && (
                      <button
                        onClick={() => handleConfirmPayment(payment.id)}
                        style={{
                          padding: '10px 20px',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Conferma Invio
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            <h3 style={{ marginBottom: '16px' }}>Spese</h3>
            {expenses.length === 0 ? (
              <div className="empty-state">Nessuna spesa</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {expenses.map(expense => (
                  <div key={expense.id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>{expense.descrizione}</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#2196F3', marginBottom: '4px' }}>
                      €{expense.importo}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {new Date(expense.data_spesa).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorBudgetDetail;
