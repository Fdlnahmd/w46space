import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, LogIn, User, LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '1rem 0'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-text-main)' }}>
          <Building2 size={24} color="var(--color-primary)" />
          <span>SewaRuang</span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Beranda</Link>
          <Link to="/ruangan" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Daftar Ruangan</Link>

          {/* Menu saat SUDAH login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>

              {/* "Pesanan Saya" hanya untuk user biasa */}
              {user.role === 'user' && (
                <Link
                  to="/pesanan-saya"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500 }}
                >
                  <ClipboardList size={17} />
                  Pesanan Saya
                </Link>
              )}

              {/* "Admin Panel" hanya untuk admin */}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                >
                  <Calendar size={16} />
                  Admin Panel
                </Link>
              )}

              {/* Info user */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
                <User size={17} color="var(--color-primary)" />
                {user.nama}
              </div>

              {/* Tombol Keluar */}
              <button
                onClick={handleLogout}
                className="btn"
                style={{ padding: '0.4rem 0.75rem', color: 'var(--color-danger)', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          ) : (
            /* Menu saat BELUM login */
            <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogIn size={17} /> Masuk
              </Link>
              <Link to="/register" className="btn btn-primary">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
