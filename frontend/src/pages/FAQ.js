import React from 'react';
import '../styles/dashboard-new.css';

function FAQ() {
  return (
    <div className="dashboard-new-container">
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        minHeight: '80vh'
      }}>
        <h1 style={{ marginBottom: '24px', fontSize: '32px', fontWeight: 700 }}>
          Domande Frequenti (FAQ)
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Contenuto in arrivo...
        </p>
      </div>
    </div>
  );
}

export default FAQ;
