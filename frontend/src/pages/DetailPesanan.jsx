import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPemesananById } from '../services/apiService';
import {
  ArrowLeft, Building, Calendar, Clock, User, Briefcase,
  CheckCircle, XCircle, Timer, AlertCircle, BadgeCheck, Hourglass
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusConfig = {
  Pending:      { label: 'Menunggu Konfirmasi', color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Hourglass },
  Dikonfirmasi: { label: 'Dikonfirmasi',         color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: BadgeCheck },
  Selesai:      { label: 'Selesai',              color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', Icon: CheckCircle },
  Dibatalkan:   { label: 'Dibatalkan',           color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
};

// Hitung sisa waktu dan status kontrak
const hitungSisaWaktuKontrak = (tanggalMulai, tanggalAkhir) => {
  if (!tanggalMulai || !tanggalAkhir) return null;
  
  const sekarang = new Date().getTime();
  const mulai = new Date(tanggalMulai.split('T')[0] + 'T00:00:00').getTime();
  const akhir = new Date(tanggalAkhir.split('T')[0] + 'T23:59:59').getTime();
  
  let target, type;

  if (sekarang < mulai) {
    target = mulai;
    type = 'upcoming';
  } else if (sekarang <= akhir) {
    target = akhir;
    type = 'active';
  } else {
    return { type: 'expired' };
  }

  const selisih = target - sekarang;
  const hari   = Math.floor(selisih / (1000 * 60 * 60 * 24));
  const jam    = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const menit  = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
  const detik  = Math.floor((selisih % (1000 * 60)) / 1000);

  return { type, hari, jam, menit, detik, total: selisih };
};

const hitungPersen = (tanggalMulai, tanggalAkhir) => {
  if (!tanggalMulai || !tanggalAkhir) return 0;
  const mulai   = new Date(tanggalMulai.split('T')[0]).getTime();
  const akhir   = new Date(tanggalAkhir.split('T')[0] + 'T23:59:59').getTime();
  const sekarang = new Date().getTime();
  const total   = akhir - mulai;
  const terpakai = sekarang - mulai;
  return Math.min(100, Math.max(0, (terpakai / total) * 100));
};

// ─── Komponen CountdownBox ───────────────────────────────────────────────────
const CountdownBox = ({ value, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    backgroundColor: 'var(--color-primary)', color: 'white',
    borderRadius: 'var(--border-radius-lg)', padding: '1rem 1.25rem', minWidth: '72px'
  }}>
    <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
      {String(value).padStart(2, '0')}
    </span>
    <span style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.25rem' }}>{label}</span>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '—';
  return dateString.split('T')[0];
};

const DetailPesanan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState(null);
  const [statusWaktu, setStatusWaktu] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data pesanan
  useEffect(() => {
    getPemesananById(id).then(data => {
      if (!data) { navigate('/pesanan-saya'); return; }
      setPesanan(data);
      setLoading(false);
    });
  }, [id, navigate]);

  // Countdown real-time
  useEffect(() => {
    if (!pesanan?.tanggal_mulai || !pesanan?.tanggal_akhir) return;

    const tick = () => setStatusWaktu(hitungSisaWaktuKontrak(pesanan.tanggal_mulai, pesanan.tanggal_akhir));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pesanan]);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      Memuat detail pesanan...
    </div>
  );

  const cfg = statusConfig[pesanan.status] || statusConfig['Pending'];
  const StatusIcon = cfg.Icon;
  const persen = pesanan.tanggal_mulai && pesanan.tanggal_akhir
    ? hitungPersen(pesanan.tanggal_mulai, pesanan.tanggal_akhir)
    : 0;
  const isUpcoming = statusWaktu?.type === 'upcoming';
  const isActive   = statusWaktu?.type === 'active';
  const isExpired  = statusWaktu?.type === 'expired';

  return (
    <div style={{ padding: '2rem 0', backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Tombol kembali */}
        <button onClick={() => navigate('/pesanan-saya')} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.4rem' }}>
          <ArrowLeft size={18} /> Kembali ke Pesanan Saya
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Header Pesanan ── */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  ID Pesanan: <strong>#{pesanan.id}</strong>
                </p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  {pesanan.office?.nama || 'Ruangan'}
                </h1>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: '9999px',
                backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
                color: cfg.color, fontWeight: 600
              }}>
                <StatusIcon size={16} />
                {cfg.label}
              </div>
            </div>

            {/* Foto ruangan */}
            {pesanan.office?.gambar && (
              <img
                src={pesanan.office.gambar}
                alt={pesanan.office.nama}
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--border-radius-lg)', marginBottom: '1.5rem' }}
              />
            )}

            {/* Detail Grid */}
            <div className="grid md:grid-cols-2" style={{ gap: '1rem' }}>
              {[
                { icon: User,      label: 'Nama Pemesan',  value: pesanan.nama_pemesan },
                { icon: Briefcase, label: 'Perusahaan',    value: pesanan.perusahaan || '—' },
                { icon: Calendar,  label: 'Tanggal Mulai', value: formatDate(pesanan.tanggal_mulai) },
                { icon: Calendar,  label: 'Tanggal Akhir', value: formatDate(pesanan.tanggal_akhir) },
                { icon: Timer,     label: 'Durasi Kontrak',value: pesanan.durasi ? `${pesanan.durasi} Bulan` : '—' },
                { icon: Clock,     label: 'Jam Operasional', value: pesanan.waktu_mulai && pesanan.waktu_selesai ? `${pesanan.waktu_mulai} – ${pesanan.waktu_selesai}` : '—' },
                { icon: Building,  label: 'Ruangan',       value: pesanan.office?.nama || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem', backgroundColor: 'var(--color-secondary)',
                  borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)'
                }}>
                  <Icon size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</p>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</p>
                  </div>
                </div>
              ))}

              {/* Total Harga */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.75rem', backgroundColor: 'rgba(37,99,235,0.06)',
                borderRadius: 'var(--border-radius)', border: '1px solid rgba(37,99,235,0.2)'
              }}>
                <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Harga</p>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                    Rp {Number(pesanan.total_harga || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Countdown Timer (hanya jika pesanan dikonfirmasi) ── */}
          {pesanan.status === 'Dikonfirmasi' && statusWaktu && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Timer size={22} color="var(--color-primary)" />
                {isUpcoming ? 'Waktu Kontrak Akan Datang' : 'Status Kontrak Berjalan'}
              </h2>

              {/* Tampilan Aktif atau Upcoming */}
              {(isActive || isUpcoming) && (
                <>
                  {/* Progress bar (hanya jika sudah jalan) */}
                  {isActive && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        <span>Mulai: {formatDate(pesanan.tanggal_mulai)}</span>
                        <span>Akhir: {formatDate(pesanan.tanggal_akhir)}</span>
                      </div>
                      <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${persen}%`,
                          background: 'linear-gradient(90deg, var(--color-primary), #60a5fa)',
                          borderRadius: '9999px',
                          transition: 'width 1s linear'
                        }} />
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
                        {persen.toFixed(1)}% masa kontrak telah berjalan
                      </p>
                    </div>
                  )}

                  {/* Countdown blocks */}
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                      {isUpcoming ? '⏳ Kontrak dimulai dalam:' : '⏳ Sisa waktu kontrak berakhir:'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <CountdownBox value={statusWaktu.hari}  label="Hari" />
                      <CountdownBox value={statusWaktu.jam}   label="Jam" />
                      <CountdownBox value={statusWaktu.menit} label="Menit" />
                      <CountdownBox value={statusWaktu.detik} label="Detik" />
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      {isUpcoming 
                        ? `Kontrak akan dimulai pada ${formatDate(pesanan.tanggal_mulai)}`
                        : `Kontrak berakhir pada ${formatDate(pesanan.tanggal_akhir)}`
                      }
                    </p>
                  </div>
                </>
              )}

              {/* Tampilan Jika Expired */}
              {isExpired && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '50%', marginBottom: '1rem' }}>
                    <CheckCircle size={32} color="var(--color-success)" />
                  </div>
                  <h3>Masa Kontrak Telah Berakhir</h3>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Sewa ruangan ini telah selesai pada {formatDate(pesanan.tanggal_akhir)}.
                  </p>
                  <Link to="/ruangan" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                    Sewa Ruangan Lagi
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Fasilitas Ruangan */}
          {pesanan.office?.fasilitas?.length > 0 && (
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Fasilitas Ruangan</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {pesanan.office.fasilitas.map((f, i) => (
                  <span key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.4rem 0.75rem', fontSize: '0.9rem',
                    backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <CheckCircle size={14} color="var(--color-success)" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DetailPesanan;
