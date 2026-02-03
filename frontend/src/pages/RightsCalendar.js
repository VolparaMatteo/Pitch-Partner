import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from '../utils/auth';
import '../styles/template-style.css';

// Icons
import {
    HiOutlineArrowLeft,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineCalendarDays,
    HiOutlineFunnel,
    HiOutlineUserGroup,
    HiOutlineCurrencyEuro,
    HiOutlineShieldCheck,
    HiOutlineExclamationTriangle
} from 'react-icons/hi2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

function RightsCalendar() {
    const navigate = useNavigate();
    const { token } = getAuth();

    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // month, year
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    // Get months for year view
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    useEffect(() => {
        fetchData();
    }, [currentDate, selectedCategory]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Calculate date range based on view
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            let start, end;

            if (view === 'month') {
                start = new Date(year, month, 1).toISOString().split('T')[0];
                end = new Date(year, month + 1, 0).toISOString().split('T')[0];
            } else {
                start = `${year}-01-01`;
                end = `${year}-12-31`;
            }

            const [calendarRes, categoriesRes] = await Promise.all([
                axios.get(`${API_URL}/api/club/rights/calendar?start=${start}&end=${end}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/club/rights/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setAllocations(calendarRes.data?.allocations || calendarRes.data || []);
            setCategories(categoriesRes.data?.categories || categoriesRes.data || []);
        } catch (err) {
            console.error('Error fetching calendar data:', err);
            // Demo data
            setAllocations(getDemoAllocations());
            setCategories(getDemoCategories());
        } finally {
            setLoading(false);
        }
    };

    const getDemoCategories = () => [
        { id: 1, codice: 'naming', nome: 'Naming Rights', colore: '#6366F1' },
        { id: 2, codice: 'kit', nome: 'Kit Rights', colore: '#EC4899' },
        { id: 3, codice: 'digital', nome: 'Digital Rights', colore: '#3B82F6' },
        { id: 4, codice: 'broadcast', nome: 'Broadcast Rights', colore: '#F59E0B' }
    ];

    const getDemoAllocations = () => {
        const year = currentDate.getFullYear();
        return [
            {
                id: 1,
                title: 'Main Sponsor Maglia - Fly Emirates',
                start: `${year}-07-01`,
                end: `${year + 2}-06-30`,
                color: '#EC4899',
                extendedProps: { right_id: 1, sponsor_id: 1, status: 'attiva', prezzo: 10500000 }
            },
            {
                id: 2,
                title: 'Naming Rights Stadio - Allianz',
                start: `${year}-01-01`,
                end: `${year + 4}-12-31`,
                color: '#6366F1',
                extendedProps: { right_id: 2, sponsor_id: 2, status: 'attiva', prezzo: 5000000 }
            },
            {
                id: 3,
                title: 'LED Curva Nord - Coca Cola',
                start: `${year}-08-01`,
                end: `${year + 1}-05-31`,
                color: '#F59E0B',
                extendedProps: { right_id: 3, sponsor_id: 3, status: 'attiva', prezzo: 250000 }
            },
            {
                id: 4,
                title: 'Website Presenting - Samsung',
                start: `${year}-09-01`,
                end: `${year + 1}-08-31`,
                color: '#3B82F6',
                extendedProps: { right_id: 4, sponsor_id: 4, status: 'attiva', prezzo: 150000 }
            }
        ];
    };

    // Navigation
    const navigatePrev = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1));
        }
    };

    const navigateNext = () => {
        if (view === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else {
            setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1));
        }
    };

    const navigateToday = () => {
        setCurrentDate(new Date());
    };

    // Format currency
    const formatCurrency = (value) => {
        if (!value) return '-';
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Get allocations for a specific month
    const getAllocationsForMonth = (year, month) => {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        return allocations.filter(alloc => {
            const allocStart = new Date(alloc.start);
            const allocEnd = new Date(alloc.end);
            return allocStart <= monthEnd && allocEnd >= monthStart;
        });
    };

    // Calculate position and width for timeline bar
    const calculateBarStyle = (alloc, viewStart, viewEnd) => {
        const allocStart = new Date(alloc.start);
        const allocEnd = new Date(alloc.end);

        const effectiveStart = allocStart < viewStart ? viewStart : allocStart;
        const effectiveEnd = allocEnd > viewEnd ? viewEnd : allocEnd;

        const totalDays = (viewEnd - viewStart) / (1000 * 60 * 60 * 24);
        const startOffset = (effectiveStart - viewStart) / (1000 * 60 * 60 * 24);
        const duration = (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24);

        const left = (startOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100 - left, width)}%`,
            backgroundColor: alloc.color
        };
    };

    // Render year timeline view
    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        return (
            <div className="timeline-container">
                {/* Month headers */}
                <div className="timeline-header">
                    <div className="timeline-label"></div>
                    <div className="timeline-months">
                        {months.map((month, i) => (
                            <div key={i} className="month-header">
                                {month.substring(0, 3)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Allocations */}
                <div className="timeline-body">
                    {allocations.map(alloc => (
                        <div key={alloc.id} className="timeline-row">
                            <div className="timeline-label">
                                <span className="alloc-title">{alloc.title}</span>
                            </div>
                            <div className="timeline-track">
                                <div
                                    className="timeline-bar"
                                    style={calculateBarStyle(alloc, yearStart, yearEnd)}
                                    onClick={() => navigate(`/club/rights/${alloc.extendedProps?.right_id}`)}
                                >
                                    <span className="bar-label">{alloc.title.split(' - ')[1]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Month grid lines */}
                <div className="timeline-grid">
                    {months.map((_, i) => (
                        <div key={i} className="grid-line" style={{ left: `${(i / 12) * 100}%` }}></div>
                    ))}
                </div>
            </div>
        );
    };

    // Render month view with cards
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthAllocations = getAllocationsForMonth(year, month);

        return (
            <div className="month-view">
                {monthAllocations.length === 0 ? (
                    <div className="empty-state">
                        <HiOutlineCalendarDays size={48} />
                        <h4>Nessuna allocazione in questo mese</h4>
                        <p>Non ci sono allocazioni attive per {months[month]} {year}</p>
                    </div>
                ) : (
                    <div className="allocations-grid">
                        {monthAllocations.map(alloc => (
                            <div
                                key={alloc.id}
                                className="allocation-card"
                                onClick={() => navigate(`/club/rights/${alloc.extendedProps?.right_id}`)}
                            >
                                <div className="card-color" style={{ backgroundColor: alloc.color }}></div>
                                <div className="card-content">
                                    <h4>{alloc.title}</h4>
                                    <div className="card-meta">
                                        <span className="meta-item">
                                            <HiOutlineCalendarDays size={14} />
                                            {new Date(alloc.start).toLocaleDateString('it-IT')} - {new Date(alloc.end).toLocaleDateString('it-IT')}
                                        </span>
                                        <span className="meta-item">
                                            <HiOutlineCurrencyEuro size={14} />
                                            {formatCurrency(alloc.extendedProps?.prezzo)}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${alloc.extendedProps?.status}`}>
                                        {alloc.extendedProps?.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/club/rights')}>
                        <HiOutlineArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="page-title">Calendario Allocazioni</h1>
                        <p className="page-subtitle">Timeline delle allocazioni dei diritti</p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="calendar-toolbar">
                <div className="nav-controls">
                    <button className="btn btn-outline" onClick={navigateToday}>
                        Oggi
                    </button>
                    <div className="nav-arrows">
                        <button className="btn-icon" onClick={navigatePrev}>
                            <HiOutlineChevronLeft size={20} />
                        </button>
                        <button className="btn-icon" onClick={navigateNext}>
                            <HiOutlineChevronRight size={20} />
                        </button>
                    </div>
                    <h2 className="current-period">
                        {view === 'month'
                            ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                            : currentDate.getFullYear()
                        }
                    </h2>
                </div>

                <div className="view-controls">
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
                            onClick={() => setView('month')}
                        >
                            Mese
                        </button>
                        <button
                            className={`toggle-btn ${view === 'year' ? 'active' : ''}`}
                            onClick={() => setView('year')}
                        >
                            Anno
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="legend">
                {categories.map(cat => (
                    <div key={cat.id} className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: cat.colore }}></span>
                        <span>{cat.nome}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Content */}
            <div className="calendar-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Caricamento...</p>
                    </div>
                ) : view === 'year' ? (
                    renderYearView()
                ) : (
                    renderMonthView()
                )}
            </div>

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 24px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .btn-back {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    cursor: pointer;
                }

                .page-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                }

                .page-subtitle {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin: 4px 0 0 0;
                }

                /* Toolbar */
                .calendar-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding: 16px 20px;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                }

                .nav-controls {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .nav-arrows {
                    display: flex;
                    gap: 4px;
                }

                .current-period {
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                }

                .view-toggle {
                    display: flex;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    padding: 4px;
                }

                .toggle-btn {
                    padding: 8px 16px;
                    border: none;
                    background: none;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .toggle-btn.active {
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                /* Legend */
                .legend {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .legend-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 3px;
                }

                /* Calendar Content */
                .calendar-content {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    overflow: hidden;
                    min-height: 400px;
                }

                /* Timeline View */
                .timeline-container {
                    position: relative;
                    padding: 0;
                }

                .timeline-header {
                    display: flex;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-secondary);
                }

                .timeline-label {
                    width: 250px;
                    flex-shrink: 0;
                    padding: 12px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                }

                .timeline-months {
                    flex: 1;
                    display: flex;
                }

                .month-header {
                    flex: 1;
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    border-left: 1px solid var(--border-light);
                }

                .timeline-body {
                    position: relative;
                }

                .timeline-row {
                    display: flex;
                    border-bottom: 1px solid var(--border-light);
                }

                .timeline-row:last-child {
                    border-bottom: none;
                }

                .timeline-row .timeline-label {
                    display: flex;
                    align-items: center;
                    border-right: 1px solid var(--border-color);
                }

                .alloc-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .timeline-track {
                    flex: 1;
                    position: relative;
                    height: 50px;
                    padding: 10px 0;
                }

                .timeline-bar {
                    position: absolute;
                    height: 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .timeline-bar:hover {
                    transform: scaleY(1.1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }

                .bar-label {
                    font-size: 11px;
                    font-weight: 500;
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .timeline-grid {
                    position: absolute;
                    top: 0;
                    left: 250px;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                }

                .grid-line {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    background: var(--border-light);
                }

                /* Month View */
                .month-view {
                    padding: 20px;
                }

                .allocations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }

                .allocation-card {
                    display: flex;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .allocation-card:hover {
                    border-color: var(--primary-green);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }

                .card-color {
                    width: 6px;
                    flex-shrink: 0;
                }

                .card-content {
                    flex: 1;
                    padding: 16px;
                }

                .card-content h4 {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                }

                .card-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 12px;
                }

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-badge.attiva {
                    background: #10B98120;
                    color: #10B981;
                }

                .status-badge.conclusa {
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
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
                    opacity: 0.5;
                    margin-bottom: 16px;
                }

                .empty-state h4 {
                    margin: 0 0 8px 0;
                    color: var(--text-primary);
                }

                .empty-state p {
                    margin: 0;
                }

                /* Loading */
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 60px;
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

                /* Buttons */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border: none;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                }

                .btn-icon:hover {
                    background: var(--bg-tertiary);
                    color: var(--text-primary);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .calendar-toolbar {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .timeline-label {
                        width: 150px;
                    }

                    .allocations-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}

export default RightsCalendar;
