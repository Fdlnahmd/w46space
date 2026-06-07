import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPemesananById, updateStatusPemesanan, confirmAddon, downloadInvoicePdf } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../../components/Modal';
import { 
  ArrowLeft, Building, Calendar, Clock, User, Briefcase, 
  CheckCircle, XCircle, Timer, AlertCircle, BadgeCheck, Hourglass,
  Check, Plus, Coffee, Wifi, Printer, Edit, CreditCard
} from 'lucide-react';

const statusConfig = {
  Pending:      { color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Hourglass },
  Dikonfirmasi: { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: BadgeCheck },
  Selesai:      { color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', Icon: CheckCircle },
  Dibatalkan:   { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
};

const getStatusLabel = (status, lang) => {
  const labels = {
    Pending:      { id: 'Menunggu Konfirmasi', en: 'Pending Confirmation' },
    Dikonfirmasi: { id: 'Dikonfirmasi',         en: 'Confirmed' },
    Selesai:      { id: 'Selesai',              en: 'Completed' },
    Dibatalkan:   { id: 'Dibatalkan',           en: 'Cancelled' },
  };
  return labels[status]?.[lang === 'id' ? 'id' : 'en'] || status;
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

const hitungStatusWaktu = (tanggalMulai, tanggalAkhir, lang) => {
  if (!tanggalMulai || !tanggalAkhir) return null;
  const sekarang = new Date().getTime();
  const mulai = new Date(tanggalMulai.split('T')[0] + 'T00:00:00').getTime();
  const akhir = new Date(tanggalAkhir.split('T')[0] + 'T23:59:59').getTime();

  if (sekarang < mulai) return { type: 'upcoming', label: lang === 'id' ? 'Kontrak Akan Datang' : 'Upcoming Contract', target: mulai };
  if (sekarang > akhir) return { type: 'expired', label: lang === 'id' ? 'Kontrak Berakhir' : 'Contract Expired', target: null };
  return { type: 'active', label: lang === 'id' ? 'Kontrak Berjalan' : 'Active Contract', target: akhir };
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
  const { lang } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState(null);
  const [statusWaktu, setStatusWaktu] = useState(null);
  const [sisa, setSisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  const fetchDetail = useCallback(async () => {
    try {
      const data = await getPemesananById(id);
      if (!data) { navigate('/admin/pemesanan'); return; }
      setPesanan(data);
      setLoading(false);
    } catch (err) { 
      console.error(err);
      navigate('/admin/pemesanan');
    }
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
      const errMsg = error.response?.data?.message || (lang === 'id' ? 'Gagal mengupdate status' : 'Failed to update status');
      setErrorModal({
        isOpen: true,
        title: lang === 'id' ? 'Gagal Mengubah Status' : 'Failed to Update Status',
        message: errMsg,
        type: 'warning'
      });
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
      const errMsg = error.response?.data?.message || (lang === 'id' ? 'Gagal mengonfirmasi fasilitas' : 'Failed to confirm amenity');
      setErrorModal({
        isOpen: true,
        title: lang === 'id' ? 'Gagal Konfirmasi' : 'Confirmation Failed',
        message: errMsg,
        type: 'warning'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    downloadInvoicePdf(id, lang);
  };

  useEffect(() => {
    if (!pesanan?.tanggal_mulai || !pesanan?.tanggal_akhir) return;
    
    const tick = () => {
      const sw = hitungStatusWaktu(pesanan.tanggal_mulai, pesanan.tanggal_akhir, lang);
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
  }, [pesanan, lang]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Memuat...' : 'Loading...'}</div>;

  const cfg = statusConfig[pesanan.status] || statusConfig['Pending'];
  const StatusIcon = cfg.Icon;
  const persen = pesanan.tanggal_mulai && pesanan.tanggal_akhir
    ? hitungPersen(pesanan.tanggal_mulai, pesanan.tanggal_akhir)
    : 0;
  const isUpcoming = statusWaktu?.type === 'upcoming';
  const isActive   = statusWaktu?.type === 'active';
  const isExpired  = statusWaktu?.type === 'expired';
  const isPaid = String(pesanan.payment_status || '').toLowerCase() === 'paid';

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/admin/pemesanan')} className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Detail Pemesanan' : 'Booking Details'} #{pesanan.id}</p>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pesanan.office?.nama || (lang === 'id' ? 'Ruangan' : 'Room')}</h1>
          </div>
        </div>
        {/* Tombol Invoice (Jika Lunas) */}
        {isPaid && (
          <button 
            onClick={handleDownloadInvoice}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={18} /> {lang === 'id' ? 'Download Invoice' : 'Download Invoice'}
          </button>
        )}

        {/* Tombol Edit */}
        <Link
          to={`/admin/pemesanan/edit/${pesanan.id}`}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Edit size={18} /> {lang === 'id' ? 'Edit / Perpanjang Kontrak' : 'Edit / Extend Contract'}
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
            <StatusIcon size={18} /> {getStatusLabel(pesanan.status, lang)}
          </div>

          {/* ACTIONS BASED ON STATUS */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Jika Status Pending (Baru Masuk) */}
            {pesanan.status?.toLowerCase() === 'pending' && isPaid && (
              <>
                <button 
                  onClick={() => handleStatusUpdate('Dikonfirmasi')}
                  disabled={processing}
                  className="btn btn-primary"
                >
                  <BadgeCheck size={18} /> {processing ? '...' : (lang === 'id' ? 'Terima Pesanan' : 'Accept Booking')}
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Dibatalkan')}
                  disabled={processing}
                  className="btn btn-outline-danger"
                >
                  <XCircle size={18} /> {processing ? '...' : (lang === 'id' ? 'Tolak Pesanan' : 'Reject Booking')}
                </button>
              </>
            )}

            {pesanan.status?.toLowerCase() === 'pending' && !isPaid && (
              <button
                onClick={() => handleStatusUpdate('Dibatalkan')}
                disabled={processing}
                className="btn btn-outline-danger"
              >
                <XCircle size={18} /> {processing ? '...' : (lang === 'id' ? 'Tolak Pesanan' : 'Reject Booking')}
              </button>
            )}

            {/* Jika Status Dikonfirmasi (Aktif) */}
            {pesanan.status === 'Dikonfirmasi' && (
              <>
                <button 
                  onClick={() => handleStatusUpdate('Selesai')}
                  disabled={processing}
                  className="btn btn-success"
                >
                  <CheckCircle size={18} /> {processing ? '...' : (lang === 'id' ? 'Selesaikan Pesanan' : 'Complete Booking')}
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Dibatalkan')}
                  disabled={processing}
                  className="btn btn-outline-danger"
                >
                  <XCircle size={18} /> {processing ? '...' : (lang === 'id' ? 'Batalkan Kontrak' : 'Cancel Contract')}
                </button>
              </>
            )}

            {/* Tombol Invoice (Jika Lunas/Dikonfirmasi/Selesai) */}
            {(pesanan.status === 'Dikonfirmasi' || pesanan.status === 'Selesai') && (
              <button 
                onClick={handleDownloadInvoice} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
              >
                <Printer size={18} /> {lang === 'id' ? 'Download Invoice' : 'Download Invoice'}
              </button>
            )}
          </div>
        </div>

        {/* Fasilitas & Addons */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>{lang === 'id' ? 'Layanan & Fasilitas' : 'Services & Amenities'}</h3>
          
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
                          {lang === 'id' ? 'Harga' : 'Price'}: Rp {Number(addon.pivot?.price_at_booking).toLocaleString('id-ID')}
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
                        <Check size={14} /> {lang === 'id' ? 'Konfirmasi Pembayaran' : 'Confirm Payment'}
                      </button>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                        <BadgeCheck size={16} /> {lang === 'id' ? 'Aktif' : 'Active'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>{lang === 'id' ? 'Tidak ada layanan tambahan.' : 'No additional services.'}</p>
            )}
          </div>
        </div>

        {/* Info Utama */}
        <div className="card" style={{ padding: '2rem' }}>
          <div className="grid md:grid-cols-2" style={{ gap: '1rem' }}>
            <InfoRow icon={User}      label={lang === 'id' ? 'Nama Pemesan' : 'Customer Name'}    value={pesanan.nama_pemesan || '—'} />
            <InfoRow icon={Briefcase} label={lang === 'id' ? 'Perusahaan' : 'Company'}      value={pesanan.perusahaan || '—'} highlight={pesanan.perusahaan} />
            <InfoRow icon={Calendar}  label={lang === 'id' ? 'Tanggal Mulai' : 'Start Date'}   value={formatDate(pesanan.tanggal_mulai)} />
            <InfoRow icon={Calendar}  label={lang === 'id' ? 'Tanggal Akhir' : 'End Date'}   value={formatDate(pesanan.tanggal_akhir)} />
            <InfoRow icon={Timer}     label={lang === 'id' ? 'Durasi Kontrak' : 'Contract Duration'}  value={pesanan.durasi ? `${pesanan.durasi} ${lang === 'id' ? 'Bulan' : 'Months'}` : '—'} />
            <InfoRow icon={Clock}     label={lang === 'id' ? 'Jam Operasional' : 'Operational Hours'} value={pesanan.waktu_mulai && pesanan.waktu_selesai ? `${pesanan.waktu_mulai} – ${pesanan.waktu_selesai}` : '—'} />
            <InfoRow icon={Building}  label={lang === 'id' ? 'Ruangan' : 'Room'}         value={pesanan.office?.nama || '—'} />
            <InfoRow icon={AlertCircle} label={lang === 'id' ? 'Total Harga' : 'Total Price'}   value={`Rp ${Number(pesanan.total_harga || 0).toLocaleString('id-ID')}`} highlight />
            
            {/* Payment Details for Admin */}
            <InfoRow 
              icon={CreditCard} 
              label={lang === 'id' ? 'Status Pembayaran' : 'Payment Status'} 
              value={
                String(pesanan.payment_status || 'Pending').toLowerCase() === 'paid' 
                  ? (lang === 'id' ? 'Lunas / Berhasil' : 'Paid / Successful') 
                  : String(pesanan.payment_status || 'Pending').toLowerCase() === 'failed'
                  ? (lang === 'id' ? 'Gagal' : 'Failed')
                  : String(pesanan.payment_status || 'Pending').toLowerCase() === 'expired'
                  ? (lang === 'id' ? 'Kedaluwarsa' : 'Expired')
                  : (lang === 'id' ? 'Menunggu Pembayaran' : 'Pending Payment')
              }
              highlight={String(pesanan.payment_status || 'Pending').toLowerCase() === 'paid'}
            />
            {String(pesanan.payment_status || 'Pending').toLowerCase() === 'paid' && (
              <InfoRow 
                icon={CheckCircle} 
                label={lang === 'id' ? 'Metode & Waktu Bayar' : 'Payment Method & Time'} 
                value={`${pesanan.midtrans_payment_type || 'Midtrans'} - ${pesanan.paid_at ? new Date(pesanan.paid_at).toLocaleString('id-ID') : '—'}`} 
              />
            )}
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
                    <span>{lang === 'id' ? 'Mulai:' : 'Start:'} {formatDate(pesanan.tanggal_mulai)}</span>
                    <span>{lang === 'id' ? 'Akhir:' : 'End:'} {formatDate(pesanan.tanggal_akhir)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${persen}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.4rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {persen.toFixed(1)}% {lang === 'id' ? 'kontrak telah berjalan' : 'of contract elapsed'}
                  </p>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  ⏳ {lang === 'id' ? 'Sisa waktu kontrak:' : 'Remaining contract time:'}
                </p>
              </>
            )}

            {isUpcoming && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                ⏳ {lang === 'id' ? 'Kontrak dimulai dalam:' : 'Contract starts in:'}
              </p>
            )}

            {sisa ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <CountdownBox value={sisa.hari} label={lang === 'id' ? 'Hari' : 'Days'} />
                <CountdownBox value={sisa.jam} label={lang === 'id' ? 'Jam' : 'Hours'} />
                <CountdownBox value={sisa.menit} label={lang === 'id' ? 'Menit' : 'Minutes'} />
                <CountdownBox value={sisa.detik} label={lang === 'id' ? 'Detik' : 'Seconds'} />
              </div>
            ) : isExpired ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <BadgeCheck size={48} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
                <h3>{lang === 'id' ? 'Masa Kontrak Selesai' : 'Contract Term Ended'}</h3>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                  {lang === 'id' 
                    ? `Layanan ini telah berakhir pada ${formatDate(pesanan.tanggal_akhir)}.` 
                    : `This service expired on ${formatDate(pesanan.tanggal_akhir)}.`}
                </p>
                <Link to={`/admin/pemesanan/edit/${pesanan.id}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  {lang === 'id' ? 'Perpanjang Kontrak' : 'Extend Contract'}
                </Link>
              </div>
            ) : null}

            {isUpcoming && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
                {lang === 'id' 
                  ? `Kontrak akan dimulai pada ${formatDate(pesanan.tanggal_mulai)}` 
                  : `Contract will start on ${formatDate(pesanan.tanggal_mulai)}`}
              </p>
            )}
          </div>
        )}
      </div>
      <Modal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal({ isOpen: false, message: '', title: '', type: 'warning' })}
        title={errorModal.title || (lang === 'id' ? 'Peringatan' : 'Warning')}
        message={errorModal.message}
        type={errorModal.type || 'warning'}
      />
    </div>
  );
};

export default DetailPemesananAdmin;
