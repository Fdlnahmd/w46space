import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan } from '../services/apiService';
import { Search, Users, AlertCircle, RefreshCw } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const DaftarRuangan = () => {
  const [ruangan, setRuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getRuangan();
      setRuangan(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchData();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchData]);

  const categories = ['Semua', 'Office', 'Private Office', 'Meeting Room', 'Coworking Space', 'Creative Space'];
  const statuses = [
    { label: 'Semua Status', value: 'Semua' },
    { label: 'Tersedia', value: 'Tersedia' },
    { label: 'Penuh', value: 'Penuh' },
    { label: 'Pemeliharaan', value: 'Pemeliharaan' }
  ];

  const filteredRuangan = ruangan.filter(r => {
    const matchSearch = r.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'Semua' || r.kategori === selectedCategory;
    
    let matchStatus = true;
    if (selectedStatus === 'Tersedia') {
      matchStatus = !r.is_booked && r.status === 'Tersedia';
    } else if (selectedStatus === 'Penuh') {
      matchStatus = r.is_booked;
    } else if (selectedStatus === 'Pemeliharaan') {
      matchStatus = r.status === 'Maintenance' || r.status === 'Pemeliharaan';
    }

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
            Daftar Ruangan
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Temukan ruang kerja terbaik yang sesuai dengan kebutuhan profesional Anda.
          </p>
        </div>
        
        {/* Search & Filter Bar */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--box-shadow)', marginBottom: '2.5rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nama ruangan..." 
              className="form-control"
              style={{ paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter Chips (Always Visible) */}
          <div style={{ 
            marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)',
            display: 'flex', gap: '0.6rem', flexWrap: 'wrap' 
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedCategory === cat ? 'white' : 'var(--color-text-main)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter Chips (Always Visible) */}
          <div style={{ 
            marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-border)',
            display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>Status:</span>
            {statuses.map(st => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                style={{
                  padding: '0.4rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid',
                  borderColor: selectedStatus === st.value ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedStatus === st.value ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedStatus === st.value ? 'white' : 'var(--color-text-main)',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 640px) {
            h1 { font-size: 1.75rem !important; }
          }
        `}</style>

        {/* List Grid */}
        {loading ? (
          <SkeletonLoader type="card" count={6} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-danger)' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gagal memuat data ruangan</h3>
            <p>Pastikan koneksi internet Anda stabil dan coba lagi.</p>
            <button onClick={fetchData} className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} /> Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              {filteredRuangan.map(item => (
                <div key={item.id} className="card">
                  <div style={{ height: '200px', overflow: 'hidden' }}>
                    <img src={item.gambar} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    {item.kategori && (
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', 
                        backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '0.2rem 0.6rem', 
                        borderRadius: '4px', marginBottom: '0.5rem', display: 'inline-block' 
                      }}>
                        {item.kategori}
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{item.nama}</h3>
                      {item.is_booked ? (
                        <span className="badge badge-danger">Penuh</span>
                      ) : item.status === 'Maintenance' || item.status === 'Pemeliharaan' ? (
                        <span className="badge badge-warning">Pemeliharaan</span>
                      ) : (
                        <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.deskripsi}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={16} /> Kapasitas: {item.kapasitas} orang
                      </span>
                      {item.is_booked && item.booked_until && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                          <AlertCircle size={14} /> Tersedia: {new Date(item.booked_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>Rp {(item.harga ?? 0).toLocaleString('id-ID')}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/hari</span></p>
                      </div>
                      <Link to={`/ruangan/${item.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredRuangan.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <Search size={64} color="var(--color-text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)' }}>Ruangan tidak ditemukan</h3>
                <p>Silakan coba kata kunci pencarian atau kategori yang lain.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DaftarRuangan;
