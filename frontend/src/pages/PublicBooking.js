import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../static/logo/logo_nobg2.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const GIORNI_CORTI = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

function PublicBooking() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({ nome_azienda: 'Pitch Partner', durata_demo: 30 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', cognome: '', email: '', telefono: '',
    nome_club: '', sport_tipo: '', messaggio: ''
  });

  // Fetch config
  useEffect(() => {
    axios.get(`${API_URL}/booking/config`).then(r => setConfig(r.data)).catch(() => {});
  }, []);

  // Fetch available dates when month changes
  useEffect(() => {
    fetchAvailableDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const fetchAvailableDates = async () => {
    setLoadingDates(true);
    try {
      const y = currentMonth.getFullYear();
      const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const res = await axios.get(`${API_URL}/booking/available-dates?month=${y}-${m}`);
      setAvailableDates(res.data.dates || []);
    } catch (e) {
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchSlots = async (dateStr) => {
    setLoadingSlots(true);
    try {
      const res = await axios.get(`${API_URL}/booking/slots?date=${dateStr}`);
      setSlots(res.data.slots || []);
    } catch (e) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    fetchSlots(dateStr);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot.ora);
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.cognome || !formData.email) return;

    setSubmitting(true);
    try {
      const data_ora = `${selectedDate}T${selectedSlot}:00`;
      const res = await axios.post(`${API_URL}/booking/reserve`, {
        ...formData,
        data_ora
      });
      setBooking(res.data.booking);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.error || 'Errore nella prenotazione';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!booking?.token) return;
    if (!window.confirm('Sei sicuro di voler annullare la prenotazione?')) return;
    try {
      await axios.put(`${API_URL}/booking/${booking.token}/cancel`);
      setBooking(prev => ({ ...prev, stato: 'annullato' }));
    } catch (e) {
      alert('Errore nell\'annullamento');
    }
  };

  // ==================== CALENDAR HELPERS ====================

  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7; // 0=Mon
    const daysInMonth = lastDay.getDate();

    const days = [];
    // Empty cells before first day
    for (let i = 0; i < startWeekday; i++) days.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, available: availableDates.includes(dateStr) });
    }
    return days;
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];
    return `${dayNames[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
  };

  // ==================== STYLES ====================

  const containerStyle = {
    minHeight: '100vh',
    background: '#1A1A1A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '40px',
    maxWidth: 560,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
    display: 'block'
  };

  // ==================== RENDER ====================

  return (
    <div style={containerStyle}>
      {/* Logo */}
      <img src={logo} alt="Pitch Partner" style={{ height: 50, marginBottom: 32, filter: 'brightness(0) invert(1)' }} />

      {/* Step 1 - Select Date */}
      {step === 1 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
            Prenota una Demo di {config.durata_demo} minuti
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
            {config.descrizione}
          </p>

          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280', padding: 8 }}>
              &#8249;
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              {MESI[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280', padding: 8 }}>
              &#8250;
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {GIORNI_CORTI.map(g => (
              <div key={g} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9CA3AF', padding: '8px 0' }}>
                {g}
              </div>
            ))}
          </div>

          {loadingDates ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Caricamento...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {getDaysInMonth(currentMonth).map((d, i) => {
                if (!d) return <div key={`e-${i}`} />;
                const isAvailable = d.available;
                const isToday = d.dateStr === new Date().toISOString().slice(0, 10);
                return (
                  <button key={d.dateStr} onClick={() => isAvailable && handleDateSelect(d.dateStr)}
                    disabled={!isAvailable}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      border: isToday ? '2px solid #1A1A1A' : 'none',
                      background: isAvailable ? '#85FF00' : 'transparent',
                      color: isAvailable ? '#1A1A1A' : '#D1D5DB',
                      fontWeight: isAvailable ? 700 : 400,
                      fontSize: 14,
                      cursor: isAvailable ? 'pointer' : 'default',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => isAvailable && (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    {d.day}
                  </button>
                );
              })}
            </div>
          )}

          {availableDates.length === 0 && !loadingDates && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 16 }}>
              Nessuna disponibilita in questo mese. Prova il mese successivo.
            </p>
          )}
        </div>
      )}

      {/* Step 2 - Select Time */}
      {step === 2 && (
        <div style={cardStyle}>
          <button onClick={() => { setStep(1); setSelectedDate(null); }}
            style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
            &#8592; Torna al calendario
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
            {formatDateLong(selectedDate)}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
            Seleziona un orario disponibile
          </p>

          {loadingSlots ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Caricamento slot...</div>
          ) : slots.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 40 }}>
              Nessuno slot disponibile per questa data.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {slots.map(slot => (
                <button key={slot.ora} onClick={() => handleSlotSelect(slot)}
                  style={{
                    padding: '14px 0',
                    borderRadius: 10,
                    border: '2px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#1F2937',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#85FF00'; e.currentTarget.style.background = '#F0FFE0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#FFFFFF'; }}>
                  {slot.ora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 - Form */}
      {step === 3 && (
        <div style={cardStyle}>
          <button onClick={() => setStep(2)}
            style={{ background: 'none', border: 'none', color: '#6366F1', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 12 }}>
            &#8592; Cambia orario
          </button>

          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: 24, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
              Demo di {config.durata_demo} minuti
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              {formatDateLong(selectedDate)}, {selectedSlot} - {(() => {
                const [h, m] = selectedSlot.split(':').map(Number);
                const endMin = h * 60 + m + config.durata_demo;
                return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
              })()}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nome *</label>
                  <input type="text" required value={formData.nome}
                    onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))}
                    style={inputStyle} placeholder="Mario" />
                </div>
                <div>
                  <label style={labelStyle}>Cognome *</label>
                  <input type="text" required value={formData.cognome}
                    onChange={e => setFormData(p => ({ ...p, cognome: e.target.value }))}
                    style={inputStyle} placeholder="Rossi" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" required value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle} placeholder="mario@email.com" />
              </div>

              <div>
                <label style={labelStyle}>Telefono</label>
                <input type="tel" value={formData.telefono}
                  onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
                  style={inputStyle} placeholder="+39 333 1234567" />
              </div>

              <div>
                <label style={labelStyle}>Societa / Club</label>
                <input type="text" value={formData.nome_club}
                  onChange={e => setFormData(p => ({ ...p, nome_club: e.target.value }))}
                  style={inputStyle} placeholder="Nome della tua societa sportiva" />
              </div>

              <div>
                <label style={labelStyle}>Sport</label>
                <input type="text" value={formData.sport_tipo}
                  onChange={e => setFormData(p => ({ ...p, sport_tipo: e.target.value }))}
                  style={inputStyle} placeholder="es. Calcio, Basket, Volley..." />
              </div>

              <div>
                <label style={labelStyle}>Messaggio</label>
                <textarea value={formData.messaggio}
                  onChange={e => setFormData(p => ({ ...p, messaggio: e.target.value }))}
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Raccontaci le tue esigenze..." />
              </div>

              <button type="submit" disabled={submitting}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10,
                  border: 'none', background: '#85FF00', color: '#1A1A1A',
                  fontSize: 16, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1, marginTop: 8
                }}>
                {submitting ? 'Prenotazione in corso...' : 'Conferma Prenotazione'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4 - Confirmation */}
      {step === 4 && booking && (
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            {booking.stato === 'annullato' ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>&#10060;</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#DC2626', marginBottom: 12 }}>
                  Prenotazione Annullata
                </h2>
              </>
            ) : (
              <>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#85FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>
                  &#10003;
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
                  Prenotazione Confermata!
                </h2>
              </>
            )}

            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '20px', margin: '20px 0', border: '1px solid #E5E7EB', textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>
                Demo di {booking.durata} minuti
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                {booking.data_ora ? formatDateLong(booking.data_ora.slice(0, 10)) : ''}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                {booking.data_ora ? booking.data_ora.slice(11, 16) : ''} - {booking.data_fine ? booking.data_fine.slice(11, 16) : ''}
              </div>
            </div>

            {booking.stato !== 'annullato' && (
              <>
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
                  Riceverai un'email di conferma a: <strong>{booking.email}</strong>
                </p>
                <button onClick={handleCancel}
                  style={{
                    padding: '10px 24px', borderRadius: 8,
                    border: '1px solid #EF4444', background: '#FEF2F2',
                    color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}>
                  Annulla prenotazione
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 32 }}>
        Powered by Pitch Partner
      </p>
    </div>
  );
}

export default PublicBooking;
