import { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../services/apiService';
import { RevenueChart, PopularRoomsChart, StatusChart } from './DashboardCharts';
import { 
  Building, Users, Activity, DollarSign, Hourglass, CheckCircle, XCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card stat-card" style={{ 
    padding: '1.25rem', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem',
    border: '1px solid var(--color-border)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  }}>
    <div className="stat-icon-wrapper" style={{ 
      backgroundColor: `${color}15`, // Light version of color
      width: '50px', 
      height: '50px', 
      borderRadius: '12px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: color, 
      flexShrink: 0 
    }}>
      <Icon className="stat-icon" size={24} />
    </div>
    <div style={{ overflow: 'hidden' }}>
      <h3 className="stat-title" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.2rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      <p className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAdminAnalytics();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat Analitik...</div>;
  if (!stats) return null;

  return (
    <div style={{ paddingBottom: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Ringkasan Bisnis</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Selamat datang kembali! Berikut adalah performa terbaru bisnis Anda.</p>
      </div>
      
      <div className="grid md:grid-cols-3" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
        <StatCard 
          title="Pendapatan" 
          value={`Rp ${Number(stats?.summary?.revenue ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
          icon={DollarSign} 
          color="#10b981" 
        />
        <StatCard title="Pending" value={stats?.summary?.pendingBookings ?? 0} icon={Hourglass} color="#f59e0b" />
        <StatCard title="Aktif" value={stats?.summary?.activeBookings ?? 0} icon={Activity} color="#3b82f6" />
        <StatCard title="Selesai" value={stats?.summary?.completedBookings ?? 0} icon={CheckCircle} color="#059669" />
        <StatCard title="Batal" value={stats?.summary?.cancelledBookings ?? 0} icon={XCircle} color="#ef4444" />
        <StatCard title="Ruangan" value={stats?.summary?.totalRooms ?? 0} icon={Building} color="#8b5cf6" />
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Grafik Pendapatan */}
        <div className="card shadow-sm" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tren Pendapatan</h3>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'rgba(37, 99, 235, 0.05)', padding: '0.3rem 0.75rem', borderRadius: '20px' }}>6 Bulan Terakhir</span>
          </div>
          <RevenueChart data={stats.revenueChart} />
        </div>

        {/* Ruangan Terpopuler */}
        <div className="card shadow-sm" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Ruangan Terpopuler</h3>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: '8px' }}>
              <Activity size={16} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <PopularRoomsChart data={stats.popularRooms} />
        </div>
      </div>

      <div className="grid md:grid-cols-12" style={{ gap: '1.5rem' }}>
        {/* Status Distribusi */}
        <div className="card shadow-sm md:col-span-4" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 700 }}>Status Pesanan</h3>
          <StatusChart data={stats.statusStats} />
        </div>

        {/* Info & Tips */}
        <div className="card shadow-sm md:col-span-8" style={{ 
          padding: '2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          backgroundColor: 'var(--color-primary)',
          backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background shape */}
          <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', width: '200px', height: '200px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.6rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px' }}>
                <Activity size={20} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Analisis Bisnis Anda</h2>
            </div>
            
            <p style={{ opacity: 0.9, lineHeight: 1.7, fontSize: '1rem', marginBottom: '1.75rem', maxWidth: '600px' }}>
              Berdasarkan performa saat ini, bisnis Anda menunjukkan tren yang positif. Fokuslah pada ruangan yang paling sering dipesan untuk meningkatkan profitabilitas.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
                <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <DollarSign size={14} /> Keuangan
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Pantau status "Dikonfirmasi" untuk realisasi pendapatan.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
                <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} /> Operasional
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Maksimalkan penggunaan ruangan dengan promosi add-on.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .stat-card { padding: 1rem !important; gap: 0.75rem !important; }
          .stat-icon-wrapper { width: 44px !important; height: 44px !important; }
          .stat-value { font-size: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
