function ClubList({ clubs, onEdit, onDelete }) {
  if (clubs.length === 0) {
    return (
      <div style={styles.empty}>
        <p>Nessun club registrato</p>
      </div>
    );
  }

  return (
    <div style={styles.grid}>
      {clubs.map((club) => (
        <div key={club.id} style={styles.card}>
          <div style={styles.cardHeader}>
            {club.logo_url && (
              <img src={club.logo_url} alt={club.nome} style={styles.logo} />
            )}
            <div style={styles.cardTitle}>
              <h3 style={styles.clubName}>{club.nome}</h3>
              <span style={styles.tipologia}>{club.tipologia}</span>
            </div>
          </div>

          <div style={styles.cardBody}>
            <div style={styles.info}>
              <span style={styles.label}>Email:</span>
              <span>{club.email}</span>
            </div>
            <div style={styles.info}>
              <span style={styles.label}>Telefono:</span>
              <span>{club.telefono || '-'}</span>
            </div>
            {club.nome_abbonamento && (
              <div style={styles.info}>
                <span style={styles.label}>Abbonamento:</span>
                <span>{club.nome_abbonamento} (€{club.costo_abbonamento})</span>
              </div>
            )}
            <div style={styles.info}>
              <span style={styles.label}>Scadenza:</span>
              <span>{club.data_scadenza_licenza ? new Date(club.data_scadenza_licenza).toLocaleDateString('it-IT') : 'Nessuna'}</span>
            </div>
            <div style={styles.status}>
              <span style={{
                ...styles.badge,
                backgroundColor: club.account_attivo ? '#28a745' : '#dc3545'
              }}>
                {club.account_attivo ? 'Attivo' : 'Disattivo'}
              </span>
              <span style={{
                ...styles.badge,
                backgroundColor: club.licenza_valida ? '#28a745' : '#ffc107'
              }}>
                {club.licenza_valida ? 'Licenza OK' : 'Licenza Scaduta'}
              </span>
            </div>
          </div>

          <div style={styles.cardFooter}>
            <button onClick={() => onEdit(club)} style={styles.editBtn}>
              Modifica
            </button>
            <button onClick={() => onDelete(club.id)} style={styles.deleteBtn}>
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
  clubName: {
    margin: '0 0 5px 0',
    fontSize: '18px',
    color: '#333'
  },
  tipologia: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'capitalize'
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

export default ClubList;
