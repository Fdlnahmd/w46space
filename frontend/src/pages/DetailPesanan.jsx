import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getPemesananById, 
  updateStatusPemesanan, 
  getAddons, 
  addAddonsToBooking,
  getInvoiceUrl
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Building, Calendar, Clock, User, Briefcase,
  CheckCircle, XCircle, Timer, AlertCircle, BadgeCheck, Hourglass, Check, X,
  Plus, Coffee, Wifi, Monitor, Printer, Ticket
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
  const { user } = useAuth();
  const [pesanan, setPesanan] = useState(null);
  const [statusWaktu, setStatusWaktu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonStep, setAddonStep] = useState(1); // 1: Selection, 2: Payment
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Ambil data pesanan
  const fetchDetail = useCallback(async () => {
    try {
      const data = await getPemesananById(id);
      if (!data) { navigate('/pesanan-saya'); return; }
      setPesanan(data);
      setLoading(false);
    } catch (err) { console.error(err); }
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
    setProcessing(true);
    try {
      await addAddonsToBooking(pesanan.id, selectedAddons);
      showToast('Permintaan fasilitas terkirim! Menunggu konfirmasi admin.');
      setShowAddonModal(false);
      setSelectedAddons([]);
      setAddonStep(1);
      fetchDetail();
    } catch (error) {
      console.error(error);
      showToast('Gagal menambahkan fasilitas', 'error');
    } finally {
      setProcessing(false);
    }
  };


  const handleDownloadInvoice = () => {
    window.open(getInvoiceUrl(pesanan.id), '_blank');
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    setProcessing(true);
    try {
      await updateStatusPemesanan(pesanan.id, newStatus);
      await fetchDetail();
    } catch (error) {
      console.error(error);
      alert('Gagal memperbarui status');
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
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: '9999px',
                  backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
                  color: cfg.color, fontWeight: 600
                }}>
                  <StatusIcon size={16} />
                  {cfg.label}
                </div>

                {user?.role === 'admin' && pesanan.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleStatusUpdate('Dikonfirmasi')}
                      disabled={processing}
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <Check size={16} /> {processing ? '...' : 'Terima'}
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('Dibatalkan')}
                      disabled={processing}
                      className="btn btn-outline" 
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                    >
                      <X size={16} /> {processing ? '...' : 'Tolak'}
                    </button>
                  </div>
                )}

                {(pesanan.status === 'Dikonfirmasi' || pesanan.status === 'Selesai') && (
                  <button 
                    onClick={handleDownloadInvoice} 
                    className="btn btn-outline" 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      fontSize: '0.85rem', padding: '0.5rem 1rem'
                    }}
                  >
                    <Printer size={16} /> Download Invoice
                  </button>
                )}
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

          {/* Fasilitas Ruangan & Addons */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Fasilitas & Layanan</h3>
              {pesanan.status === 'Dikonfirmasi' && !isExpired && (
                <button 
                  onClick={() => setShowAddonModal(true)}
                  className="btn btn-outline" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  <Plus size={16} /> Tambah Fasilitas
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Fasilitas Standar */}
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Fasilitas Standar:</p>
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Layanan Tambahan Aktif:</p>
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
                        {addon.nama} {addon.pivot?.status === 'pending' && '(Pending)'}
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
              onClick={() => { setShowAddonModal(false); setAddonStep(1); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={24} />
            </button>

            {addonStep === 1 ? (
              <>
                <h3 style={{ marginBottom: '0.5rem' }}>Tambah Fasilitas</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                  Pilih fasilitas tambahan untuk pesanan ini.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {availableAddons
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
                    ))}
                </div>

                <div style={{ 
                  backgroundColor: 'var(--color-secondary)', padding: '1rem', 
                  borderRadius: 'var(--border-radius)', marginBottom: '1.5rem',
                  border: '1px dashed var(--color-border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600 }}>
                    <span>Total Tagihan Tambahan:</span>
                    <span style={{ color: 'var(--color-primary)' }}>
                      Rp {availableAddons
                        .filter(a => selectedAddons.includes(a.id))
                        .reduce((sum, a) => sum + Number(a.harga), 0)
                        .toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowAddonModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Batal</button>
                  <button 
                    onClick={() => setAddonStep(2)}
                    disabled={selectedAddons.length === 0}
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                  >
                    Lanjut ke Pembayaran
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                    <Ticket size={32} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ margin: 0 }}>Konfirmasi Tambahan</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Pastikan detail fasilitas sudah benar.
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: 'var(--color-background)', padding: '1.5rem', 
                  borderRadius: 'var(--border-radius)', marginBottom: '1.5rem',
                  border: '1px solid var(--color-border)', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Total Tambahan:</p>
                  <p style={{ fontWeight: 700, fontSize: '1.75rem', color: 'var(--color-primary)', margin: 0 }}>
                    Rp {availableAddons
                        .filter(a => selectedAddons.includes(a.id))
                        .reduce((sum, a) => sum + Number(a.harga), 0)
                        .toLocaleString('id-ID')}
                  </p>
                  <div style={{ 
                    marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff7ed', 
                    borderRadius: '8px', border: '1px solid #ffedd5'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#9a3412', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <AlertCircle size={16} /> Permintaan akan diperiksa oleh Admin.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setAddonStep(1)} className="btn btn-outline" style={{ flex: 1 }}>Kembali</button>
                  <button 
                    onClick={handleAddAddons}
                    disabled={processing}
                    className="btn btn-primary" 
                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {processing ? 'Memproses...' : <><BadgeCheck size={18} /> Kirim Permintaan</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default DetailPesanan;
