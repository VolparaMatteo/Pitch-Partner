import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '../contexts/SidebarContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import '../styles/sidebar.css';
import '../styles/topbar.css';
import AdminPitchyWidget from './AdminPitchyWidget';

function LayoutContent({ children }) {
    const location = useLocation();

    // Don't show sidebar/topbar on login pages
    const isLoginPage = ['/', '/login', '/admin/login', '/club/login', '/sponsor/login'].includes(location.pathname);

    // Fullscreen pages (no sidebar, topbar, footer)
    // Automation builder pages: /club/automations/new, /club/automations/:id, /club/automations/:id/edit
    // Public proposal pages: /p/:link
    // Public catalog pages: /catalog/:token
    // Club activation pages: /activate/:token
    const isFullscreenPage = location.pathname.startsWith('/club/automations/') ||
                             location.pathname.startsWith('/p/') ||
                             location.pathname.startsWith('/catalog/') ||
                             location.pathname.startsWith('/activate/');

    // Pages without footer (chat-style pages, admin pages)
    const isNoFooterPage = location.pathname === '/messages' || location.pathname.startsWith('/admin');

    // Show Pitchy widget on admin pages (not login)
    const isAdminPage = location.pathname.startsWith('/admin') && !isLoginPage;

    if (isLoginPage || isFullscreenPage) {
        return <>{children}</>;
    }

    return (
        <>
            <div className="app-layout">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Area */}
                <div className="app-main">
                    {/* Topbar */}
                    <Topbar />

                    {/* Content */}
                    <main className="app-content">
                        {children}
                    </main>

                    {/* Footer */}
                    {!isNoFooterPage && <Footer />}
                </div>
            </div>
            {isAdminPage && <AdminPitchyWidget />}
        </>
    );
}

function Layout({ children }) {
    return (
        <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
    );
}

export default Layout;
