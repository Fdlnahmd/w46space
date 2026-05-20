import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getRuanganById, createPemesanan, getPemesananById, getAddons, checkCoupon } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckCircle2, ArrowLeft, LogIn, ShieldAlert, Coffee, Wifi, Monitor, Printer, Ticket, Check, X } from 'lucide-react';

const iconMap = {
  Coffee: <Coffee size={18} />,
  Wifi: <Wifi size={18} />,
  Monitor: <Monitor size={18} />,
  Printer: <Printer size={18} />,
};

// Hitung tanggalAkhir dari tanggalMulai + durasi bulan
const hitungTanggalAkhir = (tanggalMulai, durasiButlan) => {
  if (!tanggalMulai) return null;
  const d = new Date(tanggalMulai);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + parseInt(durasiButlan));
  return d.toISOString().split('T')[0];
};

import Modal from '../components/Modal';
import ReviewSection from '../components/ReviewSection';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCustom.css';

const DetailRuangan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [ruangan, setRuangan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [occupiedDates, setOccupiedDates] = useState([]);
  
  // Feature Additions
  const [availableAddons, setAvailableAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Ambil extend_from dari query param
  const queryParams = new URLSearchParams(location.search);
  const extendFromId = queryParams.get('extend_from');

  const [formData, setFormData] = useState({
    namaPemesan: user?.name || user?.nama || '',
    perusahaan: '',
    tanggalMulai: '',
    durasi: 1,          // durasi dalam bulan
    waktuMulai: '08:00',
    waktuSelesai: '17:00',
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRuanganById(id);
      if (data) {
        setRuangan(data);
        if (data.bookings) {
          const dates = data.bookings
            .filter(b => b.status !== 'Dibatalkan')
            .map(b => ({
              start: new Date(b.tanggal_mulai),
              end: new Date(b.tanggal_akhir)
            }));
          setOccupiedDates(dates);
        }
      } else {
        navigate('/ruangan');
      }

      // Load Addons
      try {
        const addonsData = await getAddons();
        setAvailableAddons(addonsData);
      } catch (err) { console.error('Addons fail:', err); }

      // Logika Perpanjang Kontrak
      if (extendFromId) {
        try {
          const oldBooking = await getPemesananById(extendFromId);
          if (oldBooking && oldBooking.tanggal_akhir) {
            const nextDate = new Date(oldBooking.tanggal_akhir);
            if (!isNaN(nextDate.getTime())) {
              nextDate.setDate(nextDate.getDate() + 1);
              setFormData(prev => ({
                ...prev,
                perusahaan: oldBooking.perusahaan || '',
                tanggalMulai: nextDate.toISOString().split('T')[0],
                durasi: oldBooking.durasi
              }));
            }
          }
        } catch (err) {
          console.error('Gagal mengambil data perpanjangan:', err);
        }
      }
    };

    fetchData();

    // 2. Availability Realtime (Polling setiap 10 detik)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [id, navigate, extendFromId]);

  // Fungsi untuk mengecek apakah tanggal tertentu sudah dipesan
  const isDateOccupied = ({ date, view }) => {
    if (view === 'month') {
      // Normalisasi tanggal yang sedang dicek ke 00:00:00
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      return occupiedDates.some(range => {
        // Normalisasi range start & end ke 00:00:00
        const start = new Date(range.start);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(range.end);
        end.setHours(0, 0, 0, 0);
        
        return d >= start && d <= end;
      });
    }
    return false;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      const res = await checkCoupon(couponCode);
      // Backend returns { message: '...', coupon: { ... } }
      setCouponData(res.coupon || res); 
    } catch (err) {
      setCouponData(null);
      setCouponError(err.response?.data?.message || 'Kupon tidak valid');
    }
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Hitung total harga: (harga/hari * 26 * durasi) + addons - discount
  const hitungTotal = () => {
    if (!ruangan) return 0;
    
    const hrg = Number(ruangan.harga || 0);
    const dur = parseInt(formData.durasi || 1);
    const basePrice = hrg * 26 * dur;
    
    // Addons
    const addonsTotal = (availableAddons || [])
      .filter(a => (selectedAddons || []).includes(a.id))
      .reduce((sum, a) => sum + Number(a.harga || 0), 0);
      
    // Discount
    let discount = 0;
    if (couponData) {
      if (couponData.type === 'percentage') {
        discount = (basePrice * Number(couponData.value || 0)) / 100;
      } else {
        discount = Number(couponData.value || 0);
      }
    }
    
    const total = basePrice + addonsTotal - discount;
    return isNaN(total) ? 0 : total;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.tanggalMulai) {
      setLoading(false);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Tanggal Belum Dipilih',
        message: 'Silakan pilih tanggal mulai kontrak terlebih dahulu melalui kalender yang tersedia.'
      });
      return;
    }

    try {
      const tanggalAkhir = hitungTanggalAkhir(formData.tanggalMulai, formData.durasi);
      if (!tanggalAkhir) throw new Error('Format tanggal tidak valid');

      const dataKeBackend = {
        id_ruangan: parseInt(id),
        parent_id: extendFromId || null,
        nama_pemesan: formData.namaPemesan,
        perusahaan: formData.perusahaan,
        tanggal_mulai: formData.tanggalMulai,
        tanggal_akhir: tanggalAkhir,
        waktu_mulai: formData.waktuMulai,
        waktu_selesai: formData.waktuSelesai,
        durasi: parseInt(formData.durasi),
        total_harga: hitungTotal(),
        coupon_code: couponData ? couponData.code : null,
        addon_ids: selectedAddons
      };

      await createPemesanan(dataKeBackend);

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Pemesanan Berhasil',
        message: 'Permintaan pemesanan Anda telah diterima. Silakan cek status berkala di halaman Pesanan Saya.'
      });
    } catch (error) {
      console.error('Booking error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Pemesanan Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
    if (modal.type === 'success') {
      navigate('/pesanan-saya');
    }
  };

  if (!ruangan) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      Memuat data ruangan...
    </div>
  );

  const renderBookingSection = () => {
    // Admin tidak bisa booking
    if (user?.role === 'admin') {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          textAlign: 'center', padding: '2rem',
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--border-radius)'
        }}>
          <ShieldAlert size={48} color="var(--color-warning)" />
          <h3 style={{ color: '#92400e' }}>Akses Terbatas untuk Admin</h3>
          <p style={{ color: '#78350f' }}>
            Akun Admin hanya memiliki akses ke CRUD (kelola data). Pemesanan ruangan dilakukan oleh pengguna terdaftar.
          </p>
          <Link to="/admin" className="btn btn-outline" style={{ marginTop: '0.5rem' }}>
            Pergi ke Panel Admin
          </Link>
        </div>
      );
    }

    // Belum login
    if (!user) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          textAlign: 'center', padding: '2rem',
          backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)'
        }}>
          <LogIn size={48} color="var(--color-text-muted)" />
          <h3>Anda belum login</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Silakan masuk atau daftar akun terlebih dahulu untuk melakukan pemesanan.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Masuk ke Akun</Link>
            <Link to="/register" className="btn btn-outline">Daftar Akun Baru</Link>
          </div>
        </div>
      );
    }

    // Ruangan sedang dipesan (Penuh)
    if (ruangan.is_booked) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          textAlign: 'center', padding: '2rem',
          backgroundColor: '#fef2f2', border: '1px solid #fee2e2',
          borderRadius: 'var(--border-radius)'
        }}>
          <ShieldAlert size={48} color="var(--color-danger)" />
          <h3 style={{ color: '#991b1b' }}>Ruangan Sedang Penuh</h3>
          <p style={{ color: '#b91c1c' }}>
            Maaf, ruangan ini sudah memiliki penyewa aktif hingga tanggal <strong>{new Date(ruangan.booked_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          </p>
          <button onClick={() => navigate('/ruangan')} className="btn btn-outline" style={{ marginTop: '0.5rem', borderColor: '#ef4444', color: '#b91c1c' }}>
            Cari Ruangan Lain
          </button>
        </div>
      );
    }

    // User biasa — form booking
    const totalHarga = hitungTotal();

    return (
      <form onSubmit={handleBooking} className="grid md:grid-cols-2" style={{ gap: '1.5rem' }}>
        {/* Nama Pemesan */}
        <div className="form-group">
          <label className="form-label">Nama Pemesan</label>
          <input
            type="text" className="form-control"
            value={formData.namaPemesan}
            onChange={(e) => setFormData({ ...formData, namaPemesan: e.target.value })}
            disabled
            style={{ backgroundColor: 'var(--color-secondary)', cursor: 'not-allowed' }}
          />
        </div>

        {/* Perusahaan */}
        <div className="form-group">
          <label className="form-label">Nama Perusahaan (Opsional)</label>
          <input
            type="text" className="form-control"
            value={formData.perusahaan}
            onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
            placeholder="PT. Nama Perusahaan"
          />
        </div>

        {/* Visual Calendar */}
        <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
          <label className="form-label">Cek Ketersediaan (Kalender)</label>
          <Calendar
            onChange={(date) => {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              const formattedDate = `${yyyy}-${mm}-${dd}`;
              setFormData({ ...formData, tanggalMulai: formattedDate });
            }}
            value={formData.tanggalMulai ? new Date(formData.tanggalMulai) : new Date()}
            tileDisabled={isDateOccupied}
            minDate={new Date()}
            className="custom-calendar"
          />
        </div>

        {/* Fasilitas Tambahan (Addons) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Fasilitas Tambahan (Opsional)</label>
          <div className="addons-mobile-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {availableAddons.map(addon => (
              <div 
                key={addon.id} 
                onClick={() => toggleAddon(addon.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--border-radius)', cursor: 'pointer', border: '1px solid',
                  borderColor: selectedAddons.includes(addon.id) ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedAddons.includes(addon.id) ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-surface)',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ color: selectedAddons.includes(addon.id) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {iconMap[addon.icon] || <Check size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{addon.nama}</p>
                  <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.75rem' }}>
                    + Rp {addon.harga.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon Code */}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Punya Kode Promo?</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Ticket size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text" className="form-control"
                placeholder="Masukkan kode (misal: KUPONSAYA)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                style={{ paddingLeft: '2.5rem' }}
                disabled={!!couponData}
              />
            </div>
            {couponData ? (
              <button type="button" onClick={() => { setCouponData(null); setCouponCode(''); }} className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                <X size={18} />
              </button>
            ) : (
              <button type="button" onClick={handleApplyCoupon} className="btn btn-outline">Gunakan</button>
            )}
          </div>
          {couponError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{couponError}</p>}
          {couponData && (
            <p style={{ color: 'var(--color-success)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={14} /> Kupon <strong>{couponData.code}</strong> berhasil dipasang!
            </p>
          )}
        </div>

        {/* Tanggal Mulai & Durasi */}
        <div className="form-group">
          <label className="form-label">Tanggal Mulai Kontrak</label>
          <div style={{ 
            padding: '0.75rem', backgroundColor: 'var(--color-secondary)', 
            borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)',
            fontWeight: 600, color: formData.tanggalMulai ? 'var(--color-text-main)' : 'var(--color-text-muted)'
          }}>
            {formData.tanggalMulai ? new Date(formData.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih di kalender'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Durasi Kontrak</label>
          <select
            className="form-control"
            value={formData.durasi}
            onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
          >
            <option value={1}>1 Bulan</option>
            <option value={2}>2 Bulan</option>
            <option value={3}>3 Bulan</option>
            <option value={6}>6 Bulan</option>
            <option value={12}>12 Bulan (1 Tahun)</option>
          </select>
        </div>

        {/* Waktu */}
        <div className="time-input-group" style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Jam Masuk</label>
            <input type="time" className="form-control" style={{ minHeight: '45px' }} value={formData.waktuMulai} onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Jam Keluar</label>
            <input type="time" className="form-control" style={{ minHeight: '45px' }} value={formData.waktuSelesai} onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })} />
          </div>
        </div>

        {/* Ringkasan Kontrak */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="summary-box" style={{
            backgroundColor: 'var(--color-secondary)', padding: '1.25rem',
            borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)'
          }}>
            <div className="summary-row">
              <span>Harga Ruangan ({formData.durasi} bln):</span>
              <span className="price-text">Rp {(Number(ruangan?.harga ?? 0) * 26 * formData.durasi).toLocaleString('id-ID')}</span>
            </div>
            
            {selectedAddons.length > 0 && (
              <div className="summary-row">
                <span>Fasilitas Tambahan:</span>
                <span className="price-text">+ Rp {Number(availableAddons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.harga, 0) ?? 0).toLocaleString('id-ID')}</span>
              </div>
            )}

            {couponData && (
              <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                <span>Diskon Kupon ({couponData.code}):</span>
                <span className="price-text">- Rp {Number(couponData.type === 'percentage' ? (Number(ruangan?.harga ?? 0) * 26 * formData.durasi * couponData.value / 100) : couponData.value).toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="summary-row total-row" style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 600 }}>Total Pembayaran:</span>
              <span className="total-price-text">
                Rp {Number(totalHarga ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <button
            type="submit" className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
            disabled={ruangan.status !== 'Tersedia' || loading}
          >
            {loading ? 'Mengajukan...' : (ruangan.status === 'Tersedia' ? 'Ajukan Pemesanan' : 'Ruangan Tidak Tersedia')}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="detail-page-container" style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          <ArrowLeft size={18} /> Kembali
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Info Ruangan */}
          <div className="card" style={{ padding: '2rem' }}>
            <div className="grid md:grid-cols-2" style={{ gap: '2rem' }}>
              <div>
                <img
                  src={ruangan.gambar} alt={ruangan.nama}
                  style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'var(--border-radius-lg)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ruangan.kategori && (
                  <span style={{ 
                    alignSelf: 'flex-start', fontSize: '0.85rem', fontWeight: 600, 
                    color: 'var(--color-primary)', backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                    padding: '0.25rem 0.75rem', borderRadius: '4px' 
                  }}>
                    {ruangan.kategori}
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{ruangan.nama}</h1>
                  {ruangan.is_booked ? (
                    <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      Penuh
                    </span>
                  ) : ruangan.status === 'Maintenance' || ruangan.status === 'Pemeliharaan' ? (
                    <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      Pemeliharaan
                    </span>
                  ) : (
                    <span className={`badge ${ruangan.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {ruangan.status}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Rp {Number(ruangan?.harga ?? 0).toLocaleString('id-ID')}
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}> /hari</span>
                </p>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{ruangan.deskripsi}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                  <Users size={20} color="var(--color-primary)" />
                  Kapasitas Maksimal: {ruangan.kapasitas} orang
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Fasilitas:</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ruangan.fasilitas.map((f, i) => (
                      <span key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-secondary)',
                        borderRadius: 'var(--border-radius)', fontSize: '0.9rem',
                        border: '1px solid var(--color-border)'
                      }}>
                        <CheckCircle2 size={16} color="var(--color-success)" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulir / Info Booking */}
        <div style={{ card: 'card', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              Formulir Pemesanan
            </h2>
            {renderBookingSection()}
          </div>

          {/* Sistem Review & Testimoni */}
          <div className="card" style={{ padding: '2rem' }}>
            <ReviewSection officeId={id} canReview={ruangan?.can_review} />
          </div>
        </div>
      </div>
      
      {/* Modal Notifikasi Modern */}
      <Modal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      <style>{`
        /* Prevent any horizontal scroll on the entire page */
        html, body {
          max-width: 100% !important;
          overflow-x: hidden !important;
          position: relative !important;
        }

        .detail-page-container {
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
          padding: 1rem 0 !important;
        }

        @media (max-width: 768px) {
          .container { 
            padding: 0 0.75rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .card { 
            padding: 1rem !important; 
            margin: 0 0 1.5rem 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }

          form {
            width: 100% !important;
            max-width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 1rem !important;
          }

          .react-calendar {
            width: 100% !important;
            max-width: 100% !important;
            min-width: unset !important;
            font-size: 0.8rem !important;
          }

          .addons-mobile-grid {
            grid-template-columns: 1fr !important;
            width: 100% !important;
          }

          input, select, textarea, .form-control {
            font-size: 16px !important; /* Fix for iOS zoom */
            width: 100% !important;
            max-width: 100% !important;
          }

          img { height: 200px !important; }
          h1 { font-size: 1.4rem !important; }

          .summary-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.25rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .price-text {
            font-weight: 600 !important;
            font-size: 1rem !important;
          }

          .total-price-text {
            font-size: 1.5rem !important;
            margin-top: 0.25rem !important;
            display: block !important;
          }

          .time-input-group {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .total-price-text {
          font-weight: 700;
          color: var(--color-primary);
          font-size: 1.4rem;
        }
      `}</style>
    </div>
  );
};

export default DetailRuangan;
