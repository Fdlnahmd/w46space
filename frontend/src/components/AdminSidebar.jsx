import { Link, useLocation } from 'react-router-dom';
import { Building, BookOpen, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const navItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius)',
    color: isActive(path) ? 'var(--color-primary)' : 'var(--color-text-muted)',
    backgroundColor: isActive(path) ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
    fontWeight: isActive(path) ? 600 : 500,
    marginBottom: '0.25rem',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    fontSize: '0.95rem',
  });

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onToggle();
    }
  };

  const sidebarContent = (
    <aside style={{
      width: '250px',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      minHeight: '100%',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Building size={22} />
          Admin Panel
        </h2>
        {/* Close button on mobile */}
        <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'none' }} className="sidebar-close-btn">
          <X size={22} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        <Link to="/admin" onClick={handleLinkClick} style={navItemStyle('/admin')}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/admin/ruangan" onClick={handleLinkClick} style={navItemStyle('/admin/ruangan')}>
          <Building size={20} /> Kelola Ruangan
        </Link>
        <Link to="/admin/pemesanan" onClick={handleLinkClick} style={navItemStyle('/admin/pemesanan')}>
          <BookOpen size={20} /> Kelola Pemesanan
        </Link>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '3rem', paddingBottom: '2rem' }}>
        <Link to="/" style={{ ...navItemStyle('/logout'), color: '#f87171', marginBottom: 0 }}>
          <LogOut size={20} /> Kembali ke Web
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onToggle}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 200,
            }}
          />
          {/* Slide-in sidebar */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            zIndex: 201,
            display: 'flex',
            overflowY: 'auto',
            backgroundColor: 'var(--color-surface)', // Ensure bg is solid during scroll
          }}>
            {sidebarContent}
          </div>
        </>
      )}

      <style>{`
        .admin-sidebar-desktop {
          display: flex;
        }
        @media (max-width: 768px) {
          .admin-sidebar-desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;
