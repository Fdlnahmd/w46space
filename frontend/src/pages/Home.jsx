import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan, getLatestReviews } from '../services/apiService';
import { Users, ArrowRight, Star } from 'lucide-react';

const Home = () => {
  const [ruangan, setRuangan] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);

  useEffect(() => {
    getRuangan().then(data => {
      // Tampilkan 3 ruangan terbaru di beranda
      setRuangan(data.slice(-3).reverse());
    });

    getLatestReviews().then(data => {
      setLatestReviews(data);
    });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #1e3a8a 100%)',
        color: 'white',
        padding: '6rem 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Temukan Ruang Kerja <br /> Impian Anda
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Sewa Office, Meeting Room, atau Coworking Space dengan mudah, cepat, dan fleksibel.
          </p>
          <Link to="/ruangan" className="btn" style={{
            backgroundColor: 'white',
            color: 'var(--color-primary)',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            Cari Ruangan Sekarang
          </Link>
        </div>
        
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '5%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

        <style>{`
          @media (max-width: 768px) {
            h1 { font-size: 2.25rem !important; }
            p { font-size: 1rem !important; }
            section { padding: 4rem 0 !important; }
          }
        `}</style>
      </section>

      {/* Featured Section */}
      <section className="container" style={{ padding: '5rem var(--spacing-md)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Ruangan Terbaru</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Pilihan ruangan yang baru saja ditambahkan.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/populer" className="btn btn-popular">
                Ruangan Populer <Star size={18} fill="var(--color-warning)" />
            </Link>
            <Link to="/ruangan" className="btn btn-primary">
              Lihat Semua <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .section-header { 
              flex-direction: column !important; 
              align-items: flex-start !important; 
              gap: 1rem;
            }
            h2 { font-size: 1.5rem !important; }
          }
        `}</style>

        <div className="grid md:grid-cols-3">
          {ruangan.map(item => (
            <div key={item.id} className="card">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={item.gambar} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem' }}>
                {item.kategori && (
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)', 
                    backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '0.15rem 0.5rem', 
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
                
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} /> Kapasitas: {item.kapasitas} orang
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>Mulai dari</p>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      Rp {(item.harga ?? 0).toLocaleString('id-ID')}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/hari</span>
                    </p>
                  </div>
                  <Link to={`/ruangan/${item.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ backgroundColor: 'var(--color-background)', padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>Apa Kata Pelanggan Kami?</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Dengarkan pengalaman langsung dari mereka yang telah menggunakan layanan sewa ruangan kami.
            </p>
          </div>

          <div className="grid md:grid-cols-3" style={{ gap: '1.5rem' }}>
            {latestReviews.length > 0 ? latestReviews.map(r => (
              <div key={r.id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < r.rating ? 'var(--color-warning)' : 'transparent'} color={i < r.rating ? 'var(--color-warning)' : '#cbd5e1'} />
                  ))}
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', flex: 1, lineHeight: 1.6 }}>
                  "{r.comment}"
                </p>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.1rem' }}>{r.user?.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Penyewa {r.office?.nama}</p>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Belum ada ulasan yang ditampilkan.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
