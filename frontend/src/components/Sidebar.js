import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationAPI, messageAPI } from '../services/api';
import { getAuth, clearAuth } from '../utils/auth';
import { getImageUrl } from '../utils/imageUtils';
import { useSidebar } from '../contexts/SidebarContext';
import logo from '../static/logo/bianco.png';
import logoIcon from '../static/logo/FavIcon.png';
import FavIcon from '../static/logo/FavIcon.png';
import '../styles/sidebar.css';

// Icons from react-icons (Heroicons 2)
import {
    HiOutlineHome,
    HiOutlineSparkles,
    HiOutlineCursorArrowRays,
    HiOutlineHandRaised,
    HiOutlineDocumentText,
    HiOutlineCalendarDays,
    HiOutlineCalendar,
    HiOutlineBookOpen,
    HiOutlineAcademicCap,
    HiOutlineSquares2X2,
    HiOutlineChartBar,
    HiOutlineUserGroup,
    HiOutlineCreditCard,
    HiOutlineFolderOpen,
    HiOutlineWallet,
    HiOutlineGlobeAlt,
    HiOutlineChatBubbleLeftRight,
    HiOutlineBell,
    HiOutlineArrowRightOnRectangle,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineXMark,
    HiOutlineChevronDown,
    HiOutlineBolt,
    HiOutlineArchiveBox,
    HiOutlineDocumentDuplicate,
    HiOutlineShoppingCart,
    HiOutlineFlag
} from 'react-icons/hi2';

function Sidebar() {
    // Use sidebar context for shared state
    const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobile } = useSidebar();

    // Local state
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Refs
    const sidebarRef = useRef(null);
    const tooltipTimeoutRef = useRef(null);

    // Hooks
    const navigate = useNavigate();
    const location = useLocation();

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

    // Close mobile menu on route change
    useEffect(() => {
        closeMobile();
    }, [location.pathname, closeMobile]);

    // Close logout modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowLogoutModal(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Fetch notification counts
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            fetchUnreadMessagesCount();
            const interval = setInterval(() => {
                fetchUnreadCount();
                fetchUnreadMessagesCount();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Errore nel caricamento notifiche:', error);
        }
    };

    const fetchUnreadMessagesCount = async () => {
        try {
            if (user?.role === 'club' || user?.role === 'sponsor') {
                const response = await messageAPI.getUnreadCount();
                setUnreadMessagesCount(response.data.unread_count);
            }
        } catch (error) {
            console.error('Errore nel caricamento contatore messaggi:', error);
        }
    };

    // Handlers
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        clearAuth();
        navigate('/');
    };

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const handleNavigation = (path) => {
        navigate(path);
        closeMobile();
    };

    const handleTooltipEnter = (itemId) => {
        if (isCollapsed) {
            tooltipTimeoutRef.current = setTimeout(() => {
                setActiveTooltip(itemId);
            }, 200);
        }
    };

    const handleTooltipLeave = () => {
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
        setActiveTooltip(null);
    };

    // Check if path is active (supports nested routes)
    const isPathActive = useCallback((path, exact = false) => {
        if (exact) {
            return location.pathname === path;
        }
        // Special case for dashboard - exact match only
        if (path.endsWith('/dashboard')) {
            return location.pathname === path;
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    }, [location.pathname]);

    // Get dashboard link
    const getDashboardLink = () => {
        if (user?.role === 'admin') return '/admin/dashboard';
        if (user?.role === 'club') return '/club/dashboard';
        if (user?.role === 'sponsor') return '/sponsor/dashboard';
        return '/';
    };

    // Get role display name
    const getRoleDisplayName = (role) => {
        const roleNames = {
            admin: 'Amministratore',
            club: 'Club Manager',
            sponsor: 'Sponsor'
        };
        return roleNames[role] || role;
    };

    // Menu configuration with groups
    const getMenuConfig = () => {
        if (user?.role === 'club') {
            return [
                {
                    id: 'main',
                    items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/club/dashboard', icon: HiOutlineHome },
                        { id: 'crm-calendar', label: 'Calendario', path: '/club/calendar', icon: HiOutlineCalendarDays },
                        { id: 'analytics', label: 'Analytics', path: '/club/analytics', icon: HiOutlineChartBar },
                        { id: 'pitchy', label: 'Pitchy AI', path: '/pitchy', icon: HiOutlineSparkles },
                        { id: 'automations', label: 'Automazioni', path: '/club/automations', icon: HiOutlineBolt },
                    ]
                },
                {
                    id: 'catalog',
                    label: 'Catalogo',
                    items: [
                        { id: 'inventory', label: 'Inventario', path: '/club/inventory', icon: HiOutlineArchiveBox },
                        { id: 'catalogs', label: 'Cataloghi', path: '/club/catalogs', icon: HiOutlineBookOpen },
                        { id: 'proposals', label: 'Proposte', path: '/club/proposals', icon: HiOutlineDocumentDuplicate },
                    ]
                },
                {
                    id: 'acquisition',
                    label: 'Acquisizione',
                    items: [
                        { id: 'leads', label: 'Lead', path: '/club/leads', icon: HiOutlineCursorArrowRays },
                        { id: 'marketplace', label: 'Marketplace', path: '/club/marketplace', icon: HiOutlineShoppingCart },
                    ]
                },
                {
                    id: 'sponsors',
                    label: 'Sponsor',
                    items: [
                        { id: 'sponsors-list', label: 'Sponsor', path: '/club/sponsors', icon: HiOutlineHandRaised },
                        { id: 'contracts', label: 'Contratti', path: '/club/contracts', icon: HiOutlineDocumentText },
                    ]
                },
                {
                    id: 'activities',
                    label: 'Attività',
                    items: [
                        { id: 'matches', label: 'Partite', path: '/matches', icon: HiOutlineCalendarDays },
                        { id: 'events', label: 'Eventi', path: '/events', icon: HiOutlineCalendar },
                    ]
                },
                {
                    id: 'resources',
                    label: 'Risorse',
                    items: [
                        { id: 'resources', label: 'Knowledge Base', path: '/resources', icon: HiOutlineBookOpen },
                        { id: 'training', label: 'Formazione', path: '/best-practice-events', icon: HiOutlineAcademicCap },
                    ]
                },
                {
                    id: 'settings',
                    label: 'Impostazioni',
                    items: [
                        { id: 'users', label: 'Utenti', path: '/club/users', icon: HiOutlineUserGroup },
                    ]
                }
            ];
        } else if (user?.role === 'sponsor') {
            return [
                {
                    id: 'main',
                    items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/sponsor/dashboard', icon: HiOutlineHome },
                        { id: 'analytics', label: 'Analytics', path: '/sponsor/analytics', icon: HiOutlineChartBar },
                        { id: 'pitchy', label: 'Pitchy AI', path: '/pitchy', icon: HiOutlineSparkles },
                    ]
                },
                {
                    id: 'partnership',
                    label: 'Partnership',
                    items: [
                        { id: 'clubs', label: 'I Miei Club', path: '/sponsor/clubs', icon: HiOutlineHandRaised },
                        { id: 'contracts', label: 'Contratti', path: '/sponsor/contracts', icon: HiOutlineDocumentText },
                        { id: 'activations', label: 'Attivazioni', path: '/sponsor/activations', icon: HiOutlineBolt },
                    ]
                },
                {
                    id: 'activities',
                    label: 'Attività',
                    items: [
                        { id: 'events', label: 'Eventi', path: '/sponsor/events', icon: HiOutlineCalendar },
                        { id: 'tasks', label: 'Task', path: '/sponsor/tasks', icon: HiOutlineDocumentText },
                        { id: 'drive', label: 'Drive', path: '/sponsor/drive', icon: HiOutlineFolderOpen },
                    ]
                },
                {
                    id: 'business',
                    label: 'Opportunità',
                    items: [
                        { id: 'marketplace', label: 'Marketplace', path: '/sponsor/marketplace', icon: HiOutlineShoppingCart },
                        { id: 'opportunities', label: 'Opportunità', path: '/sponsor/opportunities', icon: HiOutlineCursorArrowRays },
                    ]
                },
                {
                    id: 'resources',
                    label: 'Risorse',
                    items: [
                        { id: 'resources', label: 'Knowledge Base', path: '/resources', icon: HiOutlineBookOpen },
                        { id: 'training', label: 'Formazione', path: '/best-practice-events', icon: HiOutlineAcademicCap },
                    ]
                }
            ];
        } else if (user?.role === 'admin') {
            return [
                {
                    id: 'main',
                    items: [
                        { id: 'dashboard', label: 'Dashboard', path: '/admin/guida', icon: HiOutlineSquares2X2 },
                        { id: 'obiettivi', label: 'Obiettivi 2026', path: '/admin/obiettivi-2026', icon: HiOutlineFlag },
                        { id: 'andamento', label: 'Andamento', path: '/admin/andamento', icon: HiOutlineChartBar },
                    ]
                },
                {
                    id: 'crm',
                    label: 'CRM',
                    items: [
                        { id: 'clubs', label: 'Club', path: '/admin/clubs', icon: HiOutlineUserGroup },
                        { id: 'contratti', label: 'Contratti', path: '/admin/contratti', icon: HiOutlineDocumentText },
                        { id: 'leads', label: 'Lead', path: '/admin/leads', icon: HiOutlineCursorArrowRays },
                    ]
                },
                {
                    id: 'finanze',
                    label: 'Finanze',
                    items: [
                        { id: 'fatturazione', label: 'Fatturazione', path: '/admin/finanze', icon: HiOutlineWallet },
                    ]
                }
            ];
        }
        return [];
    };

    // Render menu item
    const renderMenuItem = (item) => {
        const isActive = isPathActive(item.path);
        const Icon = item.icon;

        return (
            <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => handleTooltipEnter(item.id)}
                onMouseLeave={handleTooltipLeave}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? item.label : undefined}
            >
                <span className="nav-icon">
                    <Icon size={20} />
                </span>
                <span className="nav-label">{item.label}</span>
                {isCollapsed && activeTooltip === item.id && (
                    <div className="nav-tooltip">{item.label}</div>
                )}
            </button>
        );
    };

    // Render menu group
    const renderMenuGroup = (group) => {
        const isExpanded = expandedGroups[group.id] !== false; // Default to expanded

        if (!group.label) {
            // No label = main items, render directly
            return (
                <div key={group.id} className="nav-group">
                    {group.items.map(renderMenuItem)}
                </div>
            );
        }

        return (
            <div key={group.id} className={`nav-group ${isCollapsed ? 'collapsed' : ''}`}>
                {!isCollapsed && (
                    <button
                        className={`nav-group-header ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => toggleGroup(group.id)}
                        aria-expanded={isExpanded}
                    >
                        <span className="nav-group-label">{group.label}</span>
                        <HiOutlineChevronDown className={`nav-group-chevron ${isExpanded ? 'rotated' : ''}`} size={16} />
                    </button>
                )}
                <div className={`nav-group-items ${!isExpanded && !isCollapsed ? 'hidden' : ''}`}>
                    {group.items.map(renderMenuItem)}
                </div>
            </div>
        );
    };

    if (!user) return null;

    const menuConfig = getMenuConfig();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
                onClick={closeMobile}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
                role="navigation"
                aria-label="Menu principale"
            >
                {/* Header with Logo */}
                <div className="sidebar-header">
                    <img
                        src={isCollapsed ? logoIcon : logo}
                        alt="Pitch Partner"
                        className={`sidebar-logo ${isCollapsed ? 'icon' : ''}`}
                        onClick={() => handleNavigation(getDashboardLink())}
                    />
                    {/* Close button for mobile */}
                    {isMobileOpen && (
                        <button
                            className="mobile-close-btn"
                            onClick={closeMobile}
                            aria-label="Chiudi menu"
                        >
                            <HiOutlineXMark size={24} />
                        </button>
                    )}
                    {/* Collapse toggle for desktop */}
                    {!isMobileOpen && (
                        <button
                            className="collapse-toggle"
                            onClick={toggleCollapsed}
                            aria-label={isCollapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
                        >
                            {isCollapsed ? <HiOutlineChevronRight size={18} /> : <HiOutlineChevronLeft size={18} />}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuConfig.map(renderMenuGroup)}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Quick Actions */}
                    <div className="sidebar-actions">
                        {(user.role === 'club' || user.role === 'sponsor') && (
                            <button
                                className={`action-btn ${isPathActive('/messages') ? 'active' : ''}`}
                                onClick={() => handleNavigation('/messages')}
                                aria-label={`Messaggi${unreadMessagesCount > 0 ? `, ${unreadMessagesCount} non letti` : ''}`}
                                title="Messaggi"
                            >
                                <HiOutlineChatBubbleLeftRight size={20} />
                                {unreadMessagesCount > 0 && (
                                    <span className="badge pulse">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>
                                )}
                            </button>
                        )}
                        <button
                            className={`action-btn ${isPathActive('/notifications') ? 'active' : ''}`}
                            onClick={() => handleNavigation('/notifications')}
                            aria-label={`Notifiche${unreadCount > 0 ? `, ${unreadCount} non lette` : ''}`}
                            title="Notifiche"
                        >
                            <HiOutlineBell size={20} />
                            {unreadCount > 0 && (
                                <span className="badge pulse">{unreadCount > 99 ? '99+' : unreadCount}</span>
                            )}
                        </button>
                    </div>

                    {/* User Profile */}
                    <button
                        className="user-profile"
                        onClick={() => handleNavigation(
                            user.role === 'club' ? '/club/profile' :
                            user.role === 'sponsor' ? '/sponsor/profile' :
                            user.role === 'admin' ? '/admin/profile' :
                            '#'
                        )}
                        aria-label="Profilo utente"
                    >
                        <img
                            src={user.role === 'admin'
                                ? (user.avatar ? getImageUrl(user.avatar) : FavIcon)
                                : (user.logo_url ? getImageUrl(user.logo_url) : FavIcon)}
                            alt=""
                            className="user-avatar"
                        />
                        {!isCollapsed && (
                            <div className="user-info">
                                <div className="user-name">
                                    {user.role === 'club' ? user.nome :
                                     user.role === 'sponsor' ? user.ragione_sociale :
                                     user.role === 'admin' ? user.full_name :
                                     user.email}
                                </div>
                                <div className="user-role">{getRoleDisplayName(user.role)}</div>
                            </div>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        aria-label="Esci"
                        title="Esci"
                    >
                        <HiOutlineArrowRightOnRectangle size={18} />
                        {!isCollapsed && <span>Esci</span>}
                    </button>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
                    <div
                        className="logout-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-title"
                    >
                        <div className="logout-modal-icon">
                            <HiOutlineArrowRightOnRectangle size={32} />
                        </div>
                        <h3 id="logout-title">Conferma uscita</h3>
                        <p>Sei sicuro di voler uscire dalla piattaforma?</p>
                        <div className="logout-modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Annulla
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={confirmLogout}
                            >
                                Esci
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
