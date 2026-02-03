import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/dashboard-new.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function AdminClubPayments() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [pagamenti, setPagamenti] = useState([]);
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = getAuth();

  const [formData, setFormData] = useState({
    // Dati Pagamento
    importo: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    descrizione: '',
    metodo_pagamento: 'bonifico',
    // Dati Fattura
    numero_fattura: '',
    data_fattura: new Date().toISOString().split('T')[0],
    note_fattura: '',
    file_fattura: null
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [clubRes, pagamentiRes, fattureRes] = await Promise.all([
        axios.get(`${API_URL}/admin/clubs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/clubs/${id}/pagamenti`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/clubs/${id}/fatture`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setClub(clubRes.data);
      setPagamenti(Array.isArray(pagamentiRes.data) ? pagamentiRes.data : []);
      setFatture(Array.isArray(fattureRes.data) ? fattureRes.data : []);
    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo file PDF sono accettati per le fatture');
        return;
      }
      setFormData({ ...formData, file_fattura: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      let fatturaFileUrl = null;

      // 1. Upload fattura PDF se presente
      if (formData.file_fattura) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.file_fattura);

        const uploadRes = await axios.post(`${API_URL}/upload/fattura`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        fatturaFileUrl = uploadRes.data.file_url;
      }

      // 2. Crea la fattura
      const fatturaData = {
        numero_fattura: formData.numero_fattura,
        data_fattura: formData.data_fattura,
        importo: formData.importo,
        file_url: fatturaFileUrl,
        note: formData.note_fattura
      };

      const fatturaRes = await axios.post(`${API_URL}/admin/clubs/${id}/fatture`, fatturaData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Crea il pagamento associato
      const pagamentoData = {
        importo: formData.importo,
        data_pagamento: formData.data_pagamento,
        descrizione: `${formData.descrizione} - Fattura N. ${formData.numero_fattura}`,
        metodo_pagamento: formData.metodo_pagamento
      };

      await axios.post(`${API_URL}/admin/clubs/${id}/pagamenti`, pagamentoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Pagamento e fattura registrati con successo!');
      setShowForm(false);
      setFormData({
        importo: '',
        data_pagamento: new Date().toISOString().split('T')[0],
        descrizione: '',
        metodo_pagamento: 'bonifico',
        numero_fattura: '',
        data_fattura: new Date().toISOString().split('T')[0],
        note_fattura: '',
        file_fattura: null
      });
      fetchData();
    } catch (error) {
      console.error('Errore:', error);
      alert(error.response?.data?.error || 'Errore nella registrazione');
    } finally {
      setUploading(false);
    }
  };

  const calculateStats = () => {
    const totalePagamenti = pagamenti.reduce((sum, p) => sum + (p.importo || 0), 0);
    const totaleFatture = fatture.reduce((sum, f) => sum + (f.importo || 0), 0);
    const ultimoPagamento = pagamenti.length > 0
      ? new Date(Math.max(...pagamenti.map(p => new Date(p.data_pagamento))))
      : null;

    return { totalePagamenti, totaleFatture, ultimoPagamento };
  };

  // Crea mappa fatture per ID
  const fattureMap = {};
  fatture.forEach(f => {
    fattureMap[f.id] = f;
  });

  // Combina pagamenti con fatture
  const combinedData = pagamenti.map(pagamento => {
    const numeroFattura = pagamento.descrizione?.match(/Fattura N\. ([\w-]+)/)?.[1];
    const fattura = numeroFattura ? fatture.find(f => f.numero_fattura === numeroFattura) : null;
    return {
      ...pagamento,
      fattura
    };
  }).reverse(); // Più recenti prima

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
        <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="welcome-title">💰 Gestione Pagamenti</h1>
            <p className="welcome-subtitle">{club?.nome}</p>
          </div>
          <button
            onClick={() => navigate(`/admin/clubs/${id}`)}
            style={{
              padding: '12px 24px',
              background: '#E0E0E0',
              color: '#3D3D3D',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Indietro al Club
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-header">
          <div className="stat-card-green">
            <div className="stat-card-content">
              <div className="stat-label">Totale Incassato</div>
              <div className="stat-description">Somma di tutti i pagamenti ricevuti</div>
              <div className="stat-value">€{stats.totalePagamenti.toLocaleString()}</div>
            </div>
          </div>

          <div className="stat-card-dark">
            <div className="stat-card-content">
              <div className="stat-label">Totale Fatturato</div>
              <div className="stat-description">Somma di tutte le fatture emesse</div>
              <div className="stat-value-green">€{stats.totaleFatture.toLocaleString()}</div>
            </div>
          </div>

          <div className="stat-card-pink">
            <div className="stat-card-content">
              <div className="stat-label">Ultimo Pagamento</div>
              <div className="stat-description">Data dell'ultimo pagamento ricevuto</div>
              <div className="stat-value-dark">
                {stats.ultimoPagamento ? stats.ultimoPagamento.toLocaleDateString('it-IT') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="widget-white">
          <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>💳 Storico Pagamenti e Fatture</h3>
              <div className="widget-subtitle">Tutti i pagamenti registrati con relative fatture</div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="stat-btn"
            >
              {showForm ? '✕ Annulla' : '+ Nuovo Pagamento'}
            </button>
          </div>

          {/* Payment + Invoice Form */}
          {showForm && (
            <form onSubmit={handleSubmit} style={{
              padding: '24px',
              background: '#F9FAFB',
              borderRadius: '16px',
              margin: '20px 24px',
              border: '2px solid #E0E0E0'
            }}>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>
                📝 Registra Nuovo Pagamento con Fattura
              </h4>

              {/* Section: Pagamento */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#666' }}>
                  💳 Dati Pagamento
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Importo (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.importo}
                      onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Data Pagamento *
                    </label>
                    <input
                      type="date"
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Metodo Pagamento *
                    </label>
                    <select
                      value={formData.metodo_pagamento}
                      onChange={(e) => setFormData({ ...formData, metodo_pagamento: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    >
                      <option value="bonifico">Bonifico Bancario</option>
                      <option value="carta">Carta di Credito</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                      <option value="contanti">Contanti</option>
                      <option value="assegno">Assegno</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Descrizione
                    </label>
                    <input
                      type="text"
                      value={formData.descrizione}
                      onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                      placeholder="Es: Abbonamento Mensile"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Fattura */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h5 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#666' }}>
                  📄 Dati Fattura
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Numero Fattura *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_fattura}
                      onChange={(e) => setFormData({ ...formData, numero_fattura: e.target.value })}
                      required
                      placeholder="Es: FT-2024-001"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Data Fattura *
                    </label>
                    <input
                      type="date"
                      value={formData.data_fattura}
                      onChange={(e) => setFormData({ ...formData, data_fattura: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Upload Fattura PDF *
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px',
                        background: 'white'
                      }}
                    />
                    {formData.file_fattura && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#2196F3' }}>
                        ✓ File selezionato: {formData.file_fattura.name}
                      </div>
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                      Note
                    </label>
                    <textarea
                      value={formData.note_fattura}
                      onChange={(e) => setFormData({ ...formData, note_fattura: e.target.value })}
                      rows="3"
                      placeholder="Note aggiuntive sulla fattura..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                style={{
                  marginTop: '20px',
                  padding: '14px 28px',
                  background: uploading ? '#E0E0E0' : 'linear-gradient(135deg, #7FFF00 0%, #6FEF00 100%)',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  boxShadow: uploading ? 'none' : '0 4px 16px rgba(127, 255, 0, 0.3)'
                }}
              >
                {uploading ? '⏳ Caricamento in corso...' : '✓ Registra Pagamento e Fattura'}
              </button>
            </form>
          )}

          {/* Combined List */}
          <div style={{ padding: '24px' }}>
            {combinedData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                Nessun pagamento registrato
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {combinedData.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '24px',
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '2px solid #F0F0F0',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
                          €{item.importo.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '15px', color: '#666', marginBottom: '4px' }}>
                          {item.descrizione || 'Pagamento'}
                        </div>
                        {item.fattura && (
                          <div style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            background: '#E8F5E9',
                            color: '#2E7D32',
                            marginTop: '8px'
                          }}>
                            📄 Fattura: {item.fattura.numero_fattura}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#E3F2FD',
                          color: '#2196F3',
                          marginBottom: '8px'
                        }}>
                          {item.metodo_pagamento}
                        </div>
                        <div style={{ fontSize: '14px', color: '#999' }}>
                          {new Date(item.data_pagamento).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>

                    {/* Fattura Details */}
                    {item.fattura && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #F0F0F0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            Data Fattura: {new Date(item.fattura.data_fattura).toLocaleDateString('it-IT')}
                          </div>
                          {item.fattura.note && (
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              Note: {item.fattura.note}
                            </div>
                          )}
                        </div>
                        {item.fattura.file_url && (
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
                            📥 Scarica Fattura PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

export default AdminClubPayments;
