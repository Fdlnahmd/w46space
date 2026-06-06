import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan, getLatestReviews } from '../services/apiService';
import { Users, ArrowRight, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LazyImage from '../components/LazyImage';

const Home = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      <section className="hero-section">
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '9999px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
            fontSize: '0.85rem', fontWeight: 500, backdropFilter: 'blur(8px)'
          }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
            {t('hero_badge')}
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
            {t('hero_title')}
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            {t('hero_subtitle')}
          </p>
          <Link to="/ruangan" className="btn btn-hero-cta" style={{
            display: 'inline-block',
            padding: '1rem 2.2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '9999px',
            textDecoration: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {t('hero_cta')}
          </Link>
        </div>
        
        {/* Photo credit */}
        <div style={{ position: 'absolute', bottom: '0.75rem', right: '1rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', zIndex: 5 }}>
          📷 Photo: wisma46.com
        </div>

        <style>{`
          .hero-section {
            background: ${theme === 'dark'
              ? "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(10,30,80,0.72) 100%), url('https://www.wisma46.com/lib/images/banner/slide-website-30th.png') center center / cover no-repeat"
              : "linear-gradient(to bottom, rgba(37,99,235,0.65) 0%, rgba(15,50,130,0.55) 100%), url('https://www.wisma46.com/lib/images/banner/slide-website-30th.png') center center / cover no-repeat"};
            color: white;
            padding: 7rem 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .btn-hero-cta {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border: 2px solid #ffffff;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
          }
          .btn-hero-cta:hover {
            background: #ffffff;
            color: var(--color-primary, #2563eb);
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.3);
          }
          .btn-hero-cta:active {
            transform: translateY(0);
          }
          @media (max-width: 768px) {
            .hero-section {
              padding: 4.5rem 0 !important;
              background-position: 70% center !important; /* Keep the Wisma 46 building tower in frame on mobile */
            }
            h1 { font-size: 2rem !important; }
            p { font-size: 0.95rem !important; }
          }
        `}</style>
      </section>

      {/* Featured Section */}
      <section className="container" style={{ padding: '5rem var(--spacing-md)' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{t('home_latest_title')}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{t('home_latest_subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/populer" className="btn btn-popular">
                {t('home_popular_btn')} <Star size={18} fill="var(--color-warning)" />
            </Link>
            <Link to="/ruangan" className="btn btn-primary">
              {t('home_see_all')} <ArrowRight size={18} />
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
                <LazyImage src={item.gambar} alt={item.nama} />
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
                    <span className="badge badge-danger">{t('status_full')}</span>
                  ) : item.status === 'Maintenance' || item.status === 'Pemeliharaan' ? (
                    <span className="badge badge-warning">{t('status_maintenance')}</span>
                  ) : (
                    <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`}>
                      {item.status === 'Tersedia' ? t('status_available') : item.status}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} /> {t('capacity')}: {item.kapasitas} {t('people')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>{t('start_from')}</p>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                      Rp {(item.harga ?? 0).toLocaleString('id-ID')}
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>{t('per_day')}</span>
                    </p>
                  </div>
                  <Link to={`/ruangan/${item.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    {t('detail')}
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
            <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>{t('home_reviews_title')}</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              {t('home_reviews_subtitle')}
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{t('home_tenant_of')} {r.office?.nama}</p>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>{t('home_no_reviews')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
