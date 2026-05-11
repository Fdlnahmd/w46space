import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, LogIn, User, LogOut, ClipboardList, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav style={{
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo */}
        <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-text-main)' }}>
          <Building2 size={28} color="var(--color-primary)" />
          <span style={{ letterSpacing: '-0.5px' }}>SewaRuang</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hide-on-mobile" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Beranda</Link>
          <Link to="/ruangan" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Daftar Ruangan</Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '2px solid var(--color-border)', paddingLeft: '1.5rem' }}>
              {user.role === 'user' && (
                <Link to="/pesanan-saya" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
                  <ClipboardList size={18} /> Pesanan Saya
                </Link>
              )}

              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Calendar size={16} /> Admin Panel
                </Link>
              )}

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 600 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} color="var(--color-primary)" />
                </div>
                {user.name || user.nama}
              </Link>

              <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.75rem', color: 'var(--color-danger)', backgroundColor: 'transparent' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', borderLeft: '2px solid var(--color-border)', paddingLeft: '1.5rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>Masuk</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Daftar</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md-hidden" onClick={toggleMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center' }}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed', top: '65px', left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--color-surface)', zIndex: 90,
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          borderTop: '1px solid var(--color-border)'
        }}>
          <Link to="/" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Beranda</Link>
          <Link to="/ruangan" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Daftar Ruangan</Link>
          
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '0.5rem 0' }} />

          {user ? (
            <>
              {user.role === 'user' && (
                <Link to="/pesanan-saya" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  <ClipboardList size={20} /> Pesanan Saya
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  <Calendar size={20} /> Admin Panel
                </Link>
              )}
              <Link to="/profile" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                <User size={20} /> Profil Saya
              </Link>
              <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', marginTop: 'auto' }}>
                <LogOut size={18} /> Keluar
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" onClick={closeMenu} className="btn btn-outline" style={{ width: '100%' }}>Masuk</Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary" style={{ width: '100%' }}>Daftar</Link>
            </div>
          )}
        </div>
      )}

      {/* Style for Mobile Toggle Visibility */}
      <style>{`
        @media (min-width: 768px) {
          .md-hidden { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
