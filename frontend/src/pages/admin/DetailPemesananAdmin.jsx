import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPemesananById, updateStatusPemesanan, confirmAddon, getInvoiceUrl } from '../../services/apiService';
import { 
  ArrowLeft, Building, Calendar, Clock, User, Briefcase, 
  CheckCircle, XCircle, Timer, AlertCircle, BadgeCheck, Hourglass,
  Check, Plus, Coffee, Wifi, Printer, Edit
} from 'lucide-react';

const statusConfig = {
  Pending:      { label: 'Menunggu Konfirmasi', color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Hourglass },
  Dikonfirmasi: { label: 'Dikonfirmasi',         color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: BadgeCheck },
  Selesai:      { label: 'Selesai',              color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', Icon: CheckCircle },
  Dibatalkan:   { label: 'Dibatalkan',           color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
};

const hitungSisaWaktu = (tanggalAkhir) => {
  if (!tanggalAkhir) return null;
  const dateOnly = tanggalAkhir.split('T')[0];
  const sekarang = new Date().getTime();
  const akhir = new Date(dateOnly + 'T23:59:59').getTime();
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
  if (!tanggalMulai || !tanggalAkhir) return 0;
  const startOnly = tanggalMulai.split('T')[0];
  const endOnly   = tanggalAkhir.split('T')[0];
  
  const mulai   = new Date(startOnly).getTime();
  const akhir   = new Date(endOnly + 'T23:59:59').getTime();
  const sekarang = new Date().getTime();
  const total = akhir - mulai;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((sekarang - mulai) / total) * 100));
};

const hitungStatusWaktu = (tanggalMulai, tanggalAkhir) => {
  if (!tanggalMulai || !tanggalAkhir) return null;
  const sekarang = new Date().getTime();
  const mulai = new Date(tanggalMulai.split('T')[0] + 'T00:00:00').getTime();
  const akhir = new Date(tanggalAkhir.split('T')[0] + 'T23:59:59').getTime();

  if (sekarang < mulai) return { type: 'upcoming', label: 'Kontrak Akan Datang', target: mulai };
  if (sekarang > akhir) return { type: 'expired', label: 'Kontrak Berakhir', target: null };
  return { type: 'active', label: 'Kontrak Berjalan', target: akhir };
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

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return dateString.split('T')[0];
};

const DetailPemesananAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState(null);
  const [statusWaktu, setStatusWaktu] = useState(null);
  const [sisa, setSisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await getPemesananById(id);
      if (!data) { navigate('/admin/pemesanan'); return; }
      setPesanan(data);
      setLoading(false);
    } catch (err) { console.error(err); }
  }, [id, navigate]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchDetail();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchDetail]);

  const handleStatusUpdate = async (newStatus) => {
    setProcessing(true);
    try {
      await updateStatusPemesanan(id, newStatus);
      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert('Gagal mengupdate status');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAddon = async (addonId) => {
    setProcessing(true);
    try {
      await confirmAddon(id, addonId);
      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert('Gagal mengonfirmasi fasilitas');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(getInvoiceUrl(id), '_blank');
  };

  useEffect(() => {
    if (!pesanan?.tanggal_mulai || !pesanan?.tanggal_akhir) return;
    
    const tick = () => {
      const sw = hitungStatusWaktu(pesanan.tanggal_mulai, pesanan.tanggal_akhir);
      setStatusWaktu(sw);
      if (sw && sw.target) {
        setSisa(hitungSisaWaktu(new Date(sw.target).toISOString()));
      } else {
        setSisa(null);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pesanan]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat...</div>;

  const cfg = statusConfig[pesanan.status] || statusConfig['Pending'];
  const StatusIcon = cfg.Icon;
  const persen = pesanan.tanggal_mulai && pesanan.tanggal_akhir
    ? hitungPersen(pesanan.tanggal_mulai, pesanan.tanggal_akhir)
    : 0;
  const isUpcoming = statusWaktu?.type === 'upcoming';
  const isActive   = statusWaktu?.type === 'active';
  const isExpired  = statusWaktu?.type === 'expired';

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
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pesanan.office?.nama || 'Ruangan'}</h1>
          </div>
        </div>
        {/* Tombol Invoice (Jika Lunas) */}
        {pesanan.payment_status === 'Paid' && (
          <button 
            onClick={handleDownloadInvoice}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={18} /> Download Invoice
          </button>
        )}

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

        {/* Status Badge & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.25rem', borderRadius: '9999px',
            backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
            color: cfg.color, fontWeight: 600, fontSize: '1rem'
          }}>
            <StatusIcon size={18} /> {cfg.label}
          </div>

          {/* Debug info - hapus nanti */}
          {console.log('Status Pesanan:', pesanan.status)}

          {pesanan.status?.toLowerCase() === 'pending' ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => handleStatusUpdate('Dikonfirmasi')}
                disabled={processing}
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
              >
                <BadgeCheck size={18} /> {processing ? '...' : 'Terima Pesanan'}
              </button>
              <button 
                onClick={() => handleStatusUpdate('Dibatalkan')}
                disabled={processing}
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                <XCircle size={18} /> {processing ? '...' : 'Tolak'}
              </button>
            </div>
          ) : (pesanan.status === 'Dikonfirmasi' || pesanan.status === 'Selesai') && (
            <button 
              onClick={handleDownloadInvoice} 
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
            >
              <Printer size={18} /> Download Invoice
            </button>
          )}
        </div>

        {/* Fasilitas & Addons */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Layanan & Fasilitas</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Addons */}
            {pesanan.addons?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pesanan.addons.map((addon) => (
                  <div key={addon.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', borderRadius: '12px', 
                    backgroundColor: addon.pivot?.status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(37,99,235,0.05)',
                    border: `1px solid ${addon.pivot?.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(37,99,235,0.2)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: addon.pivot?.status === 'pending' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                        {addon.nama.toLowerCase().includes('kopi') ? <Coffee size={20} /> :
                         addon.nama.toLowerCase().includes('wifi') ? <Wifi size={20} /> : <Plus size={20} />}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{addon.nama}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          Harga: Rp {Number(addon.pivot?.price_at_booking).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {addon.pivot?.status === 'pending' ? (
                      <button 
                        onClick={() => handleConfirmAddon(addon.id)}
                        disabled={processing}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Check size={14} /> Konfirmasi Pembayaran
                      </button>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                        <BadgeCheck size={16} /> Aktif
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>Tidak ada layanan tambahan.</p>
            )}
          </div>
        </div>

        {/* Info Utama */}
        <div className="card" style={{ padding: '2rem' }}>
          <div className="grid md:grid-cols-2" style={{ gap: '1rem' }}>
            <InfoRow icon={User}      label="Nama Pemesan"    value={pesanan.nama_pemesan || '—'} />
            <InfoRow icon={Briefcase} label="Perusahaan"      value={pesanan.perusahaan || '—'} highlight={pesanan.perusahaan} />
            <InfoRow icon={Calendar}  label="Tanggal Mulai"   value={formatDate(pesanan.tanggal_mulai)} />
            <InfoRow icon={Calendar}  label="Tanggal Akhir"   value={formatDate(pesanan.tanggal_akhir)} />
            <InfoRow icon={Timer}     label="Durasi Kontrak"  value={pesanan.durasi ? `${pesanan.durasi} Bulan` : '—'} />
            <InfoRow icon={Clock}     label="Jam Operasional" value={pesanan.waktu_mulai && pesanan.waktu_selesai ? `${pesanan.waktu_mulai} – ${pesanan.waktu_selesai}` : '—'} />
            <InfoRow icon={Building}  label="Ruangan"         value={pesanan.office?.nama || '—'} />
            <InfoRow icon={AlertCircle} label="Total Harga"   value={`Rp ${Number(pesanan.total_harga || 0).toLocaleString('id-ID')}`} highlight />
          </div>
        </div>

        {/* Countdown Kontrak */}
        {pesanan.status === 'Dikonfirmasi' && statusWaktu && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Timer size={20} color="var(--color-primary)" /> {statusWaktu.label}
            </h2>

            {isActive && (
              <>
                {/* Progress bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                    <span>Mulai: {formatDate(pesanan.tanggal_mulai)}</span>
                    <span>Akhir: {formatDate(pesanan.tanggal_akhir)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${persen}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.4rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {persen.toFixed(1)}% kontrak telah berjalan
                  </p>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  ⏳ Sisa waktu kontrak:
                </p>
              </>
            )}

            {isUpcoming && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ⏳ Kontrak dimulai dalam:
              </p>
            )}

            {sisa ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <CountdownBox value={sisa.hari} label="Hari" />
                <CountdownBox value={sisa.jam} label="Jam" />
                <CountdownBox value={sisa.menit} label="Menit" />
                <CountdownBox value={sisa.detik} label="Detik" />
              </div>
            ) : isExpired ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <BadgeCheck size={48} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                <h3>Masa Kontrak Selesai</h3>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  Layanan ini telah berakhir pada {formatDate(pesanan.tanggal_akhir)}.
                </p>
                <Link to={`/admin/pemesanan/edit/${pesanan.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Perpanjang Kontrak
                </Link>
              </div>
            ) : null}

            {isUpcoming && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
                Kontrak akan dimulai pada {formatDate(pesanan.tanggal_mulai)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailPemesananAdmin;
