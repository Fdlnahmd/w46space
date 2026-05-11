import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPemesananById } from '../../services/mockData';
import {
  ArrowLeft, Edit, User, Briefcase, Calendar,
  Clock, Timer, Building, CheckCircle, AlertCircle,
  Hourglass, BadgeCheck, XCircle
} from 'lucide-react';

const statusConfig = {
  Pending:      { label: 'Menunggu Konfirmasi', color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Hourglass },
  Dikonfirmasi: { label: 'Dikonfirmasi',         color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: BadgeCheck },
  Selesai:      { label: 'Selesai',              color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', Icon: CheckCircle },
  Dibatalkan:   { label: 'Dibatalkan',           color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
};

const hitungSisaWaktu = (tanggalAkhir) => {
  const sekarang = new Date().getTime();
  const akhir = new Date(tanggalAkhir + 'T23:59:59').getTime();
  const selisih = akhir - sekarang;
  if (selisih <= 0) return null;
  return {
    hari:  Math.floor(selisih / (1000 * 60 * 60 * 24)),
    jam:   Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    menit: Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60)),
    detik: Math.floor((selisih % (1000 * 60)) / 1000),
  };
};

const hitungPersen = (tanggalMulai, tanggalAkhir) => {
  const mulai   = new Date(tanggalMulai).getTime();
  const akhir   = new Date(tanggalAkhir + 'T23:59:59').getTime();
  const sekarang = new Date().getTime();
  const total = akhir - mulai;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((sekarang - mulai) / total) * 100));
};

const CountdownBox = ({ value, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    backgroundColor: 'var(--color-primary)', color: 'white',
    borderRadius: 'var(--border-radius-lg)', padding: '0.75rem 1rem', minWidth: '64px'
  }}>
    <span style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>
      {String(value).padStart(2, '0')}
    </span>
    <span style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '0.2rem' }}>{label}</span>
  </div>
);

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: highlight ? 'rgba(37,99,235,0.06)' : 'var(--color-secondary)',
    borderRadius: 'var(--border-radius)',
    border: highlight ? '1px solid rgba(37,99,235,0.2)' : '1px solid var(--color-border)'
  }}>
    <Icon size={17} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
    <div>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{label}</p>
      <p style={{ fontWeight: 600, fontSize: highlight ? '1.1rem' : '0.95rem', color: highlight ? 'var(--color-primary)' : 'inherit' }}>{value}</p>
    </div>
  </div>
);

const DetailPemesananAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState(null);
  const [sisa, setSisa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPemesananById(id).then(data => {
      if (!data) { navigate('/admin/pemesanan'); return; }
      setPesanan(data);
      setLoading(false);
    });
  }, [id, navigate]);

  useEffect(() => {
    if (!pesanan?.tanggalAkhir) return;
    const tick = () => setSisa(hitungSisaWaktu(pesanan.tanggalAkhir));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pesanan]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat...</div>;

  const cfg = statusConfig[pesanan.status] || statusConfig['Pending'];
  const StatusIcon = cfg.Icon;
  const persen = pesanan.tanggalMulai && pesanan.tanggalAkhir
    ? hitungPersen(pesanan.tanggalMulai, pesanan.tanggalAkhir)
    : 0;
  const kontrakAktif = pesanan.status === 'Dikonfirmasi' && sisa !== null;
  const kontrakHabis = pesanan.status === 'Dikonfirmasi' && sisa === null && pesanan.tanggalAkhir;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/pemesanan')} className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Detail Pemesanan #{pesanan.id}</p>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pesanan.ruangan?.nama || 'Ruangan'}</h1>
          </div>
        </div>
        {/* Tombol Edit */}
        <Link
          to={`/admin/pemesanan/edit/${pesanan.id}`}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Edit size={18} /> Edit / Perpanjang Kontrak
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Status Badge */}
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.25rem', borderRadius: '9999px',
          backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
          color: cfg.color, fontWeight: 600, fontSize: '1rem'
        }}>
          <StatusIcon size={18} /> {cfg.label}
        </div>

        {/* Info Utama */}
        <div className="card" style={{ padding: '2rem' }}>
          <div className="grid md:grid-cols-2" style={{ gap: '0.75rem' }}>
            <InfoRow icon={User}      label="Nama Pemesan"    value={pesanan.namaPemesan} />
            <InfoRow icon={Briefcase} label="Perusahaan"      value={pesanan.perusahaan || '—'} />
            <InfoRow icon={Calendar}  label="Tanggal Mulai"   value={pesanan.tanggalMulai || '—'} />
            <InfoRow icon={Calendar}  label="Tanggal Akhir"   value={pesanan.tanggalAkhir || '—'} />
            <InfoRow icon={Timer}     label="Durasi Kontrak"  value={pesanan.durasi ? `${pesanan.durasi} Bulan` : '—'} />
            <InfoRow icon={Clock}     label="Jam Operasional" value={pesanan.waktuMulai && pesanan.waktuSelesai ? `${pesanan.waktuMulai} – ${pesanan.waktuSelesai}` : '—'} />
            <InfoRow icon={Building}  label="Ruangan"         value={pesanan.ruangan?.nama || '—'} />
            <InfoRow icon={AlertCircle} label="Total Harga"   value={`Rp ${pesanan.totalHarga?.toLocaleString('id-ID') || '—'}`} highlight />
          </div>
        </div>

        {/* Countdown Kontrak */}
        {pesanan.tanggalAkhir && pesanan.status === 'Dikonfirmasi' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Timer size={20} color="var(--color-primary)" /> Status Kontrak Berjalan
            </h2>

            {kontrakAktif ? (
              <>
                {/* Progress bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                    <span>Mulai: {pesanan.tanggalMulai}</span>
                    <span>Akhir: {pesanan.tanggalAkhir}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${persen}%`, background: 'linear-gradient(90deg, var(--color-primary), #60a5fa)', borderRadius: '9999px', transition: 'width 1s linear' }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                    {persen.toFixed(1)}% kontrak telah berjalan
                  </p>
                </div>
                {/* Countdown */}
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1rem' }}>⏳ Sisa waktu kontrak:</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <CountdownBox value={sisa.hari}  label="Hari" />
                  <CountdownBox value={sisa.jam}   label="Jam" />
                  <CountdownBox value={sisa.menit} label="Menit" />
                  <CountdownBox value={sisa.detik} label="Detik" />
                </div>
              </>
            ) : kontrakHabis ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)' }}>
                <CheckCircle size={48} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                <h3>Masa Kontrak Telah Berakhir</h3>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Berakhir pada {pesanan.tanggalAkhir}.</p>
                <Link to={`/admin/pemesanan/edit/${pesanan.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Perpanjang Kontrak
                </Link>
              </div>
            ) : (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Kontrak belum dimulai atau tidak aktif.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPemesananAdmin;
