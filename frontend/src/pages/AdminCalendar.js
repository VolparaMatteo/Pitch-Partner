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
  HiOutlineClipboardDocument
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
  const [stats, setStats] = useState({});
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
    colore: '#6366F1', lead_id: null, club_id: null, note: ''
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/calendar/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error('Fetch stats error:', e); }
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
    await Promise.all([fetchEvents(), fetchBookings(), fetchStats(), fetchGoogleStatus(), fetchAvailability()]);
    setLoading(false);
  }, [fetchEvents, fetchBookings, fetchStats, fetchGoogleStatus, fetchAvailability]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchEvents(); }, [currentDate, fetchEvents]);

  // Auto-refresh 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
      fetchStats();
      fetchBookings();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchStats, fetchBookings]);

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
      lead_id: null, club_id: null, note: ''
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
      note: e.note || ''
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
        fetchStats();
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
        fetchStats();
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
        fetchStats();
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
          <button className="tp-btn tp-btn-sm" onClick={() => { setEditingEvent(null); setEventForm({ titolo: '', descrizione: '', tipo: 'appuntamento', data_inizio: '', data_fine: '', tutto_il_giorno: false, colore: '#6366F1', lead_id: null, club_id: null, note: '' }); setShowEventModal(true); }}
            style={{ background: '#6366F1', color: '#fff', border: 'none' }}>
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

      {/* Stats */}
      <div className="cc-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="cc-stat-card">
          <div className="cc-stat-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
            <HiOutlineCalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Oggi</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.appuntamenti_oggi || 0}</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
            <HiOutlineClock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Demo Settimana</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.demo_settimana || 0}</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <HiOutlineCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Bookings Pendenti</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.bookings_pendenti || 0}</div>
          </div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}>
            <HiOutlineCalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Prossimo</div>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
              {stats.prossimo_evento?.titolo || 'Nessuno'}
            </div>
          </div>
        </div>
      </div>

      {/* Google Calendar */}
      {googleStatus.configured && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 16px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Google Calendar:</span>
          {googleStatus.connected ? (
            <>
              <span className="tp-badge tp-badge-success" style={{ fontSize: 12 }}>Connesso</span>
              <button className="tp-btn tp-btn-sm tp-btn-outline" onClick={syncGoogle} style={{ marginLeft: 'auto' }}>
                <HiOutlineArrowPath size={14} /> Sync
              </button>
              <button className="tp-btn tp-btn-sm" onClick={disconnectGoogle}
                style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', fontSize: 12 }}>
                Disconnetti
              </button>
            </>
          ) : (
            <button className="tp-btn tp-btn-sm" onClick={connectGoogle}
              style={{ background: '#4285F4', color: '#fff', border: 'none', fontSize: 12 }}>
              Connetti Google Calendar
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TIPO_OPTIONS.map(t => (
          <button key={t.value} onClick={() => toggleFilter(t.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, border: '1px solid #E5E7EB',
              background: activeFilters.has(t.value) ? `${t.color}15` : '#F9FAFB',
              color: activeFilters.has(t.value) ? t.color : '#9CA3AF',
              fontSize: 13, fontWeight: 500, cursor: 'pointer'
            }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeFilters.has(t.value) ? t.color : '#D1D5DB' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
        {[
          { id: 'calendario', label: 'Calendario' },
          { id: 'bookings', label: `Prenotazioni Demo (${bookings.filter(b => b.stato === 'confermato').length})` }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
              color: activeTab === tab.id ? '#6366F1' : '#6B7280',
              marginBottom: -2
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendario' && (
        <div className="cc-calendar-wrapper">
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
          <div className="tp-card-body" style={{ padding: 0 }}>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                Nessuna prenotazione demo
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['Data/Ora', 'Nome', 'Email', 'Club', 'Sport', 'Stato', 'Azioni'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const statoInfo = BOOKING_STATI[b.stato] || BOOKING_STATI.confermato;
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>
                          {b.data_ora ? new Date(b.data_ora).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{b.nome} {b.cognome}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.email}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.nome_club || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.sport_tipo || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: statoInfo.bg, color: statoInfo.color
                          }}>
                            {statoInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {b.stato === 'confermato' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => updateBookingStato(b.id, 'completato')}
                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #10B981', background: '#ECFDF5', color: '#10B981', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                Completato
                              </button>
                              <button onClick={() => updateBookingStato(b.id, 'annullato')}
                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #EF4444', background: '#FEF2F2', color: '#EF4444', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                Annulla
                              </button>
                              <button onClick={() => updateBookingStato(b.id, 'no_show')}
                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #F59E0B', background: '#FFFBEB', color: '#F59E0B', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                                No Show
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
            <div className="cc-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Titolo */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Titolo *</label>
                  <input type="text" value={eventForm.titolo} onChange={e => setEventForm(p => ({ ...p, titolo: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }}
                    placeholder="Titolo evento" />
                </div>

                {/* Tipo */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Tipo</label>
                  <select value={eventForm.tipo} onChange={e => {
                    const tipo = e.target.value;
                    const color = TIPO_MAP[tipo]?.color || '#6366F1';
                    setEventForm(p => ({ ...p, tipo, colore: color }));
                  }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }}>
                    {TIPO_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Inizio *</label>
                    <input type="datetime-local" value={eventForm.data_inizio}
                      onChange={e => setEventForm(p => ({ ...p, data_inizio: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Fine *</label>
                    <input type="datetime-local" value={eventForm.data_fine}
                      onChange={e => setEventForm(p => ({ ...p, data_fine: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14 }} />
                  </div>
                </div>

                {/* Tutto il giorno */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={eventForm.tutto_il_giorno}
                    onChange={e => setEventForm(p => ({ ...p, tutto_il_giorno: e.target.checked }))} />
                  Tutto il giorno
                </label>

                {/* Colore */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Colore</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} onClick={() => setEventForm(p => ({ ...p, colore: c }))}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', background: c, border: eventForm.colore === c ? '3px solid #1F2937' : '2px solid #E5E7EB',
                          cursor: 'pointer'
                        }} />
                    ))}
                  </div>
                </div>

                {/* Descrizione */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Descrizione</label>
                  <textarea value={eventForm.descrizione} onChange={e => setEventForm(p => ({ ...p, descrizione: e.target.value }))}
                    rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, resize: 'vertical' }}
                    placeholder="Note o descrizione..." />
                </div>

                {/* Note */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Note interne</label>
                  <textarea value={eventForm.note} onChange={e => setEventForm(p => ({ ...p, note: e.target.value }))}
                    rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, resize: 'vertical' }}
                    placeholder="Note interne..." />
                </div>
              </div>
            </div>

            <div className="cc-modal-footer">
              {editingEvent && (
                <button onClick={deleteEvent} style={{
                  padding: '10px 16px', borderRadius: 8, border: '1px solid #EF4444',
                  background: '#FEF2F2', color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginRight: 'auto'
                }}>
                  <HiOutlineTrash size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Elimina
                </button>
              )}
              <button onClick={() => setShowEventModal(false)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 14, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={saveEvent}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
            <div className="cc-modal-body">
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Imposta le fasce orarie in cui sei disponibile per le demo. I prospect potranno prenotare solo negli slot attivi.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GIORNI.map((giorno, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120, fontSize: 13, fontWeight: 600 }}>
                      <input type="checkbox" checked={availForm[i].attivo}
                        onChange={e => {
                          const nf = [...availForm];
                          nf[i] = { ...nf[i], attivo: e.target.checked };
                          setAvailForm(nf);
                        }} />
                      {giorno}
                    </label>
                    {availForm[i].attivo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="time" value={availForm[i].ora_inizio}
                          onChange={e => {
                            const nf = [...availForm];
                            nf[i] = { ...nf[i], ora_inizio: e.target.value };
                            setAvailForm(nf);
                          }}
                          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }} />
                        <span style={{ color: '#6B7280' }}>-</span>
                        <input type="time" value={availForm[i].ora_fine}
                          onChange={e => {
                            const nf = [...availForm];
                            nf[i] = { ...nf[i], ora_fine: e.target.value };
                            setAvailForm(nf);
                          }}
                          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }} />
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
              <button onClick={() => setShowAvailModal(false)}
                style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 14, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={saveAvailability}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6366F1', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
