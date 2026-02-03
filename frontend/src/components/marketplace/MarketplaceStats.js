import { FaBullseye, FaPaperPlane, FaHandshake, FaEdit } from 'react-icons/fa';
import '../../styles/template-style.css';

/**
 * Stats cards per la sezione marketplace
 * Stesso stile delle KPI cards della dashboard (tp-stat-card-dark)
 */
function MarketplaceStats({ stats, userRole = 'club' }) {
  const cards = [
    {
      key: 'opportunities',
      label: 'Opportunità Attive',
      value: stats?.total_opportunities || 0,
      description: 'nel marketplace'
    },
    {
      key: 'applications',
      label: 'Le Tue Candidature',
      value: stats?.my_applications || 0,
      description: 'inviate'
    },
    {
      key: 'collaborations',
      label: 'Collaborazioni',
      value: stats?.active_collaborations || 0,
      description: 'in corso'
    }
  ];

  if (userRole === 'club') {
    cards.push({
      key: 'my_opportunities',
      label: 'Tue Opportunità',
      value: stats?.my_opportunities || 0,
      description: 'pubblicate'
    });
  }

  return (
    <div className="tp-stats-grid" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)` }}>
      {cards.map((card) => (
        <div key={card.key} className="tp-stat-card-dark">
          <div className="tp-stat-label">{card.label}</div>
          <div className="tp-stat-value">{card.value}</div>
          <div className="tp-stat-description">{card.description}</div>
        </div>
      ))}
    </div>
  );
}

export default MarketplaceStats;
