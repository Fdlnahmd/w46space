import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building, BookOpen, LogOut, LayoutDashboard, X, MessageSquare, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [waitingCount, setWaitingCount] = useState(0);
  const isHelpdesk = user?.role === 'helpdesk';

  // Poll for active/waiting sessions count to alert admin in sidebar
  useEffect(() => {
    const fetchWaitingCount = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      let token = null;
      try {
        const userObj = JSON.parse(userStr);
        token = userObj?.token;
      } catch (e) {
        return;
      }
      if (!token) return;

      try {
        const res = await fetch('/api/admin/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Count sessions that are waiting for takeover or have unread messages from user
          const alertSessions = data.filter(s => s.mode === 'waiting' || s.unread_count > 0);
          setWaitingCount(alertSessions.length);
        }
      } catch (err) {
        console.error('Error fetching waiting chat count:', err);
      }
    };

    fetchWaitingCount();
    const interval = setInterval(fetchWaitingCount, 8000); // Check every 8s

    return () => clearInterval(interval);
  }, []);

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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', marginBottom: '0.1rem' }}>
            <Building size={20} />
            Wisma 46 Space
          </h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', paddingLeft: '1.75rem', letterSpacing: '0.05em' }}>
            {isHelpdesk ? '🎧 Helpdesk Panel' : 'Admin Panel'}
          </span>
        </div>
        {/* Close button on mobile */}
        <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'none' }} className="sidebar-close-btn">
          <X size={22} />
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {!isHelpdesk && (
          <Link to="/admin" onClick={handleLinkClick} style={navItemStyle('/admin')}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
        )}
        {!isHelpdesk && (
          <Link to="/admin/ruangan" onClick={handleLinkClick} style={navItemStyle('/admin/ruangan')}>
            <Building size={20} /> Kelola Ruangan
          </Link>
        )}
        <Link to="/admin/pemesanan" onClick={handleLinkClick} style={navItemStyle('/admin/pemesanan')}>
          <BookOpen size={20} /> Kelola Pemesanan
        </Link>
        {!isHelpdesk && (
          <Link to="/admin/ulasan" onClick={handleLinkClick} style={navItemStyle('/admin/ulasan')}>
            <MessageSquare size={20} /> Moderasi Ulasan
          </Link>
        )}
        {!isHelpdesk && (
          <Link to="/admin/kupon" onClick={handleLinkClick} style={navItemStyle('/admin/kupon')}>
            <Ticket size={20} /> Kelola Kupon
          </Link>
        )}
        <Link to="/admin/chat" onClick={handleLinkClick} style={navItemStyle('/admin/chat')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare size={20} /> Live Chat
            </span>
            {waitingCount > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                animation: 'pulseGlow 1.8s infinite',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
              }}>
                {waitingCount}
              </span>
            )}
          </div>
        </Link>
      </nav>

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
        <Link to="/" style={{ ...navItemStyle('/logout'), color: '#f87171', marginBottom: 0 }}>
          <LogOut size={20} /> Kembali ke Web
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-close-btn { display: flex !important; }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
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
