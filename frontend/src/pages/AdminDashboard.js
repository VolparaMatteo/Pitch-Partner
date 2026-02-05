import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/auth';
import Sidebar from '../components/Sidebar';
import {
  HiOutlineCursorArrowRays,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineWallet,
  HiOutlineBell,
  HiOutlineChartBar
} from 'react-icons/hi2';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = getAuth();

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sections = [
    { label: 'Lead', path: '/admin/leads', icon: HiOutlineCursorArrowRays, color: '#F59E0B' },
    { label: 'Club', path: '/admin/clubs', icon: HiOutlineUserGroup, color: '#8B5CF6' },
    { label: 'Contratti', path: '/admin/contratti', icon: HiOutlineDocumentText, color: '#3B82F6' },
    { label: 'Finanze', path: '/admin/finanze', icon: HiOutlineWallet, color: '#059669' },
    { label: 'Notifiche', path: '/admin/notifiche', icon: HiOutlineBell, color: '#EF4444' },
    { label: 'Andamento', path: '/admin/andamento', icon: HiOutlineChartBar, color: '#06B6D4' },
  ];

  return (
    <div className="tp-page-container" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          Benvenuto, {user?.full_name || 'Admin'}
        </h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '6px 0 0' }}>
          {today}
        </p>
        <p style={{ fontSize: 15, color: '#9CA3AF', margin: '4px 0 0' }}>
          Pannello di amministrazione Pitch Partner
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16
      }}>
        {sections.map((s) => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '20px 18px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.boxShadow = `0 4px 12px ${s.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `${s.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2937' }}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
