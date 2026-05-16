import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPemesananByUser, batalkanPemesanan, getInvoiceUrl } from '../services/apiService';
import { ClipboardList, XCircle, CheckCircle, Eye, Hourglass, BadgeCheck, AlertCircle, RefreshCw, Star, Printer } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

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
  const [error, setError] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (user) {
      if (showLoading) setLoading(true);
      setError(false);
      try {
        const data = await getPemesananByUser();
        setPesananList(data);
      } catch (err) {
        console.error('Error fetching user bookings:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) loadData(false);
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  const handleBatalkan = (id) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;
    batalkanPemesanan(id)
      .then(() => { alert('Pesanan berhasil dibatalkan.'); loadData(); })
      .catch(err => alert(err.message));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return dateString.split('T')[0];
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
          <SkeletonLoader type="row" count={4} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-danger)' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gagal memuat pesanan Anda</h3>
            <p>Pastikan koneksi internet Anda stabil dan coba lagi.</p>
            <button onClick={() => loadData()} className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} /> Coba Lagi
            </button>
          </div>
        ) : pesananList.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
              <ClipboardList size={64} color="var(--color-text-muted)" />
            </div>
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
                  {item.office?.gambar && (
                    <img
                      src={item.office.gambar}
                      alt={item.office.nama}
                      style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius)', flexShrink: 0 }}
                    />
                  )}

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Nama + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{item.id}</p>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.office?.nama || 'Ruangan tidak ditemukan'}
                          {item.parent_id && (
                            <span style={{ 
                              fontSize: '0.65rem', backgroundColor: 'var(--color-secondary)', 
                              color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px',
                              border: '1px solid var(--color-primary)'
                            }}>
                              Perpanjangan
                            </span>
                          )}
                        </h3>
                      </div>
                      {renderStatus(item.status)}
                    </div>

                    {/* Info singkat */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {item.tanggal_mulai && (
                        <span>📅 <strong>Mulai:</strong> {formatDate(item.tanggal_mulai)}</span>
                      )}
                      {item.tanggal_akhir && (
                        <span>🏁 <strong>Akhir:</strong> {formatDate(item.tanggal_akhir)}</span>
                      )}
                      {item.durasi && (
                        <span>⏱ <strong>Durasi:</strong> {item.durasi} Bulan</span>
                      )}
                      {item.waktu_mulai && item.waktu_selesai && (
                        <span>⏰ {item.waktu_mulai} – {item.waktu_selesai}</span>
                      )}
                      {item.perusahaan && (
                        <span>🏢 {item.perusahaan}</span>
                      )}
                    </div>

                    {/* Footer: harga + aksi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Harga</p>
                          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                            Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
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

                        {(item.status === 'Dikonfirmasi' || item.status === 'Selesai') && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(getInvoiceUrl(item.id), '_blank');
                            }}
                            className="btn btn-outline"
                            title="Download Invoice"
                            style={{ padding: '0.45rem', minWidth: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Printer size={15} />
                          </button>
                        )}

                        {/* Perpanjang — Jika Dikonfirmasi atau Selesai */}
                        {(item.status === 'Dikonfirmasi' || item.status === 'Selesai') && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link
                              to={`/ruangan/${item.office_id}#reviews`}
                              className="btn btn-outline"
                              style={{ 
                                padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                borderColor: 'var(--color-warning)', color: 'var(--color-warning)'
                              }}
                            >
                              <Star size={15} /> Beri Ulasan
                            </Link>
                            <Link
                              to={`/ruangan/${item.office_id}?extend_from=${item.id}`}
                              className="btn btn-outline"
                              style={{ 
                                padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                borderColor: 'var(--color-primary)', color: 'var(--color-primary)'
                              }}
                            >
                              <RefreshCw size={15} /> Perpanjang
                            </Link>
                          </div>
                        )}

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
