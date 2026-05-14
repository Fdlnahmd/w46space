import { useState, useEffect } from 'react';
import { getRuangan, getPemesanan } from '../../services/apiService';
import { Building, BookOpen, DollarSign } from 'lucide-react';

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
  const [stats, setStats] = useState({
    totalRuangan: 0,
    totalPemesanan: 0,
    pendapatan: 0
  });

  useEffect(() => {
    Promise.all([getRuangan(), getPemesanan()]).then(([ruangan, pemesanan]) => {
      const pendapatan = pemesanan
        .filter(p => p.status === 'Selesai' || p.status === 'Dikonfirmasi')
        .reduce((sum, curr) => sum + (curr.total_harga || 0), 0);

      setStats({
        totalRuangan: ruangan.length,
        totalPemesanan: pemesanan.length,
        pendapatan
      });
    });
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Admin</h1>
      
      <div className="grid md:grid-cols-3">
        <StatCard title="Total Ruangan" value={stats.totalRuangan} icon={Building} color="var(--color-primary)" />
        <StatCard title="Total Pemesanan" value={stats.totalPemesanan} icon={BookOpen} color="var(--color-warning)" />
        <StatCard title="Pendapatan (Estimasi)" value={`Rp ${(stats.pendapatan ?? 0).toLocaleString('id-ID')}`} icon={DollarSign} color="var(--color-success)" />
      </div>

      <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2>Selamat Datang di Panel Admin</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>
          Gunakan sidebar di sebelah kiri untuk mengelola data ruangan dan pemesanan. Semua data Anda kini terhubung langsung dengan sistem database pusat.
        </p>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .stat-card {
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .stat-icon-wrapper {
            width: 48px !important;
            height: 48px !important;
          }
          .stat-icon {
            width: 20px !important;
            height: 20px !important;
          }
          .stat-title {
            fontSize: 0.85rem !important;
          }
          .stat-value {
            fontSize: 1.4rem !important;
          }
          h1 {
            font-size: 1.5rem !important;
            margin-bottom: 1.5rem !important;
          }
          h2 {
            font-size: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
