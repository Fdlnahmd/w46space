import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getPemesananById,
  updateStatusPemesanan,
  getAddons,
  addAddonsToBooking,
  downloadInvoicePdf,
  createSnapToken,
  ensureMidtransSnap
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Building, Calendar, Clock, User, Briefcase,
  CheckCircle, XCircle, Timer, AlertCircle, BadgeCheck, Hourglass, Check, X,
  Plus, Coffee, Wifi, Monitor, Printer, CreditCard
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LazyImage from '../components/LazyImage';
import Modal from '../components/Modal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusConfig = {
  Pending:      { labelKey: 'status_pending', color: '#92400e', bg: '#fef3c7', border: '#fde68a', Icon: Hourglass },
  Dikonfirmasi: { labelKey: 'status_confirmed', color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', Icon: BadgeCheck },
  Selesai:      { labelKey: 'status_completed', color: '#334155', bg: '#f1f5f9', border: '#cbd5e1', Icon: CheckCircle },
  Dibatalkan:   { labelKey: 'status_canceled',  color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
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
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pesanan, setPesanan] = useState(null);
  const [statusWaktu, setStatusWaktu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showAddonModal, setShowAddonModal] = useState(false);
  // no addonStep state needed
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: lang === 'id' ? 'Ya' : 'Yes',
    cancelText: lang === 'id' ? 'Batal' : 'Cancel',
    onConfirm: null,
    onClose: null
  });

  const showCustomAlert = (title, message, type = 'success', onClose = null) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: lang === 'id' ? 'Tutup' : 'Close',
      onConfirm: null,
      onClose
    });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };


  const getPaymentErrorMessage = (error) => {
    const message = error?.response?.data?.message || '';
    const status = error?.response?.status;

    if (status === 422 && message.includes('sudah dibayar')) {
      return lang === 'id'
        ? 'Pesanan ini sudah dibayar dan tidak ada fasilitas tambahan yang perlu dibayar.'
        : 'This booking has already been paid and there are no additional services waiting for payment.';
    }

    if (status === 422 && message) {
      return lang === 'id' ? message : 'Payment cannot be started for this booking.';
    }

    return lang === 'id' ? 'Terjadi kesalahan sistem pembayaran.' : 'Payment system error occurred.';
  };

  // Ambil data pesanan
  const fetchDetail = useCallback(async () => {
    try {
      const data = await getPemesananById(id);
      if (!data) { navigate('/pesanan-saya'); return; }
      setPesanan(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      navigate('/pesanan-saya');
    }
  }, [id, navigate]);

  const fetchAddons = useCallback(async () => {
    try {
      const data = await getAddons();
      setAvailableAddons(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      await Promise.all([fetchDetail(), fetchAddons()]);
    };

    if (isMounted) {
      loadData();
    }

    return () => { isMounted = false; };
  }, [fetchDetail, fetchAddons]);

  const handleAddAddons = async () => {
    if (selectedAddons.length === 0) return;
    const shouldPayAddons = String(pesanan?.payment_status || '').toLowerCase() === 'paid';

    setProcessing(true);
    try {
      await addAddonsToBooking(pesanan.id, selectedAddons);
      setShowAddonModal(false);
      setSelectedAddons([]);
      await fetchDetail();

      if (shouldPayAddons) {
        setProcessing(false);
        await handlePayment(pesanan.id, 'addons');
        return;
      }

      showToast(lang === 'id' ? 'Fasilitas ditambahkan ke total pembayaran.' : 'Facility added to the payment total.');
    } catch (error) {
      console.error(error);
      showToast(lang === 'id' ? 'Gagal menambahkan fasilitas' : 'Failed to add facilities', 'error');
    } finally {
      setProcessing(false);
    }
  };


  const handleDownloadInvoice = () => {
    downloadInvoicePdf(pesanan.id, lang);
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStatusUpdate = (newStatus) => {
    const isConfirm = newStatus === 'Dikonfirmasi';
    setModalState({
      isOpen: true,
      title: isConfirm
        ? (lang === 'id' ? 'Konfirmasi Pesanan' : 'Confirm Booking')
        : (lang === 'id' ? 'Batalkan/Tolak Pesanan' : 'Cancel/Reject Booking'),
      message: isConfirm
        ? (lang === 'id' ? 'Apakah Anda yakin ingin menyetujui dan mengonfirmasi pesanan ini?' : 'Are you sure you want to approve and confirm this booking?')
        : (lang === 'id' ? 'Apakah Anda yakin ingin membatalkan/menolak pesanan ini?' : 'Are you sure you want to cancel/reject this booking?'),
      type: isConfirm ? 'success' : 'danger',
      confirmText: isConfirm
        ? (lang === 'id' ? 'Ya, Konfirmasi' : 'Yes, Confirm')
        : (lang === 'id' ? 'Ya, Tolak' : 'Yes, Reject'),
      cancelText: lang === 'id' ? 'Batal' : 'Cancel',
      onConfirm: async () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        setProcessing(true);
        try {
          await updateStatusPemesanan(pesanan.id, newStatus);
          showCustomAlert(
            lang === 'id' ? 'Berhasil' : 'Success',
            lang === 'id' ? 'Status pesanan berhasil diperbarui.' : 'Booking status updated successfully.',
            'success'
          );
          fetchDetail();
        } catch (error) {
          console.error(error);
          showCustomAlert(
            lang === 'id' ? 'Gagal' : 'Failed',
            lang === 'id' ? 'Gagal memperbarui status pesanan.' : 'Failed to update booking status.',
            'danger'
          );
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const handlePayment = async (bookingId = pesanan.id, paymentMode = 'booking') => {
    const isAddonPayment = paymentMode === 'addons';
    setProcessing(true);
    try {
      const data = await createSnapToken(bookingId);
      if (data && data.snap_token) {
        await ensureMidtransSnap(data.client_key, data.snap_url);

        if (!window.snap?.pay) {
          showCustomAlert(
            lang === 'id' ? 'Kesalahan Pembayaran' : 'Payment Error',
            lang === 'id' ? 'Layanan pembayaran belum siap. Muat ulang halaman lalu coba lagi.' : 'Payment service is not ready. Reload the page and try again.',
            'danger'
          );
          return;
        }

        window.snap.pay(data.snap_token, {
          onSuccess: async function () {
            await fetchDetail();
            showCustomAlert(
              isAddonPayment
                ? (lang === 'id' ? 'Pembayaran Fasilitas Berhasil' : 'Add-on Payment Success')
                : (lang === 'id' ? 'Pembayaran Berhasil' : 'Payment Success'),
              isAddonPayment
                ? (lang === 'id'
                  ? 'Pembayaran fasilitas tambahan berhasil diproses. Sistem akan mengaktifkan fasilitas setelah notifikasi Midtrans diterima.'
                  : 'Your add-on payment has been processed. The system will activate the services after the Midtrans notification is received.')
                : (lang === 'id'
                  ? 'Pembayaran Anda berhasil diproses! Sistem akan memperbarui status pembayaran setelah notifikasi Midtrans diterima dan pesanan akan otomatis dikonfirmasi.'
                  : 'Your payment has been successfully processed! The system will update your payment status after the Midtrans notification is received and confirm your booking automatically.'),
              'success',
              () => fetchDetail()
            );
          },
          onPending: function () {
            showCustomAlert(
              lang === 'id' ? 'Menunggu Pembayaran' : 'Awaiting Payment',
              lang === 'id' ? 'Silakan selesaikan pembayaran Anda sesuai petunjuk Midtrans.' : 'Please complete your payment as instructed by Midtrans.',
              'warning',
              () => fetchDetail()
            );
          },
          onError: function () {
            showCustomAlert(
              lang === 'id' ? 'Pembayaran Gagal' : 'Payment Failed',
              lang === 'id' ? 'Pembayaran Anda gagal diproses. Silakan coba lagi.' : 'Your payment failed. Please try again.',
              'danger',
              () => fetchDetail()
            );
          },
          onClose: function () {
            showCustomAlert(
              lang === 'id' ? 'Transaksi Dibatalkan' : 'Transaction Cancelled',
              lang === 'id' ? 'Popup pembayaran telah ditutup.' : 'Payment popup was closed.',
              'warning',
              () => fetchDetail()
            );
          }
        });
      } else {
        showCustomAlert(
          lang === 'id' ? 'Kesalahan Pembayaran' : 'Payment Error',
          lang === 'id' ? 'Gagal mendapatkan token pembayaran.' : 'Failed to retrieve payment token.',
          'danger'
        );
      }
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 422) {
        await fetchDetail();
      }
      showCustomAlert(
        error?.response?.status === 422
          ? (lang === 'id' ? 'Pembayaran Tidak Diperlukan' : 'Payment Not Required')
          : (lang === 'id' ? 'Kesalahan Sistem' : 'System Error'),
        getPaymentErrorMessage(error),
        error?.response?.status === 422 ? 'warning' : 'danger'
      );
    } finally {
      setProcessing(false);
    }
  };

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
      {t('loading')}
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

  const detailItems = [
    { icon: User,      label: t('customer_name'),  value: pesanan.nama_pemesan },
    { icon: Briefcase, label: t('company'),    value: pesanan.perusahaan || '—' },
    { icon: Calendar,  label: lang === 'id' ? 'Tanggal Mulai' : 'Start Date', value: formatDate(pesanan.tanggal_mulai) },
    { icon: Calendar,  label: lang === 'id' ? 'Tanggal Akhir' : 'End Date', value: formatDate(pesanan.tanggal_akhir) },
    { icon: Timer,     label: t('duration'),value: pesanan.durasi ? `${pesanan.durasi} ${t('months')}` : '—' },
    { icon: Clock,     label: lang === 'id' ? 'Jam Operasional' : 'Operational Hours', value: pesanan.waktu_mulai && pesanan.waktu_selesai ? `${pesanan.waktu_mulai} – ${pesanan.waktu_selesai}` : '—' },
    { icon: Building,  label: t('booked_room'),       value: pesanan.office?.nama || '—' },
  ];

  const paymentStatusLower = String(pesanan.payment_status || 'Pending').toLowerCase();
  const paymentStatusLabel = paymentStatusLower === 'paid'
    ? (lang === 'id' ? 'Lunas (Sudah Dibayar)' : 'Paid')
    : (paymentStatusLower === 'failed'
      ? (lang === 'id' ? 'Gagal' : 'Failed')
      : (paymentStatusLower === 'expired'
        ? (lang === 'id' ? 'Kedaluwarsa' : 'Expired')
        : (lang === 'id' ? 'Belum Dibayar (Pending)' : 'Unpaid (Pending)')));

  const paymentStatusColor = paymentStatusLower === 'paid' ? '#059669' : (paymentStatusLower === 'failed' || paymentStatusLower === 'expired' ? '#dc2626' : '#d97706');
  const canAddAddons = (pesanan.status === 'Pending' && paymentStatusLower !== 'paid') || (pesanan.status === 'Dikonfirmasi' && !isExpired);

  detailItems.push({
    icon: CheckCircle,
    label: lang === 'id' ? 'Status Pembayaran' : 'Payment Status',
    value: <span style={{ color: paymentStatusColor, fontWeight: 700 }}>{paymentStatusLabel}</span>
  });

  if (pesanan.midtrans_payment_type) {
    detailItems.push({
      icon: Briefcase,
      label: lang === 'id' ? 'Metode Pembayaran' : 'Payment Method',
      value: pesanan.midtrans_payment_type.toUpperCase()
    });
  }

  if (pesanan.paid_at) {
    detailItems.push({
      icon: Clock,
      label: lang === 'id' ? 'Waktu Pembayaran' : 'Paid At',
      value: new Date(pesanan.paid_at).toLocaleString('id-ID')
    });
  }

  return (
    <div style={{ padding: '2rem 0', backgroundColor: 'var(--color-background)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Tombol kembali */}
        <button onClick={() => navigate('/pesanan-saya')} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.4rem' }}>
          <ArrowLeft size={18} /> {t('back_to_my_orders')}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Header Pesanan ── */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  {t('booking_id')}: <strong>#{pesanan.id}</strong>
                </p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                  {pesanan.office?.nama || 'Ruangan'}
                </h1>
              </div>
              <div className="detail-order-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: '9999px',
                  backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
                  color: cfg.color, fontWeight: 600
                }}>
                  <StatusIcon size={16} />
                  {t(cfg.labelKey)}
                </div>

                {user?.role === 'admin' && pesanan.status === 'Pending' && (
                  <div className="detail-admin-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleStatusUpdate('Dikonfirmasi')}
                      disabled={processing}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={16} /> {processing ? '...' : (lang === 'id' ? 'Terima' : 'Accept')}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('Dibatalkan')}
                      disabled={processing}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <X size={16} /> {processing ? '...' : (lang === 'id' ? 'Tolak' : 'Reject')}
                    </button>
                  </div>
                )}

                {user?.role !== 'admin' && user?.role !== 'helpdesk' && pesanan.status === 'Pending' && paymentStatusLower !== 'paid' && (
                  <button
                    onClick={() => handlePayment()}
                    disabled={processing}
                    className="btn btn-success btn-sm"
                  >
                    <CreditCard size={16} /> {processing ? '...' : (lang === 'id' ? 'Bayar Sekarang' : 'Pay Now')}
                  </button>
                )}

                {user?.role !== 'admin' && user?.role !== 'helpdesk' && paymentStatusLower === 'paid' && pesanan.addons?.some(a => a.pivot?.status === 'pending') && (
                  <button
                    onClick={() => handlePayment(pesanan.id, 'addons')}
                    disabled={processing}
                    className="btn btn-primary btn-sm"
                  >
                    <CreditCard size={16} /> {processing ? '...' : (lang === 'id' ? 'Bayar Fasilitas Tambahan' : 'Pay Additional Services')}
                  </button>
                )}

                {(pesanan.status === 'Dikonfirmasi' || pesanan.status === 'Selesai') && (
                  <button
                    onClick={handleDownloadInvoice}
                    className="btn btn-outline btn-sm"
                  >
                    <Printer size={16} /> Invoice
                  </button>
                )}
              </div>
            </div>

            {/* Foto ruangan */}
            {pesanan.office?.gambar && (
              <div style={{ width: '100%', height: '220px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <LazyImage src={pesanan.office.gambar} alt={pesanan.office.nama} width={600} />
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid md:grid-cols-2" style={{ gap: '1rem' }}>
              {detailItems.map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.75rem', backgroundColor: 'var(--color-secondary)',
                  borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)'
                }}>
                  <Icon size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</p>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{value}</div>
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t('total_price')}</p>
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
                {isUpcoming ? (lang === 'id' ? 'Waktu Kontrak Akan Datang' : 'Contract Commencing Soon') : (lang === 'id' ? 'Status Kontrak Berjalan' : 'Active Contract Status')}
              </h2>

              {/* Tampilan Aktif atau Upcoming */}
              {(isActive || isUpcoming) && (
                <>
                  {/* Progress bar (hanya jika sudah jalan) */}
                  {isActive && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        <span>{lang === 'id' ? 'Mulai' : 'Start'}: {formatDate(pesanan.tanggal_mulai)}</span>
                        <span>{lang === 'id' ? 'Akhir' : 'End'}: {formatDate(pesanan.tanggal_akhir)}</span>
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
                        {persen.toFixed(1)}% {lang === 'id' ? 'masa kontrak telah berjalan' : 'of contract duration has elapsed'}
                      </p>
                    </div>
                  )}

                  {/* Countdown blocks */}
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                      {isUpcoming ? (lang === 'id' ? '⏳ Kontrak dimulai dalam:' : '⏳ Contract starts in:') : (lang === 'id' ? '⏳ Sisa waktu kontrak berakhir:' : '⏳ Time remaining on contract:')}
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <CountdownBox value={statusWaktu.hari}  label={lang === 'id' ? 'Hari' : 'Days'} />
                      <CountdownBox value={statusWaktu.jam}   label={lang === 'id' ? 'Jam' : 'Hours'} />
                      <CountdownBox value={statusWaktu.menit} label={lang === 'id' ? 'Menit' : 'Mins'} />
                      <CountdownBox value={statusWaktu.detik} label={lang === 'id' ? 'Detik' : 'Secs'} />
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      {isUpcoming
                        ? (lang === 'id' ? `Kontrak akan dimulai pada ${formatDate(pesanan.tanggal_mulai)}` : `Contract starts on ${formatDate(pesanan.tanggal_mulai)}`)
                        : (lang === 'id' ? `Kontrak berakhir pada ${formatDate(pesanan.tanggal_akhir)}` : `Contract ends on ${formatDate(pesanan.tanggal_akhir)}`)
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
                  <h3>{lang === 'id' ? 'Masa Kontrak Telah Berakhir' : 'Contract Term Expired'}</h3>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    {lang === 'id' ? `Sewa ruangan ini telah selesai pada ${formatDate(pesanan.tanggal_akhir)}.` : `Room rental ended on ${formatDate(pesanan.tanggal_akhir)}.`}
                  </p>
                  <Link to="/ruangan" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                    {lang === 'id' ? 'Sewa Ruangan Lagi' : 'Rent Room Again'}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Fasilitas Ruangan & Addons */}
          <div className="card" style={{ padding: '2rem' }}>
            <div className="detail-services-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{lang === 'id' ? 'Fasilitas & Layanan' : 'Facilities & Services'}</h3>
              {canAddAddons && (
                <button
                  onClick={() => setShowAddonModal(true)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  <Plus size={16} /> {lang === 'id' ? 'Tambah Fasilitas' : 'Add Facilities'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Fasilitas Standar */}
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{lang === 'id' ? 'Fasilitas Standar:' : 'Standard Facilities:'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {pesanan.office?.fasilitas?.map((f, i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.4rem 0.75rem', fontSize: '0.85rem',
                      backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <CheckCircle size={14} color="var(--color-success)" /> {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Addons yang sudah ada */}
              {pesanan.addons?.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{lang === 'id' ? 'Layanan Tambahan Aktif:' : 'Active Add-on Services:'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {pesanan.addons.map((addon) => (
                      <span key={addon.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.4rem 0.75rem', fontSize: '0.85rem',
                        backgroundColor: addon.pivot?.status === 'pending' ? 'rgba(245, 158, 11, 0.06)' : 'rgba(37,99,235,0.06)',
                        borderRadius: 'var(--border-radius)',
                        border: `1px solid ${addon.pivot?.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(37,99,235,0.2)'}`,
                        color: addon.pivot?.status === 'pending' ? 'var(--color-warning)' : 'var(--color-primary)'
                      }}>
                        {addon.pivot?.status === 'pending' ? <Hourglass size={14} /> : <CheckCircle size={14} />}
                        {addon.nama} (Rp {Number(addon.pivot?.price_at_booking || addon.harga).toLocaleString('id-ID')}){addon.pivot?.status === 'pending' && ` - ${lang === 'id' ? 'Menunggu Pembayaran' : 'Awaiting Payment'}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Tambah Addon */}
      {showAddonModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => { setShowAddonModal(false); setSelectedAddons([]); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={24} />
            </button>

            <>
              <h3 style={{ marginBottom: '0.5rem' }}>{lang === 'id' ? 'Tambah Fasilitas' : 'Add Facilities'}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                {lang === 'id' ? 'Pilih fasilitas tambahan untuk pesanan ini.' : 'Select additional facilities for this booking.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {availableAddons.filter(addon => !pesanan.addons?.find(a => a.id === addon.id)).length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '2rem', backgroundColor: 'var(--color-secondary)',
                    borderRadius: 'var(--border-radius)', border: '1px dashed var(--color-border)'
                  }}>
                    <BadgeCheck size={40} color="var(--color-success)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>{lang === 'id' ? 'Semua fasilitas telah ditambahkan' : 'All facilities added'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {lang === 'id' ? 'Pesanan ini sudah memiliki semua fasilitas yang tersedia.' : 'This booking already has all available facilities.'}
                    </p>
                  </div>
                ) : (
                  availableAddons
                    .filter(addon => !pesanan.addons?.find(a => a.id === addon.id))
                    .map(addon => (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '1rem', borderRadius: 'var(--border-radius)',
                          border: `2px solid ${selectedAddons.includes(addon.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: selectedAddons.includes(addon.id) ? 'rgba(37,99,235,0.05)' : 'var(--color-secondary)',
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            backgroundColor: selectedAddons.includes(addon.id) ? 'var(--color-primary)' : 'var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                          }}>
                            {addon.nama.toLowerCase().includes('kopi') ? <Coffee size={20} /> :
                             addon.nama.toLowerCase().includes('wifi') ? <Wifi size={20} /> :
                             addon.nama.toLowerCase().includes('monitor') ? <Monitor size={20} /> :
                             addon.nama.toLowerCase().includes('print') ? <Printer size={20} /> : <Plus size={20} />}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{addon.nama}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                              Rp {Number(addon.harga).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        {selectedAddons.includes(addon.id) && <CheckCircle size={20} color="var(--color-primary)" />}
                      </div>
                    ))
                )}
              </div>

              {availableAddons.filter(addon => !pesanan.addons?.find(a => a.id === addon.id)).length > 0 && (
                <div style={{
                  backgroundColor: 'var(--color-secondary)', padding: '1rem',
                  borderRadius: 'var(--border-radius)', marginBottom: '1.5rem',
                  border: '1px dashed var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600 }}>
                    <span>{lang === 'id' ? 'Total Biaya Tambahan:' : 'Total Additional Cost:'}</span>
                    <span style={{ color: 'var(--color-primary)' }}>
                      Rp {availableAddons
                        .filter(a => selectedAddons.includes(a.id))
                        .reduce((sum, a) => sum + Number(a.harga), 0)
                        .toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div className="addon-modal-actions" style={{ display: 'flex', gap: '1rem' }}>
                {availableAddons.filter(addon => !pesanan.addons?.find(a => a.id === addon.id)).length === 0 ? (
                  <button onClick={() => setShowAddonModal(false)} className="btn btn-primary" style={{ flex: 1 }}>
                    {lang === 'id' ? 'Tutup' : 'Close'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setShowAddonModal(false); setSelectedAddons([]); }} className="btn btn-outline" style={{ flex: 1 }}>{lang === 'id' ? 'Batal' : 'Cancel'}</button>
                    <button
                      onClick={handleAddAddons}
                      disabled={selectedAddons.length === 0 || processing}
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                    >
                      {processing
                        ? t('submitting')
                        : String(pesanan?.payment_status || '').toLowerCase() === 'paid'
                          ? (lang === 'id' ? 'Tambah & Bayar' : 'Add & Pay')
                          : (lang === 'id' ? 'Tambah ke Total' : 'Add to Total')}
                    </button>
                  </>
                )}
              </div>
            </>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .detail-order-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch !important;
          }

          .detail-order-actions > .btn,
          .detail-order-actions > a.btn,
          .detail-admin-actions,
          .detail-admin-actions .btn {
            width: 100%;
            justify-content: center;
          }

          .detail-admin-actions,
          .detail-services-header,
          .addon-modal-actions {
            flex-direction: column;
            align-items: stretch !important;
          }

          .detail-services-header .btn,
          .addon-modal-actions .btn {
            width: 100%;
          }
        }
      `}</style>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '2rem', right: '1.5rem', zIndex: 99999,
          padding: '1rem 1.5rem', borderRadius: '12px', color: 'white',
          maxWidth: '90vw', width: 'max-content',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideIn 0.3s ease-out forwards'
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{toast.message}</span>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(110%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
      {/* Modal Notification / Dialog */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => {
          if (modalState.onClose) modalState.onClose();
          setModalState(prev => ({ ...prev, isOpen: false }));
        }}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
};

export default DetailPesanan;
