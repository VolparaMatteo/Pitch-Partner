import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/template-style.css';

import {
  FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash,
  FaBullseye, FaHandshake, FaFileContract, FaCheckCircle,
  FaClock, FaTimesCircle, FaEuroSign, FaBuilding,
  FaChartLine, FaArrowRight
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

function SponsorOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  // Form state
  const [formData, setFormData] = useState({
    nome_club: '',
    tipo_opportunita: 'sponsorship',
    valore_stimato: '',
    probabilita: 50,
    status: 'nuovo',
    note: '',
    prossima_azione: '',
    data_prossima_azione: ''
  });

  const statusOptions = [
    { value: 'nuovo', label: 'Nuovo', color: 'blue' },
    { value: 'contattato', label: 'Contattato', color: 'purple' },
    { value: 'in_trattativa', label: 'In Trattativa', color: 'orange' },
    { value: 'proposta', label: 'Proposta Inviata', color: 'yellow' },
    { value: 'negoziazione', label: 'Negoziazione', color: 'pink' },
    { value: 'vinto', label: 'Vinto', color: 'green' },
    { value: 'perso', label: 'Perso', color: 'red' }
  ];

  const tipoOptions = [
    { value: 'sponsorship', label: 'Sponsorship' },
    { value: 'evento', label: 'Evento' },
    { value: 'media', label: 'Media/Visibilità' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'altro', label: 'Altro' }
  ];

  useEffect(() => {
    if (!user || user.role !== 'sponsor') {
      navigate('/sponsor/login');
      return;
    }
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/sponsor/opportunities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpportunities(response.data.opportunities || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      // Use mock data if API not available
      setOpportunities([
        {
          id: 1,
          nome_club: 'FC Milano',
          tipo_opportunita: 'sponsorship',
          valore_stimato: 50000,
          probabilita: 75,
          status: 'in_trattativa',
          note: 'Interessati a LED bordo campo',
          prossima_azione: 'Inviare proposta dettagliata',
          data_prossima_azione: '2026-01-20',
          created_at: '2026-01-10'
        },
        {
          id: 2,
          nome_club: 'AC Torino',
          tipo_opportunita: 'evento',
          valore_stimato: 15000,
          probabilita: 40,
          status: 'contattato',
          note: 'Gala di fine stagione',
          prossima_azione: 'Follow-up telefonico',
          data_prossima_azione: '2026-01-18',
          created_at: '2026-01-08'
        },
        {
          id: 3,
          nome_club: 'US Napoli',
          tipo_opportunita: 'sponsorship',
          valore_stimato: 100000,
          probabilita: 20,
          status: 'nuovo',
          note: 'Primo contatto via email',
          prossima_azione: 'Presentazione aziendale',
          data_prossima_azione: '2026-01-25',
          created_at: '2026-01-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingOpportunity) {
        await axios.put(`${API_URL}/sponsor/opportunities/${editingOpportunity.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/sponsor/opportunities`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchOpportunities();
      resetForm();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      // For demo, add locally
      if (!editingOpportunity) {
        setOpportunities([...opportunities, { ...formData, id: Date.now(), created_at: new Date().toISOString() }]);
      }
      resetForm();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa opportunità?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/sponsor/opportunities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      setOpportunities(opportunities.filter(o => o.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      nome_club: '',
      tipo_opportunita: 'sponsorship',
      valore_stimato: '',
      probabilita: 50,
      status: 'nuovo',
      note: '',
      prossima_azione: '',
      data_prossima_azione: ''
    });
    setEditingOpportunity(null);
    setShowForm(false);
  };

  const openEditForm = (opp) => {
    setEditingOpportunity(opp);
    setFormData({
      nome_club: opp.nome_club,
      tipo_opportunita: opp.tipo_opportunita,
      valore_stimato: opp.valore_stimato,
      probabilita: opp.probabilita,
      status: opp.status,
      note: opp.note || '',
      prossima_azione: opp.prossima_azione || '',
      data_prossima_azione: opp.data_prossima_azione || ''
    });
    setShowForm(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.nome_club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.note?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate pipeline stats
  const pipelineStats = {
    total: opportunities.length,
    valore_totale: opportunities.reduce((sum, o) => sum + (o.valore_stimato || 0), 0),
    valore_pesato: opportunities.reduce((sum, o) => sum + ((o.valore_stimato || 0) * (o.probabilita || 0) / 100), 0),
    vinti: opportunities.filter(o => o.status === 'vinto').length
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Caricamento opportunità...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Opportunità</h1>
          <p>Gestisci la tua pipeline di opportunità di sponsorizzazione</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <FaPlus /> Nuova Opportunità
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FaBullseye /></div>
          <div className="stat-content">
            <div className="stat-value">{pipelineStats.total}</div>
            <div className="stat-label">Opportunità Totali</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FaEuroSign /></div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(pipelineStats.valore_totale)}</div>
            <div className="stat-label">Valore Pipeline</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FaChartLine /></div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(pipelineStats.valore_pesato)}</div>
            <div className="stat-label">Valore Pesato</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FaCheckCircle /></div>
          <div className="stat-content">
            <div className="stat-value">{pipelineStats.vinti}</div>
            <div className="stat-label">Vinti</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Cerca opportunità..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <FaFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tutti gli stati</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Tipo</th>
              <th>Valore Stimato</th>
              <th>Probabilità</th>
              <th>Status</th>
              <th>Prossima Azione</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredOpportunities.map(opp => {
              const statusInfo = getStatusInfo(opp.status);
              return (
                <tr key={opp.id}>
                  <td>
                    <div className="cell-main">
                      <FaBuilding className="cell-icon" />
                      <div>
                        <div className="cell-title">{opp.nome_club}</div>
                        <div className="cell-subtitle">{opp.note?.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">{tipoOptions.find(t => t.value === opp.tipo_opportunita)?.label || opp.tipo_opportunita}</span>
                  </td>
                  <td className="cell-currency">{formatCurrency(opp.valore_stimato)}</td>
                  <td>
                    <div className="probability-bar">
                      <div className="probability-fill" style={{ width: `${opp.probabilita}%` }}></div>
                      <span className="probability-text">{opp.probabilita}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${statusInfo.color}`}>{statusInfo.label}</span>
                  </td>
                  <td>
                    <div className="cell-action">
                      <div className="action-text">{opp.prossima_azione || '-'}</div>
                      {opp.data_prossima_azione && (
                        <div className="action-date">
                          <FaClock /> {formatDate(opp.data_prossima_azione)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => openEditForm(opp)} title="Modifica">
                        <FaEdit />
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(opp.id)} title="Elimina">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOpportunities.length === 0 && (
          <div className="empty-state">
            <FaBullseye />
            <h3>Nessuna opportunità trovata</h3>
            <p>Crea la tua prima opportunità per iniziare a tracciare la pipeline</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Nuova Opportunità
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOpportunity ? 'Modifica Opportunità' : 'Nuova Opportunità'}</h2>
              <button className="btn-close" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome Club *</label>
                  <input
                    type="text"
                    value={formData.nome_club}
                    onChange={(e) => setFormData({ ...formData, nome_club: e.target.value })}
                    required
                    placeholder="Es: FC Milano"
                  />
                </div>
                <div className="form-group">
                  <label>Tipo Opportunità</label>
                  <select
                    value={formData.tipo_opportunita}
                    onChange={(e) => setFormData({ ...formData, tipo_opportunita: e.target.value })}
                  >
                    {tipoOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Valore Stimato (€)</label>
                  <input
                    type="number"
                    value={formData.valore_stimato}
                    onChange={(e) => setFormData({ ...formData, valore_stimato: parseInt(e.target.value) || 0 })}
                    placeholder="50000"
                  />
                </div>
                <div className="form-group">
                  <label>Probabilità (%): {formData.probabilita}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.probabilita}
                    onChange={(e) => setFormData({ ...formData, probabilita: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Data Prossima Azione</label>
                  <input
                    type="date"
                    value={formData.data_prossima_azione}
                    onChange={(e) => setFormData({ ...formData, data_prossima_azione: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Prossima Azione</label>
                  <input
                    type="text"
                    value={formData.prossima_azione}
                    onChange={(e) => setFormData({ ...formData, prossima_azione: e.target.value })}
                    placeholder="Es: Inviare proposta commerciale"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Note</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    placeholder="Aggiungi note sull'opportunità..."
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>Annulla</button>
                <button type="submit" className="btn-primary">
                  {editingOpportunity ? 'Salva Modifiche' : 'Crea Opportunità'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorOpportunities;
