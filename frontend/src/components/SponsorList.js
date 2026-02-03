function SponsorList({ sponsors, onEdit, onDelete }) {
  if (sponsors.length === 0) {
    return (
      <div style={styles.empty}>
        <p>Nessuno sponsor registrato</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {sponsors.map((sponsor) => (
        <div key={sponsor.id} style={styles.card}>
          <div style={styles.cardHeader}>
            {sponsor.logo_url && (
              <img src={sponsor.logo_url} alt={sponsor.ragione_sociale} style={styles.logo} />
            )}
            <div style={styles.cardTitle}>
              <h3 style={styles.sponsorName}>{sponsor.ragione_sociale}</h3>
              {sponsor.settore_merceologico && (
                <span style={styles.settore}>{sponsor.settore_merceologico}</span>
              )}
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.info}>
              <span style={styles.label}>Email:</span>
              <span>{sponsor.email}</span>
            </div>
            <div style={styles.info}>
              <span style={styles.label}>Telefono:</span>
              <span>{sponsor.telefono || '-'}</span>
            </div>
            {sponsor.sito_web && (
              <div style={styles.info}>
                <span style={styles.label}>Sito:</span>
                <a href={sponsor.sito_web} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {sponsor.sito_web}
                </a>
              </div>
            )}
            <div style={styles.status}>
              <span style={{
                ...styles.badge,
                backgroundColor: sponsor.account_attivo ? '#28a745' : '#dc3545'
              }}>
                {sponsor.account_attivo ? 'Attivo' : 'Disattivo'}
              </span>
            </div>
          </div>

          <div style={styles.cardFooter}>
            <button onClick={() => onEdit(sponsor)} style={styles.editBtn}>
              Modifica
            </button>
            <button onClick={() => onDelete(sponsor.id)} style={styles.deleteBtn}>
              Elimina
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  logo: {
    width: '60px',
    height: '60px',
    objectFit: 'contain',
    borderRadius: '4px'
  },
  cardTitle: {
    flex: 1
  },
  sponsorName: {
    margin: '0 0 5px 0',
    fontSize: '18px',
    color: '#333'
  },
  settore: {
    fontSize: '14px',
    color: '#666'
  },
  cardBody: {
    padding: '20px'
  },
  info: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px'
  },
  label: {
    fontWeight: '500',
    color: '#666'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none'
  },
  status: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
    fontWeight: '500'
  },
  cardFooter: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #eee'
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  }
};

export default SponsorList;
