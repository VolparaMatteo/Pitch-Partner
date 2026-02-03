import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractAPI } from '../services/api';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

function SponsorContractList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/');
      return;
    }
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractAPI.getContracts();
      setContracts(response.data.contracts || []);
    } catch (error) {
      console.error('Errore caricamento contratti:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'bozza': '#FFD4D4',
      'attivo': '#7FFF00',
      'scaduto': '#E0E0E0',
      'terminato': '#3D3D3D'
    };
    return colors[status] || '#E0E0E0';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'bozza': 'Bozza',
      'attivo': 'Attivo',
      'scaduto': 'Scaduto',
      'terminato': 'Terminato'
    };
    return labels[status] || status;
  };

  const isContractActive = (contract) => {
    const now = new Date();
    const start = new Date(contract.data_inizio);
    const end = new Date(contract.data_fine);
    return now >= start && now <= end;
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.nome_contratto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.club?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && contract.status === filterStatus;
  });

  // Calculate stats
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'attivo').length;
  const draftContracts = contracts.filter(c => c.status === 'bozza').length;
  const totalValue = contracts.reduce((sum, c) => sum + (parseFloat(c.compenso) || 0), 0);

  if (loading) {
    return (
      <>
        <div className="dashboard-new-container">
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Caricamento contratti...</div>
        </div>
      </>
    );
  }

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
          <h1 className="welcome-title">📄 I Miei Contratti</h1>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {/* Total Contracts */}
          <div style={{
            background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Contratti Totali</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>{totalContracts}</div>
          </div>

          {/* Active Contracts */}
          <div style={{
            background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#FFF', fontWeight: 600 }}>Contratti Attivi</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFF' }}>{activeContracts}</div>
          </div>

          {/* Draft Contracts */}
          <div style={{
            background: 'linear-gradient(135deg, #FFD4D4 0%, #FFC4C4 100%)',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#2D2D2D', fontWeight: 600 }}>Bozze</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2D2D2D' }}>{draftContracts}</div>
          </div>

          {/* Total Value */}
          <div style={{
            background: 'white',
            border: '2px solid #E0E0E0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>Valore Totale</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#3D3D3D' }}>
              €{totalValue.toLocaleString('it-IT')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          border: '2px solid #E0E0E0',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Search */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#3D3D3D',
                marginBottom: '8px'
              }}>
                Cerca
              </label>
              <input
                type="text"
                placeholder="Cerca per nome contratto o club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7FFF00'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#3D3D3D',
                marginBottom: '8px'
              }}>
                Stato
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#7FFF00'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              >
                <option value="all">Tutti gli stati</option>
                <option value="bozza">Bozza</option>
                <option value="attivo">Attivo</option>
                <option value="scaduto">Scaduto</option>
                <option value="terminato">Terminato</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div style={{
            background: 'white',
            border: '2px dashed #E0E0E0',
            borderRadius: '20px',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3D3D3D', marginBottom: '8px' }}>
              {searchTerm || filterStatus !== 'all' ? 'Nessun contratto trovato' : 'Nessun contratto ancora'}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'I tuoi contratti con i club appariranno qui'
              }
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {filteredContracts.map(contract => {
              const daysRemaining = getDaysRemaining(contract.data_fine);
              const isActive = isContractActive(contract);

              return (
                <div
                  key={contract.id}
                  onClick={() => navigate(`/sponsor/contracts/${contract.id}`)}
                  style={{
                    background: 'white',
                    border: '2px solid #E0E0E0',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#7FFF00';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 255, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E0E0E0';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #3D3D3D 0%, #2D2D2D 100%)',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {contract.club?.logo_url && (
                        <img
                          src={contract.club.logo_url}
                          alt={contract.club.nome}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            background: 'white'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontSize: '12px', color: '#7FFF00', fontWeight: 600 }}>
                          {contract.club?.nome || 'Club'}
                        </div>
                        <div style={{ fontSize: '16px', color: '#FFF', fontWeight: 600, marginTop: '4px' }}>
                          {contract.nome_contratto}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      background: getStatusColor(contract.status),
                      color: contract.status === 'attivo' ? '#2D2D2D' : '#FFF',
                      padding: '6px 16px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      {getStatusLabel(contract.status)}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '24px' }}>
                    {/* Description */}
                    {contract.descrizione && (
                      <p style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.6',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {contract.descrizione}
                      </p>
                    )}

                    {/* Dates */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        padding: '12px',
                        background: '#F5F5F5',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Inizio</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                          {new Date(contract.data_inizio).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      <div style={{
                        padding: '12px',
                        background: '#F5F5F5',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Fine</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#3D3D3D' }}>
                          {new Date(contract.data_fine).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Days Remaining Alert */}
                    {isActive && daysRemaining <= 60 && (
                      <div style={{
                        background: daysRemaining <= 30 ? '#FFF5F5' : '#FFF9E6',
                        border: `2px solid ${daysRemaining <= 30 ? '#FFD4D4' : '#FFE4B3'}`,
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '20px' }}>
                          {daysRemaining <= 30 ? '⚠️' : '⏰'}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: daysRemaining <= 30 ? '#FF6B6B' : '#FF9800'
                        }}>
                          {daysRemaining > 0
                            ? `Scade tra ${daysRemaining} giorni`
                            : 'Scaduto'
                          }
                        </span>
                      </div>
                    )}

                    {/* Value */}
                    <div style={{
                      background: 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', color: '#2D2D2D', fontWeight: 600, marginBottom: '4px' }}>
                        Valore Contratto
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#2D2D2D' }}>
                        €{parseFloat(contract.compenso).toLocaleString('it-IT')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default SponsorContractList;
