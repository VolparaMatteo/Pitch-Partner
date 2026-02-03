import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaEye, FaPaperPlane, FaCheck } from 'react-icons/fa';
import '../../styles/marketplace.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

/**
 * Card moderna per opportunità marketplace
 * Stile Pitch Partner
 */
function OpportunityCard({ opportunity, userRole = 'club', variant = 'default', onAction }) {
  const navigate = useNavigate();

  const getTypeLabel = (tipo) => {
    const labels = {
      'evento_speciale': 'Evento',
      'campagna_promozionale': 'Campagna',
      'progetto_csr': 'CSR',
      'co_branding': 'Co-Branding',
      'attivazione_speciale': 'Attivazione',
      'altro': 'Altro'
    };
    return labels[tipo] || tipo;
  };

  const formatBudget = (budget) => {
    if (!budget) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(budget);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return `${Math.floor(diffDays / 30)} mesi fa`;
  };

  const handleClick = () => {
    const basePath = userRole === 'sponsor' ? '/sponsor' : '/club';
    navigate(`${basePath}/marketplace/opportunities/${opportunity.id}`);
  };

  const spotsRemaining = opportunity.spots_remaining ??
    (opportunity.numero_sponsor_cercati || 1) - (opportunity.collaborations_count || 0);

  const isDeadlineUrgent = opportunity.deadline_candidature &&
    new Date(opportunity.deadline_candidature) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="mp-opp-card" onClick={handleClick}>
      {/* Header con tipo e badge */}
      <div className="mp-opp-header">
        <div className="mp-opp-badges">
          <span className="mp-opp-badge type">
            {getTypeLabel(opportunity.tipo_opportunita)}
          </span>
          <span className={`mp-opp-badge ${opportunity.creator_type}`}>
            {opportunity.creator_type === 'club' ? 'Club' : 'Sponsor'}
          </span>
        </div>

        {spotsRemaining > 0 && (
          <span className={`mp-opp-badge ${spotsRemaining <= 2 ? 'status-draft' : ''}`}
            style={{ background: 'var(--tp-gray-100)', color: 'var(--tp-gray-600)' }}>
            {spotsRemaining} {spotsRemaining === 1 ? 'posto' : 'posti'}
          </span>
        )}
      </div>

      {/* Creator info */}
      <div className="mp-opp-creator">
        <div className="mp-opp-creator-logo">
          {opportunity.creator_logo ? (
            <img
              src={opportunity.creator_logo.startsWith('http')
                ? opportunity.creator_logo
                : `${API_URL.replace('/api', '')}${opportunity.creator_logo}`}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span style={{ fontSize: '18px' }}>
              {opportunity.creator_type === 'club' ? '🏆' : '🏢'}
            </span>
          )}
        </div>
        <div>
          <div className="mp-opp-creator-name">{opportunity.creator_name}</div>
          <div className="mp-opp-creator-date">
            {getTimeAgo(opportunity.pubblicata_at || opportunity.created_at)}
          </div>
        </div>
      </div>

      {/* Titolo */}
      <h3 className="mp-opp-title">{opportunity.titolo}</h3>

      {/* Descrizione */}
      <p className="mp-opp-description">{opportunity.descrizione}</p>

      {/* Info */}
      <div className="mp-opp-info">
        {opportunity.location_city && (
          <div className="mp-opp-info-item">
            <FaMapMarkerAlt />
            <span>
              {opportunity.location_city}
              {opportunity.location_province ? `, ${opportunity.location_province}` : ''}
              {opportunity.distance_km !== undefined && opportunity.distance_km !== null && (
                <span style={{ color: 'var(--tp-gray-400)' }}> • {opportunity.distance_km} km</span>
              )}
            </span>
          </div>
        )}

        {opportunity.data_inizio && (
          <div className="mp-opp-info-item">
            <FaCalendarAlt />
            <span>
              {new Date(opportunity.data_inizio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
              {opportunity.data_fine && opportunity.data_fine !== opportunity.data_inizio && (
                <> - {new Date(opportunity.data_fine).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}</>
              )}
            </span>
          </div>
        )}

        {opportunity.deadline_candidature && (
          <div className={`mp-opp-info-item ${isDeadlineUrgent ? 'urgent' : ''}`}>
            <FaClock />
            <span>
              Scadenza: {new Date(opportunity.deadline_candidature).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mp-opp-footer">
        {opportunity.budget_richiesto ? (
          <div className="mp-opp-budget">
            <div className="mp-opp-budget-label">Budget</div>
            <div className="mp-opp-budget-value">{formatBudget(opportunity.budget_richiesto)}</div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--tp-gray-400)' }}>Budget da definire</div>
        )}

        <div className="mp-opp-stats">
          <div className="mp-opp-stat">
            <div className="mp-opp-stat-icon"><FaEye /></div>
            <div className="mp-opp-stat-value">{opportunity.views_count || 0}</div>
          </div>
          <div className="mp-opp-stat">
            <div className="mp-opp-stat-icon"><FaPaperPlane /></div>
            <div className="mp-opp-stat-value">{opportunity.applications_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Has Applied indicator */}
      {opportunity.has_applied && (
        <div style={{
          padding: '10px 20px',
          background: 'var(--tp-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderRadius: '0 0 var(--tp-radius-xl) var(--tp-radius-xl)'
        }}>
          <FaCheck style={{ color: 'var(--tp-success-500)' }} />
          <span style={{ color: 'var(--tp-success-500)', fontSize: '12px', fontWeight: 600 }}>
            Candidatura inviata
          </span>
        </div>
      )}
    </div>
  );
}

export default OpportunityCard;
