import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPemesananByUser, batalkanPemesanan } from '../services/mockData';
import { ClipboardList, XCircle, Clock, CheckCircle, Building, Eye, Hourglass, BadgeCheck } from 'lucide-react';

const statusConfig = {
  Pending:      { class: 'badge-warning', Icon: Hourglass,   label: 'Menunggu Konfirmasi' },
  Dikonfirmasi: { class: 'badge-success', Icon: BadgeCheck,  label: 'Dikonfirmasi' },
  Selesai:      { class: 'badge-neutral', Icon: CheckCircle, label: 'Selesai' },
  Dibatalkan:   { class: 'badge-danger',  Icon: XCircle,     label: 'Dibatalkan' },
};

const PesananSaya = () => {
  const { user } = useAuth();
  const [pesananList, setPesananList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user) return;
    setLoading(true);
    getPemesananByUser(user.id).then(data => {
      setPesananList(data);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, [user]);

  const handleBatalkan = (id) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    batalkanPemesanan(id)
      .then(() => { alert('Pesanan berhasil dibatalkan.'); loadData(); })
      .catch(err => alert(err.message));
  };

  const renderStatus = (status) => {
    const cfg = statusConfig[status] || statusConfig['Pending'];
    const Icon = cfg.Icon;
    return (
      <span className={`badge ${cfg.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        <Icon size={13} /> {cfg.label}
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '50%', display: 'flex' }}>
            <ClipboardList size={28} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Pesanan Saya</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Riwayat semua pemesanan ruangan Anda
            </p>
          </div>
        </div>

        {/* Konten */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            Memuat data...
          </div>
        ) : pesananList.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Building size={56} color="var(--color-border)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Belum ada pesanan</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Anda belum pernah melakukan pemesanan ruangan.
            </p>
            <Link to="/ruangan" className="btn btn-primary">Cari Ruangan Sekarang</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pesananList.map(item => (
              <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                  {/* Foto ruangan kecil */}
                  {item.ruangan?.gambar && (
                    <img
                      src={item.ruangan.gambar}
                      alt={item.ruangan.nama}
                      style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius)', flexShrink: 0 }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Nama + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{item.id}</p>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                          {item.ruangan?.nama || 'Ruangan tidak ditemukan'}
                        </h3>
                      </div>
                      {renderStatus(item.status)}
                    </div>

                    {/* Info singkat */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {item.tanggalMulai && (
                        <span>📅 <strong>Mulai:</strong> {item.tanggalMulai}</span>
                      )}
                      {item.tanggalAkhir && (
                        <span>🏁 <strong>Akhir:</strong> {item.tanggalAkhir}</span>
                      )}
                      {item.durasi && (
                        <span>⏱ <strong>Durasi:</strong> {item.durasi} Bulan</span>
                      )}
                      {item.waktuMulai && item.waktuSelesai && (
                        <span>⏰ {item.waktuMulai} – {item.waktuSelesai}</span>
                      )}
                      {item.perusahaan && (
                        <span>🏢 {item.perusahaan}</span>
                      )}
                    </div>

                    {/* Footer: harga + aksi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Total Harga: </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                          Rp {item.totalHarga.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Tombol utama: Lihat Detail Pesanan */}
                        <Link
                          to={`/pesanan-saya/${item.id}`}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Eye size={15} /> Lihat Detail
                        </Link>

                        {/* Batalkan — hanya jika Pending */}
                        {item.status === 'Pending' && (
                          <button
                            onClick={() => handleBatalkan(item.id)}
                            className="btn btn-danger"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <XCircle size={15} /> Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PesananSaya;
