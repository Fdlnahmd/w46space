import { Link, useLocation } from 'react-router-dom';
import { Building, BookOpen, LogOut, LayoutDashboard } from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const navItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius)',
    color: isActive(path) ? 'var(--color-primary)' : 'var(--color-text-muted)',
    backgroundColor: isActive(path) ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
    fontWeight: isActive(path) ? 600 : 500,
    marginBottom: '0.5rem',
    transition: 'var(--transition)'
  });

  return (
    <aside style={{
      width: '250px',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
        <h2 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={24} />
          Admin Panel
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        <Link to="/admin" style={navItemStyle('/admin/dashboard')}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/admin/ruangan" style={navItemStyle('/admin/ruangan')}>
          <Building size={20} />
          Kelola Ruangan
        </Link>
        <Link to="/admin/pemesanan" style={navItemStyle('/admin/pemesanan')}>
          <BookOpen size={20} />
          Kelola Pemesanan
        </Link>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <Link to="/" style={{
          ...navItemStyle('/logout'),
          color: 'var(--color-danger)'
        }}>
          <LogOut size={20} />
          Kembali ke Web
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
