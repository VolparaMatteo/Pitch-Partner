import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import { getAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import { adminAPI } from '../services/api';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/topbar.css';

// Icons
import {
    HiOutlineBars3,
    HiOutlineMagnifyingGlass,
    HiOutlineBell,
    HiOutlinePlus,
    HiOutlineQuestionMarkCircle,
    HiOutlineCog6Tooth,
    HiOutlineChevronDown,
    HiOutlineUser,
    HiOutlineArrowRightOnRectangle,
    HiOutlineSparkles,
    HiOutlineDocumentText,
    HiOutlineUserGroup,
    HiOutlineCalendarDays,
    HiOutlineRectangleStack
} from 'react-icons/hi2';

// Breadcrumb configuration
const breadcrumbConfig = {
    // Admin routes
    '/admin/profile': { title: 'Profilo', breadcrumb: ['Profilo'] },
    '/admin/leads': { title: 'Pipeline Lead', breadcrumb: ['CRM', 'Lead'] },
    '/admin/notifiche': { title: 'Centro Notifiche', breadcrumb: ['Admin', 'Notifiche'] },
    '/admin/dashboard': { title: 'Dashboard', breadcrumb: ['Admin', 'Dashboard'] },
    '/admin/clubs': { title: 'Club', breadcrumb: ['Admin', 'Club'] },
    '/admin/contratti': { title: 'Contratti', breadcrumb: ['Admin', 'Contratti'] },
    '/admin/finanze': { title: 'Finanze', breadcrumb: ['Admin', 'Finanze'] },
    '/admin/andamento': { title: 'Andamento', breadcrumb: ['Admin', 'Andamento'] },

    // Club routes
    '/club/dashboard': { title: 'Dashboard', breadcrumb: ['Home'] },
    '/club/analytics': { title: 'Analytics', breadcrumb: ['Home', 'Analytics'] },
    '/club/profile': { title: 'Profilo Club', breadcrumb: ['Home', 'Profilo'] },
    '/club/marketplace': { title: 'Marketplace', breadcrumb: ['Home', 'Marketplace'] },
    '/club/leads': { title: 'Lead', breadcrumb: ['Home', 'Lead'] },
    '/club/sponsors': { title: 'Sponsor', breadcrumb: ['Home', 'Sponsor'] },
    '/club/contracts': { title: 'Contratti', breadcrumb: ['Home', 'Contratti'] },
    '/matches': { title: 'Calendario Partite', breadcrumb: ['Home', 'Partite'] },
    '/events': { title: 'Calendario Eventi', breadcrumb: ['Home', 'Eventi'] },
    '/resources': { title: 'Knowledge Base', breadcrumb: ['Home', 'Risorse'] },
    '/best-practice-events': { title: 'Formazione', breadcrumb: ['Home', 'Formazione'] },

    // Sponsor routes
    '/sponsor/dashboard': { title: 'Dashboard', breadcrumb: ['Home'] },
    '/sponsor/profile': { title: 'Profilo Sponsor', breadcrumb: ['Home', 'Profilo'] },
    '/sponsor/contracts': { title: 'I Miei Contratti', breadcrumb: ['Home', 'Contratti'] },
    '/sponsor/projects': { title: 'Progetti', breadcrumb: ['Home', 'Progetti'] },
    '/sponsor/budgets': { title: 'Budget', breadcrumb: ['Home', 'Budget'] },
    '/sponsor/marketplace': { title: 'Marketplace', breadcrumb: ['Home', 'Marketplace'] },
    '/sponsor-network': { title: 'Network', breadcrumb: ['Home', 'Network'] },

    // Common routes
    '/messages': { title: 'Messaggi', breadcrumb: ['Home', 'Messaggi'] },
    '/notifications': { title: 'Notifiche', breadcrumb: ['Home', 'Notifiche'] },
    '/pitchy': { title: 'Pitchy AI', breadcrumb: ['Home', 'Pitchy'] },
};

function Topbar() {
    const { isCollapsed, toggleCollapsed, toggleMobile } = useSidebar();
    const location = useLocation();
    const navigate = useNavigate();

    // State for dropdowns
    const [showSearch, setShowSearch] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const searchTimerRef = useRef(null);

    // Initialize user and listen for updates
    useEffect(() => {
        const { user } = getAuth();
        setCurrentUser(user);

        const handleUserUpdate = (e) => {
            setCurrentUser(e.detail);
        };

        window.addEventListener('userUpdated', handleUserUpdate);
        return () => window.removeEventListener('userUpdated', handleUserUpdate);
    }, []);

    const user = currentUser;

    // Refs for click outside
    const searchRef = useRef(null);
    const quickActionsRef = useRef(null);
    const userMenuRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearch(false);
            }
            if (quickActionsRef.current && !quickActionsRef.current.contains(e.target)) {
                setShowQuickActions(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setShowSearch(false);
        setShowQuickActions(false);
        setShowUserMenu(false);
        setSearchQuery('');
        setSearchResults([]);
    }, [location.pathname]);

    // Get page info
    const getPageInfo = () => {
        const path = location.pathname;

        // Exact match
        if (breadcrumbConfig[path]) {
            return breadcrumbConfig[path];
        }

        // Pattern match for dynamic routes
        if (path.startsWith('/club/sponsors/')) {
            return { title: 'Dettaglio Sponsor', breadcrumb: ['Home', 'Sponsor', 'Dettaglio'] };
        }
        if (path.startsWith('/club/contracts/')) {
            return { title: 'Dettaglio Contratto', breadcrumb: ['Home', 'Contratti', 'Dettaglio'] };
        }
        if (path.startsWith('/club/leads/')) {
            return { title: 'Dettaglio Lead', breadcrumb: ['Home', 'Lead', 'Dettaglio'] };
        }
        if (path.startsWith('/admin/leads/') && path !== '/admin/leads/new') {
            return { title: 'Dettaglio Lead', breadcrumb: ['CRM', 'Lead', 'Dettaglio'] };
        }
        if (path === '/admin/leads/new') {
            return { title: 'Nuovo Lead', breadcrumb: ['CRM', 'Lead', 'Nuovo'] };
        }
        if (path.startsWith('/admin/clubs/')) {
            return { title: 'Dettaglio Club', breadcrumb: ['Home', 'Club', 'Dettaglio'] };
        }
        if (path.startsWith('/sponsor/contracts/')) {
            return { title: 'Dettaglio Contratto', breadcrumb: ['Home', 'Contratti', 'Dettaglio'] };
        }
        if (path.startsWith('/matches/')) {
            return { title: 'Dettaglio Partita', breadcrumb: ['Home', 'Partite', 'Dettaglio'] };
        }
        if (path.startsWith('/events/')) {
            return { title: 'Dettaglio Evento', breadcrumb: ['Home', 'Eventi', 'Dettaglio'] };
        }

        // Default
        return { title: 'Pitch Partner', breadcrumb: ['Home'] };
    };

    // Quick actions based on role
    const getQuickActions = () => {
        if (user?.role === 'club') {
            return [
                { icon: HiOutlineUserGroup, label: 'Nuovo Sponsor', action: () => navigate('/club/sponsors/new'), color: 'green' },
                { icon: HiOutlineDocumentText, label: 'Nuovo Contratto', action: () => navigate('/club/contracts/new'), color: 'blue' },
                { icon: HiOutlineCalendarDays, label: 'Nuova Partita', action: () => navigate('/matches/new'), color: 'purple' },
                { icon: HiOutlineSparkles, label: 'Chiedi a Pitchy', action: () => navigate('/pitchy'), color: 'amber' },
            ];
        }
        if (user?.role === 'sponsor') {
            return [
                { icon: HiOutlineSparkles, label: 'Chiedi a Pitchy', action: () => navigate('/pitchy'), color: 'amber' },
                { icon: HiOutlineRectangleStack, label: 'Nuovo Progetto', action: () => navigate('/sponsor/projects/new'), color: 'blue' },
            ];
        }
        if (user?.role === 'admin') {
            // Menu admin da ricostruire
            return [];
        }
        return [];
    };

    // Debounced search
    const performSearch = useCallback(async (query) => {
        if (!query || query.length < 2 || user?.role !== 'admin') {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }
        try {
            setSearchLoading(true);
            const res = await adminAPI.globalSearch(query);
            setSearchResults(res.data.results || []);
        } catch (err) {
            console.error('Errore ricerca:', err);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, [user?.role]);

    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (value.length >= 2) {
            setSearchLoading(true);
            searchTimerRef.current = setTimeout(() => performSearch(value), 300);
        } else {
            setSearchResults([]);
            setSearchLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(searchQuery);
    };

    const handleSearchResultClick = (result) => {
        navigate(result.link);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Search result type config
    const SEARCH_TYPE_CONFIG = {
        lead: { label: 'Lead', icon: '🎯', color: '#3B82F6' },
        club: { label: 'Club', icon: '🏟️', color: '#059669' },
        contratto: { label: 'Contratto', icon: '📄', color: '#F59E0B' },
        fattura: { label: 'Fattura', icon: '💶', color: '#DC2626' }
    };

    const pageInfo = getPageInfo();
    const quickActions = getQuickActions();

    if (!user) return null;

    return (
        <header className={`topbar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="topbar-left">
                {/* Sidebar Toggle */}
                <button
                    className="topbar-toggle"
                    onClick={() => {
                        if (window.innerWidth <= 768) {
                            toggleMobile();
                        } else {
                            toggleCollapsed();
                        }
                    }}
                    aria-label="Toggle sidebar"
                >
                    <HiOutlineBars3 size={22} />
                </button>

                {/* Breadcrumb */}
                <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
                    {pageInfo.breadcrumb.map((item, idx) => (
                        <span key={idx} className="breadcrumb-item">
                            {idx > 0 && <span className="breadcrumb-separator">/</span>}
                            <span className={idx === pageInfo.breadcrumb.length - 1 ? 'current' : ''}>
                                {item}
                            </span>
                        </span>
                    ))}
                </nav>

                {/* Page Title (mobile) */}
                <h1 className="topbar-title-mobile">{pageInfo.title}</h1>
            </div>

            <div className="topbar-center">
                {/* Search Bar */}
                <div className="topbar-search" ref={searchRef}>
                    <button
                        className="search-trigger"
                        onClick={() => setShowSearch(!showSearch)}
                        aria-expanded={showSearch}
                        aria-label="Cerca"
                    >
                        <HiOutlineMagnifyingGlass size={20} />
                        <span className="search-placeholder">Cerca...</span>
                        <kbd className="search-shortcut">⌘K</kbd>
                    </button>

                    {showSearch && (
                        <div className="search-dropdown">
                            <form onSubmit={handleSearch}>
                                <div className="search-input-wrapper">
                                    <HiOutlineMagnifyingGlass size={20} />
                                    <input
                                        type="text"
                                        placeholder={user?.role === 'admin' ? 'Cerca lead, club, contratti, fatture...' : 'Cerca sponsor, contratti, eventi...'}
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </form>

                            {user?.role === 'admin' && searchQuery.length >= 2 ? (
                                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                    {searchLoading ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                            Ricerca in corso...
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <>
                                            {/* Group results by type */}
                                            {Object.entries(
                                                searchResults.reduce((acc, r) => {
                                                    if (!acc[r.type]) acc[r.type] = [];
                                                    acc[r.type].push(r);
                                                    return acc;
                                                }, {})
                                            ).map(([type, items]) => (
                                                <div key={type}>
                                                    <div style={{
                                                        padding: '8px 16px 4px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        color: '#9CA3AF'
                                                    }}>
                                                        {SEARCH_TYPE_CONFIG[type]?.icon} {SEARCH_TYPE_CONFIG[type]?.label || type}
                                                    </div>
                                                    {items.map((result, idx) => (
                                                        <button
                                                            key={`${type}-${idx}`}
                                                            className="dropdown-item"
                                                            onClick={() => handleSearchResultClick(result)}
                                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                                                        >
                                                            <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                                                                {result.title}
                                                            </span>
                                                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                                {result.subtitle}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                            <div style={{
                                                padding: '8px 16px',
                                                fontSize: '12px',
                                                color: '#9CA3AF',
                                                textAlign: 'center',
                                                borderTop: '1px solid #E5E7EB',
                                                marginTop: '4px'
                                            }}>
                                                {searchResults.length} risultati trovati
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                            Nessun risultato per "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="search-hint">
                                        <span>Premi <kbd>Enter</kbd> per cercare</span>
                                        <span>Premi <kbd>Esc</kbd> per chiudere</span>
                                    </div>
                                    {searchQuery.length > 0 && searchQuery.length < 2 && (
                                        <div style={{ padding: '12px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                                            Digita almeno 2 caratteri...
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="topbar-right">
                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <div className="topbar-quick-actions" ref={quickActionsRef}>
                        <button
                            className="quick-actions-trigger"
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            aria-expanded={showQuickActions}
                            aria-label="Azioni rapide"
                        >
                            <HiOutlinePlus size={20} />
                            <span className="quick-actions-label">Nuovo</span>
                            <HiOutlineChevronDown size={16} className={showQuickActions ? 'rotated' : ''} />
                        </button>

                        {showQuickActions && (
                            <div className="quick-actions-dropdown">
                                <div className="dropdown-header">Azioni Rapide</div>
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        className="dropdown-item"
                                        onClick={() => {
                                            action.action();
                                            setShowQuickActions(false);
                                        }}
                                    >
                                        <span className={`dropdown-icon ${action.color}`}>
                                            <action.icon size={18} />
                                        </span>
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Help Button - solo per club/sponsor */}
                {user?.role !== 'admin' && (
                    <button
                        className="topbar-btn"
                        onClick={() => navigate('/centro-assistenza')}
                        aria-label="Aiuto"
                        title="Aiuto"
                    >
                        <HiOutlineQuestionMarkCircle size={22} />
                    </button>
                )}

                {/* Notifications */}
                <button
                    className="topbar-btn"
                    onClick={() => navigate(user?.role === 'admin' ? '/admin/notifiche' : '/notifications')}
                    aria-label="Notifiche"
                    title="Notifiche"
                >
                    <HiOutlineBell size={22} />
                </button>

                {/* User Menu */}
                <div className="topbar-user-menu" ref={userMenuRef}>
                    <button
                        className="user-menu-trigger"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        aria-expanded={showUserMenu}
                        aria-label="Menu utente"
                    >
                        <img
                            src={user.role === 'admin'
                                ? (user.avatar ? getImageUrl(user.avatar) : FavIcon)
                                : (user.logo_url ? getImageUrl(user.logo_url) : FavIcon)}
                            alt=""
                            className="user-menu-avatar"
                        />
                        <HiOutlineChevronDown size={16} className={showUserMenu ? 'rotated' : ''} />
                    </button>

                    {showUserMenu && (
                        <div className="user-menu-dropdown">
                            <div className="user-menu-header">
                                <img
                                    src={user.role === 'admin'
                                        ? (user.avatar ? getImageUrl(user.avatar) : FavIcon)
                                        : (user.logo_url ? getImageUrl(user.logo_url) : FavIcon)}
                                    alt=""
                                    className="user-menu-avatar-large"
                                />
                                <div className="user-menu-info">
                                    <div className="user-menu-name">
                                        {user.role === 'club' ? user.nome :
                                         user.role === 'sponsor' ? user.ragione_sociale :
                                         user.role === 'admin' ? user.full_name :
                                         user.email}
                                    </div>
                                    <div className="user-menu-role">
                                        {user.role === 'admin' ? 'Amministratore' :
                                         user.role === 'club' ? 'Club Manager' : 'Sponsor'}
                                    </div>
                                </div>
                            </div>
                            <div className="user-menu-items">
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        navigate(user.role === 'club' ? '/club/profile' :
                                                 user.role === 'sponsor' ? '/sponsor/profile' :
                                                 user.role === 'admin' ? '/admin/profile' : '#');
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <HiOutlineUser size={18} />
                                    <span>Profilo</span>
                                </button>
                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item danger"
                                    onClick={() => {
                                        // Will be handled by sidebar logout modal
                                        alert('Usa il pulsante Esci nella sidebar');
                                        setShowUserMenu(false);
                                    }}
                                >
                                    <HiOutlineArrowRightOnRectangle size={18} />
                                    <span>Esci</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Topbar;
