import { createContext, useContext, useState, useEffect } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === 'true';
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Persist collapsed state
    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed);
    }, [isCollapsed]);

    // Close mobile menu on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsMobileOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when mobile menu open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
    const closeMobile = () => setIsMobileOpen(false);
    const openMobile = () => setIsMobileOpen(true);

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            setIsCollapsed,
            toggleCollapsed,
            isMobileOpen,
            setIsMobileOpen,
            toggleMobile,
            closeMobile,
            openMobile
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}

export default SidebarContext;
