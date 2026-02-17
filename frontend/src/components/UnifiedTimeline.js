import { useState, useEffect, useRef } from 'react';
import {
  FaPhone, FaEnvelope, FaCalendarAlt, FaStickyNote, FaEllipsisH,
  FaFileInvoice, FaFileContract, FaCrown, FaExchangeAlt,
  FaUserTie, FaPause, FaPlay, FaRocket, FaHandshake,
  FaChevronDown, FaChevronUp, FaFilter, FaStar, FaFileAlt,
  FaCheck, FaTimes, FaWhatsapp
} from 'react-icons/fa';

// Event type configuration
const EVENT_CONFIG = {
  // Activities
  chiamata: { icon: <FaPhone />, label: 'Chiamata', color: '#3B82F6', bg: '#EFF6FF', category: 'activity' },
  email: { icon: <FaEnvelope />, label: 'Email', color: '#8B5CF6', bg: '#F5F3FF', category: 'activity' },
  meeting: { icon: <FaCalendarAlt />, label: 'Meeting', color: '#F59E0B', bg: '#FFFBEB', category: 'activity' },
  nota: { icon: <FaStickyNote />, label: 'Nota', color: '#6B7280', bg: '#F3F4F6', category: 'activity' },
  supporto: { icon: <FaUserTie />, label: 'Supporto', color: '#10B981', bg: '#ECFDF5', category: 'activity' },
  demo: { icon: <FaRocket />, label: 'Demo', color: '#EC4899', bg: '#FDF2F8', category: 'activity' },
  proposta: { icon: <FaFileAlt />, label: 'Proposta', color: '#3B82F6', bg: '#EFF6FF', category: 'activity' },
  altro: { icon: <FaEllipsisH />, label: 'Altro', color: '#9CA3AF', bg: '#F9FAFB', category: 'activity' },
  // Special activity types
  stage_change: { icon: <FaExchangeAlt />, label: 'Cambio Stage', color: '#6366F1', bg: '#EEF2FF', category: 'activity' },
  follow_up: { icon: <FaCalendarAlt />, label: 'Follow-up', color: '#F59E0B', bg: '#FFFBEB', category: 'activity' },
  task: { icon: <FaCheck />, label: 'Task', color: '#10B981', bg: '#ECFDF5', category: 'activity' },
  proposal_sent: { icon: <FaFileAlt />, label: 'Proposta Inviata', color: '#3B82F6', bg: '#EFF6FF', category: 'activity' },
  call: { icon: <FaPhone />, label: 'Chiamata', color: '#3B82F6', bg: '#EFF6FF', category: 'activity' },
  note: { icon: <FaStickyNote />, label: 'Nota', color: '#6B7280', bg: '#F3F4F6', category: 'activity' },
  // Invoices
  invoice: { icon: <FaFileInvoice />, label: 'Fattura', color: '#059669', bg: '#ECFDF5', category: 'invoice' },
  // Contracts
  contract: { icon: <FaFileContract />, label: 'Contratto', color: '#7C3AED', bg: '#F5F3FF', category: 'contract' },
  // Subscription events
  subscription: { icon: <FaCrown />, label: 'Abbonamento', color: '#F59E0B', bg: '#FFFBEB', category: 'subscription' },
  // Emails from conversation
  email_inbound: { icon: <FaEnvelope />, label: 'Email Ricevuta', color: '#6B7280', bg: '#F3F4F6', category: 'email' },
  email_outbound: { icon: <FaEnvelope />, label: 'Email Inviata', color: '#4F46E5', bg: '#EEF2FF', category: 'email' },
  // WhatsApp messages
  wa_inbound: { icon: <FaWhatsapp />, label: 'WhatsApp Ricevuto', color: '#25D366', bg: '#F0FFF4', category: 'whatsapp' },
  wa_outbound: { icon: <FaWhatsapp />, label: 'WhatsApp Inviato', color: '#25D366', bg: '#F0FFF4', category: 'whatsapp' },
};

const ESITO_BADGE = {
  positivo: { label: 'Positivo', bg: '#D1FAE5', color: '#059669' },
  negativo: { label: 'Negativo', bg: '#FEE2E2', color: '#DC2626' },
  neutro: { label: 'Neutro', bg: '#F3F4F6', color: '#6B7280' },
  da_seguire: { label: 'Da seguire', bg: '#FEF3C7', color: '#D97706' },
  no_risposta: { label: 'No risposta', bg: '#FEF3C7', color: '#D97706' },
};

const INVOICE_STATUS = {
  draft: { label: 'Bozza', color: '#6B7280' },
  pending: { label: 'In attesa', color: '#F59E0B' },
  sent: { label: 'Inviata', color: '#3B82F6' },
  paid: { label: 'Pagata', color: '#059669' },
  overdue: { label: 'Scaduta', color: '#DC2626' },
  cancelled: { label: 'Annullata', color: '#6B7280' },
};

const SUB_EVENT_LABELS = {
  created: 'Abbonamento creato',
  activated: 'Abbonamento attivato',
  renewed: 'Abbonamento rinnovato',
  upgraded: 'Piano aggiornato',
  downgraded: 'Piano declassato',
  cancelled: 'Abbonamento cancellato',
  expired: 'Abbonamento scaduto',
  reactivated: 'Abbonamento riattivato',
  payment_failed: 'Pagamento fallito',
  payment_success: 'Pagamento riuscito',
  trial_started: 'Prova iniziata',
  trial_ended: 'Prova terminata',
  suspended: 'Abbonamento sospeso',
};

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tutto' },
  { id: 'activity', label: 'Attivita' },
  { id: 'email', label: 'Email' },
  { id: 'invoice', label: 'Fatture' },
  { id: 'contract', label: 'Contratti' },
  { id: 'subscription', label: 'Abbonamento' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

function UnifiedTimeline({ activities = [], invoices = [], contracts = [], subscriptionEvents = [], emails = [], whatsappMessages = [] }) {
  const [timelineItems, setTimelineItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const timelineRef = useRef(null);

  useEffect(() => {
    const items = [];

    // 1. Activities
    activities.forEach(a => {
      const tipo = a.tipo || 'altro';
      items.push({
        id: `act-${a.id}`,
        type: tipo,
        category: 'activity',
        date: a.created_at || a.data_schedulata,
        title: a.titolo || (EVENT_CONFIG[tipo]?.label || 'Attivita'),
        description: a.descrizione || '',
        esito: a.esito,
        extra: {
          durata: a.durata_minuti,
          old_stage: a.old_stage,
          new_stage: a.new_stage,
          completata: a.completata,
          created_by: a.created_by,
        }
      });
    });

    // 2. Invoices
    invoices.forEach(inv => {
      items.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        category: 'invoice',
        date: inv.issue_date || inv.created_at,
        title: `Fattura ${inv.invoice_number || '#' + inv.id}`,
        description: inv.notes || (inv.line_items?.map(li => li.description).join(', ')) || '',
        extra: {
          status: inv.status,
          total_amount: inv.total_amount,
          due_date: inv.due_date,
          payment_date: inv.payment_date,
        }
      });
    });

    // 3. Contracts
    contracts.forEach(c => {
      items.push({
        id: `ctr-${c.id}`,
        type: 'contract',
        category: 'contract',
        date: c.signed_date || c.start_date || c.created_at,
        title: `Contratto ${c.plan_type?.charAt(0).toUpperCase() + c.plan_type?.slice(1) || ''} ${c.status === 'active' ? '(Attivo)' : ''}`,
        description: c.notes || '',
        extra: {
          plan_type: c.plan_type,
          total_value: c.total_value,
          status: c.status,
          start_date: c.start_date,
          end_date: c.end_date,
          addons: c.addons,
        }
      });
    });

    // 4. Subscription events
    subscriptionEvents.forEach(ev => {
      items.push({
        id: `sub-${ev.id}`,
        type: 'subscription',
        category: 'subscription',
        date: ev.created_at,
        title: SUB_EVENT_LABELS[ev.evento] || ev.evento,
        description: ev.note || '',
        extra: {
          evento: ev.evento,
          old_price: ev.old_price,
          new_price: ev.new_price,
          triggered_by: ev.triggered_by,
        }
      });
    });

    // 5. Emails from conversation
    emails.forEach(em => {
      const isOutbound = em.direction === 'outbound';
      items.push({
        id: `em-${em.account_key}-${em.uid}-${em.folder}`,
        type: isOutbound ? 'email_outbound' : 'email_inbound',
        category: 'email',
        date: em.date,
        title: em.subject || '(senza oggetto)',
        description: isOutbound
          ? `Inviata da ${em.from_email} a ${em.to}`
          : `Ricevuta da ${em.from_name || em.from_email}`,
        extra: {
          from_email: em.from_email,
          from_name: em.from_name,
          to: em.to,
          account_key: em.account_key,
          direction: em.direction,
        }
      });
    });

    // 6. WhatsApp messages
    whatsappMessages.forEach(msg => {
      items.push({
        id: `wa-${msg.id}`,
        type: msg.fromMe ? 'wa_outbound' : 'wa_inbound',
        category: 'whatsapp',
        date: new Date(msg.timestamp * 1000),
        title: msg.body || (msg.hasMedia ? '(media)' : '(messaggio)'),
        description: msg.fromMe ? 'Inviato via WhatsApp' : 'Ricevuto via WhatsApp',
      });
    });

    // Sort by date (newest first)
    items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    setTimelineItems(items);
  }, [activities, invoices, contracts, subscriptionEvents, emails, whatsappMessages]);

  const filteredItems = filter === 'all'
    ? timelineItems
    : timelineItems.filter(item => item.category === filter);

  const visibleItems = filteredItems.slice(0, visibleCount);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '';
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Group items by date for date separators
  const getDateGroup = (dateStr) => {
    if (!dateStr) return 'Senza data';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Oggi';
      if (diffDays === 1) return 'Ieri';
      if (diffDays < 7) return `${diffDays} giorni fa`;
      return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'Senza data'; }
  };

  // Category counts for filter badges
  const categoryCounts = {};
  timelineItems.forEach(item => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  const renderItemDetail = (item) => {
    const cfg = EVENT_CONFIG[item.type] || EVENT_CONFIG.altro;

    return (
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#4B5563' }}>
        {/* Activity details */}
        {item.category === 'activity' && (
          <>
            {item.extra?.old_stage && item.extra?.new_stage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#F3F4F6', fontWeight: 600 }}>{item.extra.old_stage}</span>
                <span>→</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#DBEAFE', fontWeight: 600, color: '#1E40AF' }}>{item.extra.new_stage}</span>
              </div>
            )}
            {item.extra?.durata && <div>Durata: {item.extra.durata} min</div>}
            {item.extra?.created_by && <div>Creata da: {item.extra.created_by}</div>}
          </>
        )}

        {/* Invoice details */}
        {item.category === 'invoice' && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {item.extra?.total_amount != null && (
              <div><strong>Importo:</strong> {formatCurrency(item.extra.total_amount)}</div>
            )}
            {item.extra?.status && (
              <div>
                <strong>Stato:</strong>{' '}
                <span style={{ color: INVOICE_STATUS[item.extra.status]?.color || '#6B7280', fontWeight: 600 }}>
                  {INVOICE_STATUS[item.extra.status]?.label || item.extra.status}
                </span>
              </div>
            )}
            {item.extra?.due_date && <div><strong>Scadenza:</strong> {new Date(item.extra.due_date).toLocaleDateString('it-IT')}</div>}
            {item.extra?.payment_date && <div><strong>Pagata il:</strong> {new Date(item.extra.payment_date).toLocaleDateString('it-IT')}</div>}
          </div>
        )}

        {/* Contract details */}
        {item.category === 'contract' && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {item.extra?.total_value != null && (
              <div><strong>Valore:</strong> {formatCurrency(item.extra.total_value)}/anno</div>
            )}
            {item.extra?.start_date && <div><strong>Inizio:</strong> {new Date(item.extra.start_date).toLocaleDateString('it-IT')}</div>}
            {item.extra?.end_date && <div><strong>Fine:</strong> {new Date(item.extra.end_date).toLocaleDateString('it-IT')}</div>}
            {item.extra?.addons?.length > 0 && (
              <div><strong>Add-on:</strong> {item.extra.addons.map(a => a.name).join(', ')}</div>
            )}
          </div>
        )}

        {/* Subscription event details */}
        {item.category === 'subscription' && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {item.extra?.old_price != null && item.extra?.new_price != null && (
              <div>{formatCurrency(item.extra.old_price)} → {formatCurrency(item.extra.new_price)}</div>
            )}
            {item.extra?.triggered_by && <div>Scatenato da: {item.extra.triggered_by}</div>}
          </div>
        )}

        {/* Email details */}
        {item.category === 'email' && (
          <div>
            {item.extra?.direction === 'outbound' && item.extra?.account_key && (
              <div>Inviata via: {item.extra.account_key}@pitchpartner.it</div>
            )}
          </div>
        )}
      </div>
    );
  };

  let lastDateGroup = '';

  return (
    <div ref={timelineRef} style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      {/* Filters */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '0', padding: '0 0 12px 0', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0
      }}>
        <FaFilter size={12} style={{ color: '#9CA3AF', marginRight: '4px' }} />
        {CATEGORY_FILTERS.map(f => {
          // Hide filter if no items
          if (f.id !== 'all' && !categoryCounts[f.id]) return null;
          const count = f.id === 'all' ? timelineItems.length : (categoryCounts[f.id] || 0);
          return (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setVisibleCount(50); }}
              style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                border: filter === f.id ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                background: filter === f.id ? '#EEF2FF' : '#FFFFFF',
                color: filter === f.id ? '#4F46E5' : '#6B7280',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {f.label}
              <span style={{
                fontSize: '10px', padding: '1px 5px', borderRadius: '8px',
                background: filter === f.id ? '#C7D2FE' : '#F3F4F6',
                color: filter === f.id ? '#4338CA' : '#9CA3AF'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline (scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <FaStickyNote size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <p style={{ fontSize: '14px' }}>Nessun evento nella timeline</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '11px', top: '0', bottom: '0',
            width: '2px', background: '#E5E7EB'
          }} />

          {visibleItems.map((item, idx) => {
            const cfg = EVENT_CONFIG[item.type] || EVENT_CONFIG.altro;
            const isExpanded = expandedId === item.id;
            const dateGroup = getDateGroup(item.date);
            const showDateSeparator = dateGroup !== lastDateGroup;
            lastDateGroup = dateGroup;

            return (
              <div key={item.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div style={{
                    position: 'relative', marginBottom: '12px', marginTop: idx > 0 ? '16px' : '0'
                  }}>
                    <span style={{
                      position: 'relative', display: 'inline-block',
                      background: '#FFFFFF', padding: '2px 10px',
                      fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      marginLeft: '-4px'
                    }}>
                      {dateGroup}
                    </span>
                  </div>
                )}

                {/* Timeline item */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    position: 'relative', marginBottom: '8px', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: '-24px', top: '8px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: cfg.bg, border: `2px solid ${cfg.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: cfg.color, zIndex: 1
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: isExpanded ? cfg.bg : '#FFFFFF',
                    border: `1px solid ${isExpanded ? cfg.color + '40' : '#F3F4F6'}`,
                    transition: 'all 0.15s ease',
                    marginLeft: '8px'
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, color: cfg.color,
                            textTransform: 'uppercase', letterSpacing: '0.3px'
                          }}>
                            {cfg.label}
                          </span>
                          {item.esito && ESITO_BADGE[item.esito] && (
                            <span style={{
                              fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                              borderRadius: '4px',
                              background: ESITO_BADGE[item.esito].bg,
                              color: ESITO_BADGE[item.esito].color
                            }}>
                              {ESITO_BADGE[item.esito].label}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '13px', fontWeight: 600, color: '#1F2937',
                          marginTop: '2px',
                          whiteSpace: isExpanded ? 'normal' : 'nowrap',
                          overflow: isExpanded ? 'visible' : 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {formatDate(item.date)}
                        </span>
                        {isExpanded ? <FaChevronUp size={10} color="#9CA3AF" /> : <FaChevronDown size={10} color="#D1D5DB" />}
                      </div>
                    </div>

                    {/* Description (always show truncated, full when expanded) */}
                    {item.description && (
                      <div style={{
                        fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: '1.4',
                        whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                        overflow: isExpanded ? 'visible' : 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.description}
                      </div>
                    )}

                    {/* Expanded detail */}
                    {isExpanded && renderItemDetail(item)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {visibleCount < filteredItems.length && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 50)}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
                  background: '#FFFFFF', fontSize: '13px', fontWeight: 600,
                  color: '#4F46E5', cursor: 'pointer'
                }}
              >
                Mostra altri ({filteredItems.length - visibleCount} rimanenti)
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default UnifiedTimeline;
