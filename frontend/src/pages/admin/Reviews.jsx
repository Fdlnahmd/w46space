import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllReviewsAdmin, deleteReviewAdmin } from '../../services/apiService';
import { Star, Trash2, MessageSquare, ShieldAlert, Search, Filter, TrendingUp } from 'lucide-react';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [modal, setModal] = useState({ isOpen: false, id: null });

  const fetchReviews = useCallback(async () => {
    try {
      const data = await getAllReviewsAdmin();
      setReviews(data);
    } catch (error) {
      console.error('Gagal mengambil ulasan:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (searchQuery) {
      result = result.filter(r => 
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.office?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (ratingFilter !== 'all') {
      result = result.filter(r => r.rating === parseInt(ratingFilter));
    }
    return result;
  }, [searchQuery, ratingFilter, reviews]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchReviews();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchReviews]);

  const handleDelete = async () => {
    try {
      await deleteReviewAdmin(modal.id);
      setReviews(reviews.filter(r => r.id !== modal.id));
      setModal({ isOpen: false, id: null });
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus ulasan');
    }
  };

  const stats = {
    total: reviews.length,
    avg: reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) : 0,
    fiveStars: reviews.filter(r => r.rating === 5).length
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? '#f59e0b' : 'transparent'} color={i < rating ? '#f59e0b' : '#cbd5e1'} />
        ))}
      </div>
    );
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Memuat ulasan...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text-main)', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Dashboard <span style={{ color: 'var(--color-primary)' }}>Ulasan</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Moderasi dan kelola ulasan dari pengguna di seluruh platform.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', marginBottom: '2.5rem' 
      }}>
        {[
          { label: 'Total Ulasan', value: stats.total, icon: MessageSquare, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' },
          { label: 'Rata-rata Rating', value: stats.avg, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Bintang 5', value: stats.fiveStars, icon: Star, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--color-border)' }}>
            <div style={{ backgroundColor: stat.bg, color: stat.color, padding: '1rem', borderRadius: '12px', display: 'flex' }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Cari user, ruangan, atau komentar..." 
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              padding: '0.75rem 1rem 0.75rem 2.75rem', marginBottom: 0, borderRadius: '10px',
              backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', width: '100%'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-background)', borderRadius: '10px', display: 'flex', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <Filter size={18} />
          </div>
          <select 
            className="input" 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{ marginBottom: 0, padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)', cursor: 'pointer' }}
          >
            <option value="all">Semua Rating</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Bintang</option>)}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1.25rem 1.5rem' }}>Pengguna</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Ruangan</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Rating</th>
                <th style={{ padding: '1.25rem 1.5rem' }}>Komentar</th>
                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? filteredReviews.map((r, idx) => (
                <tr key={r.id} style={{ 
                  borderTop: '1px solid var(--color-border)', 
                  backgroundColor: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-background)',
                  transition: 'background 0.2s'
                }}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', 
                        backgroundColor: 'var(--color-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                      }}>
                        {r.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{r.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: #{r.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{r.office?.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    {renderStars(r.rating)}
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--color-text-muted)' }}>Skor: <strong>{r.rating}/5</strong></div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', maxWidth: '400px' }}>
                    <div style={{ color: 'var(--color-text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                      <MessageSquare size={14} style={{ marginRight: '6px', opacity: 0.5, display: 'inline-block' }} />
                      {r.comment}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => setModal({ isOpen: true, id: r.id })}
                      style={{ 
                        padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        backgroundColor: '#fff1f2', color: '#e11d48', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffe4e6'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff1f2'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '6rem', color: '#94a3b8' }}>
                    <Search size={48} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                    <p style={{ fontSize: '1.1rem' }}>Tidak menemukan ulasan yang sesuai kriteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center', borderRadius: '24px', border: 'none' }}>
            <div style={{ 
              backgroundColor: '#fff1f2', color: '#e11d48', width: '70px', height: '70px', 
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
            }}>
              <ShieldAlert size={36} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#1e293b' }}>Hapus Permanen?</h3>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Ulasan ini akan dihapus dari sistem dan tidak dapat dipulihkan kembali.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setModal({ isOpen: false, id: null })} className="btn btn-outline" style={{ flex: 1, padding: '0.85rem', borderRadius: '12px' }}>Batal</button>
              <button onClick={handleDelete} className="btn btn-danger" style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', backgroundColor: '#e11d48' }}>Hapus Sekarang</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
