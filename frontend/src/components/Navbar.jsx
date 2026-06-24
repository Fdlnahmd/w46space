import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, LogOut, ClipboardList, Menu, X, Star, Sun, Moon, Bell, Headset } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/apiService';

const translateNotification = (title, message, lang) => {
  if (lang === 'id') return { title, message };

  let tTitle = title;
  let tMessage = message;

  if (title === 'Pesanan Baru Masuk!') {
    tTitle = 'New Booking Received!';
  } else if (title.startsWith('Status Pesanan #')) {
    const id = title.replace('Status Pesanan #', '').replace(' Berubah', '');
    tTitle = `Booking #${id} Status Changed`;
  } else if (title === 'Permintaan Fasilitas Baru') {
    tTitle = 'New Add-on Request';
  } else if (title === 'Fasilitas Dikonfirmasi') {
    tTitle = 'Add-on Confirmed';
  } else if (title === 'Pembayaran Berhasil!') {
    tTitle = 'Payment Successful!';
  }

  if (message.startsWith('Pesanan baru dari ')) {
    const match = message.match(/Pesanan baru dari (.*) untuk ruangan (.*)\./);
    if (match) {
      tMessage = `New booking from ${match[1]} for room ${match[2]}.`;
    }
  } else if (message.startsWith('Pesanan Anda untuk ')) {
    const match = message.match(/Pesanan Anda untuk (.*) sekarang berstatus: (.*)\./);
    if (match) {
      let statusStr = match[2];
      if (statusStr === 'Dikonfirmasi') statusStr = 'Confirmed';
      else if (statusStr === 'Pending') statusStr = 'Pending';
      else if (statusStr === 'Selesai') statusStr = 'Completed';
      else if (statusStr === 'Dibatalkan') statusStr = 'Canceled';
      tMessage = `Your booking for ${match[1]} is now: ${statusStr}.`;
    }
  } else if (message.endsWith('meminta tambahan fasilitas. Segera konfirmasi pembayaran.')) {
    const match = message.match(/Pesanan #(.*) meminta tambahan fasilitas\. Segera konfirmasi pembayaran\./);
    if (match) {
      tMessage = `Booking #${match[1]} requested additional amenities. Please verify payment.`;
    }
  } else if (message.startsWith('Fasilitas ') && message.endsWith('telah aktif.')) {
    const match = message.match(/Fasilitas (.*) untuk pesanan #(.*) telah aktif\./);
    if (match) {
      tMessage = `Amenity ${match[1]} for booking #${match[2]} is now active.`;
    }
  } else if (message.startsWith('Pembayaran untuk pesanan #') && message.endsWith('telah kami terima. Selamat menikmati ruangan Anda!')) {
    const match = message.match(/Pembayaran untuk pesanan #(.*) telah kami terima\. Selamat menikmati ruangan Anda!/);
    if (match) {
      tMessage = `Payment for booking #${match[1]} has been received. Enjoy your workspace!`;
    }
  }

  return { title: tTitle, message: tMessage };
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
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
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ letterSpacing: '-0.5px', fontWeight: 700 }}>Wisma 46 Space</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Kota BNI Jakarta</span>
            </span>
          </Link>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', marginRight: '0.75rem' }}>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle nav-actions-desktop"
              aria-label="Toggle Theme"
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-background)',
                transition: 'all 0.2s ease', flexShrink: 0
              }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="nav-actions-desktop"
              aria-label="Toggle Language"
              style={{
                background: 'none', border: '1.5px solid var(--color-border)', cursor: 'pointer',
                color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '34px', borderRadius: '9999px', backgroundColor: 'var(--color-background)',
                transition: 'all 0.2s ease', flexShrink: 0, padding: '0 0.75rem',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', gap: '0.3rem'
              }}
              title={lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
            >
              <span style={{ opacity: lang === 'id' ? 1 : 0.65 }}>ID</span>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ opacity: lang === 'en' ? 1 : 0.65 }}>EN</span>
            </button>

            {user && (
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  aria-label="Toggle Notifications"
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    color: 'var(--color-text-main)', position: 'relative', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--color-background)',
                    flexShrink: 0
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '2px', right: '2px',
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
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{lang === 'id' ? 'Notifikasi' : 'Notifications'}</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
                        >
                          {lang === 'id' ? 'Tandai semua dibaca' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                          <Bell size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', opacity: 0.3 }} />
                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{lang === 'id' ? 'Tidak ada notifikasi baru' : 'No new notifications'}</p>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const trans = translateNotification(n.title, n.message, lang);
                          return (
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
                              <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: n.is_read ? 'var(--color-text-main)' : 'var(--color-primary)' }}>{trans.title}</p>
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{trans.message}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', opacity: 0.7 }}>{new Date(n.created_at).toLocaleTimeString()}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="nav-desktop" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.95rem' }}>{t('nav_home')}</Link>
            <Link to="/ruangan" style={{ color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.95rem' }}>{t('nav_rooms')}</Link>
            <Link to="/populer" 
              className="populer-link"
              style={{ 
                color: '#b45309', fontWeight: 600, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              {t('nav_popular')} <Star size={16} fill="#b45309" color="#b45309" />
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem', marginLeft: '0.25rem' }}>
                {['admin', 'helpdesk'].includes(user.role) ? (
                  <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Headset size={18} /> {user.role === 'helpdesk' ? 'Helpdesk' : t('nav_admin')}
                  </Link>
                ) : (
                  <Link to="/pesanan-saya" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-main)', fontWeight: 500, fontSize: '0.9rem' }}>
                    <ClipboardList size={18} /> {t('nav_my_orders')}
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
                <button onClick={handleLogout} aria-label="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: '0.5rem' }}>
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>{t('nav_login')}</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>{t('nav_register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="nav-mobile-toggle" 
            onClick={toggleMenu} 
            aria-label="Toggle Menu"
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
          <Link to="/" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('nav_home')}</Link>
          <Link to="/ruangan" onClick={closeMenu} style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('nav_rooms')}</Link>
          <Link to="/populer" onClick={closeMenu} className="populer-link" style={{ 
            fontSize: '1.1rem', fontWeight: 600, color: '#b45309',
            display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            {t('nav_popular')} <Star size={20} fill="#b45309" color="#b45309" />
          </Link>

          <button 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)', padding: 0
            }}
          >
            {theme === 'light' ? <><Moon size={20} /> {lang === 'id' ? 'Mode Gelap' : 'Dark Mode'}</> : <><Sun size={20} /> {lang === 'id' ? 'Mode Terang' : 'Light Mode'}</>}
          </button>

          <button 
            onClick={toggleLang} 
            aria-label="Toggle Language"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0
            }}
          >
            🌐 {lang === 'id' ? 'Switch to English' : 'Ganti ke Indonesia'}
          </button>
          
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '0.5rem 0' }} />

          {user ? (
            <>
              {user.role === 'user' && (
                <Link to="/pesanan-saya" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  <ClipboardList size={20} /> {t('nav_my_orders')}
                </Link>
              )}
              {['admin', 'helpdesk'].includes(user.role) && (
                <Link to="/admin" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                  <Headset size={20} /> {user.role === 'helpdesk' ? 'Helpdesk' : t('nav_admin')}
                </Link>
              )}
              <Link to="/profile" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600 }}>
                <User size={20} /> {t('nav_profile')}
              </Link>
              <button onClick={handleLogout} aria-label="Logout" className="btn btn-danger" style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }}>
                <LogOut size={18} /> {t('nav_logout')}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" onClick={closeMenu} className="btn btn-outline" style={{ width: '100%' }}>{t('nav_login')}</Link>
              <Link to="/register" onClick={closeMenu} className="btn btn-primary" style={{ width: '100%' }}>{t('nav_register')}</Link>
            </div>
          )}
        </div>
      )}

      {/* Style for Responsive Visibility */}
      <style>{`
        @media (max-width: 991px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .nav-actions-desktop { display: none !important; }
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
