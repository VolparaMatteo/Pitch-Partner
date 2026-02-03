import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { clubAPI } from '../services/api';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineCreditCard,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList
} from 'react-icons/hi2';
import { HiOutlineTrophy } from 'react-icons/hi2';
import '../styles/crm-calendar.css';

// date-fns localizer
const locales = { 'it': it };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales
});

const messages = {
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  today: 'Oggi',
  previous: 'Indietro',
  next: 'Avanti',
  date: 'Data',
  time: 'Ora',
  event: 'Evento',
  noEventsInRange: 'Nessun evento in questo periodo.',
  showMore: (total) => `+${total} altri`
};

const SOURCE_CONFIG = {
  calendar_event: { label: 'Task/Appuntamenti', color: '#6366F1', Icon: HiOutlineCalendarDays },
  lead_followup: { label: 'Follow-up Lead', color: '#F59E0B', Icon: HiOutlineClock },
  sponsor_followup: { label: 'Follow-up Sponsor', color: '#8B5CF6', Icon: HiOutlineClock },
  lead_contatto: { label: 'Contatti Lead', color: '#F59E0B', Icon: HiOutlinePhone },
  event: { label: 'Eventi', color: '#10B981', Icon: HiOutlineCalendar },
  match: { label: 'Partite', color: '#EF4444', Icon: HiOutlineTrophy },
  payment: { label: 'Pagamenti', color: '#DC2626', Icon: HiOutlineCreditCard }
};

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

const TIPO_OPTIONS = [
  { value: 'appuntamento', label: 'Appuntamento' },
  { value: 'task', label: 'Task' },
  { value: 'promemoria', label: 'Promemoria' }
];

const PRIORITA_OPTIONS = [
  { value: 1, label: 'Bassa', cls: 'low' },
  { value: 2, label: 'Media', cls: 'medium' },
  { value: 3, label: 'Alta', cls: 'high' }
];

export default function CRMCalendar() {
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState({ tasks_pendenti: 0, followup_scaduti: 0, appuntamenti_oggi: 0, pagamenti_in_scadenza: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [activeSources, setActiveSources] = useState(Object.keys(SOURCE_CONFIG));

  // Modals
  const [editModal, setEditModal] = useState(null); // null or { mode: 'create'|'edit', data: {...} }
  const [viewModal, setViewModal] = useState(null); // null or event object (read-only)
  const [saving, setSaving] = useState(false);

  // Search states for lead/sponsor
  const [leadSearch, setLeadSearch] = useState('');
  const [leadResults, setLeadResults] = useState([]);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorResults, setSponsorResults] = useState([]);
  const leadSearchTimeout = useRef(null);
  const sponsorSearchTimeout = useRef(null);

  // ==================== DATA FETCHING ====================

  const getDateRange = useCallback(() => {
    const start = startOfMonth(subMonths(currentDate, 1));
    const end = endOfMonth(addMonths(currentDate, 1));
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }, [currentDate]);

  const fetchAggregate = useCallback(async () => {
    try {
      const range = getDateRange();
      const res = await clubAPI.getCalendarAggregate({
        start: range.start,
        end: range.end,
        sources: activeSources.join(',')
      });
      const mapped = (res.data || []).map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end)
      }));
      setEvents(mapped);
    } catch (err) {
      console.error('Errore caricamento eventi:', err);
    }
  }, [getDateRange, activeSources]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await clubAPI.getCalendarStats();
      setStats(res.data || {});
    } catch (err) {
      console.error('Errore caricamento stats:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAggregate(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchAggregate, fetchStats]);

  // ==================== EVENT HANDLERS ====================

  const handleSelectSlot = useCallback(({ start, end }) => {
    const toLocal = (d) => {
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000);
      return local.toISOString().slice(0, 16);
    };
    setEditModal({
      mode: 'create',
      data: {
        tipo: 'appuntamento',
        titolo: '',
        descrizione: '',
        data_inizio: toLocal(start),
        data_fine: toLocal(end),
        tutto_il_giorno: false,
        priorita: 2,
        colore: '#6366F1',
        lead_id: null,
        lead_nome: null,
        sponsor_id: null,
        sponsor_nome: null
      }
    });
  }, []);

  const handleSelectEvent = useCallback((event) => {
    if (event.editable) {
      // Open edit modal for CalendarEvent
      const toLocal = (d) => {
        if (!d) return '';
        const date = typeof d === 'string' ? new Date(d) : d;
        const off = date.getTimezoneOffset();
        const local = new Date(date.getTime() - off * 60000);
        return local.toISOString().slice(0, 16);
      };
      setEditModal({
        mode: 'edit',
        data: {
          id: event.source_id,
          tipo: event.tipo || 'appuntamento',
          titolo: event.title,
          descrizione: event.descrizione || '',
          data_inizio: toLocal(event.start),
          data_fine: toLocal(event.end),
          tutto_il_giorno: event.allDay || false,
          priorita: event.priorita || 2,
          colore: event.color || '#6366F1',
          completato: event.completato || false,
          lead_id: event.lead_id || null,
          lead_nome: event.lead_nome || null,
          sponsor_id: event.sponsor_id || null,
          sponsor_nome: event.sponsor_nome || null
        }
      });
    } else {
      setViewModal(event);
    }
  }, []);

  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((view) => {
    setCurrentView(view);
  }, []);

  const toggleSource = useCallback((source) => {
    setActiveSources(prev => {
      if (prev.includes(source)) {
        return prev.filter(s => s !== source);
      }
      return [...prev, source];
    });
  }, []);

  // ==================== CRUD ====================

  const handleSave = async () => {
    if (!editModal) return;
    const { mode, data } = editModal;

    if (!data.titolo.trim()) return;
    if (!data.data_inizio) return;

    setSaving(true);
    try {
      const payload = {
        tipo: data.tipo,
        titolo: data.titolo.trim(),
        descrizione: data.descrizione || null,
        data_inizio: data.data_inizio,
        data_fine: data.data_fine || null,
        tutto_il_giorno: data.tutto_il_giorno,
        priorita: data.priorita,
        colore: data.colore,
        lead_id: data.lead_id || null,
        sponsor_id: data.sponsor_id || null
      };

      if (mode === 'create') {
        await clubAPI.createCalendarEvent(payload);
      } else {
        await clubAPI.updateCalendarEvent(data.id, payload);
      }

      setEditModal(null);
      await Promise.all([fetchAggregate(), fetchStats()]);
    } catch (err) {
      console.error('Errore salvataggio:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editModal || editModal.mode !== 'edit') return;
    if (!window.confirm('Eliminare questo evento?')) return;

    setSaving(true);
    try {
      await clubAPI.deleteCalendarEvent(editModal.data.id);
      setEditModal(null);
      await Promise.all([fetchAggregate(), fetchStats()]);
    } catch (err) {
      console.error('Errore eliminazione:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!editModal || editModal.mode !== 'edit') return;

    try {
      await clubAPI.completeCalendarEvent(editModal.data.id);
      setEditModal(null);
      await Promise.all([fetchAggregate(), fetchStats()]);
    } catch (err) {
      console.error('Errore completamento:', err);
    }
  };

  // ==================== SEARCH ====================

  const searchLeads = useCallback((query) => {
    setLeadSearch(query);
    if (leadSearchTimeout.current) clearTimeout(leadSearchTimeout.current);
    if (!query.trim()) {
      setLeadResults([]);
      return;
    }
    leadSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await clubAPI.getLeads({ status: '' });
        const leads = (res.data || []).filter(l =>
          l.ragione_sociale?.toLowerCase().includes(query.toLowerCase())
        );
        setLeadResults(leads.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    }, 300);
  }, []);

  const searchSponsors = useCallback((query) => {
    setSponsorSearch(query);
    if (sponsorSearchTimeout.current) clearTimeout(sponsorSearchTimeout.current);
    if (!query.trim()) {
      setSponsorResults([]);
      return;
    }
    sponsorSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await clubAPI.getSponsors();
        const sponsors = (res.data || []).filter(s =>
          s.ragione_sociale?.toLowerCase().includes(query.toLowerCase())
        );
        setSponsorResults(sponsors.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    }, 300);
  }, []);

  // ==================== CALENDAR CUSTOMIZATION ====================

  const eventPropGetter = useCallback((event) => {
    const style = {
      backgroundColor: event.color || '#6366F1',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      opacity: event.completato ? 0.5 : 0.95
    };
    return { style };
  }, []);

  const CustomEvent = useMemo(() => {
    return function EventComponent({ event }) {
      return (
        <span className={event.completato ? 'cc-event-completed' : ''}>
          {event.title}
        </span>
      );
    };
  }, []);

  const components = useMemo(() => ({
    event: CustomEvent
  }), [CustomEvent]);

  // ==================== MODAL FORM UPDATE ====================

  const updateEditData = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="tp-page">
        <div className="cc-loading">
          <div className="cc-spinner" />
          Caricamento calendario...
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* Page Header */}
      <div className="tp-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="tp-page-title">Calendario</h1>
          <p className="tp-page-subtitle">Gestisci appuntamenti, task e visualizza tutte le attività</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="tp-stats-row">
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <HiOutlineClipboardDocumentList style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.tasks_pendenti}</div>
            <div className="tp-stat-label">Task Pendenti</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <HiOutlineExclamationTriangle style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.followup_scaduti}</div>
            <div className="tp-stat-label">Follow-up Scaduti</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <HiOutlineCalendarDays style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.appuntamenti_oggi}</div>
            <div className="tp-stat-label">Appuntamenti Oggi</div>
          </div>
        </div>
        <div className="tp-stat-card-dark">
          <div className="tp-stat-icon" style={{ background: '#FFFFFF' }}>
            <HiOutlineCreditCard style={{ color: '#1F2937' }} />
          </div>
          <div className="tp-stat-content">
            <div className="tp-stat-value">{stats.pagamenti_in_scadenza}</div>
            <div className="tp-stat-label">Pagamenti in Scadenza</div>
          </div>
        </div>
      </div>

      {/* Source Filters */}
      <div className="cc-toolbar-card">
        <div className="cc-toolbar-label">Filtra sorgenti</div>
        <div className="cc-source-filters">
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`cc-source-filter-btn ${activeSources.includes(key) ? 'active' : ''}`}
              onClick={() => toggleSource(key)}
            >
              <span className="cc-source-dot" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="cc-calendar-card cc-calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          allDayAccessor="allDay"
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventPropGetter}
          components={components}
          messages={messages}
          culture="it"
          views={['month', 'week', 'day', 'agenda']}
          popup
          style={{ minHeight: 650 }}
        />
      </div>

      {/* Edit/Create Modal */}
      {editModal && (
        <div className="cc-modal-overlay" onClick={() => !saving && setEditModal(null)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-modal-header">
              <h3 className="cc-modal-title">
                {editModal.mode === 'create' ? 'Nuovo Evento' : 'Modifica Evento'}
              </h3>
              <button className="cc-modal-close" onClick={() => setEditModal(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            <div className="cc-modal-body">
              {/* Tipo */}
              <div className="cc-form-group">
                <label className="cc-form-label">Tipo</label>
                <div className="cc-type-btns">
                  {TIPO_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`cc-type-btn ${editModal.data.tipo === opt.value ? 'active' : ''}`}
                      onClick={() => updateEditData('tipo', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titolo */}
              <div className="cc-form-group">
                <label className="cc-form-label">Titolo *</label>
                <input
                  type="text"
                  className="cc-form-input"
                  value={editModal.data.titolo}
                  onChange={e => updateEditData('titolo', e.target.value)}
                  placeholder="Inserisci titolo..."
                />
              </div>

              {/* Date */}
              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label className="cc-form-label">Data inizio *</label>
                  <input
                    type="datetime-local"
                    className="cc-form-input"
                    value={editModal.data.data_inizio}
                    onChange={e => updateEditData('data_inizio', e.target.value)}
                  />
                </div>
                <div className="cc-form-group">
                  <label className="cc-form-label">Data fine</label>
                  <input
                    type="datetime-local"
                    className="cc-form-input"
                    value={editModal.data.data_fine}
                    onChange={e => updateEditData('data_fine', e.target.value)}
                  />
                </div>
              </div>

              {/* Tutto il giorno */}
              <div className="cc-checkbox-row">
                <input
                  type="checkbox"
                  className="cc-checkbox"
                  id="cc-allday"
                  checked={editModal.data.tutto_il_giorno}
                  onChange={e => updateEditData('tutto_il_giorno', e.target.checked)}
                />
                <label className="cc-checkbox-label" htmlFor="cc-allday">Tutto il giorno</label>
              </div>

              {/* Descrizione */}
              <div className="cc-form-group">
                <label className="cc-form-label">Descrizione</label>
                <textarea
                  className="cc-form-textarea"
                  value={editModal.data.descrizione}
                  onChange={e => updateEditData('descrizione', e.target.value)}
                  placeholder="Descrizione opzionale..."
                  rows={3}
                />
              </div>

              {/* Priorita */}
              <div className="cc-form-group">
                <label className="cc-form-label">Priorit&agrave;</label>
                <div className="cc-priority-btns">
                  {PRIORITA_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`cc-priority-btn ${editModal.data.priorita === opt.value ? `active ${opt.cls}` : ''}`}
                      onClick={() => updateEditData('priorita', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colore */}
              <div className="cc-form-group">
                <label className="cc-form-label">Colore</label>
                <div className="cc-color-picker">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      className={`cc-color-swatch ${editModal.data.colore === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateEditData('colore', c)}
                    />
                  ))}
                </div>
              </div>

              {/* Lead search */}
              <div className="cc-form-group">
                <label className="cc-form-label">Lead collegato</label>
                {editModal.data.lead_id ? (
                  <div className="cc-search-selected">
                    {editModal.data.lead_nome}
                    <button className="cc-search-selected-remove" onClick={() => {
                      updateEditData('lead_id', null);
                      updateEditData('lead_nome', null);
                    }}>&times;</button>
                  </div>
                ) : (
                  <div className="cc-search-wrapper">
                    <input
                      type="text"
                      className="cc-form-input"
                      value={leadSearch}
                      onChange={e => searchLeads(e.target.value)}
                      placeholder="Cerca lead..."
                    />
                    {leadResults.length > 0 && (
                      <div className="cc-search-dropdown">
                        {leadResults.map(l => (
                          <button
                            key={l.id}
                            className="cc-search-item"
                            onClick={() => {
                              updateEditData('lead_id', l.id);
                              updateEditData('lead_nome', l.ragione_sociale);
                              setLeadSearch('');
                              setLeadResults([]);
                            }}
                          >
                            {l.ragione_sociale}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sponsor search */}
              <div className="cc-form-group">
                <label className="cc-form-label">Sponsor collegato</label>
                {editModal.data.sponsor_id ? (
                  <div className="cc-search-selected">
                    {editModal.data.sponsor_nome}
                    <button className="cc-search-selected-remove" onClick={() => {
                      updateEditData('sponsor_id', null);
                      updateEditData('sponsor_nome', null);
                    }}>&times;</button>
                  </div>
                ) : (
                  <div className="cc-search-wrapper">
                    <input
                      type="text"
                      className="cc-form-input"
                      value={sponsorSearch}
                      onChange={e => searchSponsors(e.target.value)}
                      placeholder="Cerca sponsor..."
                    />
                    {sponsorResults.length > 0 && (
                      <div className="cc-search-dropdown">
                        {sponsorResults.map(s => (
                          <button
                            key={s.id}
                            className="cc-search-item"
                            onClick={() => {
                              updateEditData('sponsor_id', s.id);
                              updateEditData('sponsor_nome', s.ragione_sociale);
                              setSponsorSearch('');
                              setSponsorResults([]);
                            }}
                          >
                            {s.ragione_sociale}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="cc-modal-footer">
              {editModal.mode === 'edit' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cc-btn cc-btn-danger" onClick={handleDelete} disabled={saving}>
                    <HiOutlineTrash /> Elimina
                  </button>
                  <button className="cc-btn cc-btn-success" onClick={handleToggleComplete} disabled={saving}>
                    <HiOutlineCheck /> {editModal.data.completato ? 'Riapri' : 'Completa'}
                  </button>
                </div>
              )}
              <div className="cc-modal-footer-right">
                <button className="cc-btn cc-btn-secondary" onClick={() => setEditModal(null)} disabled={saving}>
                  Annulla
                </button>
                <button className="cc-btn cc-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal (read-only for external events) */}
      {viewModal && (
        <div className="cc-modal-overlay" onClick={() => setViewModal(null)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="cc-modal-header">
              <h3 className="cc-modal-title">{viewModal.title}</h3>
              <button className="cc-modal-close" onClick={() => setViewModal(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            <div className="cc-modal-body">
              {/* Source badge */}
              {viewModal.source && SOURCE_CONFIG[viewModal.source] && (
                <div>
                  <span
                    className="cc-source-badge"
                    style={{
                      background: `${SOURCE_CONFIG[viewModal.source].color}20`,
                      color: SOURCE_CONFIG[viewModal.source].color
                    }}
                  >
                    <span className="cc-source-dot" style={{ background: SOURCE_CONFIG[viewModal.source].color }} />
                    {SOURCE_CONFIG[viewModal.source].label}
                  </span>
                </div>
              )}

              {/* Tipo */}
              {viewModal.tipo && (
                <div className="cc-view-field">
                  <span className="cc-view-label">Tipo</span>
                  <span className="cc-view-value" style={{ textTransform: 'capitalize' }}>{viewModal.tipo}</span>
                </div>
              )}

              {/* Date */}
              <div className="cc-form-row">
                <div className="cc-view-field">
                  <span className="cc-view-label">Inizio</span>
                  <span className="cc-view-value">
                    {viewModal.start ? format(new Date(viewModal.start), 'dd/MM/yyyy HH:mm', { locale: it }) : '-'}
                  </span>
                </div>
                <div className="cc-view-field">
                  <span className="cc-view-label">Fine</span>
                  <span className="cc-view-value">
                    {viewModal.end ? format(new Date(viewModal.end), 'dd/MM/yyyy HH:mm', { locale: it }) : '-'}
                  </span>
                </div>
              </div>

              {/* Descrizione */}
              {viewModal.descrizione && (
                <div className="cc-view-field">
                  <span className="cc-view-label">Descrizione</span>
                  <span className="cc-view-value">{viewModal.descrizione}</span>
                </div>
              )}

              {/* Lead/Sponsor */}
              {viewModal.lead_nome && (
                <div className="cc-view-field">
                  <span className="cc-view-label">Lead</span>
                  <span className="cc-view-value">{viewModal.lead_nome}</span>
                </div>
              )}
              {viewModal.sponsor_nome && (
                <div className="cc-view-field">
                  <span className="cc-view-label">Sponsor</span>
                  <span className="cc-view-value">{viewModal.sponsor_nome}</span>
                </div>
              )}

              {/* Completato */}
              {viewModal.completato !== undefined && (
                <div className="cc-view-field">
                  <span className="cc-view-label">Stato</span>
                  <span className="cc-view-value">
                    {viewModal.completato ? 'Completato' : 'In corso'}
                  </span>
                </div>
              )}
            </div>

            <div className="cc-modal-footer">
              <div />
              <div className="cc-modal-footer-right">
                {viewModal.link && (
                  <button
                    className="cc-btn cc-btn-primary"
                    onClick={() => {
                      setViewModal(null);
                      navigate(viewModal.link);
                    }}
                  >
                    <HiOutlineArrowTopRightOnSquare /> Vai al dettaglio
                  </button>
                )}
                <button className="cc-btn cc-btn-secondary" onClick={() => setViewModal(null)}>
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
