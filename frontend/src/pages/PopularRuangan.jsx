import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan } from '../services/apiService';
import { Users, Star, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const PopularRuangan = () => {
  const [ruangan, setRuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getRuangan();
      const popular = data.filter(r => r.is_popular === true || r.is_popular === 1 || r.is_popular === "1");
      setRuangan(popular);
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

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          <ArrowLeft size={18} /> Kembali ke Beranda
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Ruangan Populer <Star size={32} color="var(--color-warning)" fill="var(--color-warning)" />
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0.5rem auto 0' }}>
            Koleksi ruangan terbaik yang paling banyak diminati oleh pengguna kami.
          </p>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-danger)' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gagal memuat ruangan populer</h3>
            <p>Silakan coba kembali dalam beberapa saat.</p>
            <button onClick={fetchData} className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} /> Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              {ruangan.map(item => (
                <div key={item.id} className="card">
                  <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img src={item.gambar} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ 
                      position: 'absolute', top: '1rem', right: '1rem', 
                      backgroundColor: 'var(--color-warning)', color: 'white',
                      padding: '0.25rem 0.75rem', borderRadius: '9999px',
                      fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      POPULER <Star size={12} fill="white" />
                    </div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{item.nama}</h3>
                      {item.is_booked ? (
                        <span className="badge badge-danger">Penuh</span>
                      ) : (
                        <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', height: '40px', overflow: 'hidden' }}>
                      {item.deskripsi}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={16} /> {item.kapasitas} orang
                      </span>
                      {item.is_booked && item.booked_until && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                          <AlertCircle size={14} /> Tersedia: {new Date(item.booked_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                          Rp {(item.harga ?? 0).toLocaleString('id-ID')}
                          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/hari</span>
                        </p>
                      </div>
                      <Link to={`/ruangan/${item.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {ruangan.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <Star size={64} color="var(--color-text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Belum ada ruangan populer</h3>
                <p style={{ color: 'var(--color-text-muted)' }}>Admin belum menandai ruangan manapun sebagai populer.</p>
                <Link to="/ruangan" className="btn btn-outline" style={{ marginTop: '1.5rem' }}>Lihat Semua Ruangan</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PopularRuangan;
