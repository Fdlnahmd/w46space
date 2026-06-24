import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getRuanganById, createPemesanan, getPemesananById, getAddons, checkCoupon } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckCircle2, ArrowLeft, LogIn, ShieldAlert, Coffee, Wifi, Monitor, Printer, Ticket, Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

const normalizeDate = (value) => {
  if (!value) return null;
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const dateOnly = raw.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDateRangeConflict = (tanggalMulai, tanggalAkhir, occupiedDates) => {
  const selectedStart = normalizeDate(tanggalMulai);
  const selectedEnd = normalizeDate(tanggalAkhir);

  if (!selectedStart || !selectedEnd) return null;

  return occupiedDates.find((range) => {
    const bookedStart = normalizeDate(range.start);
    const bookedEnd = normalizeDate(range.end);
    if (!bookedStart || !bookedEnd) return false;
    return selectedStart <= bookedEnd && selectedEnd >= bookedStart;
  }) || null;
};

import Modal from '../components/Modal';
import LazyImage from '../components/LazyImage';
import ReviewSection from '../components/ReviewSection';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarCustom.css';

const DetailRuangan = () => {
  const { t, lang } = useLanguage();
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
  const [fieldErrors, setFieldErrors] = useState({});

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
        const periods = data.booked_periods || data.bookings || [];
        const dates = periods
          .filter(b => b.status !== 'Dibatalkan')
          .map(b => ({
            start: b.start || b.tanggal_mulai,
            end: b.end || b.tanggal_akhir,
          }))
          .filter(range => range.start && range.end);
        setOccupiedDates(dates);
        if (data.is_booked && data.booked_until && !extendFromId) {
          const nextAvailDate = new Date(data.booked_until);
          nextAvailDate.setDate(nextAvailDate.getDate() + 1);
          const yyyy = nextAvailDate.getFullYear();
          const mm = String(nextAvailDate.getMonth() + 1).padStart(2, '0');
          const dd = String(nextAvailDate.getDate()).padStart(2, '0');
          setFormData(prev => {
            if (prev.tanggalMulai) return prev;
            return { ...prev, tanggalMulai: `${yyyy}-${mm}-${dd}` };
          });
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

  const isDateInsideBookedPeriod = (date) => {
    const d = normalizeDate(date);
    if (!d) return false;

    return occupiedDates.some(range => {
      const start = normalizeDate(range.start);
      const end = normalizeDate(range.end);
      if (!start || !end) return false;
      return d >= start && d <= end;
    });
  };

  const isStartDateUnavailable = ({ date, view }) => {
    if (view !== 'month') return false;
    if (isDateInsideBookedPeriod(date)) return true;

    const startDate = normalizeDate(date);
    if (!startDate) return false;

    const yyyy = startDate.getFullYear();
    const mm = String(startDate.getMonth() + 1).padStart(2, '0');
    const dd = String(startDate.getDate()).padStart(2, '0');
    const startString = `${yyyy}-${mm}-${dd}`;
    const endString = hitungTanggalAkhir(startString, formData.durasi);

    return !!getDateRangeConflict(startString, endString, occupiedDates);
  };

  const getCalendarTileClassName = ({ date, view }) => {
    return isStartDateUnavailable({ date, view }) ? 'occupied-date' : null;
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
      setCouponError(err.response?.data?.message || (lang === 'id' ? 'Kupon tidak valid' : 'Invalid coupon code'));
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

  const getBookingErrorMessage = (error) => {
    const backendMessage = error.response?.data?.message || '';
    const validationMessages = error.response?.data?.errors
      ? Object.values(error.response.data.errors).flat().join(' ')
      : '';
    const message = `${backendMessage} ${validationMessages}`.trim();
    const lower = message.toLowerCase();

    if (lower.includes('waktu selesai') && (lower.includes('after') || lower.includes('setelah'))) {
      return lang === 'id'
        ? 'Waktu selesai harus lebih lambat dari waktu mulai.'
        : 'End time must be later than start time.';
    }

    if (lower.includes('tanggal akhir') && (lower.includes('after') || lower.includes('setelah'))) {
      return lang === 'id'
        ? 'Tanggal selesai harus setelah tanggal mulai.'
        : 'End date must be after start date.';
    }

    if (lower.includes('already booked') || lower.includes('sudah dipesan') || lower.includes('sudah dibook')) {
      return lang === 'id'
        ? 'Ruangan sudah dipesan pada periode tersebut. Silakan pilih tanggal lain.'
        : 'This room is already booked for that period. Please choose another date.';
    }

    if (lower.includes('required') || lower.includes('wajib')) {
      return lang === 'id'
        ? 'Mohon lengkapi semua field wajib sebelum memesan.'
        : 'Please complete all required fields before booking.';
    }

    return message || (lang === 'id'
      ? 'Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.'
      : 'An error occurred while processing your booking. Please try again.');
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    const nextFieldErrors = {};
    if (!formData.tanggalMulai) {
      nextFieldErrors.tanggalMulai = lang === 'id'
        ? 'Tanggal mulai wajib dipilih melalui kalender.'
        : 'Start date must be selected from the calendar.';
    }
    if (!formData.waktuMulai) {
      nextFieldErrors.waktuMulai = lang === 'id' ? 'Jam masuk wajib diisi.' : 'Check-in time is required.';
    }
    if (!formData.waktuSelesai) {
      nextFieldErrors.waktuSelesai = lang === 'id' ? 'Jam keluar wajib diisi.' : 'Check-out time is required.';
    }
    if (formData.waktuMulai && formData.waktuSelesai && formData.waktuSelesai <= formData.waktuMulai) {
      nextFieldErrors.waktuSelesai = lang === 'id'
        ? 'Jam keluar harus lebih besar dari jam masuk.'
        : 'Check-out time must be later than check-in time.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const tanggalAkhir = hitungTanggalAkhir(formData.tanggalMulai, formData.durasi);
      if (!tanggalAkhir) throw new Error(lang === 'id' ? 'Format tanggal tidak valid' : 'Invalid date format');

      const conflict = getDateRangeConflict(formData.tanggalMulai, tanggalAkhir, occupiedDates);
      if (conflict) {
        const bookedStart = formatDateDisplay(conflict.start);
        const bookedEnd = formatDateDisplay(conflict.end);
        setModal({
          isOpen: true,
          type: 'warning',
          title: lang === 'id' ? 'Periode Sudah Dibook' : 'Period Already Booked',
          message: lang === 'id'
            ? `Periode yang Anda pilih bentrok dengan booking ${bookedStart} sampai ${bookedEnd}. Silakan pilih tanggal setelah ${bookedEnd}.`
            : `Your selected period overlaps with an existing booking from ${bookedStart} to ${bookedEnd}. Please choose a date after ${bookedEnd}.`
        });
        setLoading(false);
        return;
      }

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
        title: lang === 'id' ? 'Pemesanan Berhasil' : 'Booking Successful',
        message: lang === 'id' ? 'Permintaan pemesanan Anda telah diterima. Silakan cek status berkala di halaman Pesanan Saya.' : 'Your booking request has been received. Please check the status regularly on the My Bookings page.'
      });
    } catch (error) {
      console.error('Booking error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: lang === 'id' ? 'Pemesanan Gagal' : 'Booking Failed',
        message: getBookingErrorMessage(error)
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
      {lang === 'id' ? 'Memuat data ruangan...' : 'Loading room details...'}
    </div>
  );

  const formatDateDisplay = (value) => {
    const d = normalizeDate(value);
    if (!d) return '—';
    return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const selectedTanggalAkhir = hitungTanggalAkhir(formData.tanggalMulai, formData.durasi);
  const selectedDateConflict = selectedTanggalAkhir
    ? getDateRangeConflict(formData.tanggalMulai, selectedTanggalAkhir, occupiedDates)
    : null;

  const renderBookingSection = () => {
    // Admin & Helpdesk tidak bisa booking
    const userRole = user?.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'helpdesk') {
      const isHelpdesk = userRole === 'helpdesk';
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          textAlign: 'center', padding: '2rem',
          backgroundColor: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--border-radius)'
        }}>
          <ShieldAlert size={48} color="var(--color-warning)" />
          <h3 style={{ color: '#92400e' }}>{lang === 'id' ? 'Akses Terbatas untuk' : 'Restricted Access for'} {isHelpdesk ? 'Helpdesk' : 'Admin'}</h3>
          <p style={{ color: '#78350f' }}>
            {lang === 'id' 
              ? `Akun ${isHelpdesk ? 'Helpdesk' : 'Admin'} hanya memiliki akses ke panel operasional. Pemesanan ruangan dilakukan oleh pengguna terdaftar.`
              : `${isHelpdesk ? 'Helpdesk' : 'Admin'} accounts only have access to the operational panel. Room bookings must be made by registered users.`}
          </p>
          <Link to="/admin" className="btn btn-outline" style={{ marginTop: '0.5rem' }}>
            {lang === 'id' ? 'Pergi ke Panel' : 'Go to Panel'} {isHelpdesk ? 'Helpdesk' : 'Admin'}
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
          <h3>{lang === 'id' ? 'Anda belum login' : 'You are not logged in'}</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {lang === 'id' ? 'Silakan masuk atau daftar akun terlebih dahulu untuk melakukan pemesanan.' : 'Please sign in or register an account first to make a booking.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">{lang === 'id' ? 'Masuk ke Akun' : 'Sign In'}</Link>
            <Link to="/register" className="btn btn-outline">{lang === 'id' ? 'Daftar Akun Baru' : 'Register New Account'}</Link>
          </div>
        </div>
      );
    }

    // User biasa — form booking
    const totalHarga = hitungTotal();

    return (
      <form onSubmit={handleBooking} className="grid md:grid-cols-2" style={{ gap: '1.5rem' }}>
        {ruangan.is_booked && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '1rem 1.25rem',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fef3c7',
            borderRadius: 'var(--border-radius)',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <ShieldAlert size={20} color="#d97706" />
            <div style={{ textAlign: 'left' }}>
              <strong>{t('availability_info')}</strong> {t('room_booked_until')}{' '}
              <strong>{new Date(ruangan.booked_until).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.{' '}
              {t('room_booked_after')}
            </div>
          </div>
        )}
        {/* Nama Pemesan */}
        <div className="form-group">
          <label className="form-label">{lang === 'id' ? 'Nama Pemesan' : 'Booker Name'}</label>
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
          <label className="form-label">{lang === 'id' ? 'Nama Perusahaan (Opsional)' : 'Company Name (Optional)'}</label>
          <input
            type="text" className="form-control"
            value={formData.perusahaan}
            onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
            placeholder={lang === 'id' ? 'PT. Nama Perusahaan' : 'PT. Company Name'}
          />
        </div>

        {/* Visual Calendar */}
        <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
          <label className="form-label">{lang === 'id' ? 'Cek Ketersediaan (Kalender)' : 'Check Availability (Calendar)'}</label>
          <Calendar
            onChange={(date) => {
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              const formattedDate = `${yyyy}-${mm}-${dd}`;
              setFormData({ ...formData, tanggalMulai: formattedDate });
              setFieldErrors(prev => ({ ...prev, tanggalMulai: '' }));
            }}
            value={formData.tanggalMulai ? new Date(formData.tanggalMulai) : new Date()}
            tileDisabled={isStartDateUnavailable}
            tileClassName={getCalendarTileClassName}
            minDate={new Date()}
            className="custom-calendar"
          />

          {occupiedDates.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {lang === 'id' ? 'Periode yang sudah dibook:' : 'Already booked periods:'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {occupiedDates.slice(0, 4).map((range, idx) => (
                  <span key={idx} className="badge badge-danger" style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {formatDateDisplay(range.start)} - {formatDateDisplay(range.end)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedDateConflict && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.28)',
            borderRadius: 'var(--border-radius)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ textAlign: 'left' }}>
              <strong>{lang === 'id' ? 'Periode tidak tersedia.' : 'Period unavailable.'}</strong>{' '}
              {lang === 'id'
                ? `Pilihan ${formatDateDisplay(formData.tanggalMulai)} sampai ${formatDateDisplay(selectedTanggalAkhir)} bentrok dengan booking ${formatDateDisplay(selectedDateConflict.start)} sampai ${formatDateDisplay(selectedDateConflict.end)}.`
                : `Your selection from ${formatDateDisplay(formData.tanggalMulai)} to ${formatDateDisplay(selectedTanggalAkhir)} overlaps with an existing booking from ${formatDateDisplay(selectedDateConflict.start)} to ${formatDateDisplay(selectedDateConflict.end)}.`}
            </div>
          </div>
        )}

        {/* Fasilitas Tambahan (Addons) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">{lang === 'id' ? 'Fasilitas Tambahan (Opsional)' : 'Additional Facilities (Optional)'}</label>
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
          <label className="form-label">{lang === 'id' ? 'Punya Kode Promo?' : 'Have a Promo Code?'}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Ticket size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text" className="form-control"
                placeholder={lang === 'id' ? 'Masukkan kode (misal: KUPONSAYA)' : 'Enter code (e.g. MYCOUPON)'}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                style={{ paddingLeft: '2.5rem' }}
                disabled={!!couponData}
              />
            </div>
            {couponData ? (
              <button type="button" onClick={() => { setCouponData(null); setCouponCode(''); }} className="btn btn-outline-danger">
                <X size={18} />
              </button>
            ) : (
              <button type="button" onClick={handleApplyCoupon} className="btn btn-outline">{lang === 'id' ? 'Gunakan' : 'Apply'}</button>
            )}
          </div>
          {couponError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{couponError}</p>}
          {couponData && (
            <p style={{ color: 'var(--color-success)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Check size={14} /> {lang === 'id' ? 'Kupon' : 'Coupon'} <strong>{couponData.code}</strong> {lang === 'id' ? 'berhasil dipasang!' : 'successfully applied!'}
            </p>
          )}
        </div>

        {/* Tanggal Mulai & Durasi */}
        <div className="form-group">
          <label className="form-label">{lang === 'id' ? 'Tanggal Mulai Kontrak' : 'Contract Start Date'}</label>
          <div style={{ 
            padding: '0.75rem', backgroundColor: 'var(--color-secondary)', 
            borderRadius: 'var(--border-radius)',
            border: fieldErrors.tanggalMulai ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            fontWeight: 600, color: formData.tanggalMulai ? 'var(--color-text-main)' : 'var(--color-text-muted)'
          }}>
            {formData.tanggalMulai ? new Date(formData.tanggalMulai).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : (lang === 'id' ? 'Pilih di kalender' : 'Select on calendar')}
          </div>
          {fieldErrors.tanggalMulai && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{fieldErrors.tanggalMulai}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t('duration')}</label>
          <select
            className="form-control"
            value={formData.durasi}
            onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
          >
            <option value={1}>1 {t('months')}</option>
            <option value={2}>2 {t('months')}</option>
            <option value={3}>3 {t('months')}</option>
            <option value={6}>6 {t('months')}</option>
            <option value={12}>12 {t('months')} ({lang === 'id' ? '1 Tahun' : '1 Year'})</option>
          </select>
        </div>

        {/* Waktu */}
        <div className="time-input-group" style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{lang === 'id' ? 'Jam Masuk' : 'Check-in Time'}</label>
            <input
              type="time"
              className="form-control"
              style={{ minHeight: '45px', borderColor: fieldErrors.waktuMulai ? 'var(--color-danger)' : undefined }}
              value={formData.waktuMulai}
              onChange={(e) => {
                setFormData({ ...formData, waktuMulai: e.target.value });
                setFieldErrors(prev => ({ ...prev, waktuMulai: '', waktuSelesai: '' }));
              }}
            />
            {fieldErrors.waktuMulai && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{fieldErrors.waktuMulai}</p>
            )}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{lang === 'id' ? 'Jam Keluar' : 'Check-out Time'}</label>
            <input
              type="time"
              className="form-control"
              style={{ minHeight: '45px', borderColor: fieldErrors.waktuSelesai ? 'var(--color-danger)' : undefined }}
              value={formData.waktuSelesai}
              onChange={(e) => {
                setFormData({ ...formData, waktuSelesai: e.target.value });
                setFieldErrors(prev => ({ ...prev, waktuSelesai: '' }));
              }}
            />
            {fieldErrors.waktuSelesai && (
              <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{fieldErrors.waktuSelesai}</p>
            )}
          </div>
        </div>

        {/* Ringkasan Kontrak */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="summary-box" style={{
            backgroundColor: 'var(--color-secondary)', padding: '1.25rem',
            borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)'
          }}>
            <div className="summary-row">
              <span>{lang === 'id' ? `Harga Ruangan (${formData.durasi} bln):` : `Room Price (${formData.durasi} mo):`}</span>
              <span className="price-text">Rp {(Number(ruangan?.harga ?? 0) * 26 * formData.durasi).toLocaleString('id-ID')}</span>
            </div>
            
            {selectedAddons.length > 0 && (
              <div className="summary-row">
                <span>{lang === 'id' ? 'Fasilitas Tambahan:' : 'Additional Facilities:'}</span>
                <span className="price-text">+ Rp {Number(availableAddons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.harga, 0) ?? 0).toLocaleString('id-ID')}</span>
              </div>
            )}

            {couponData && (
              <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                <span>{lang === 'id' ? `Diskon Kupon (${couponData.code}):` : `Coupon Discount (${couponData.code}):`}</span>
                <span className="price-text">- Rp {Number(couponData.type === 'percentage' ? (Number(ruangan?.harga ?? 0) * 26 * formData.durasi * couponData.value / 100) : couponData.value).toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="summary-row total-row" style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 600 }}>{t('total_price')}:</span>
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
            disabled={ruangan.status !== 'Tersedia' || loading || !!selectedDateConflict}
          >
            {loading
              ? (lang === 'id' ? 'Mengajukan...' : 'Submitting...')
              : selectedDateConflict
                ? (lang === 'id' ? 'Periode Sudah Dibook' : 'Period Already Booked')
                : (ruangan.status === 'Tersedia' ? (lang === 'id' ? 'Ajukan Pemesanan' : 'Submit Booking') : (lang === 'id' ? 'Ruangan Tidak Tersedia' : 'Room Not Available'))}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="detail-page-container" style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
          <ArrowLeft size={18} /> {lang === 'id' ? 'Kembali' : 'Back'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Info Ruangan */}
          <div className="card" style={{ padding: '2rem' }}>
            <div className="grid md:grid-cols-2" style={{ gap: '2rem' }}>
              <div>
                <div className="room-detail-image">
                  <LazyImage src={ruangan.gambar} alt={ruangan.nama} width={800} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ruangan.kategori && (
                  <span className="room-category-badge" style={{ 
                    alignSelf: 'flex-start', fontSize: '0.85rem', 
                    padding: '0.25rem 0.75rem' 
                  }}>
                    {ruangan.kategori}
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{ruangan.nama}</h1>
                  {ruangan.is_booked ? (
                    <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {t('status_full')}
                    </span>
                  ) : ruangan.status === 'Maintenance' || ruangan.status === 'Pemeliharaan' ? (
                    <span className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {t('status_maintenance')}
                    </span>
                  ) : (
                    <span className={`badge ${ruangan.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {ruangan.status === 'Tersedia' ? t('status_available') : ruangan.status}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Rp {Number(ruangan?.harga ?? 0).toLocaleString('id-ID')}
                  <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}> /{lang === 'id' ? 'hari' : 'day'}</span>
                </p>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{ruangan.deskripsi}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                  <Users size={20} color="var(--color-primary)" />
                  {lang === 'id' ? 'Kapasitas Maksimal' : 'Maximum Capacity'}: {ruangan.kapasitas} {lang === 'id' ? 'orang' : 'people'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{lang === 'id' ? 'Fasilitas' : 'Facilities'}:</h3>
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
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              {lang === 'id' ? 'Formulir Pemesanan' : 'Booking Form'}
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

        .room-detail-image {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .room-detail-image {
            height: 400px;
            aspect-ratio: auto;
          }
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

          .room-detail-image {
            aspect-ratio: 16 / 10;
          }

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
