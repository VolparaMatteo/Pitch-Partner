import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ClubBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    anno_fiscale: new Date().getFullYear(),
    contract_id: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contracts, setContracts] = useState([]);

  const navigate = useNavigate();
  const { user, token } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'club') {
      navigate('/club/login');
      return;
    }
    fetchBudgets();
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.anno_fiscale) params.append('anno_fiscale', filters.anno_fiscale);
      if (filters.contract_id) params.append('contract_id', filters.contract_id);

      const res = await axios.get(`${API_URL}/club/budgets?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(res.data.budgets || []);
    } catch (error) {
      console.error('Errore caricamento budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API_URL}/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(res.data.contracts || []);
    } catch (error) {
      console.error('Errore caricamento contratti:', error);
    }
  };

  const getStatusColor = (percentuale) => {
    if (percentuale >= 90) return '#F44336';
    if (percentuale >= 75) return '#FF9800';
    if (percentuale >= 50) return '#FFC107';
    return '#4CAF50';
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
        <div className="dashboard-new-container">
          <div className="loading">Caricamento budget...</div>
        </div>
      </>
    );
  }

  // Calcola statistiche
  const totalBudget = budgets.reduce((sum, b) => sum + b.importo_totale, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.importo_speso, 0);
  const avgUtilization = budgets.length > 0
    ? budgets.reduce((sum, b) => sum + b.percentuale_utilizzo, 0) / budgets.length
    : 0;

  return (
    <>
      <div className="dashboard-new-container">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <h1 className="welcome-title">Budget e Monitoraggio Spese</h1>
          <button
            style={{
              background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
              color: '#3D3D3D',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(127, 255, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(127, 255, 0, 0.3)';
            }}
            onClick={() => setShowCreateModal(true)}
          >
            + Nuovo Budget
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {formatCurrency(totalBudget)}
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
            <div style={{ fontSize: '14px', color: 'white', opacity: 0.7 }}>Speso Totale</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              {formatCurrency(totalSpent)}
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
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              {formatCurrency(totalBudget - totalSpent)}
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
            <div style={{ fontSize: '14px', color: '#666' }}>Utilizzo Medio</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: getStatusColor(avgUtilization) }}>
              {avgUtilization.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Anno Fiscale
              </label>
              <select
                value={filters.anno_fiscale}
                onChange={(e) => setFilters({ ...filters, anno_fiscale: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti gli anni</option>
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666'
              }}>
                Contratto
              </label>
              <select
                value={filters.contract_id}
                onChange={(e) => setFilters({ ...filters, contract_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #E0E0E0',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tutti i contratti</option>
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.nome_contratto}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget Cards */}
        {budgets.length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed #E0E0E0',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', color: '#999', marginBottom: '20px' }}>
              Nessun budget trovato
            </div>
            <button
              style={{
                background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                color: '#3D3D3D',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(127, 255, 0, 0.3)'
              }}
              onClick={() => setShowCreateModal(true)}
            >
              Crea il primo budget
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
            {budgets.map(budget => (
              <div
                key={budget.id}
                style={{
                  background: 'white',
                  border: '2px solid #E0E0E0',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => navigate(`/club/budgets/${budget.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7FFF00';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
                  color: 'white',
                  padding: '20px 24px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                    {budget.contract_name}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>
                    {budget.sponsor?.ragione_sociale} • Anno {budget.anno_fiscale}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                  {/* Importi */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Budget Totale</span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#3D3D3D' }}>
                        {formatCurrency(budget.importo_totale)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Speso</span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#FF6B6B' }}>
                        {formatCurrency(budget.importo_speso)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>Rimanente</span>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#7FFF00' }}>
                        {formatCurrency(budget.importo_rimanente)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>Utilizzo</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: getStatusColor(budget.percentuale_utilizzo) }}>
                        {budget.percentuale_utilizzo.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      background: '#F5F5F5',
                      borderRadius: '12px',
                      height: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: getStatusColor(budget.percentuale_utilizzo),
                        width: `${Math.min(budget.percentuale_utilizzo, 100)}%`,
                        height: '100%',
                        transition: 'width 0.3s',
                        borderRadius: '12px'
                      }} />
                    </div>
                  </div>

                  {/* Alert */}
                  {budget.percentuale_utilizzo >= 75 && (
                    <div style={{
                      background: budget.percentuale_utilizzo >= 90 ? '#FFD4D4' : '#FFF3E0',
                      color: '#3D3D3D',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginTop: '16px'
                    }}>
                      ⚠️ Budget al {budget.percentuale_utilizzo.toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Budget Modal */}
        {showCreateModal && (
          <CreateBudgetModal
            contracts={contracts}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchBudgets();
            }}
            token={token}
          />
        )}
      </div>
    </>
  );
}

// Modal Creazione Budget
function CreateBudgetModal({ contracts, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState({
    contract_id: '',
    anno_fiscale: new Date().getFullYear(),
    importo_totale: '',
    valuta: 'EUR',
    note: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/club/budgets`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Budget creato con successo!');
      onSuccess();
    } catch (error) {
      console.error('Errore creazione budget:', error);
      alert(error.response?.data?.error || 'Errore durante la creazione del budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        border: '2px solid #E0E0E0',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{
          marginBottom: '28px',
          fontSize: '24px',
          fontWeight: 700,
          color: '#3D3D3D'
        }}>Crea Nuovo Budget</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#666'
            }}>
              Contratto *
            </label>
            <select
              value={formData.contract_id}
              onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #E0E0E0',
                fontSize: '14px',
                color: '#3D3D3D',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Seleziona contratto --</option>
              {contracts.map(contract => (
                <option key={contract.id} value={contract.id}>
                  {contract.nome_contratto} - {contract.sponsor?.ragione_sociale}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#666'
            }}>
              Anno Fiscale *
            </label>
            <select
              value={formData.anno_fiscale}
              onChange={(e) => setFormData({ ...formData, anno_fiscale: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #E0E0E0',
                fontSize: '14px',
                color: '#3D3D3D',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#666'
            }}>
              Importo Totale (€) *
            </label>
            <input
              type="number"
              value={formData.importo_totale}
              onChange={(e) => setFormData({ ...formData, importo_totale: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="100000.00"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #E0E0E0',
                fontSize: '14px',
                color: '#3D3D3D',
                background: 'white'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#666'
            }}>
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              placeholder="Note aggiuntive sul budget..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #E0E0E0',
                fontSize: '14px',
                color: '#3D3D3D',
                background: 'white',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#F5F5F5',
                border: '2px solid #E0E0E0',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: '#666',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#E0E0E0'}
              onMouseLeave={(e) => e.target.style.background = '#F5F5F5'}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                color: '#3D3D3D',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: loading ? 'none' : '0 4px 12px rgba(127, 255, 0, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(127, 255, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(127, 255, 0, 0.3)';
                }
              }}
            >
              {loading ? 'Creazione...' : 'Crea Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClubBudgets;
