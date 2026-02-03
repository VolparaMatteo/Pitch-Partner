import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaCheckCircle, FaRegClock, FaCalendarAlt, FaDownload,
  FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt, FaLinkedin,
  FaChevronDown, FaChevronUp, FaStar, FaShieldAlt, FaHandshake
} from 'react-icons/fa';
import { ProposalAreaRenderer } from '../components/proposal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const PublicProposal = () => {
  const { link } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchProposal();
  }, [link]);

  const fetchProposal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/club/proposals/public/${link}`);
      if (response.ok) {
        const data = await response.json();
        setProposal(data);
      } else if (response.status === 404) {
        setError({ title: 'Proposta non trovata', desc: 'Il link potrebbe essere errato o la proposta è stata rimossa.' });
      } else if (response.status === 410) {
        setError({ title: 'Proposta scaduta', desc: 'Questa proposta non è più valida. Contatta il mittente per una nuova proposta.' });
      } else if (response.status === 403) {
        setError({ title: 'Link non attivo', desc: 'Questa proposta non è ancora stata pubblicata.' });
      } else {
        setError({ title: 'Errore', desc: 'Si è verificato un errore nel caricamento.' });
      }
    } catch (err) {
      console.error('Error:', err);
      setError({ title: 'Errore di connessione', desc: 'Impossibile connettersi al server.' });
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!proposal?.data_scadenza) return null;
    const days = Math.ceil((new Date(proposal.data_scadenza) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const toggleItem = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Loading State
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Caricamento
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '60px 40px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <FaShieldAlt style={{ fontSize: '32px', color: '#EF4444' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            marginBottom: '12px'
          }}>{error.title}</h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '16px',
            lineHeight: 1.6
          }}>{error.desc}</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  // Check for version 2.0 layout
  const layout = proposal.layout_json ? (typeof proposal.layout_json === 'string' ? JSON.parse(proposal.layout_json) : proposal.layout_json) : null;
  const isV2Layout = layout?.version === '2.0' && layout?.areas?.length > 0;

  // Brand settings from club (with fallbacks)
  const brand = proposal.club?.brand || {};
  const primaryColor = brand.colore_primario || proposal.colore_primario || '#1A1A1A';
  const accentColor = brand.colore_secondario || proposal.colore_secondario || '#85FF00';
  const brandFont = brand.font || 'Inter';
  const footerText = brand.footer_text;

  // Build proposalData object for components
  const proposalData = {
    titolo: proposal.titolo,
    sottotitolo: proposal.sottotitolo,
    codice: proposal.codice,
    versione: proposal.versione_corrente || 1,
    destinatario_nome: proposal.destinatario_nome,
    destinatario_azienda: proposal.destinatario_azienda,
    destinatario_ruolo: proposal.destinatario_ruolo,
    destinatario_email: proposal.destinatario_email,
    destinatario_telefono: proposal.destinatario_telefono,
    settore_merceologico: proposal.settore_merceologico,
    messaggio_introduttivo: proposal.messaggio_introduttivo,
    proposta_valore: proposal.proposta_valore,
    items: proposal.items || [],
    valore_totale: proposal.valore_totale,
    sconto_percentuale: proposal.sconto_percentuale,
    sconto_valore: proposal.sconto_valore,
    valore_finale: proposal.valore_finale,
    termini_condizioni: proposal.termini_condizioni,
    data_scadenza: proposal.data_scadenza,
    durata_mesi: proposal.durata_mesi,
    stagioni: proposal.stagioni,
    modalita_pagamento: proposal.modalita_pagamento,
    note_pagamento: proposal.note_pagamento,
    created_at: proposal.created_at
  };

  const clubData = {
    nome: proposal.club?.nome,
    logo_url: proposal.club?.logo_url,
    logo_chiaro: brand.logo_chiaro,
    email: proposal.club?.email,
    telefono: proposal.club?.telefono,
    sito_web: proposal.club?.sito_web,
    indirizzo: proposal.club?.indirizzo
  };

  const globalStyles = layout?.globalStyles || {
    colors: {
      primary: primaryColor,
      secondary: accentColor,
      background: '#FAFAFA',
      text: '#1F2937'
    },
    fonts: {
      heading: brandFont,
      body: brandFont
    }
  };

  // Version 2.0 Layout Rendering
  if (isV2Layout) {
    return (
      <div style={{
        minHeight: '100vh',
        background: globalStyles.colors?.background || '#FAFAFA',
        fontFamily: `'${globalStyles.fonts?.body || brandFont}', -apple-system, BlinkMacSystemFont, sans-serif`
      }}>
        {layout.areas.map((area) => (
          <ProposalAreaRenderer
            key={area.id}
            area={area}
            globalStyles={globalStyles}
            proposalData={proposalData}
            clubData={clubData}
            isPreview={false}
          />
        ))}
      </div>
    );
  }

  // Legacy Layout - Original static rendering
  const headerBackground = brand.sfondo_header;
  const lightLogo = brand.logo_chiaro;
  const daysRemaining = getDaysRemaining();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      fontFamily: `'${brandFont}', -apple-system, BlinkMacSystemFont, sans-serif`
    }}>
      {/* Hero Section */}
      <div style={{
        background: headerBackground
          ? `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%), url(${headerBackground}) center/cover`
          : `linear-gradient(135deg, ${primaryColor} 0%, #000 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 40px 80px',
          position: 'relative'
        }}>
          {/* Club Header */}
          {proposal.club && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '48px'
            }}>
              {(lightLogo || proposal.club.logo_url) && (
                <img
                  src={lightLogo || proposal.club.logo_url}
                  alt={proposal.club.nome}
                  style={{
                    height: '56px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                  }}
                />
              )}
              <div>
                <p style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '12px',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}>Proposta Commerciale</p>
                <p style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 600
                }}>{proposal.club.nome}</p>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}>
            {proposal.titolo}
          </h1>

          {proposal.sottotitolo && (
            <p style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '40px',
              fontWeight: 400
            }}>
              {proposal.sottotitolo}
            </p>
          )}

          {/* Meta Info */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '32px',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'rgba(255,255,255,0.7)'
            }}>
              <FaCalendarAlt />
              <span>Valida fino al {formatDate(proposal.data_scadenza)}</span>
            </div>
            {proposal.durata_mesi && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'rgba(255,255,255,0.7)'
              }}>
                <FaRegClock />
                <span>Durata {proposal.durata_mesi} mesi</span>
              </div>
            )}
            {daysRemaining !== null && daysRemaining <= 14 && (
              <div style={{
                background: daysRemaining <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)',
                color: daysRemaining <= 5 ? '#FCA5A5' : '#FCD34D',
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {daysRemaining === 0 ? 'Scade oggi' : `${daysRemaining} giorni rimanenti`}
              </div>
            )}
          </div>
        </div>

        {/* Curved Bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: '#FAFAFA',
          borderRadius: '40px 40px 0 0'
        }} />
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px 80px'
      }}>
        {/* Value Highlight Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          marginTop: '-20px',
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          position: 'relative',
          zIndex: 10
        }}>
          <div>
            <p style={{
              fontSize: '13px',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
              fontWeight: 600
            }}>Valore Totale</p>
            <p style={{
              fontSize: '42px',
              fontWeight: 800,
              color: primaryColor,
              letterSpacing: '-0.02em'
            }}>
              {formatCurrency(proposal.valore_finale)}
            </p>
            {proposal.sconto_percentuale > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <span style={{
                  textDecoration: 'line-through',
                  color: '#9CA3AF',
                  fontSize: '18px'
                }}>
                  {formatCurrency(proposal.valore_totale)}
                </span>
                <span style={{
                  background: '#DCFCE7',
                  color: '#166534',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 700
                }}>
                  -{proposal.sconto_percentuale}%
                </span>
              </div>
            )}
          </div>

          {proposal.durata_mesi && (
            <div style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: '32px' }}>
              <p style={{
                fontSize: '13px',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
                fontWeight: 600
              }}>Durata Partnership</p>
              <p style={{
                fontSize: '42px',
                fontWeight: 800,
                color: '#1F2937',
                letterSpacing: '-0.02em'
              }}>
                {proposal.durata_mesi}
                <span style={{ fontSize: '20px', fontWeight: 500, color: '#6B7280', marginLeft: '8px' }}>mesi</span>
              </p>
              {proposal.stagioni && (
                <p style={{ color: '#6B7280', marginTop: '4px' }}>Stagione {proposal.stagioni}</p>
              )}
            </div>
          )}

          <div style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: '32px' }}>
            <p style={{
              fontSize: '13px',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
              fontWeight: 600
            }}>Codice Proposta</p>
            <p style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1F2937',
              fontFamily: 'monospace'
            }}>
              {proposal.codice}
            </p>
            <p style={{ color: '#6B7280', marginTop: '4px' }}>
              Versione {proposal.versione_corrente || 1}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Left Column - Main Content */}
          <div>
            {/* Introduction */}
            {proposal.messaggio_introduttivo && (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaHandshake style={{ color: 'white', fontSize: '20px' }} />
                  </div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1F2937'
                  }}>Gentile {proposal.destinatario_nome || 'Partner'},</h2>
                </div>
                <p style={{
                  color: '#4B5563',
                  fontSize: '17px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {proposal.messaggio_introduttivo}
                </p>
              </div>
            )}

            {/* Value Proposition */}
            {proposal.proposta_valore && (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaStar style={{ color: 'white', fontSize: '20px' }} />
                  </div>
                  <h2 style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: '#1F2937'
                  }}>Cosa Include la Partnership</h2>
                </div>
                <p style={{
                  color: '#4B5563',
                  fontSize: '17px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {proposal.proposta_valore}
                </p>
              </div>
            )}

            {/* Items */}
            {proposal.items && proposal.items.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1F2937',
                  marginBottom: '24px'
                }}>Dettaglio Elementi</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {proposal.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        onClick={() => item.descrizione_display && toggleItem(item.id || idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '20px 24px',
                          cursor: item.descrizione_display ? 'pointer' : 'default',
                          background: expandedItems[item.id || idx] ? '#F9FAFB' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}40)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: primaryColor,
                            fontSize: '16px'
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <p style={{
                              fontWeight: 600,
                              color: '#1F2937',
                              fontSize: '16px'
                            }}>{item.nome_display}</p>
                            <p style={{
                              fontSize: '13px',
                              color: '#6B7280',
                              marginTop: '2px'
                            }}>
                              {item.gruppo || 'Asset'} {item.quantita > 1 && `• Quantità: ${item.quantita}`}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <p style={{
                            fontWeight: 700,
                            color: '#1F2937',
                            fontSize: '18px'
                          }}>
                            {formatCurrency(item.valore_totale)}
                          </p>
                          {item.descrizione_display && (
                            expandedItems[item.id || idx]
                              ? <FaChevronUp style={{ color: '#9CA3AF' }} />
                              : <FaChevronDown style={{ color: '#9CA3AF' }} />
                          )}
                        </div>
                      </div>
                      {expandedItems[item.id || idx] && item.descrizione_display && (
                        <div style={{
                          padding: '0 24px 20px',
                          background: '#F9FAFB'
                        }}>
                          <p style={{
                            color: '#6B7280',
                            fontSize: '15px',
                            lineHeight: 1.7,
                            paddingLeft: '60px'
                          }}>
                            {item.descrizione_display}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '2px solid #E5E7EB'
                }}>
                  {proposal.sconto_percentuale > 0 && (
                    <>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <span style={{ color: '#6B7280', fontSize: '16px' }}>Subtotale</span>
                        <span style={{ color: '#6B7280', fontSize: '16px' }}>
                          {formatCurrency(proposal.valore_totale)}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}>
                        <span style={{ color: '#059669', fontSize: '16px', fontWeight: 600 }}>
                          Sconto ({proposal.sconto_percentuale}%)
                        </span>
                        <span style={{ color: '#059669', fontSize: '16px', fontWeight: 600 }}>
                          -{formatCurrency(proposal.sconto_valore)}
                        </span>
                      </div>
                    </>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: primaryColor,
                    margin: '-24px -40px -40px',
                    padding: '24px 40px',
                    borderRadius: '0 0 24px 24px'
                  }}>
                    <span style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '18px',
                      fontWeight: 600
                    }}>Totale Investimento</span>
                    <span style={{
                      color: 'white',
                      fontSize: '32px',
                      fontWeight: 800
                    }}>
                      {formatCurrency(proposal.valore_finale)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            {proposal.termini_condizioni && (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1F2937',
                  marginBottom: '16px'
                }}>Termini e Condizioni</h2>
                <p style={{
                  color: '#6B7280',
                  fontSize: '14px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}>
                  {proposal.termini_condizioni}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ position: 'sticky', top: '24px' }}>
            {/* Recipient Card */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px',
                fontWeight: 600
              }}>Proposta Per</p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'white'
                }}>
                  {(proposal.destinatario_azienda || 'A').charAt(0)}
                </div>
                <div>
                  <p style={{
                    fontWeight: 700,
                    color: '#1F2937',
                    fontSize: '18px'
                  }}>{proposal.destinatario_azienda}</p>
                  {proposal.settore_merceologico && (
                    <p style={{
                      color: '#6B7280',
                      fontSize: '14px'
                    }}>{proposal.settore_merceologico}</p>
                  )}
                </div>
              </div>

              {(proposal.destinatario_nome || proposal.destinatario_email || proposal.destinatario_telefono) && (
                <div style={{
                  borderTop: '1px solid #E5E7EB',
                  paddingTop: '20px'
                }}>
                  {proposal.destinatario_nome && (
                    <p style={{
                      fontWeight: 600,
                      color: '#1F2937',
                      marginBottom: '4px'
                    }}>
                      {proposal.destinatario_nome}
                    </p>
                  )}
                  {proposal.destinatario_ruolo && (
                    <p style={{
                      color: '#6B7280',
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      {proposal.destinatario_ruolo}
                    </p>
                  )}
                  {proposal.destinatario_email && (
                    <a href={`mailto:${proposal.destinatario_email}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#4F46E5',
                      textDecoration: 'none',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}>
                      <FaEnvelope style={{ opacity: 0.7 }} />
                      {proposal.destinatario_email}
                    </a>
                  )}
                  {proposal.destinatario_telefono && (
                    <a href={`tel:${proposal.destinatario_telefono}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#1F2937',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}>
                      <FaPhone style={{ opacity: 0.5 }} />
                      {proposal.destinatario_telefono}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* CTA Card */}
            <div style={{
              background: `linear-gradient(135deg, ${primaryColor}, #000)`,
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <FaCheckCircle style={{
                fontSize: '48px',
                color: accentColor,
                marginBottom: '16px'
              }} />
              <h3 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '8px'
              }}>Interessato?</h3>
              <p style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                marginBottom: '24px',
                lineHeight: 1.6
              }}>
                Contattaci per discutere i dettagli e personalizzare questa proposta
              </p>
              {proposal.club && (
                <a
                  href={`mailto:${proposal.destinatario_email || ''}`}
                  style={{
                    display: 'block',
                    background: accentColor,
                    color: primaryColor,
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '16px',
                    textDecoration: 'none',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  Rispondi alla Proposta
                </a>
              )}
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '24px',
              padding: '16px',
              color: '#9CA3AF',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaShieldAlt />
                <span>Documento Sicuro</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCheckCircle />
                <span>Verificato</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #E5E7EB',
        padding: '32px 40px',
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '13px'
      }}>
        <p style={{ marginBottom: '8px' }}>
          Proposta <strong style={{ color: '#6B7280' }}>{proposal.codice}</strong> •
          Creata il {formatDate(proposal.created_at)} •
          Valida fino al {formatDate(proposal.data_scadenza)}
        </p>
        <p>{footerText || 'Documento generato automaticamente. Tutti i diritti riservati.'}</p>
      </div>
    </div>
  );
};

export default PublicProposal;
