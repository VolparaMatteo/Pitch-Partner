import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClubBudgetDetail() {
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetRes, expensesRes, paymentsRes, docsRes, catsRes, reportRes] = await Promise.all([
        axios.get(`${API_URL}/club/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/budgets/${id}/expenses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/budgets/${id}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/budgets/${id}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/budgets/${id}/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/club/budgets/${id}/report`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setBudget(budgetRes.data.budget);
      setExpenses(expensesRes.data.expenses || []);
      setPayments(paymentsRes.data.payments || []);
      setDocuments(docsRes.data.documents || []);
      setCategories(catsRes.data.categories || []);
      setReport(reportRes.data.report);
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

  const getStatusColor = (percentuale) => {
    if (percentuale >= 90) return '#F44336';
    if (percentuale >= 75) return '#FF9800';
    if (percentuale >= 50) return '#FFC107';
    return '#4CAF50';
  };

  const getPaymentStatusColor = (stato) => {
    const colors = {
      'pianificato': '#2196F3',
      'in_corso': '#FF9800',
      'completato': '#4CAF50',
      'in_ritardo': '#F44336',
      'annullato': '#9E9E9E'
    };
    return colors[stato] || '#666';
  };

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="loading">Caricamento budget...</div>
        </div>
      </>
    );
  }

  if (!budget) {
    return (
      <>
        <div className="dashboard-new-container">
          <div className="empty-state">Budget non trovato</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            className="stat-btn"
            onClick={() => navigate('/club/budgets')}
            style={{ marginBottom: '20px' }}
          >
            ← Torna ai budget
          </button>

          <h1 className="welcome-title" style={{ marginBottom: '8px' }}>
            Budget: {budget.contract?.nome_contratto}
          </h1>
          <div style={{ fontSize: '15px', color: '#666', fontWeight: 500 }}>
            {budget.sponsor?.ragione_sociale} • Anno Fiscale {budget.anno_fiscale}
          </div>
        </div>

        {/* Overview Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>Budget Totale</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#3D3D3D' }}>
              {formatCurrency(budget.importo_totale)}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.7 }}>Speso</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
              {formatCurrency(budget.importo_speso)}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#3D3D3D', opacity: 0.8 }}>Rimanente</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#3D3D3D' }}>
              {formatCurrency(budget.importo_rimanente)}
            </div>
          </div>

          <div style={{
            background: 'white',
            border: '2px solid #E0E0E0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>Utilizzo</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: getStatusColor(budget.percentuale_utilizzo) }}>
              {budget.percentuale_utilizzo.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ marginBottom: '16px', fontWeight: 600, fontSize: '15px', color: '#3D3D3D' }}>
            Progresso Budget
          </div>
          <div style={{
            background: '#F5F5F5',
            borderRadius: '12px',
            height: '28px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              background: getStatusColor(budget.percentuale_utilizzo),
              width: `${Math.min(budget.percentuale_utilizzo, 100)}%`,
              height: '100%',
              transition: 'width 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '12px'
            }}>
              {budget.percentuale_utilizzo.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '2px solid #E0E0E0',
          marginBottom: '32px'
        }}>
          {['overview', 'expenses', 'payments', 'documents', 'report'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 24px',
                background: activeTab === tab ? '#7FFF00' : 'transparent',
                border: 'none',
                borderRadius: activeTab === tab ? '12px 12px 0 0' : '0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? '#3D3D3D' : '#666',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.target.style.background = '#F5F5F5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {tab === 'overview' && `📊 Overview`}
              {tab === 'expenses' && `💸 Spese (${expenses.length})`}
              {tab === 'payments' && `💰 Pagamenti (${payments.length})`}
              {tab === 'documents' && `📄 Documenti (${documents.length})`}
              {tab === 'report' && '📈 Report'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab budget={budget} categories={categories} />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            budgetId={id}
            expenses={expenses}
            categories={categories}
            token={token}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            budgetId={id}
            payments={payments}
            token={token}
            onRefresh={fetchData}
            getPaymentStatusColor={getPaymentStatusColor}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            budgetId={id}
            documents={documents}
            token={token}
            onRefresh={fetchData}
            formatCurrency={formatCurrency}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab report={report} formatCurrency={formatCurrency} />
        )}
      </div>
    </>
  );
}

// Overview Tab
function OverviewTab({ budget, categories }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div>
      {/* Stats */}
      <div style={{
        background: 'white',
        border: '2px solid #E0E0E0',
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Statistiche</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Spese Totali</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{budget.stats?.total_expenses || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Spese in Sospeso</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#FF9800' }}>
              {budget.stats?.pending_expenses || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Pagamenti Totali</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{budget.stats?.total_payments || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Pagamenti in Sospeso</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#2196F3' }}>
              {budget.stats?.pending_payments || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Categorie di Spesa</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{
                padding: '20px',
                border: '2px solid #E0E0E0',
                borderRadius: '16px',
                background: '#FAFAFA'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{cat.nome}</span>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {formatCurrency(cat.importo_speso)} / {formatCurrency(cat.importo_allocato)}
                  </span>
                </div>
                <div style={{
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: cat.percentuale_utilizzo >= 90 ? '#F44336' : '#4CAF50',
                    width: `${Math.min(cat.percentuale_utilizzo, 100)}%`,
                    height: '100%'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {cat.percentuale_utilizzo.toFixed(1)}% utilizzato
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Expenses Tab
function ExpensesTab({ budgetId, expenses, categories, token, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);

  const getExpenseStatusColor = (stato) => {
    const colors = {
      'in_sospeso': '#FF9800',
      'approvato': '#2196F3',
      'rifiutato': '#F44336',
      'pagato': '#4CAF50'
    };
    return colors[stato] || '#666';
  };

  const handleMarkPaid = async (expenseId) => {
    if (!window.confirm('Segnare questa spesa come pagata?')) return;

    try {
      await axios.post(`${API_URL}/club/expenses/${expenseId}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Spesa segnata come pagata');
      onRefresh();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'operazione');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Spese Registrate</h3>
        <button
          style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            color: '#3D3D3D',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)'
          }}
          onClick={() => setShowAddModal(true)}
        >
          + Aggiungi Spesa
        </button>
      </div>

      {expenses.length === 0 ? (
        <div style={{
          background: 'white',
          border: '2px dashed #E0E0E0',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          color: '#999'
        }}>Nessuna spesa registrata</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {expenses.map(expense => (
            <div key={expense.id} style={{
              background: 'white',
              border: '2px solid #E0E0E0',
              padding: '24px',
              borderRadius: '20px',
              borderLeft: `6px solid ${getExpenseStatusColor(expense.stato)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{expense.descrizione}</h4>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3', marginBottom: '8px' }}>
                    €{expense.importo}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Data: {new Date(expense.data_spesa).toLocaleDateString('it-IT')}
                    {expense.category && ` • Categoria: ${expense.category.nome}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: getExpenseStatusColor(expense.stato),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {expense.stato.replace('_', ' ')}
                  </span>
                  {expense.stato === 'approvato' && (
                    <button
                      onClick={() => handleMarkPaid(expense.id)}
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Segna Pagata
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddExpenseModal
          budgetId={budgetId}
          categories={categories}
          token={token}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Payments Tab
function PaymentsTab({ budgetId, payments, token, onRefresh, getPaymentStatusColor, formatCurrency }) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleMarkPaid = async (paymentId) => {
    const dataPagamento = prompt('Data pagamento (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];

    try {
      await axios.post(`${API_URL}/club/payments/${paymentId}/mark-paid`, {
        data_pagamento: dataPagamento
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pagamento confermato');
      onRefresh();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'operazione');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Pagamenti Pianificati</h3>
        <button
          style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            color: '#3D3D3D',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)'
          }}
          onClick={() => setShowAddModal(true)}
        >
          + Pianifica Pagamento
        </button>
      </div>

      {payments.length === 0 ? (
        <div style={{
          background: 'white',
          border: '2px dashed #E0E0E0',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          color: '#999'
        }}>Nessun pagamento pianificato</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {payments.map(payment => (
            <div key={payment.id} style={{
              background: 'white',
              border: '2px solid #E0E0E0',
              padding: '24px',
              borderRadius: '20px',
              borderLeft: `6px solid ${getPaymentStatusColor(payment.stato)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {payment.tipo}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '600', color: '#2196F3', marginBottom: '8px' }}>
                    {formatCurrency(payment.importo)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Previsto: {new Date(payment.data_prevista).toLocaleDateString('it-IT')}
                    {payment.data_effettiva && (
                      <span> • Pagato: {new Date(payment.data_effettiva).toLocaleDateString('it-IT')}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: getPaymentStatusColor(payment.stato),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {payment.stato.replace('_', ' ')}
                  </span>
                  {(payment.stato === 'pianificato' || payment.stato === 'in_corso') && (
                    <button
                      onClick={() => handleMarkPaid(payment.id)}
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        padding: '6px 12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Segna Ricevuto
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPaymentModal
          budgetId={budgetId}
          token={token}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Documents Tab
function DocumentsTab({ budgetId, documents, token, onRefresh, formatCurrency }) {
  return (
    <div>
      <h3 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Documenti Finanziari</h3>

      {documents.length === 0 ? (
        <div style={{
          background: 'white',
          border: '2px dashed #E0E0E0',
          borderRadius: '20px',
          padding: '48px',
          textAlign: 'center',
          color: '#999'
        }}>Nessun documento caricato</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {documents.map(doc => (
            <div key={doc.id} style={{
              background: 'white',
              border: '2px solid #E0E0E0',
              padding: '24px',
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {doc.tipo.toUpperCase()} {doc.numero_documento && `- ${doc.numero_documento}`}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Emissione: {new Date(doc.data_emissione).toLocaleDateString('it-IT')}
                  {doc.data_scadenza && ` • Scadenza: ${new Date(doc.data_scadenza).toLocaleDateString('it-IT')}`}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                  {formatCurrency(doc.importo_totale || doc.importo)}
                </div>
              </div>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  background: '#2196F3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                Visualizza
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Report Tab
function ReportTab({ report, formatCurrency }) {
  if (!report) return (
    <div style={{
      background: 'white',
      border: '2px dashed #E0E0E0',
      borderRadius: '20px',
      padding: '48px',
      textAlign: 'center',
      color: '#999'
    }}>Nessun report disponibile</div>
  );

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Budget Overview */}
      <div style={{
        background: 'white',
        border: '2px solid #E0E0E0',
        padding: '24px',
        borderRadius: '20px'
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Riepilogo Budget</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Totale</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              {formatCurrency(report.budget_overview.totale)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Speso</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#FF9800' }}>
              {formatCurrency(report.budget_overview.speso)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Rimanente</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#4CAF50' }}>
              {formatCurrency(report.budget_overview.rimanente)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#666' }}>Utilizzo</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>
              {report.budget_overview.percentuale_utilizzo.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      {report.categories && report.categories.length > 0 && (
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600, color: '#3D3D3D' }}>Spese per Categoria</h3>
          {report.categories.map((cat, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{cat.nome}</span>
                <span>{formatCurrency(cat.speso)} / {formatCurrency(cat.allocato)}</span>
              </div>
              <div style={{
                background: '#f0f0f0',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: cat.percentuale >= 90 ? '#F44336' : '#4CAF50',
                  width: `${Math.min(cat.percentuale, 100)}%`,
                  height: '100%'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add Expense Modal
function AddExpenseModal({ budgetId, categories, token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    descrizione: '',
    importo: '',
    data_spesa: new Date().toISOString().split('T')[0],
    category_id: '',
    tipo_spesa: 'effettivo',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/club/budgets/${budgetId}/expenses`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Spesa registrata con successo!');
      onSuccess();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la registrazione della spesa');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '24px' }}>Registra Nuova Spesa</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Descrizione *
            </label>
            <input
              type="text"
              value={formData.descrizione}
              onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Importo (€) *
            </label>
            <input
              type="number"
              value={formData.importo}
              onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Data Spesa *
            </label>
            <input
              type="date"
              value={formData.data_spesa}
              onChange={(e) => setFormData({ ...formData, data_spesa: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Categoria
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">-- Nessuna categoria --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Annulla
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
              Registra Spesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Payment Modal
function AddPaymentModal({ budgetId, token, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tipo: 'rata',
    importo: '',
    data_prevista: '',
    metodo_pagamento: 'bonifico',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/club/budgets/${budgetId}/payments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pagamento pianificato con successo!');
      onSuccess();
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la pianificazione del pagamento');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '24px' }}>Pianifica Pagamento</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            >
              <option value="rata">Rata</option>
              <option value="acconto">Acconto</option>
              <option value="saldo">Saldo</option>
              <option value="bonus">Bonus</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Importo (€) *
            </label>
            <input
              type="number"
              value={formData.importo}
              onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Data Prevista *
            </label>
            <input
              type="date"
              value={formData.data_prevista}
              onChange={(e) => setFormData({ ...formData, data_prevista: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Annulla
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
              Pianifica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClubBudgetDetail;
