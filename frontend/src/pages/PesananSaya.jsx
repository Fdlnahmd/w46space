import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPemesananByUser, batalkanPemesanan, downloadInvoicePdf, createSnapToken, ensureMidtransSnap } from '../services/apiService';
import { ClipboardList, XCircle, CheckCircle, Eye, Hourglass, BadgeCheck, AlertCircle, RefreshCw, Star, Printer } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import LazyImage from '../components/LazyImage';
import { useLanguage } from '../contexts/LanguageContext';

const statusConfig = {
  Pending:      { class: 'badge-warning', Icon: Hourglass,   labelKey: 'status_pending' },
  Dikonfirmasi: { class: 'badge-success', Icon: BadgeCheck,  labelKey: 'status_confirmed' },
  Selesai:      { class: 'badge-neutral', Icon: CheckCircle, labelKey: 'status_completed' },
  Dibatalkan:   { class: 'badge-danger',  Icon: XCircle,     labelKey: 'status_canceled' },
};

const PesananSaya = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [pesananList, setPesananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [modalState, setModalState] = useState(() => ({
    isOpen: !!location.state?.error,
    title: t('booking_not_found') || 'Peringatan',
    message: location.state?.error || '',
    type: 'warning',
    confirmText: lang === 'id' ? 'Ya' : 'Yes',
    cancelText: lang === 'id' ? 'Batal' : 'Cancel',
    onConfirm: null,
    onClose: null
  }));

  useEffect(() => {
    if (location.state?.error) {
      // clear location state to prevent showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadData = useCallback(async (showLoading = true) => {
    if (user) {
      if (showLoading) setLoading(true);
      setError(false);
      try {
        const res = await getPemesananByUser();
        // Handle paginated response: { data: [...] }
        setPesananList(res.data || []);
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

  const handleBatalkan = (id) => {
    setModalState({
      isOpen: true,
      title: lang === 'id' ? 'Batalkan Pemesanan' : 'Cancel Booking',
      message: t('cancel_confirm'),
      type: 'danger',
      confirmText: lang === 'id' ? 'Ya, Batalkan' : 'Yes, Cancel',
      cancelText: lang === 'id' ? 'Batal' : 'Cancel',
      onConfirm: () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        batalkanPemesanan(id)
          .then(() => { 
            showCustomAlert(
              lang === 'id' ? 'Berhasil' : 'Success', 
              t('cancel_success'), 
              'success'
            ); 
            loadData(); 
          })
          .catch(err => {
            showCustomAlert(
              lang === 'id' ? 'Gagal' : 'Failed', 
              err.message, 
              'danger'
            );
          });
      }
    });
  };

  const handlePayment = async (bookingId) => {
    if (payingId) return;
    setPayingId(bookingId);
    try {
      const response = await createSnapToken(bookingId);
      const snapToken = response?.snap_token;
      if (snapToken) {
        await ensureMidtransSnap(response.client_key, response.snap_url);

        if (!window.snap?.pay) {
          showCustomAlert(
            lang === 'id' ? 'Kesalahan Pembayaran' : 'Payment Error',
            lang === 'id' ? 'Layanan pembayaran belum siap. Muat ulang halaman lalu coba lagi.' : 'Payment service is not ready. Reload the page and try again.',
            'danger'
          );
          return;
        }

        window.snap.pay(snapToken, {
          onSuccess: async function () {
            showCustomAlert(
              lang === 'id' ? 'Pembayaran Berhasil' : 'Payment Success',
              lang === 'id' 
                ? 'Pembayaran Anda berhasil diproses! Sistem akan memperbarui status pembayaran setelah notifikasi Midtrans diterima, lalu admin akan memproses pesanan Anda.' 
                : 'Your payment has been successfully processed! The system will update your payment status after the Midtrans notification is received, then admin will process your booking.',
              'success',
              () => loadData(false)
            );
          },
          onPending: function () {
            showCustomAlert(
              lang === 'id' ? 'Menunggu Pembayaran' : 'Awaiting Payment',
              lang === 'id' ? 'Silakan selesaikan pembayaran Anda sesuai petunjuk Midtrans.' : 'Please complete your payment as instructed by Midtrans.',
              'warning',
              () => loadData(false)
            );
          },
          onError: function () {
            showCustomAlert(
              lang === 'id' ? 'Pembayaran Gagal' : 'Payment Failed',
              lang === 'id' ? 'Pembayaran Anda gagal diproses. Silakan coba lagi.' : 'Your payment failed. Please try again.',
              'danger',
              () => loadData(false)
            );
          },
          onClose: function () {
            showCustomAlert(
              lang === 'id' ? 'Transaksi Dibatalkan' : 'Transaction Cancelled',
              lang === 'id' ? 'Popup pembayaran telah ditutup.' : 'Payment popup was closed.',
              'warning',
              () => loadData(false)
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
    } catch (err) {
      console.error('Payment error:', err);
      showCustomAlert(
        lang === 'id' ? 'Kesalahan Sistem' : 'System Error',
        lang === 'id' ? 'Gagal memulai pembayaran.' : 'Failed to initialize payment.',
        'danger'
      );
    } finally {
      setPayingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return dateString.split('T')[0];
  };

  const renderStatus = (item, isUpcoming) => {
    const status = item.status;
    const cfg = statusConfig[status] || statusConfig['Pending'];
    const Icon = cfg.Icon;
    const isPaid = String(item.payment_status || '').toLowerCase() === 'paid';

    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span className={`badge ${cfg.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Icon size={13} /> {t(cfg.labelKey)}
        </span>
        {isPaid && (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#059669', color: 'white', fontWeight: 600 }}>
            ✓ {lang === 'id' ? 'Lunas' : 'Paid'}
          </span>
        )}
        {isUpcoming && (
          <span className="badge" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            backgroundColor: 'rgba(59, 130, 246, 0.12)', 
            color: '#3b82f6', 
            border: '1px solid rgba(59, 130, 246, 0.3)' 
          }}>
            🕒 {lang === 'id' ? 'Belum Berjalan' : 'Not Started'}
          </span>
        )}
      </div>
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('my_bookings_title')}</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {t('my_bookings_subtitle')}
            </p>
          </div>
        </div>

        {/* Konten */}
        {loading ? (
          <SkeletonLoader type="row" count={4} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-danger)' }}>
            <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('fail_load_bookings')}</h3>
            <p>{t('please_check_connection')}</p>
            <button onClick={() => loadData()} className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} /> {t('try_again')}
            </button>
          </div>
        ) : pesananList.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'var(--color-background)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
              <ClipboardList size={64} color="var(--color-text-muted)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{t('no_bookings')}</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {t('no_bookings_desc')}
            </p>
            <Link to="/ruangan" className="btn btn-primary">{t('order_now')}</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pesananList.map(item => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const startDate = item.tanggal_mulai ? new Date(item.tanggal_mulai.split('T')[0] + 'T00:00:00') : null;
              const isUpcoming = item.status === 'Dikonfirmasi' && startDate && startDate.getTime() > today.getTime();

              return (
                <div key={item.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                    {/* Foto ruangan kecil */}
                    {item.office?.gambar && (
                      <div style={{ width: '100px', height: '80px', borderRadius: 'var(--border-radius)', overflow: 'hidden', flexShrink: 0 }}>
                        <LazyImage src={item.office.gambar} alt={item.office.nama} width={150} quality={60} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: '200px' }}>
                      {/* Nama + Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>#{item.id}</p>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {item.office?.nama || t('room_not_found')}
                            {item.parent_id && (
                              <span style={{ 
                                fontSize: '0.65rem', backgroundColor: 'var(--color-secondary)', 
                                color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px',
                                border: '1px solid var(--color-primary)'
                              }}>
                                {t('extension')}
                              </span>
                            )}
                          </h3>
                        </div>
                        {renderStatus(item, isUpcoming)}
                      </div>

                      {/* Info singkat */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {item.tanggal_mulai && (
                          <span>📅 <strong>{lang === 'id' ? 'Mulai' : 'Start'}:</strong> {formatDate(item.tanggal_mulai)}</span>
                        )}
                        {item.tanggal_akhir && (
                          <span>🏁 <strong>{lang === 'id' ? 'Akhir' : 'End'}:</strong> {formatDate(item.tanggal_akhir)}</span>
                        )}
                        {item.durasi && (
                          <span>⏱ <strong>{t('duration')}:</strong> {item.durasi} {t('months')}</span>
                        )}
                        {item.waktu_mulai && item.waktu_selesai && (
                          <span>⏰ {item.waktu_mulai} – {item.waktu_selesai}</span>
                        )}
                        {item.perusahaan && (
                          <span>🏢 {item.perusahaan}</span>
                        )}
                      </div>

                      {/* Footer: harga + aksi */}
                      <div className="order-card-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t('total_price')}</p>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                              Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        <div className="order-actions-group">
                          {/* Tombol utama: Lihat Detail Pesanan */}
                          <Link
                            to={`/pesanan-saya/${item.id}`}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Eye size={15} /> {t('detail')}
                          </Link>

                          {(item.status === 'Dikonfirmasi' || item.status === 'Selesai') && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                downloadInvoicePdf(item.id, lang);
                              }}
                              className="btn btn-outline-primary-custom"
                              style={{ 
                                padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                display: 'flex', alignItems: 'center', gap: '0.35rem'
                              }}
                            >
                              <Printer size={15} /> Invoice
                            </button>
                          )}

                          {/* Tombol Beri Ulasan & Perpanjang — Jika Dikonfirmasi atau Selesai dan tidak upcoming */}
                          {(item.status === 'Dikonfirmasi' || item.status === 'Selesai') && !isUpcoming && (
                            <>
                              <Link
                                  to={`/ruangan/${item.office_id}#reviews`}
                                className="btn btn-outline-warning-custom"
                                style={{ 
                                  padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                  display: 'flex', alignItems: 'center', gap: '0.35rem'
                                }}
                              >
                                <Star size={15} /> {t('write_review')}
                              </Link>
                              <Link
                                to={`/ruangan/${item.office_id}?extend_from=${item.id}`}
                                className="btn btn-outline-primary-custom"
                                style={{ 
                                  padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                  display: 'flex', alignItems: 'center', gap: '0.35rem'
                                }}
                              >
                                <RefreshCw size={15} /> {t('extend')}
                              </Link>
                            </>
                          )}

                          {/* Bayar Sekarang — jika Pending dan belum Lunas */}
                          {item.status === 'Pending' && String(item.payment_status || '').toLowerCase() !== 'paid' && (
                            <button
                              onClick={() => handlePayment(item.id)}
                              disabled={payingId === item.id}
                              className="btn btn-success"
                              style={{ 
                                padding: '0.45rem 0.85rem', fontSize: '0.9rem', 
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                backgroundColor: '#10b981', borderColor: '#10b981', color: 'white'
                              }}
                            >
                              💳 {payingId === item.id ? '...' : (lang === 'id' ? 'Bayar Sekarang' : 'Pay Now')}
                            </button>
                          )}

                          {/* Batalkan — hanya jika Pending dan belum Lunas */}
                          {item.status === 'Pending' && String(item.payment_status || '').toLowerCase() !== 'paid' && (
                            <button
                              onClick={() => handleBatalkan(item.id)}
                              className="btn btn-danger"
                              style={{ padding: '0.45rem 0.85rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <XCircle size={15} /> {t('cancel_booking')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      <style>{`
        .order-card-footer {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          gap: 1rem !important;
          border-top: 1px solid var(--color-border) !important;
          padding-top: 1rem !important;
          margin-top: 1rem !important;
        }
        .order-actions-group {
          display: flex !important;
          gap: 0.5rem !important;
          align-items: center !important;
          flex-wrap: wrap !important;
          justify-content: flex-end !important;
        }
        .order-actions-group .btn, 
        .order-actions-group a.btn {
          white-space: nowrap !important;
        }
        @media (max-width: 768px) {
          .order-card-footer {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1.25rem !important;
          }
          .order-actions-group {
            justify-content: stretch !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
          }
          .order-actions-group > * {
            width: 100% !important;
            justify-content: center !important;
          }
          /* Tombol 'Lihat Detail' biar full width sendiri di atas kalau perlu */
          .order-actions-group a:first-child {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 480px) {
          .order-actions-group {
            grid-template-columns: 1fr !important;
          }
          .order-actions-group a:first-child {
            grid-column: span 1 !important;
          }
        }
        .btn-outline-primary-custom {
          background-color: transparent !important;
          border: 1px solid var(--color-primary) !important;
          color: var(--color-primary) !important;
          transition: var(--transition) !important;
        }
        .btn-outline-primary-custom:hover {
          background-color: var(--color-primary) !important;
          color: white !important;
        }
        .btn-outline-warning-custom {
          background-color: transparent !important;
          border: 1px solid var(--color-warning) !important;
          color: var(--color-warning) !important;
          transition: var(--transition) !important;
        }
        .btn-outline-warning-custom:hover {
          background-color: var(--color-warning) !important;
          color: white !important;
        }
      `}</style>
      
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
    </div>
  );
};

export default PesananSaya;
