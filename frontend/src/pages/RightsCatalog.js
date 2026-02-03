import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import '../styles/template-style.css';

// Icons
import {
    HiOutlinePlus,
    HiOutlineMagnifyingGlass,
    HiOutlineFunnel,
    HiOutlineSquares2X2,
    HiOutlineListBullet,
    HiOutlineExclamationTriangle,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineGlobeAlt,
    HiOutlineShieldCheck,
    HiOutlineCurrencyEuro,
    HiOutlineCalendarDays,
    HiOutlineChevronRight,
    HiOutlineEllipsisVertical,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlineDocumentDuplicate,
    HiOutlineArrowPath,
    HiOutlineBuildingOffice2,
    HiOutlineSparkles,
    HiOutlineTag,
    HiOutlineXMark
} from 'react-icons/hi2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

// Icone per categorie
const categoryIcons = {
    naming: HiOutlineBuildingOffice2,
    kit: HiOutlineTag,
    digital: HiOutlineGlobeAlt,
    broadcast: HiOutlineSparkles,
    hospitality: HiOutlineSparkles,
    activation: HiOutlineSparkles,
    ip: HiOutlineShieldCheck
};

function RightsCatalog() {
    const navigate = useNavigate();
    const { token } = getAuth();

    // State
    const [rights, setRights] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    // Menu dropdown
    const [activeMenu, setActiveMenu] = useState(null);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [selectedCategory, selectedStatus, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams();
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (selectedStatus) params.append('status', selectedStatus);
            if (searchTerm) params.append('search', searchTerm);
            params.append('include_allocations', 'true');

            const [rightsRes, categoriesRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/club/rights?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/club/rights/categories?include_stats=true`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/club/rights/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setRights(rightsRes.data.items || []);
            setCategories(categoriesRes.data || []);
            setStats(statsRes.data || null);
            setError(null);
        } catch (err) {
            console.error('Error fetching rights:', err);
            setError('Errore nel caricamento dei diritti');
            // Use demo data
            setCategories(getDemoCategories());
            setRights(getDemoRights());
            setStats(getDemoStats());
        } finally {
            setLoading(false);
        }
    };

    // Demo data
    const getDemoCategories = () => [
        { id: 1, codice: 'naming', nome: 'Naming Rights', colore: '#6366F1', icona: 'building', rights_count: 3 },
        { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899', icona: 'shirt', rights_count: 8 },
        { id: 3, codice: 'digital', nome: 'Digital Rights', colore: '#3B82F6', icona: 'globe', rights_count: 12 },
        { id: 4, codice: 'broadcast', nome: 'Broadcast Rights', colore: '#F59E0B', icona: 'tv', rights_count: 15 },
        { id: 5, codice: 'hospitality', nome: 'Hospitality Rights', colore: '#10B981', icona: 'star', rights_count: 6 },
        { id: 6, codice: 'activation', nome: 'Activation Rights', colore: '#8B5CF6', icona: 'zap', rights_count: 10 },
        { id: 7, codice: 'ip', nome: 'IP Rights', colore: '#EF4444', icona: 'shield', rights_count: 4 }
    ];

    const getDemoRights = () => [
        {
            id: 1,
            codice: 'NAM-001',
            nome: 'Naming Rights Stadio',
            descrizione_breve: 'Diritto di denominazione dello stadio principale',
            category: { id: 1, codice: 'naming', nome: 'Naming Rights', colore: '#6366F1' },
            prezzo_listino: 5000000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'allocato',
            esclusivo: true,
            territorio_disponibile: 'world',
            durata_minima_mesi: 36,
            allocazioni_attive: 1,
            immagine_principale: null
        },
        {
            id: 2,
            codice: 'KIT-001',
            nome: 'Main Sponsor Maglia Gara',
            descrizione_breve: 'Logo fronte maglia da gara - posizione centrale',
            category: { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899' },
            prezzo_listino: 3500000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'allocato',
            esclusivo: true,
            territorio_disponibile: 'world',
            durata_minima_mesi: 12,
            allocazioni_attive: 1,
            immagine_principale: null
        },
        {
            id: 3,
            codice: 'KIT-002',
            nome: 'Sleeve Sponsor Destro',
            descrizione_breve: 'Logo manica destra maglia da gara',
            category: { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899' },
            prezzo_listino: 800000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'disponibile',
            esclusivo: true,
            territorio_disponibile: 'world',
            durata_minima_mesi: 12,
            allocazioni_attive: 0,
            immagine_principale: null
        },
        {
            id: 4,
            codice: 'LED-001',
            nome: 'LED Bordo Campo - Curva Nord',
            descrizione_breve: 'Spazio LED rotativo curva nord - visibilità TV',
            category: { id: 4, codice: 'broadcast', nome: 'Broadcast Rights', colore: '#F59E0B' },
            prezzo_listino: 250000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'disponibile',
            esclusivo: false,
            territorio_disponibile: 'italy',
            durata_minima_mesi: 12,
            allocazioni_attive: 0,
            immagine_principale: null
        },
        {
            id: 5,
            codice: 'DIG-001',
            nome: 'Presenting Partner Website',
            descrizione_breve: 'Posizione premium homepage sito ufficiale',
            category: { id: 3, codice: 'digital', nome: 'Digital Rights', colore: '#3B82F6' },
            prezzo_listino: 150000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'disponibile',
            esclusivo: true,
            territorio_disponibile: 'world',
            durata_minima_mesi: 6,
            allocazioni_attive: 0,
            immagine_principale: null
        },
        {
            id: 6,
            codice: 'HOS-001',
            nome: 'Skybox Premium - Tribuna VIP',
            descrizione_breve: 'Skybox 12 posti con catering incluso',
            category: { id: 5, codice: 'hospitality', nome: 'Hospitality Rights', colore: '#10B981' },
            prezzo_listino: 180000,
            valuta: 'EUR',
            prezzo_per: 'stagione',
            status: 'allocato',
            esclusivo: true,
            territorio_disponibile: 'world',
            durata_minima_mesi: 12,
            allocazioni_attive: 1,
            immagine_principale: null
        }
    ];

    const getDemoStats = () => ({
        rights: { totale: 58, disponibili: 42, allocati: 16, valore_listino: 12500000, valore_allocato: 8750000 },
        allocations: { attive: 16, in_scadenza: 3 },
        sectors: { totale: 15, allocati: 8, disponibili: 7 },
        conflicts: { aperti: 2 },
        categories: getDemoCategories().map((c, i) => ({
            ...c,
            totale: c.rights_count,
            allocati: Math.floor(c.rights_count * 0.3),
            disponibili: Math.ceil(c.rights_count * 0.7),
            valore: (c.rights_count * 500000)
        }))
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
            <span className={`badge badge-${config.color}`}>
                <Icon size={14} style={{ marginRight: '4px' }} />
                {config.label}
            </span>
        );
    };

    // Territory badge
    const getTerritoryLabel = (territory) => {
        const labels = {
            world: 'Mondiale',
            europe: 'Europa',
            italy: 'Italia',
            region: 'Regionale'
        };
        return labels[territory] || territory;
    };

    // Handle actions
    const handleView = (id) => {
        navigate(`/club/rights/${id}`);
    };

    const handleEdit = (id) => {
        navigate(`/club/rights/${id}/edit`);
    };

    const handleDuplicate = async (right) => {
        // TODO: Implement duplicate
        console.log('Duplicate:', right);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo diritto?')) return;
        try {
            await axios.delete(`${API_URL}/api/club/rights/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error deleting right:', err);
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleInitDefaults = async () => {
        try {
            await axios.post(`${API_URL}/api/club/rights/categories/init-defaults`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await axios.post(`${API_URL}/api/club/rights/sectors/init-defaults`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error initializing defaults:', err);
        }
    };

    // Render category chip
    const CategoryChip = ({ category, isActive, onClick }) => (
        <button
            className={`category-chip ${isActive ? 'active' : ''}`}
            onClick={onClick}
            style={{
                '--chip-color': category.colore || '#6B7280',
                borderColor: isActive ? category.colore : 'transparent',
                backgroundColor: isActive ? `${category.colore}15` : 'var(--bg-secondary)'
            }}
        >
            <span className="chip-dot" style={{ backgroundColor: category.colore }}></span>
            <span className="chip-label">{category.nome}</span>
            <span className="chip-count">{category.rights_count || 0}</span>
        </button>
    );

    // Right card component
    const RightCard = ({ right }) => {
        const Icon = categoryIcons[right.category?.codice] || HiOutlineTag;

        return (
            <div className="card right-card" onClick={() => handleView(right.id)}>
                <div className="right-card-header">
                    <div className="right-category-badge" style={{ backgroundColor: `${right.category?.colore}20`, color: right.category?.colore }}>
                        <Icon size={14} />
                        <span>{right.category?.nome || 'Categoria'}</span>
                    </div>
                    <div className="right-card-menu">
                        <button
                            className="btn-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === right.id ? null : right.id);
                            }}
                        >
                            <HiOutlineEllipsisVertical size={18} />
                        </button>
                        {activeMenu === right.id && (
                            <div className="dropdown-menu show">
                                <button onClick={(e) => { e.stopPropagation(); handleView(right.id); }}>
                                    <HiOutlineEye size={16} /> Visualizza
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleEdit(right.id); }}>
                                    <HiOutlinePencil size={16} /> Modifica
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(right); }}>
                                    <HiOutlineDocumentDuplicate size={16} /> Duplica
                                </button>
                                <hr />
                                <button className="danger" onClick={(e) => { e.stopPropagation(); handleDelete(right.id); }}>
                                    <HiOutlineTrash size={16} /> Elimina
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="right-card-body">
                    <div className="right-code">{right.codice}</div>
                    <h3 className="right-name">{right.nome}</h3>
                    <p className="right-description">{right.descrizione_breve}</p>
                </div>

                <div className="right-card-meta">
                    <div className="meta-item">
                        <HiOutlineCurrencyEuro size={16} />
                        <span>{formatCurrency(right.prezzo_listino)}</span>
                        <span className="meta-suffix">/{right.prezzo_per || 'stagione'}</span>
                    </div>
                    <div className="meta-item">
                        <HiOutlineGlobeAlt size={16} />
                        <span>{getTerritoryLabel(right.territorio_disponibile)}</span>
                    </div>
                    {right.durata_minima_mesi && (
                        <div className="meta-item">
                            <HiOutlineCalendarDays size={16} />
                            <span>Min {right.durata_minima_mesi} mesi</span>
                        </div>
                    )}
                </div>

                <div className="right-card-footer">
                    <div className="right-badges">
                        {getStatusBadge(right.status)}
                        {right.esclusivo && (
                            <span className="badge badge-outline">
                                <HiOutlineShieldCheck size={14} style={{ marginRight: '4px' }} />
                                Esclusivo
                            </span>
                        )}
                    </div>
                    <HiOutlineChevronRight size={18} className="card-arrow" />
                </div>
            </div>
        );
    };

    // Right list row
    const RightRow = ({ right }) => {
        const Icon = categoryIcons[right.category?.codice] || HiOutlineTag;

        return (
            <tr className="right-row" onClick={() => handleView(right.id)}>
                <td>
                    <div className="right-category-dot" style={{ backgroundColor: right.category?.colore }}></div>
                </td>
                <td className="code-cell">{right.codice}</td>
                <td>
                    <div className="right-info">
                        <span className="right-name">{right.nome}</span>
                        <span className="right-category-text">{right.category?.nome}</span>
                    </div>
                </td>
                <td className="price-cell">{formatCurrency(right.prezzo_listino)}</td>
                <td>{getTerritoryLabel(right.territorio_disponibile)}</td>
                <td>{right.esclusivo ? 'Sì' : 'No'}</td>
                <td>{getStatusBadge(right.status)}</td>
                <td className="actions-cell">
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(right.id); }}>
                        <HiOutlinePencil size={16} />
                    </button>
                </td>
            </tr>
        );
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div>
                        <h1 className="page-title">Gestione Diritti</h1>
                        <p className="page-subtitle">Catalogo completo dei diritti di sponsorizzazione</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-outline" onClick={() => navigate('/club/rights/calendar')}>
                            <HiOutlineCalendarDays size={18} />
                            Calendario
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/club/rights/conflicts')}>
                            <HiOutlineExclamationTriangle size={18} />
                            Conflitti
                            {stats?.conflicts?.aperti > 0 && (
                                <span className="badge badge-danger badge-sm">{stats.conflicts.aperti}</span>
                            )}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/club/rights/new')}>
                            <HiOutlinePlus size={18} />
                            Nuovo Diritto
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid stats-grid-4">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
                            <HiOutlineSquares2X2 size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.rights?.totale || 0}</div>
                            <div className="stat-label">Diritti Totali</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                            <HiOutlineCheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.rights?.disponibili || 0}</div>
                            <div className="stat-label">Disponibili</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#8B5CF620', color: '#8B5CF6' }}>
                            <HiOutlineShieldCheck size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.rights?.allocati || 0}</div>
                            <div className="stat-label">Allocati</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
                            <HiOutlineCurrencyEuro size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-value">{formatCurrency(stats.rights?.valore_allocato)}</div>
                            <div className="stat-label">Valore Allocato</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Chips */}
            <div className="category-chips-container">
                <div className="category-chips">
                    <button
                        className={`category-chip ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('')}
                    >
                        <span className="chip-label">Tutti</span>
                        <span className="chip-count">{stats?.rights?.totale || rights.length}</span>
                    </button>
                    {categories.map(cat => (
                        <CategoryChip
                            key={cat.id}
                            category={cat}
                            isActive={selectedCategory === String(cat.id)}
                            onClick={() => setSelectedCategory(selectedCategory === String(cat.id) ? '' : String(cat.id))}
                        />
                    ))}
                </div>
                {categories.length === 0 && (
                    <button className="btn btn-sm btn-outline" onClick={handleInitDefaults}>
                        <HiOutlineArrowPath size={16} />
                        Inizializza Categorie Default
                    </button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="filters-bar">
                <div className="search-box">
                    <HiOutlineMagnifyingGlass size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Cerca diritti..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="search-clear" onClick={() => setSearchTerm('')}>
                            <HiOutlineXMark size={16} />
                        </button>
                    )}
                </div>

                <div className="filters-right">
                    <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">Tutti gli stati</option>
                        <option value="disponibile">Disponibile</option>
                        <option value="allocato">Allocato</option>
                        <option value="riservato">Riservato</option>
                        <option value="sospeso">Sospeso</option>
                    </select>

                    <div className="view-toggle">
                        <button
                            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <HiOutlineSquares2X2 size={18} />
                        </button>
                        <button
                            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <HiOutlineListBullet size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Caricamento diritti...</p>
                </div>
            ) : error && rights.length === 0 ? (
                <div className="error-container">
                    <HiOutlineExclamationTriangle size={48} />
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchData}>
                        Riprova
                    </button>
                </div>
            ) : rights.length === 0 ? (
                <div className="empty-state">
                    <HiOutlineShieldCheck size={64} />
                    <h3>Nessun diritto trovato</h3>
                    <p>Inizia creando il tuo primo diritto di sponsorizzazione</p>
                    <button className="btn btn-primary" onClick={() => navigate('/club/rights/new')}>
                        <HiOutlinePlus size={18} />
                        Crea Diritto
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="rights-grid">
                    {rights.map(right => (
                        <RightCard key={right.id} right={right} />
                    ))}
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '30px' }}></th>
                                <th>Codice</th>
                                <th>Nome</th>
                                <th>Prezzo</th>
                                <th>Territorio</th>
                                <th>Esclusivo</th>
                                <th>Stato</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rights.map(right => (
                                <RightRow key={right.id} right={right} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Click outside to close menu */}
            {activeMenu && (
                <div
                    className="backdrop"
                    onClick={() => setActiveMenu(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                />
            )}

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 24px;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 24px;
                }

                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 4px 0 0 0;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stats-grid-4 {
                    grid-template-columns: repeat(4, 1fr);
                }

                .stat-card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-label {
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                /* Category Chips */
                .category-chips-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                }

                .category-chips {
                    display: flex;
                    gap: 8px;
                    flex-wrap: nowrap;
                }

                .category-chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border-radius: 20px;
                    border: 2px solid transparent;
                    background: var(--bg-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .category-chip:hover {
                    background: var(--bg-tertiary);
                }

                .category-chip.active {
                    background: var(--chip-color, var(--primary-green))15;
                    border-color: var(--chip-color, var(--primary-green));
                }

                .chip-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .chip-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .chip-count {
                    font-size: 12px;
                    padding: 2px 8px;
                    background: var(--bg-tertiary);
                    border-radius: 10px;
                    color: var(--text-secondary);
                }

                /* Filters Bar */
                .filters-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .search-box {
                    position: relative;
                    flex: 1;
                    max-width: 400px;
                }

                .search-box input {
                    width: 100%;
                    padding: 10px 40px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 14px;
                    background: var(--bg-primary);
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }

                .search-clear {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    padding: 4px;
                }

                .filters-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .form-select {
                    padding: 10px 32px 10px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 14px;
                    background: var(--bg-primary);
                    min-width: 160px;
                }

                .view-toggle {
                    display: flex;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    padding: 4px;
                }

                .view-toggle .btn-icon {
                    padding: 8px;
                    border-radius: 6px;
                }

                .view-toggle .btn-icon.active {
                    background: var(--bg-primary);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                /* Rights Grid */
                .rights-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 20px;
                }

                .right-card {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.2s;
                    overflow: hidden;
                }

                .right-card:hover {
                    border-color: var(--primary-green);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    transform: translateY(-2px);
                }

                .right-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 16px 0;
                }

                .right-category-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .right-card-menu {
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
                    min-width: 160px;
                    z-index: 100;
                    display: none;
                }

                .dropdown-menu.show {
                    display: block;
                }

                .dropdown-menu button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    background: none;
                    font-size: 13px;
                    color: var(--text-primary);
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
                    border-top: 1px solid var(--border-color);
                }

                .right-card-body {
                    padding: 12px 16px;
                }

                .right-code {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .right-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0 0 6px 0;
                    line-height: 1.3;
                }

                .right-description {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .right-card-meta {
                    padding: 12px 16px;
                    border-top: 1px solid var(--border-light);
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .meta-item svg {
                    color: var(--text-muted);
                }

                .meta-suffix {
                    font-size: 11px;
                    color: var(--text-muted);
                }

                .right-card-footer {
                    padding: 12px 16px;
                    background: var(--bg-secondary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .right-badges {
                    display: flex;
                    gap: 8px;
                }

                .card-arrow {
                    color: var(--text-muted);
                }

                /* Table */
                .table-container {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .table th {
                    text-align: left;
                    padding: 14px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                }

                .table td {
                    padding: 14px 16px;
                    font-size: 14px;
                    color: var(--text-primary);
                    border-bottom: 1px solid var(--border-light);
                }

                .table tr:last-child td {
                    border-bottom: none;
                }

                .right-row {
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .right-row:hover {
                    background: var(--bg-secondary);
                }

                .right-category-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .right-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .right-info .right-name {
                    font-size: 14px;
                    font-weight: 500;
                    margin: 0;
                }

                .right-category-text {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .code-cell {
                    font-family: monospace;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .price-cell {
                    font-weight: 600;
                }

                .actions-cell {
                    text-align: right;
                }

                /* Loading & Empty States */
                .loading-container,
                .error-container,
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 24px;
                    text-align: center;
                    color: var(--text-secondary);
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary-green);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .empty-state h3 {
                    font-size: 18px;
                    color: var(--text-primary);
                    margin: 16px 0 8px;
                }

                .empty-state p {
                    margin-bottom: 20px;
                }

                /* Badges */
                .badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .badge-success {
                    background: #10B98120;
                    color: #10B981;
                }

                .badge-primary {
                    background: #3B82F620;
                    color: #3B82F6;
                }

                .badge-warning {
                    background: #F59E0B20;
                    color: #F59E0B;
                }

                .badge-danger {
                    background: #EF444420;
                    color: #EF4444;
                }

                .badge-outline {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-secondary);
                }

                .badge-sm {
                    padding: 2px 6px;
                    font-size: 10px;
                    margin-left: 6px;
                }

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
                    transition: all 0.2s;
                    border: none;
                }

                .btn-primary {
                    background: var(--primary-green);
                    color: var(--primary-black);
                }

                .btn-primary:hover {
                    background: var(--primary-green-dark);
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
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .btn-icon:hover {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }

                .btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .stats-grid-4 {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .page-container {
                        padding: 16px;
                    }

                    .header-content {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .header-actions {
                        flex-wrap: wrap;
                    }

                    .stats-grid-4 {
                        grid-template-columns: 1fr;
                    }

                    .filters-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-box {
                        max-width: none;
                    }

                    .rights-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default RightsCatalog;
