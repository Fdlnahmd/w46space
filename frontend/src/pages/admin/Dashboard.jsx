import { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../services/apiService';
import { RevenueChart, PopularRoomsChart, StatusChart } from './DashboardCharts';
import { 
  Building, Users, Activity, DollarSign
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div className="stat-icon-wrapper" style={{ backgroundColor: color, width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
      <Icon className="stat-icon" size={28} />
    </div>
    <div>
      <h3 className="stat-title" style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500, margin: 0 }}>{title}</h3>
      <p className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>{value}</p>
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
    <div style={{ paddingBottom: '3rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Analitik</h1>
      
      <div className="grid md:grid-cols-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Pendapatan" value={`Rp ${stats.summary.revenue.toLocaleString('id-ID')}`} icon={DollarSign} color="#10b981" />
        <StatCard title="Pesanan Aktif" value={stats.summary.activeBookings} icon={Activity} color="#3b82f6" />
        <StatCard title="Total Ruangan" value={stats.summary.totalRooms} icon={Building} color="#f59e0b" />
        <StatCard title="Pelanggan" value={stats.summary.totalUsers} icon={Users} color="#8b5cf6" />
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Grafik Pendapatan */}
        <div className="card shadow-sm" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Tren Pendapatan</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>6 Bulan Terakhir</span>
          </div>
          <RevenueChart data={stats.revenueChart} />
        </div>

        {/* Ruangan Terpopuler */}
        <div className="card shadow-sm" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Ruangan Terpopuler</h3>
            <Activity size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <PopularRoomsChart data={stats.popularRooms} />
        </div>
      </div>

      <div className="grid md:grid-cols-12" style={{ gap: '2rem' }}>
        {/* Status Distribusi */}
        <div className="card shadow-sm md:col-span-4" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Status Pesanan</h3>
          <StatusChart data={stats.statusStats} />
        </div>

        {/* Tip: Performance */}
        <div className="card shadow-sm md:col-span-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px' }}>
              <Activity size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>Analisis Performa Bisnis</h2>
          </div>
          
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '2rem' }}>
            Dashboard ini memberikan gambaran menyeluruh tentang kesehatan bisnis penyewaan kantor Anda. 
            Gunakan data **Tren Pendapatan** untuk melihat pertumbuhan bulanan, dan perhatikan **Ruangan Terpopuler** untuk strategi ekspansi.
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px', flex: 1 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} /> Insight Pendapatan
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Fokus pada konfirmasi pesanan tepat waktu untuk menjaga arus kas tetap sehat.</p>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '16px', flex: 1 }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} /> Tips Strategi
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Ruangan yang kurang populer bisa ditawarkan dengan paket fasilitas tambahan.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .stat-card { padding: 1rem !important; gap: 1rem !important; }
          .stat-icon-wrapper { width: 48px !important; height: 48px !important; }
          .stat-value { fontSize: 1.4rem !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
