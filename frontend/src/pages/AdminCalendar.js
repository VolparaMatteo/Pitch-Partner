import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { getAuth } from '../utils/auth';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlinePlusCircle,
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineLink,
  HiOutlineVideoCameraSlash,
  HiOutlineVideoCamera
} from 'react-icons/hi2';
import '../styles/crm-calendar.css';
import '../styles/template-style.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

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
  month: 'Mese', week: 'Settimana', day: 'Giorno', agenda: 'Agenda',
  today: 'Oggi', previous: 'Indietro', next: 'Avanti',
  date: 'Data', time: 'Ora', event: 'Evento',
  noEventsInRange: 'Nessun evento in questo periodo.',
  showMore: (total) => `+${total} altri`
};

const TIPO_OPTIONS = [
  { value: 'appuntamento', label: 'Appuntamento', color: '#6366F1' },
  { value: 'demo', label: 'Demo', color: '#F59E0B' },
  { value: 'meeting', label: 'Meeting', color: '#3B82F6' },
  { value: 'personale', label: 'Personale', color: '#8B5CF6' },
  { value: 'follow_up', label: 'Follow-up', color: '#10B981' }
];

const TIPO_MAP = Object.fromEntries(TIPO_OPTIONS.map(t => [t.value, t]));

const COLOR_OPTIONS = ['#6366F1', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#EF4444', '#6B7280'];

const GIORNI = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

const BOOKING_STATI = {
  confermato: { label: 'Confermato', color: '#10B981', bg: '#ECFDF5' },
  completato: { label: 'Completato', color: '#3B82F6', bg: '#EFF6FF' },
  annullato: { label: 'Annullato', color: '#EF4444', bg: '#FEF2F2' },
  no_show: { label: 'No Show', color: '#F59E0B', bg: '#FFFBEB' }
};

function AdminCalendar() {
  const { user, token } = getAuth();
  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  // State
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [googleStatus, setGoogleStatus] = useState({ configured: false, connected: false });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [activeFilters, setActiveFilters] = useState(new Set(TIPO_OPTIONS.map(t => t.value)));
  const [activeTab, setActiveTab] = useState('calendario');

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailModal, setShowAvailModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    titolo: '', descrizione: '', tipo: 'appuntamento',
    data_inizio: '', data_fine: '', tutto_il_giorno: false,
    colore: '#6366F1', lead_id: null, club_id: null, note: '',
    genera_meet: false
  });

  // Availability
  const [availability, setAvailability] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ msg, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ==================== FETCH DATA ====================

  const fetchEvents = useCallback(async () => {
    try {
      const start = startOfMonth(subMonths(currentDate, 1)).toISOString();
      const end = endOfMonth(addMonths(currentDate, 1)).toISOString();
      const res = await fetch(`${API_URL}/admin/calendar/events?start=${start}&end=${end}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) { console.error('Fetch events error:', e); }
  }, [currentDate, headers]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/bookings`, { headers });
      if (res.ok) setBookings(await res.json());
    } catch (e) { console.error('Fetch bookings error:', e); }
  }, [headers]);

  const fetchGoogleStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/google/status`, { headers });
      if (res.ok) setGoogleStatus(await res.json());
    } catch (e) { console.error('Fetch google status error:', e); }
  }, [headers]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/availability`, { headers });
      if (res.ok) setAvailability(await res.json());
    } catch (e) { console.error('Fetch availability error:', e); }
  }, [headers]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchBookings(), fetchGoogleStatus(), fetchAvailability()]);
    setLoading(false);
  }, [fetchEvents, fetchBookings, fetchGoogleStatus, fetchAvailability]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchEvents(); }, [currentDate, fetchEvents]);

  // Auto-refresh 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
      fetchBookings();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchBookings]);

  // ==================== CALENDAR EVENTS ====================

  const calendarEvents = useMemo(() => {
    return events
      .filter(e => activeFilters.has(e.tipo))
      .map(e => ({
        id: e.id,
        title: e.titolo,
        start: new Date(e.data_inizio),
        end: new Date(e.data_fine),
        allDay: e.tutto_il_giorno,
        resource: e
      }));
  }, [events, activeFilters]);

  const eventStyleGetter = useCallback((event) => {
    const color = event.resource?.colore || TIPO_MAP[event.resource?.tipo]?.color || '#6366F1';
    return {
      style: {
        backgroundColor: color,
        borderRadius: '6px',
        opacity: 0.9,
        color: '#fff',
        border: 'none',
        fontSize: '12px',
        padding: '2px 6px'
      }
    };
  }, []);

  // ==================== EVENT CRUD ====================

  const handleSelectSlot = useCallback(({ start, end }) => {
    setEditingEvent(null);
    setEventForm({
      titolo: '', descrizione: '', tipo: 'appuntamento',
      data_inizio: format(start, "yyyy-MM-dd'T'HH:mm"),
      data_fine: format(end, "yyyy-MM-dd'T'HH:mm"),
      tutto_il_giorno: false, colore: '#6366F1',
      lead_id: null, club_id: null, note: '', genera_meet: false
    });
    setShowEventModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    const e = event.resource;
    setEditingEvent(e);
    setEventForm({
      titolo: e.titolo || '',
      descrizione: e.descrizione || '',
      tipo: e.tipo || 'appuntamento',
      data_inizio: e.data_inizio ? e.data_inizio.slice(0, 16) : '',
      data_fine: e.data_fine ? e.data_fine.slice(0, 16) : '',
      tutto_il_giorno: e.tutto_il_giorno || false,
      colore: e.colore || '#6366F1',
      lead_id: e.lead_id || null,
      club_id: e.club_id || null,
      note: e.note || '',
      genera_meet: false,
      meet_link: e.meet_link || null
    });
    setShowEventModal(true);
  }, []);

  const saveEvent = async () => {
    if (!eventForm.titolo || !eventForm.data_inizio || !eventForm.data_fine) {
      showToast('Compila titolo e date', 'error');
      return;
    }

    try {
      const url = editingEvent
        ? `${API_URL}/admin/calendar/events/${editingEvent.id}`
        : `${API_URL}/admin/calendar/events`;
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method, headers,
        body: JSON.stringify(eventForm)
      });

      if (res.ok) {
        showToast(editingEvent ? 'Evento aggiornato' : 'Evento creato');
        setShowEventModal(false);
        fetchEvents();
      } else {
        const err = await res.json();
        showToast(err.error || 'Errore', 'error');
      }
    } catch (e) {
      showToast('Errore di connessione', 'error');
    }
  };

  const deleteEvent = async () => {
    if (!editingEvent) return;
    if (!window.confirm('Eliminare questo evento?')) return;

    try {
      const res = await fetch(`${API_URL}/admin/calendar/events/${editingEvent.id}`, {
        method: 'DELETE', headers
      });
      if (res.ok) {
        showToast('Evento eliminato');
        setShowEventModal(false);
        fetchEvents();
      }
    } catch (e) {
      showToast('Errore', 'error');
    }
  };

  // ==================== AVAILABILITY ====================

  const [availForm, setAvailForm] = useState(
    GIORNI.map((_, i) => ({ giorno_settimana: i, attivo: i < 5, ora_inizio: '09:00', ora_fine: '18:00' }))
  );

  useEffect(() => {
    if (availability.length > 0) {
      const newForm = GIORNI.map((_, i) => {
        const existing = availability.find(a => a.giorno_settimana === i);
        return existing
          ? { giorno_settimana: i, attivo: existing.attivo, ora_inizio: existing.ora_inizio, ora_fine: existing.ora_fine }
          : { giorno_settimana: i, attivo: false, ora_inizio: '09:00', ora_fine: '18:00' };
      });
      setAvailForm(newForm);
    }
  }, [availability]);

  const saveAvailability = async () => {
    try {
      const slots = availForm.filter(a => a.attivo);
      const res = await fetch(`${API_URL}/admin/calendar/availability`, {
        method: 'POST', headers,
        body: JSON.stringify({ slots })
      });
      if (res.ok) {
        showToast('Disponibilita aggiornata');
        setShowAvailModal(false);
        fetchAvailability();
      }
    } catch (e) {
      showToast('Errore', 'error');
    }
  };

  // ==================== GOOGLE CALENDAR ====================

  const connectGoogle = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/google/connect`, {
        method: 'POST', headers
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.auth_url, '_blank');
      } else {
        showToast('Google Calendar non configurato', 'error');
      }
    } catch (e) {
      showToast('Errore', 'error');
    }
  };

  const syncGoogle = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/google/sync`, {
        method: 'POST', headers
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Sync: ${data.stats.created} creati, ${data.stats.updated} aggiornati`);
        fetchEvents();
      }
    } catch (e) {
      showToast('Errore sync', 'error');
    }
  };

  const disconnectGoogle = async () => {
    if (!window.confirm('Disconnettere Google Calendar?')) return;
    try {
      await fetch(`${API_URL}/admin/calendar/google/disconnect`, {
        method: 'POST', headers
      });
      showToast('Google Calendar disconnesso');
      fetchGoogleStatus();
    } catch (e) {
      showToast('Errore', 'error');
    }
  };

  // ==================== BOOKINGS ====================

  const updateBookingStato = async (bookingId, stato) => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/bookings/${bookingId}/stato`, {
        method: 'PUT', headers,
        body: JSON.stringify({ stato })
      });
      if (res.ok) {
        showToast(`Booking ${stato}`);
        fetchBookings();
      }
    } catch (e) {
      showToast('Errore', 'error');
    }
  };

  const copyBookingLink = () => {
    const url = `${window.location.origin}/prenota-demo`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copiato!'));
  };

  // ==================== TOGGLE FILTER ====================

  const toggleFilter = (tipo) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
  };

  // ==================== HELPERS ====================

  const openNewEvent = () => {
    setEditingEvent(null);
    setEventForm({
      titolo: '', descrizione: '', tipo: 'appuntamento',
      data_inizio: '', data_fine: '', tutto_il_giorno: false,
      colore: '#6366F1', lead_id: null, club_id: null, note: '',
      genera_meet: false
    });
    setShowEventModal(true);
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="tp-page-container">
        <div className="tp-loading" style={{ minHeight: '60vh' }}>
          <div className="tp-spinner"></div>
          <span>Caricamento Calendario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page-container">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? '#FEE2E2' : '#ECFDF5',
          color: toast.type === 'error' ? '#DC2626' : '#059669',
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="tp-page-header">
        <div>
          <h1 className="tp-page-title">Calendario</h1>
          <p className="tp-page-subtitle">Gestisci appuntamenti, demo e impegni</p>
        </div>
        <div className="tp-page-actions">
          <button className="tp-btn tp-btn-sm tp-btn-primary" onClick={openNewEvent}>
            <HiOutlinePlusCircle size={15} /> Evento
          </button>
          <button className="tp-btn tp-btn-sm tp-btn-outline" onClick={() => setShowAvailModal(true)}>
            <HiOutlineCog6Tooth size={15} /> Disponibilita
          </button>
          <button className="tp-btn tp-btn-sm tp-btn-outline" onClick={copyBookingLink} title="Copia link prenotazione">
            <HiOutlineLink size={15} /> Link Booking
          </button>
        </div>
      </div>


      {/* Google Calendar */}
      {googleStatus.configured && (
        <div className="tp-card" style={{ marginBottom: 20, padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Google Calendar:</span>
            {googleStatus.connected ? (
              <>
                <span className="tp-badge tp-badge-success">Connesso</span>
                <button className="tp-btn tp-btn-sm tp-btn-outline" onClick={syncGoogle} style={{ marginLeft: 'auto' }}>
                  <HiOutlineArrowPath size={14} /> Sync
                </button>
                <button className="tp-btn tp-btn-sm" onClick={disconnectGoogle}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                  Disconnetti
                </button>
              </>
            ) : (
              <button className="tp-btn tp-btn-sm tp-btn-primary" onClick={connectGoogle} style={{ marginLeft: 'auto' }}>
                Connetti Google Calendar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TIPO_OPTIONS.map(t => (
          <button
            key={t.value}
            onClick={() => toggleFilter(t.value)}
            className={`tp-filter-chip${activeFilters.has(t.value) ? ' active' : ''}`}
            style={activeFilters.has(t.value) ? { background: t.color, borderColor: t.color } : {}}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: activeFilters.has(t.value) ? '#fff' : t.color
            }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs - dark pill style like AdminClubDetail */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px', marginBottom: 20,
        background: '#FAFAFA', borderRadius: 10, border: '1px solid #E5E7EB'
      }}>
        {[
          { id: 'calendario', label: 'Calendario', icon: <HiOutlineCalendarDays size={14} /> },
          { id: 'bookings', label: 'Prenotazioni Demo', count: bookings.filter(b => b.stato === 'confermato').length },
          { id: 'disponibilita', label: 'Disponibilita', icon: <HiOutlineCog6Tooth size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'disponibilita' ? setShowAvailModal(true) : setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: activeTab === tab.id ? '#1A1A1A' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : '#6B7280',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                background: activeTab === tab.id ? '#FFFFFF' : '#E5E7EB',
                color: activeTab === tab.id ? '#1A1A1A' : '#6B7280',
                padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendario' && (
        <div className="cc-calendar-card cc-calendar-wrapper">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ minHeight: 650 }}
            messages={messages}
            culture="it"
            eventPropGetter={eventStyleGetter}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            date={currentDate}
            onNavigate={setCurrentDate}
            view={currentView}
            onView={setCurrentView}
            views={['month', 'week', 'day', 'agenda']}
            popup
            step={30}
            timeslots={2}
          />
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="tp-card">
          <div className="tp-table-wrapper">
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                Nessuna prenotazione demo
              </div>
            ) : (
              <table className="tp-table">
                <thead>
                  <tr>
                    <th>Data/Ora</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Club</th>
                    <th>Sport</th>
                    <th>Meet</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const statoInfo = BOOKING_STATI[b.stato] || BOOKING_STATI.confermato;
                    return (
                      <tr key={b.id}>
                        <td>{b.data_ora ? new Date(b.data_ora).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                        <td style={{ fontWeight: 600 }}>{b.nome} {b.cognome}</td>
                        <td>{b.email}</td>
                        <td>{b.nome_club || '-'}</td>
                        <td>{b.sport_tipo || '-'}</td>
                        <td>
                          {b.meet_link ? (
                            <a href={b.meet_link} target="_blank" rel="noopener noreferrer" className="tp-badge tp-badge-success" style={{ textDecoration: 'none', fontSize: 11, padding: '4px 10px' }}>
                              <HiOutlineVideoCamera size={14} /> Meet
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span className="tp-badge" style={{ background: statoInfo.bg, color: statoInfo.color, border: `1px solid ${statoInfo.color}20` }}>
                            {statoInfo.label}
                          </span>
                        </td>
                        <td>
                          {b.stato === 'confermato' && (
                            <div className="tp-table-actions">
                              <button className="tp-btn-icon tp-btn-icon-restore" title="Completato" onClick={() => updateBookingStato(b.id, 'completato')}>
                                <HiOutlineCheck size={16} />
                              </button>
                              <button className="tp-btn-icon tp-btn-icon-delete" title="Annulla" onClick={() => updateBookingStato(b.id, 'annullato')}>
                                <HiOutlineXMark size={16} />
                              </button>
                              <button className="tp-btn-icon tp-btn-icon-archive" title="No Show" onClick={() => updateBookingStato(b.id, 'no_show')}>
                                <HiOutlineClock size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================== EVENT MODAL ==================== */}
      {showEventModal && (
        <div className="cc-modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="cc-modal-header">
              <h3>{editingEvent ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
              <button className="cc-modal-close" onClick={() => setShowEventModal(false)}><HiOutlineXMark size={20} /></button>
            </div>
            <div className="cc-modal-body" style={{ gap: 0 }}>
              {/* Titolo */}
              <div className="tp-form-group" style={{ marginBottom: 16 }}>
                <label className="tp-form-label">Titolo <span className="required">*</span></label>
                <input className="tp-form-input" type="text" value={eventForm.titolo}
                  onChange={e => setEventForm(p => ({ ...p, titolo: e.target.value }))}
                  placeholder="Titolo evento" />
              </div>

              {/* Tipo */}
              <div className="tp-form-group" style={{ marginBottom: 16 }}>
                <label className="tp-form-label">Tipo</label>
                <select className="tp-form-select" value={eventForm.tipo} onChange={e => {
                  const tipo = e.target.value;
                  const color = TIPO_MAP[tipo]?.color || '#6366F1';
                  setEventForm(p => ({ ...p, tipo, colore: color }));
                }}>
                  {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Date */}
              <div className="tp-form-row tp-form-row-2" style={{ marginBottom: 16 }}>
                <div className="tp-form-group">
                  <label className="tp-form-label">Inizio <span className="required">*</span></label>
                  <input className="tp-form-input" type="datetime-local" value={eventForm.data_inizio}
                    onChange={e => setEventForm(p => ({ ...p, data_inizio: e.target.value }))} />
                </div>
                <div className="tp-form-group">
                  <label className="tp-form-label">Fine <span className="required">*</span></label>
                  <input className="tp-form-input" type="datetime-local" value={eventForm.data_fine}
                    onChange={e => setEventForm(p => ({ ...p, data_fine: e.target.value }))} />
                </div>
              </div>

              {/* Tutto il giorno */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input type="checkbox" id="tutto-giorno" checked={eventForm.tutto_il_giorno}
                  onChange={e => setEventForm(p => ({ ...p, tutto_il_giorno: e.target.checked }))}
                  style={{ accentColor: '#111827' }} />
                <label htmlFor="tutto-giorno" style={{ fontSize: 14, color: '#374151', cursor: 'pointer' }}>Tutto il giorno</label>
              </div>

              {/* Google Meet toggle */}
              {googleStatus.connected && !eventForm.meet_link && (
                <div
                  onClick={() => setEventForm(p => ({ ...p, genera_meet: !p.genera_meet }))}
                  className="tp-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', marginBottom: 16, cursor: 'pointer',
                    borderColor: eventForm.genera_meet ? '#6366F1' : undefined,
                    background: eventForm.genera_meet ? '#EEF2FF' : undefined
                  }}
                >
                  {eventForm.genera_meet
                    ? <HiOutlineVideoCamera size={18} style={{ color: '#6366F1' }} />
                    : <HiOutlineVideoCameraSlash size={18} style={{ color: '#9CA3AF' }} />
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, color: eventForm.genera_meet ? '#6366F1' : '#6B7280' }}>
                    Google Meet
                  </span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
                    {eventForm.genera_meet ? 'Link generato automaticamente' : 'Nessun link Meet'}
                  </span>
                </div>
              )}

              {/* Meet Link esistente (in edit) */}
              {eventForm.meet_link && (
                <div className="tp-card" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', marginBottom: 16,
                  borderColor: '#6366F1', background: '#EEF2FF'
                }}>
                  <HiOutlineVideoCamera size={18} style={{ color: '#6366F1' }} />
                  <a href={eventForm.meet_link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>
                    Apri Google Meet
                  </a>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(eventForm.meet_link).then(() => showToast('Link Meet copiato!'));
                  }}
                    className="tp-btn tp-btn-sm tp-btn-outline"
                    style={{ marginLeft: 'auto' }}>
                    Copia link
                  </button>
                </div>
              )}

              {/* Colore */}
              <div className="tp-form-group" style={{ marginBottom: 16 }}>
                <label className="tp-form-label">Colore</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setEventForm(p => ({ ...p, colore: c }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c,
                        border: eventForm.colore === c ? '3px solid #1F2937' : '2px solid #E5E7EB',
                        cursor: 'pointer', padding: 0
                      }} />
                  ))}
                </div>
              </div>

              {/* Descrizione */}
              <div className="tp-form-group" style={{ marginBottom: 16 }}>
                <label className="tp-form-label">Descrizione</label>
                <textarea className="tp-form-textarea" value={eventForm.descrizione}
                  onChange={e => setEventForm(p => ({ ...p, descrizione: e.target.value }))}
                  rows={3} placeholder="Note o descrizione..." />
              </div>

              {/* Note */}
              <div className="tp-form-group">
                <label className="tp-form-label">Note interne</label>
                <textarea className="tp-form-textarea" value={eventForm.note}
                  onChange={e => setEventForm(p => ({ ...p, note: e.target.value }))}
                  rows={2} placeholder="Note interne..." style={{ minHeight: 60 }} />
              </div>
            </div>

            <div className="cc-modal-footer">
              {editingEvent && (
                <button onClick={deleteEvent} className="tp-btn tp-btn-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', marginRight: 'auto' }}>
                  <HiOutlineTrash size={16} /> Elimina
                </button>
              )}
              <button onClick={() => setShowEventModal(false)} className="tp-btn tp-btn-sm tp-btn-outline">
                Annulla
              </button>
              <button onClick={saveEvent} className="tp-btn tp-btn-sm tp-btn-primary">
                {editingEvent ? 'Salva' : 'Crea Evento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== AVAILABILITY MODAL ==================== */}
      {showAvailModal && (
        <div className="cc-modal-overlay" onClick={() => setShowAvailModal(false)}>
          <div className="cc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="cc-modal-header">
              <h3>Gestisci Disponibilita</h3>
              <button className="cc-modal-close" onClick={() => setShowAvailModal(false)}><HiOutlineXMark size={20} /></button>
            </div>
            <div className="cc-modal-body" style={{ gap: 0 }}>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Imposta le fasce orarie in cui sei disponibile per le demo. I prospect potranno prenotare solo negli slot attivi.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {GIORNI.map((giorno, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120, cursor: 'pointer' }}>
                      <input type="checkbox" checked={availForm[i].attivo}
                        onChange={e => {
                          const nf = [...availForm];
                          nf[i] = { ...nf[i], attivo: e.target.checked };
                          setAvailForm(nf);
                        }}
                        style={{ accentColor: '#111827' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{giorno}</span>
                    </label>
                    {availForm[i].attivo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input className="tp-form-input" type="time" value={availForm[i].ora_inizio}
                          onChange={e => {
                            const nf = [...availForm];
                            nf[i] = { ...nf[i], ora_inizio: e.target.value };
                            setAvailForm(nf);
                          }}
                          style={{ width: 'auto', height: 36 }} />
                        <span style={{ color: '#6B7280' }}>-</span>
                        <input className="tp-form-input" type="time" value={availForm[i].ora_fine}
                          onChange={e => {
                            const nf = [...availForm];
                            nf[i] = { ...nf[i], ora_fine: e.target.value };
                            setAvailForm(nf);
                          }}
                          style={{ width: 'auto', height: 36 }} />
                      </div>
                    )}
                    {!availForm[i].attivo && (
                      <span style={{ fontSize: 13, color: '#9CA3AF' }}>Non disponibile</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="cc-modal-footer">
              <button onClick={() => setShowAvailModal(false)} className="tp-btn tp-btn-sm tp-btn-outline">
                Annulla
              </button>
              <button onClick={saveAvailability} className="tp-btn tp-btn-sm tp-btn-primary">
                Salva Disponibilita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCalendar;
