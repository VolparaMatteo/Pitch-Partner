import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import api from '../services/api';
import '../styles/admin-dashboard.css';
import '../styles/template-style.css';

// Icons
import {
  HiOutlineCursorArrowRays,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineCurrencyEuro,
  HiOutlineBolt,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineEllipsisVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSparkles
} from 'react-icons/hi2';

function AdminLeadsPipeline() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = getAuth();
  const [loading, setLoading] = useState(true);

  const [pipelineData, setPipelineData] = useState({
    pipeline: {},
    stats: {
      total_value: 0,
      total_leads: 0,
      won_month: 0,
      lost_month: 0
    }
  });

  const [leads, setLeads] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    stage: searchParams.get('stage') || '',
    temperatura: searchParams.get('temperatura') || '',
    search: ''
  });

  // View mode: 'pipeline' or 'list'
  const [viewMode, setViewMode] = useState('pipeline');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    nome_club: '',
    tipologia_club: '',
    contatto_nome: '',
    contatto_ruolo: '',
    email: '',
    telefono: '',
    citta: '',
    regione: '',
    fonte: 'direct',
    valore_stimato: 0,
    piano_interessato: '',
    note: ''
  });

  const stages = [
    { id: 'nuovo', label: 'Nuovo', color: '#6B7280' },
    { id: 'contattato', label: 'Contattato', color: '#3B82F6' },
    { id: 'qualificato', label: 'Qualificato', color: '#8B5CF6' },
    { id: 'demo', label: 'Demo', color: '#F59E0B' },
    { id: 'proposta', label: 'Proposta', color: '#EC4899' },
    { id: 'negoziazione', label: 'Negoziazione', color: '#10B981' }
  ];

  const temperatureLabels = {
    cold: { label: 'Freddo', color: '#3B82F6', bg: '#EFF6FF' },
    warm: { label: 'Tiepido', color: '#F59E0B', bg: '#FFFBEB' },
    hot: { label: 'Caldo', color: '#EF4444', bg: '#FEF2F2' }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [filters.stage, filters.temperatura]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pipelineRes, leadsRes] = await Promise.all([
        api.get('/admin/leads/pipeline'),
        api.get('/admin/leads', { params: filters })
      ]);

      setPipelineData(pipelineRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      if (!formData.nome_club) {
        alert('Il nome del club è obbligatorio');
        return;
      }

      await api.post('/admin/leads', formData);
      setShowCreateModal(false);
      setFormData({
        nome_club: '',
        tipologia_club: '',
        contatto_nome: '',
        contatto_ruolo: '',
        email: '',
        telefono: '',
        citta: '',
        regione: '',
        fonte: 'direct',
        valore_stimato: 0,
        piano_interessato: '',
        note: ''
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nella creazione');
    }
  };

  const handleUpdateStage = async (leadId, newStage) => {
    try {
      await api.put(`/admin/leads/${leadId}`, { stage: newStage });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nell\'aggiornamento');
    }
  };

  const handleUpdateTemperature = async (leadId, newTemp) => {
    try {
      await api.put(`/admin/leads/${leadId}`, { temperatura: newTemp });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nell\'aggiornamento');
    }
  };

  const handleAddActivity = async (leadId, tipo, descrizione) => {
    try {
      await api.post(`/admin/leads/${leadId}/activity`, { tipo, descrizione });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Errore nell\'aggiunta attività');
    }
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
      month: 'short'
    });
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return lead.nome_club?.toLowerCase().includes(searchLower) ||
             lead.contatto_nome?.toLowerCase().includes(searchLower) ||
             lead.email?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const { pipeline, stats } = pipelineData;

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Caricamento pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Pipeline Lead</h1>
          <p className="page-subtitle">Gestione lead e potenziali clienti</p>
        </div>
        <div className="page-header-right">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              Lista
            </button>
          </div>
          <button className="btn-secondary" onClick={fetchData}>
            <HiOutlineArrowPath size={18} />
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <HiOutlinePlusCircle size={18} />
            Nuovo Lead
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="admin-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="stat-icon leads">
            <HiOutlineCursorArrowRays size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total_leads}</span>
            <span className="stat-label">Lead in Pipeline</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon subscriptions">
            <HiOutlineCurrencyEuro size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.total_value)}</span>
            <span className="stat-label">Valore Pipeline</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon new">
            <HiOutlineCheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.won_month}</span>
            <span className="stat-label">Vinti (mese)</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon hot-leads">
            <HiOutlineXCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.lost_month}</span>
            <span className="stat-label">Persi (mese)</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-box">
          <HiOutlineMagnifyingGlass size={18} />
          <input
            type="text"
            placeholder="Cerca lead..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-buttons">
          <select
            className="filter-select"
            value={filters.temperatura}
            onChange={(e) => setFilters({ ...filters, temperatura: e.target.value })}
          >
            <option value="">Tutte le temperature</option>
            <option value="cold">Freddo</option>
            <option value="warm">Tiepido</option>
            <option value="hot">Caldo</option>
          </select>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' ? (
        <div className="pipeline-board">
          {stages.map((stage) => {
            const stageLeads = (pipeline[stage.id]?.leads || []).filter(lead => {
              if (!filters.search) return true;
              const searchLower = filters.search.toLowerCase();
              return lead.nome_club?.toLowerCase().includes(searchLower);
            });

            return (
              <div key={stage.id} className="pipeline-column">
                <div className="column-header" style={{ borderTopColor: stage.color }}>
                  <span className="column-title">{stage.label}</span>
                  <span className="column-count">{stageLeads.length}</span>
                </div>
                <div className="column-value">
                  {formatCurrency(pipeline[stage.id]?.value || 0)}
                </div>
                <div className="column-content">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      stages={stages}
                      temperatureLabels={temperatureLabels}
                      onStageChange={(newStage) => handleUpdateStage(lead.id, newStage)}
                      onTempChange={(newTemp) => handleUpdateTemperature(lead.id, newTemp)}
                      onAddActivity={(tipo, desc) => handleAddActivity(lead.id, tipo, desc)}
                      onClick={() => navigate(`/admin/leads/${lead.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Club</th>
                <th>Contatto</th>
                <th>Stage</th>
                <th>Temperatura</th>
                <th>Valore</th>
                <th>Score</th>
                <th>Ultimo Contatto</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    <HiOutlineCursorArrowRays size={32} />
                    <span>Nessun lead trovato</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const tempInfo = temperatureLabels[lead.temperatura] || temperatureLabels.cold;

                  return (
                    <tr key={lead.id}>
                      <td>
                        <div className="cell-with-icon">
                          <HiOutlineBuildingOffice2 size={18} className="cell-icon" />
                          <div className="cell-content">
                            <span className="primary-text">{lead.nome_club}</span>
                            {lead.citta && (
                              <span className="secondary-text">{lead.citta}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <span className="primary-text">{lead.contatto_nome || '-'}</span>
                          <span className="secondary-text">{lead.email}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className="inline-select"
                          value={lead.stage}
                          onChange={(e) => handleUpdateStage(lead.id, e.target.value)}
                        >
                          {stages.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          className="temp-badge"
                          style={{ backgroundColor: tempInfo.bg, color: tempInfo.color }}
                          onClick={() => {
                            const temps = ['cold', 'warm', 'hot'];
                            const currentIdx = temps.indexOf(lead.temperatura);
                            const nextIdx = (currentIdx + 1) % temps.length;
                            handleUpdateTemperature(lead.id, temps[nextIdx]);
                          }}
                        >
                          {tempInfo.label}
                        </span>
                      </td>
                      <td>{formatCurrency(lead.valore_stimato)}</td>
                      <td>
                        <div className="score-badge" style={{
                          backgroundColor: lead.score >= 70 ? '#ECFDF5' :
                                          lead.score >= 40 ? '#FFFBEB' : '#F3F4F6',
                          color: lead.score >= 70 ? '#10B981' :
                                 lead.score >= 40 ? '#F59E0B' : '#6B7280'
                        }}>
                          {lead.score}
                        </div>
                      </td>
                      <td>{formatDate(lead.data_ultimo_contatto)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            onClick={() => navigate(`/admin/leads/${lead.id}`)}
                            title="Dettagli"
                          >
                            <HiOutlineDocumentText size={16} />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleAddActivity(lead.id, 'call', 'Chiamata effettuata')}
                            title="Log Chiamata"
                          >
                            <HiOutlinePhone size={16} />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleAddActivity(lead.id, 'email', 'Email inviata')}
                            title="Log Email"
                          >
                            <HiOutlineEnvelope size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuovo Lead</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <HiOutlineXCircle size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome Club *</label>
                  <input
                    type="text"
                    value={formData.nome_club}
                    onChange={(e) => setFormData({ ...formData, nome_club: e.target.value })}
                    placeholder="Nome del club"
                  />
                </div>

                <div className="form-group">
                  <label>Tipologia</label>
                  <select
                    value={formData.tipologia_club}
                    onChange={(e) => setFormData({ ...formData, tipologia_club: e.target.value })}
                  >
                    <option value="">Seleziona...</option>
                    <option value="calcio">Calcio</option>
                    <option value="basket">Basket</option>
                    <option value="volley">Volley</option>
                    <option value="rugby">Rugby</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Nome Contatto</label>
                  <input
                    type="text"
                    value={formData.contatto_nome}
                    onChange={(e) => setFormData({ ...formData, contatto_nome: e.target.value })}
                    placeholder="Nome e cognome"
                  />
                </div>

                <div className="form-group">
                  <label>Ruolo Contatto</label>
                  <input
                    type="text"
                    value={formData.contatto_ruolo}
                    onChange={(e) => setFormData({ ...formData, contatto_ruolo: e.target.value })}
                    placeholder="es. Presidente, Marketing Manager"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@club.it"
                  />
                </div>

                <div className="form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+39..."
                  />
                </div>

                <div className="form-group">
                  <label>Città</label>
                  <input
                    type="text"
                    value={formData.citta}
                    onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    placeholder="Città"
                  />
                </div>

                <div className="form-group">
                  <label>Regione</label>
                  <input
                    type="text"
                    value={formData.regione}
                    onChange={(e) => setFormData({ ...formData, regione: e.target.value })}
                    placeholder="Regione"
                  />
                </div>

                <div className="form-group">
                  <label>Fonte</label>
                  <select
                    value={formData.fonte}
                    onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                  >
                    <option value="direct">Diretto</option>
                    <option value="website">Sito Web</option>
                    <option value="referral">Referral</option>
                    <option value="event">Evento</option>
                    <option value="social">Social Media</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valore Stimato</label>
                  <input
                    type="number"
                    value={formData.valore_stimato}
                    onChange={(e) => setFormData({ ...formData, valore_stimato: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Note</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Note aggiuntive..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Annulla
              </button>
              <button className="btn-primary" onClick={handleCreateLead}>
                Crea Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lead Card Component
function LeadCard({ lead, stages, temperatureLabels, onStageChange, onTempChange, onAddActivity, onClick }) {
  const [showMenu, setShowMenu] = useState(false);
  const tempInfo = temperatureLabels[lead.temperatura] || temperatureLabels.cold;

  return (
    <div className="lead-card" onClick={onClick}>
      <div className="lead-card-header">
        <span className="lead-name">{lead.nome_club}</span>
        <span
          className="lead-temp"
          style={{ backgroundColor: tempInfo.bg, color: tempInfo.color }}
          onClick={(e) => {
            e.stopPropagation();
            const temps = ['cold', 'warm', 'hot'];
            const currentIdx = temps.indexOf(lead.temperatura);
            const nextIdx = (currentIdx + 1) % temps.length;
            onTempChange(temps[nextIdx]);
          }}
        >
          {tempInfo.label}
        </span>
      </div>

      {lead.contatto_nome && (
        <div className="lead-contact">
          <HiOutlineUserCircle size={14} />
          <span>{lead.contatto_nome}</span>
        </div>
      )}

      {lead.valore_stimato > 0 && (
        <div className="lead-value">
          <HiOutlineCurrencyEuro size={14} />
          <span>{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(lead.valore_stimato)}</span>
        </div>
      )}

      <div className="lead-card-footer">
        <div className="lead-score" style={{
          color: lead.score >= 70 ? '#10B981' : lead.score >= 40 ? '#F59E0B' : '#6B7280'
        }}>
          Score: {lead.score}
        </div>
        <div className="lead-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddActivity('call', 'Chiamata')}>
            <HiOutlinePhone size={14} />
          </button>
          <button onClick={() => onAddActivity('email', 'Email')}>
            <HiOutlineEnvelope size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLeadsPipeline;
