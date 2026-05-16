import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, User, LogOut, ClipboardList, Menu, X, Star, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/apiService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notif when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (user) {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) { console.error('Notif error:', err); }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchNotifs();
    }, 0);

    const interval = setInterval(() => {
      if (isMounted) fetchNotifs();
    }, 5000); 

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifs]);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { console.error('Mark all read error:', err); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    if (nextState) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
  };

  return (
    <>
      {/* Spacer to prevent content jump because nav is fixed */}
      <div style={{ height: '70px' }} />
      
      <nav style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {/* Logo */}
          <Link to="/" onClick={closeMenu} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.6rem', 
            fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--color-text-main)',
            flexShrink: 0, whiteSpace: 'nowrap'
          }}>
            <Building2 size={30} color="var(--color-primary)" />
            <span style={{ letterSpacing: '-0.5px' }}>Sewa Ruang</span>
          </Link>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', marginRight: '0.75rem' }}>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--color-text-main)', display: 'flex', alignItems: 'center',
                padding: '0.6rem', borderRadius: '50%', backgroundColor: 'var(--color-background)',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user && (
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', position: 'relative', padding: '0.6rem', borderRadius: '50%', backgroundColor: 'var(--color-background)' }}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '5px', right: '5px',
                      backgroundColor: 'var(--color-danger)', color: 'white',
                      fontSize: '0.65rem', padding: '2px 5px', borderRadius: '10px',
                      fontWeight: 'bold', border: '2px solid var(--color-surface)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="notif-dropdown" style={{
                    position: 'absolute', top: '50px', right: '0', width: '300px',
                    backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    zIndex: 2100, padding: '1.25rem', maxHeight: '450px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notifikasi</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                          <Bell size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', opacity: 0.3 }} />
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Tidak ada notifikasi baru</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => { if (n.link) navigate(n.link); setIsNotifOpen(false); handleMarkRead(n.id); }}
                            style={{
                              padding: '0.75rem', borderRadius: '12px',
                              backgroundColor: n.is_read ? 'transparent' : 'rgba(37, 99, 235, 0.05)',
                              borderLeft: n.is_read ? 'none' : '4px solid var(--color-primary)',
                              cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                            }}
                          >
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: n.is_read ? 'var(--color-text-main)' : 'var(--color-primary)' }}>{n.title}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', opacity: 0.7 }}>{new Date(n.created_at).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="nav-desktop" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.95rem' }}>Beranda</Link>
            <Link to="/ruangan" style={{ color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.95rem' }}>Daftar Ruangan</Link>
            <Link to="/populer" 
              className="populer-link"
              style={{ 
                color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              Populer <Star size={16} fill="var(--color-warning)" />
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem', marginLeft: '0.25rem' }}>
                {user.role === 'admin' ? (
                  <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Calendar size={18} /> Admin
                  </Link>
                ) : (
                  <Link to="/pesanan-saya" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                    <ClipboardList size={18} /> Pesanan
                  </Link>
                )}
                <Link to="/profile" style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  backgroundColor: 'var(--color-background)', padding: '0.4rem 1rem', 
                  borderRadius: '24px', color: 'var(--color-text-main)', fontWeight: 600,
                  border: '1px solid var(--color-border)', fontSize: '0.85rem'
                }}>
                  <User size={14} color="var(--color-primary)" /> {user.name.split(' ')[0]}
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.5rem' }}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>Masuk</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>Daftar</Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="nav-mobile-toggle" 
            onClick={toggleMenu} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--color-text-main)', display: 'flex', alignItems: 'center',
              marginLeft: '0.5rem', zIndex: 3000 
            }}
          >
            {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="nav-mobile-menu" style={{
          position: 'fixed', 
          top: '70px', 
          left: 0, 
          right: 0, 
          bottom: 0,
          height: 'calc(100dvh - 70px)',
          backgroundColor: 'var(--color-surface)', 
          zIndex: 2500,
          padding: '2rem 1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem',
          overflowY: 'auto',
          boxShadow: 'inset 0 10px 15px -3px rgba(0,0,0,0.1)'
        }}>
          <Link to="/" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Beranda</Link>
          <Link to="/ruangan" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>Daftar Ruangan</Link>
          <Link to="/populer" onClick={closeMenu} className="populer-link" style={{ 
            fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-warning)',
            display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            Ruangan Populer <Star size={20} fill="var(--color-warning)" />
          </Link>

          <button 
            onClick={toggleTheme} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: 0
            }}
          >
            {theme === 'light' ? <><Moon size={20} /> Mode Gelap</> : <><Sun size={20} /> Mode Terang</>}
          </button>
          
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
    </>
  );
};

export default Navbar;
