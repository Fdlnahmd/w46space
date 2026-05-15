import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, LogIn, User, LogOut, ClipboardList, Menu, X, Star } from 'lucide-react';
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
      borderBottom: isMenuOpen ? 'none' : '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: isMenuOpen ? 'none' : 'none' // Explicitly no shadow
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* Logo */}
        <Link to="/" onClick={closeMenu} style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-text-main)',
          flexShrink: 0, whiteSpace: 'nowrap', marginRight: '1rem'
        }}>
          <Building2 size={28} color="var(--color-primary)" />
          <span style={{ letterSpacing: '-0.5px' }}>Sewa Ruang</span>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-desktop" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 500, whiteSpace: 'nowrap' }}>Beranda</Link>
          <Link to="/ruangan" style={{ color: 'var(--color-text-main)', fontWeight: 500, whiteSpace: 'nowrap' }}>Daftar Ruangan</Link>
          <Link to="/populer" 
            className="populer-link"
            style={{ 
              color: 'var(--color-warning)', fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}
          >
            Populer <Star size={16} fill="var(--color-warning)" />
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.25rem' }}>
              {user.role === 'user' && (
                <Link to="/pesanan-saya" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  <ClipboardList size={18} /> Pesanan Saya
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <Calendar size={18} /> Panel Admin
                </Link>
              )}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '20px', color: 'var(--color-text-main)', fontWeight: 500 }}>
                <User size={14} color="var(--color-primary)" /> {user.name.split(' ')[0].toLowerCase()}
              </Link>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem' }}>Masuk</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Daftar</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="nav-mobile-toggle" onClick={toggleMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center' }}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="nav-mobile-menu" style={{
          position: 'fixed', top: '63px', left: 0, right: 0, bottom: 0,
          backgroundColor: 'var(--color-surface)', zIndex: 90,
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          overflowY: 'auto'
        }}>
          <Link to="/" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Beranda</Link>
          <Link to="/ruangan" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Daftar Ruangan</Link>
          <Link to="/populer" onClick={closeMenu} className="populer-link" style={{ 
            fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-warning)',
            display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            Ruangan Populer <Star size={20} fill="var(--color-warning)" />
          </Link>
          
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
                  <Calendar size={20} /> Panel Admin
                </Link>
              )}
              <Link to="/profile" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                <User size={20} /> Profil Saya
              </Link>
              <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }}>
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

      {/* Style for Responsive Visibility */}
      <style>{`
        @media (max-width: 991px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
        @media (min-width: 992px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-toggle { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
