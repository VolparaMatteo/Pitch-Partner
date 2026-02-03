import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import '../styles/template-style.css';

// Icons
import {
    HiOutlineArrowLeft,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDocumentDuplicate,
    HiOutlineCurrencyEuro,
    HiOutlineGlobeAlt,
    HiOutlineShieldCheck,
    HiOutlineCalendarDays,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineExclamationTriangle,
    HiOutlineUserGroup,
    HiOutlinePlus,
    HiOutlineChartBar,
    HiOutlineEllipsisVertical,
    HiOutlineArrowTrendingUp,
    HiOutlineTag,
    HiOutlineMapPin,
    HiOutlineDocument,
    HiOutlinePhoto,
    HiOutlinePlay
} from 'react-icons/hi2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

function RightDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token } = getAuth();

    const [right, setRight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        fetchRight();
    }, [id]);

    const fetchRight = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/club/rights/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRight(response.data);
        } catch (err) {
            console.error('Error fetching right:', err);
            setError('Errore nel caricamento del diritto');
            // Demo data
            setRight(getDemoRight());
        } finally {
            setLoading(false);
        }
    };

    const getDemoRight = () => ({
        id: 1,
        codice: 'KIT-001',
        nome: 'Main Sponsor Maglia Gara',
        descrizione: 'Posizione centrale fronte maglia da gara. Massima visibilità in tutte le partite ufficiali, materiali promozionali e comunicazioni del club. Include diritto di utilizzo su maglia replica venduta al pubblico.',
        descrizione_breve: 'Logo fronte maglia da gara - posizione centrale',
        category: { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899', icona: 'shirt' },
        tipo: 'maglia_gara',
        sottotipo: 'fronte_centrale',
        posizione: 'Fronte maglia - Centro petto',
        dimensioni: '20cm x 10cm',
        specifiche_tecniche: 'Logo ricamato su tessuto tecnico DriFit',
        prezzo_listino: 3500000,
        prezzo_minimo: 2800000,
        valuta: 'EUR',
        prezzo_per: 'stagione',
        sconto_biennale: 10,
        sconto_triennale: 15,
        esclusivo: true,
        esclusivita_settoriale: true,
        settori_esclusi: ['bevande', 'betting'],
        max_allocazioni: 1,
        territorio_disponibile: 'world',
        durata_minima_mesi: 12,
        durata_massima_mesi: 60,
        preavviso_disdetta_giorni: 90,
        rinnovo_automatico: false,
        sublicenziabile: false,
        status: 'allocato',
        disponibile: false,
        visibile_marketplace: true,
        in_evidenza: true,
        stagione_corrente: '2024-2025',
        allocations: [
            {
                id: 1,
                sponsor: { id: 1, nome: 'Fly Emirates', logo: null },
                data_inizio: '2024-07-01',
                data_fine: '2027-06-30',
                prezzo_concordato: 10500000,
                status: 'attiva',
                territorio: 'world'
            }
        ],
        pricing_tiers: [
            { id: 1, nome: 'Partita Standard', codice: 'standard', prezzo: 3500000, moltiplicatore: 1.0 },
            { id: 2, nome: 'Derby', codice: 'derby', prezzo: 5250000, moltiplicatore: 1.5 },
            { id: 3, nome: 'Champions League', codice: 'champions', prezzo: 7000000, moltiplicatore: 2.0 }
        ],
        created_at: '2024-01-15T10:30:00',
        updated_at: '2024-10-20T15:45:00'
    });

    // Format currency
    const formatCurrency = (value, currency = 'EUR') => {
        if (!value) return '-';
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Status badge
    const getStatusBadge = (status) => {
        const configs = {
            disponibile: { color: 'success', icon: HiOutlineCheckCircle, label: 'Disponibile' },
            allocato: { color: 'primary', icon: HiOutlineShieldCheck, label: 'Allocato' },
            riservato: { color: 'warning', icon: HiOutlineClock, label: 'Riservato' },
            sospeso: { color: 'danger', icon: HiOutlineExclamationTriangle, label: 'Sospeso' }
        };
        const config = configs[status] || configs.disponibile;
        const Icon = config.icon;
        return (
            <span className={`badge badge-lg badge-${config.color}`}>
                <Icon size={16} />
                {config.label}
            </span>
        );
    };

    // Territory label
    const getTerritoryLabel = (territory) => {
        const labels = { world: 'Mondiale', europe: 'Europa', italy: 'Italia', region: 'Regionale' };
        return labels[territory] || territory;
    };

    const handleDelete = async () => {
        if (!window.confirm('Sei sicuro di voler eliminare questo diritto?')) return;
        try {
            await axios.delete(`${API_URL}/api/club/rights/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/club/rights');
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Errore durante l\'eliminazione');
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Caricamento...</p>
                </div>
            </div>
        );
    }

    if (error && !right) {
        return (
            <div className="page-container">
                <div className="error-container">
                    <HiOutlineExclamationTriangle size={48} />
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/club/rights')}>
                        Torna al Catalogo
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'allocations', label: 'Allocazioni', count: right?.allocations?.length },
        { id: 'pricing', label: 'Pricing Tiers', count: right?.pricing_tiers?.length },
        { id: 'history', label: 'Storico' }
    ];

    return (
        <div className="page-container">
            {/* Header */}
            <div className="detail-header">
                <div className="header-top">
                    <button className="btn-back" onClick={() => navigate('/club/rights')}>
                        <HiOutlineArrowLeft size={20} />
                    </button>
                    <div className="header-breadcrumb">
                        <span>Gestione Diritti</span>
                        <span>/</span>
                        <span>{right?.codice}</span>
                    </div>
                </div>

                <div className="header-main">
                    <div className="header-info">
                        <div className="category-badge" style={{
                            backgroundColor: `${right?.category?.colore}20`,
                            color: right?.category?.colore
                        }}>
                            <HiOutlineTag size={14} />
                            {right?.category?.nome}
                        </div>
                        <h1 className="right-title">{right?.nome}</h1>
                        <p className="right-code">{right?.codice}</p>
                    </div>
                    <div className="header-actions">
                        {getStatusBadge(right?.status)}
                        <button className="btn btn-outline" onClick={() => navigate(`/club/rights/${id}/edit`)}>
                            <HiOutlinePencil size={18} />
                            Modifica
                        </button>
                        <div className="dropdown">
                            <button className="btn btn-icon" onClick={() => setShowMenu(!showMenu)}>
                                <HiOutlineEllipsisVertical size={20} />
                            </button>
                            {showMenu && (
                                <div className="dropdown-menu show">
                                    <button onClick={() => {}}>
                                        <HiOutlineDocumentDuplicate size={16} /> Duplica
                                    </button>
                                    <button onClick={() => navigate('/club/rights/allocations/new?right=' + id)}>
                                        <HiOutlinePlus size={16} /> Nuova Allocazione
                                    </button>
                                    <hr />
                                    <button className="danger" onClick={handleDelete}>
                                        <HiOutlineTrash size={16} /> Elimina
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-row">
                <div className="stat-item">
                    <div className="stat-icon" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
                        <HiOutlineCurrencyEuro size={20} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(right?.prezzo_listino)}</div>
                        <div className="stat-label">Prezzo Listino / {right?.prezzo_per}</div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
                        <HiOutlineGlobeAlt size={20} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{getTerritoryLabel(right?.territorio_disponibile)}</div>
                        <div className="stat-label">Territorio</div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
                        <HiOutlineCalendarDays size={20} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{right?.durata_minima_mesi} mesi</div>
                        <div className="stat-label">Durata Minima</div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                        <HiOutlineUserGroup size={20} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{right?.allocations?.length || 0}</div>
                        <div className="stat-label">Allocazioni Attive</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="tab-count">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-grid">
                        {/* Info Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Informazioni Generali</h3>
                            </div>
                            <div className="card-body">
                                <p className="description">{right?.descrizione}</p>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Tipo</label>
                                        <span>{right?.tipo || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Sottotipo</label>
                                        <span>{right?.sottotipo || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Posizione</label>
                                        <span>{right?.posizione || '-'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Dimensioni</label>
                                        <span>{right?.dimensioni || '-'}</span>
                                    </div>
                                </div>

                                {right?.specifiche_tecniche && (
                                    <div className="specs-box">
                                        <label>Specifiche Tecniche</label>
                                        <p>{right.specifiche_tecniche}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exclusivity Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Esclusività & Territorio</h3>
                            </div>
                            <div className="card-body">
                                <div className="badges-list">
                                    {right?.esclusivo && (
                                        <div className="feature-badge active">
                                            <HiOutlineShieldCheck size={18} />
                                            <span>Diritto Esclusivo</span>
                                        </div>
                                    )}
                                    {right?.esclusivita_settoriale && (
                                        <div className="feature-badge active">
                                            <HiOutlineUserGroup size={18} />
                                            <span>Esclusività Settoriale</span>
                                        </div>
                                    )}
                                    {right?.sublicenziabile && (
                                        <div className="feature-badge">
                                            <HiOutlineDocument size={18} />
                                            <span>Sublicenziabile</span>
                                        </div>
                                    )}
                                </div>

                                {right?.settori_esclusi?.length > 0 && (
                                    <div className="excluded-sectors">
                                        <label>Settori Esclusi</label>
                                        <div className="sector-chips">
                                            {right.settori_esclusi.map(sector => (
                                                <span key={sector} className="chip">{sector}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="territory-info">
                                    <HiOutlineGlobeAlt size={20} />
                                    <span>Disponibile per: <strong>{getTerritoryLabel(right?.territorio_disponibile)}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Pricing</h3>
                            </div>
                            <div className="card-body">
                                <div className="price-main">
                                    <span className="price-amount">{formatCurrency(right?.prezzo_listino)}</span>
                                    <span className="price-per">/ {right?.prezzo_per}</span>
                                </div>
                                {right?.prezzo_minimo && (
                                    <p className="price-floor">
                                        Prezzo minimo: {formatCurrency(right?.prezzo_minimo)}
                                    </p>
                                )}

                                {(right?.sconto_biennale || right?.sconto_triennale) && (
                                    <div className="discount-info">
                                        <label>Sconti per Durata</label>
                                        <div className="discount-items">
                                            {right?.sconto_biennale && (
                                                <div className="discount-item">
                                                    <span>Biennale</span>
                                                    <strong>-{right.sconto_biennale}%</strong>
                                                </div>
                                            )}
                                            {right?.sconto_triennale && (
                                                <div className="discount-item">
                                                    <span>Triennale+</span>
                                                    <strong>-{right.sconto_triennale}%</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Duration Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3>Durata & Rinnovo</h3>
                            </div>
                            <div className="card-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Durata Minima</label>
                                        <span>{right?.durata_minima_mesi} mesi</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Durata Massima</label>
                                        <span>{right?.durata_massima_mesi ? `${right.durata_massima_mesi} mesi` : 'Nessun limite'}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Preavviso Disdetta</label>
                                        <span>{right?.preavviso_disdetta_giorni} giorni</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Rinnovo Automatico</label>
                                        <span>{right?.rinnovo_automatico ? 'Sì' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'allocations' && (
                    <div className="allocations-section">
                        <div className="section-header">
                            <h3>Allocazioni</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/club/rights/allocations/new?right=' + id)}>
                                <HiOutlinePlus size={16} />
                                Nuova Allocazione
                            </button>
                        </div>

                        {right?.allocations?.length === 0 ? (
                            <div className="empty-state">
                                <HiOutlineUserGroup size={48} />
                                <h4>Nessuna allocazione</h4>
                                <p>Questo diritto non è ancora stato allocato a nessuno sponsor</p>
                            </div>
                        ) : (
                            <div className="allocations-list">
                                {right?.allocations?.map(alloc => (
                                    <div key={alloc.id} className="allocation-card">
                                        <div className="allocation-sponsor">
                                            <div className="sponsor-logo">
                                                {alloc.sponsor?.logo ? (
                                                    <img src={getImageUrl(alloc.sponsor.logo)} alt="" />
                                                ) : (
                                                    <HiOutlineUserGroup size={24} />
                                                )}
                                            </div>
                                            <div className="sponsor-info">
                                                <strong>{alloc.sponsor?.nome}</strong>
                                                <span className={`status-badge ${alloc.status}`}>
                                                    {alloc.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="allocation-details">
                                            <div className="detail-item">
                                                <HiOutlineCalendarDays size={16} />
                                                <span>{formatDate(alloc.data_inizio)} - {formatDate(alloc.data_fine)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <HiOutlineGlobeAlt size={16} />
                                                <span>{getTerritoryLabel(alloc.territorio)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <HiOutlineCurrencyEuro size={16} />
                                                <span>{formatCurrency(alloc.prezzo_concordato)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'pricing' && (
                    <div className="pricing-section">
                        <div className="section-header">
                            <h3>Pricing Tiers</h3>
                        </div>

                        {right?.pricing_tiers?.length === 0 ? (
                            <div className="empty-state">
                                <HiOutlineCurrencyEuro size={48} />
                                <h4>Nessun tier definito</h4>
                                <p>Il prezzo base viene applicato a tutti gli eventi</p>
                            </div>
                        ) : (
                            <div className="pricing-tiers-grid">
                                {right?.pricing_tiers?.map(tier => (
                                    <div key={tier.id} className="tier-card">
                                        <div className="tier-header">
                                            <h4>{tier.nome}</h4>
                                            <span className="tier-code">{tier.codice}</span>
                                        </div>
                                        <div className="tier-price">
                                            <span className="price">{formatCurrency(tier.prezzo)}</span>
                                            {tier.moltiplicatore !== 1 && (
                                                <span className="multiplier">
                                                    <HiOutlineArrowTrendingUp size={14} />
                                                    {tier.moltiplicatore}x
                                                </span>
                                            )}
                                        </div>
                                        {tier.descrizione && (
                                            <p className="tier-desc">{tier.descrizione}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="history-section">
                        <div className="empty-state">
                            <HiOutlineClock size={48} />
                            <h4>Storico non disponibile</h4>
                            <p>Lo storico delle modifiche sarà disponibile prossimamente</p>
                        </div>
                    </div>
                )}
            </div>

            {showMenu && <div className="backdrop" onClick={() => setShowMenu(false)} />}

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* Header */
                .detail-header {
                    margin-bottom: 24px;
                }

                .header-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .btn-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    cursor: pointer;
                }

                .header-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .header-breadcrumb span:last-child {
                    color: var(--text-primary);
                    font-weight: 500;
                }

                .header-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 24px;
                }

                .category-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .right-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 4px 0;
                }

                .right-code {
                    font-size: 14px;
                    color: var(--text-secondary);
                    font-family: monospace;
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                /* Stats Row */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 16px 20px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                }

                .stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                }

                .stat-label {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                /* Tabs */
                .tabs-container {
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 24px;
                }

                .tabs {
                    display: flex;
                    gap: 4px;
                }

                .tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    background: none;
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                    transition: all 0.2s;
                }

                .tab:hover {
                    color: var(--text-primary);
                }

                .tab.active {
                    color: var(--primary-green);
                    border-bottom-color: var(--primary-green);
                }

                .tab-count {
                    background: var(--bg-secondary);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                }

                /* Cards */
                .overview-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                .card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .card-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-light);
                }

                .card-header h3 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                }

                .card-body {
                    padding: 20px;
                }

                .description {
                    font-size: 14px;
                    line-height: 1.6;
                    color: var(--text-secondary);
                    margin: 0 0 20px 0;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .info-item label {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .info-item span {
                    font-size: 14px;
                    font-weight: 500;
                }

                /* Feature Badges */
                .badges-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .feature-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .feature-badge.active {
                    background: #10B98115;
                    color: #10B981;
                }

                .territory-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    font-size: 14px;
                }

                /* Pricing */
                .price-main {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .price-amount {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .price-per {
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                .price-floor {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0 0 20px 0;
                }

                .discount-info {
                    padding-top: 16px;
                    border-top: 1px solid var(--border-light);
                }

                .discount-info label {
                    font-size: 12px;
                    color: var(--text-secondary);
                    display: block;
                    margin-bottom: 10px;
                }

                .discount-items {
                    display: flex;
                    gap: 16px;
                }

                .discount-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .discount-item span {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .discount-item strong {
                    font-size: 16px;
                    color: #10B981;
                }

                /* Allocations */
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 18px;
                }

                .allocations-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .allocation-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                }

                .allocation-sponsor {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .sponsor-logo {
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    background: var(--bg-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .sponsor-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .sponsor-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .sponsor-info strong {
                    font-size: 15px;
                }

                .status-badge {
                    font-size: 11px;
                    padding: 2px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .status-badge.attiva {
                    background: #10B98120;
                    color: #10B981;
                }

                .allocation-details {
                    display: flex;
                    gap: 24px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                /* Pricing Tiers */
                .pricing-tiers-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }

                .tier-card {
                    padding: 20px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                }

                .tier-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .tier-header h4 {
                    margin: 0;
                    font-size: 15px;
                }

                .tier-code {
                    font-size: 11px;
                    color: var(--text-secondary);
                    background: var(--bg-secondary);
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .tier-price {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .tier-price .price {
                    font-size: 22px;
                    font-weight: 700;
                }

                .multiplier {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #F59E0B;
                    background: #F59E0B15;
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .tier-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px 20px;
                    text-align: center;
                    color: var(--text-secondary);
                }

                .empty-state svg {
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .empty-state h4 {
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                }

                .empty-state p {
                    margin: 0;
                }

                /* Chips */
                .sector-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                }

                .chip {
                    padding: 4px 12px;
                    background: var(--bg-secondary);
                    border-radius: 16px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .excluded-sectors {
                    margin-bottom: 16px;
                }

                .excluded-sectors label {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                /* Dropdown */
                .dropdown {
                    position: relative;
                }

                .dropdown-menu {
                    position: absolute;
                    right: 0;
                    top: 100%;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    min-width: 180px;
                    z-index: 100;
                    display: none;
                }

                .dropdown-menu.show {
                    display: block;
                }

                .dropdown-menu button {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    background: none;
                    font-size: 13px;
                    cursor: pointer;
                    text-align: left;
                }

                .dropdown-menu button:hover {
                    background: var(--bg-secondary);
                }

                .dropdown-menu button.danger {
                    color: var(--danger);
                }

                .dropdown-menu hr {
                    margin: 4px 0;
                    border: none;
                    border-top: 1px solid var(--border-light);
                }

                .backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 50;
                }

                /* Badges */
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .badge-lg {
                    padding: 8px 14px;
                    font-size: 13px;
                }

                .badge-success { background: #10B98120; color: #10B981; }
                .badge-primary { background: #3B82F620; color: #3B82F6; }
                .badge-warning { background: #F59E0B20; color: #F59E0B; }
                .badge-danger { background: #EF444420; color: #EF4444; }

                /* Buttons */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: var(--primary-green);
                    color: var(--primary-black);
                }

                .btn-outline {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .btn-outline:hover {
                    background: var(--bg-secondary);
                }

                .btn-icon {
                    padding: 10px;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                }

                .btn-sm {
                    padding: 8px 12px;
                    font-size: 13px;
                }

                /* Loading */
                .loading-container,
                .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 80px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary-green);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .stats-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .overview-grid {
                        grid-template-columns: 1fr;
                    }
                    .pricing-tiers-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .stats-row {
                        grid-template-columns: 1fr;
                    }
                    .header-main {
                        flex-direction: column;
                    }
                    .allocation-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .pricing-tiers-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default RightDetail;
