import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRuanganById, createPemesanan } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Users, CheckCircle2, ArrowLeft, LogIn, ShieldAlert } from 'lucide-react';

// Hitung tanggalAkhir dari tanggalMulai + durasi bulan
const hitungTanggalAkhir = (tanggalMulai, durasiButlan) => {
  const d = new Date(tanggalMulai);
  d.setMonth(d.getMonth() + parseInt(durasiButlan));
  return d.toISOString().split('T')[0];
};

import Modal from '../components/Modal';

const DetailRuangan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ruangan, setRuangan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const [formData, setFormData] = useState({
    namaPemesan: user?.name || user?.nama || '',
    perusahaan: '',
    tanggalMulai: '',
    durasi: 1,          // durasi dalam bulan
    waktuMulai: '08:00',
    waktuSelesai: '17:00',
  });

  useEffect(() => {
    getRuanganById(id).then(data => {
      if (data) setRuangan(data);
      else navigate('/ruangan');
    });
  }, [id, navigate]);

  // Hitung total harga: harga/hari * 26 hari kerja * durasi bulan (estimasi)
  const hitungTotal = () => {
    if (!ruangan) return 0;
    return ruangan.harga * 26 * parseInt(formData.durasi);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const tanggalAkhir = hitungTanggalAkhir(formData.tanggalMulai, formData.durasi);

      const dataKeBackend = {
        id_ruangan: parseInt(id),
        nama_pemesan: formData.namaPemesan,
        perusahaan: formData.perusahaan,
        tanggal_mulai: formData.tanggalMulai,
        tanggal_akhir: tanggalAkhir,
        waktu_mulai: formData.waktuMulai,
        waktu_selesai: formData.waktuSelesai,
        durasi: parseInt(formData.durasi),
        total_harga: hitungTotal()
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
    const tanggalAkhirPreview = formData.tanggalMulai
      ? hitungTanggalAkhir(formData.tanggalMulai, formData.durasi)
      : '—';

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

        {/* Tanggal Mulai */}
        <div className="form-group">
          <label className="form-label">Tanggal Mulai Kontrak</label>
          <input
            required type="date" className="form-control"
            value={formData.tanggalMulai}
            onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
          />
        </div>

        {/* Durasi */}
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Jam Masuk</label>
            <input
              type="time" className="form-control"
              value={formData.waktuMulai}
              onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Jam Keluar</label>
            <input
              type="time" className="form-control"
              value={formData.waktuSelesai}
              onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
            />
          </div>
        </div>

        {/* Ringkasan Kontrak */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{
            backgroundColor: 'var(--color-secondary)', padding: '1.25rem',
            borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)',
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Tanggal Akhir Kontrak</p>
              <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>{tanggalAkhirPreview}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                Estimasi Total ({formData.durasi} bln × 26 hari × Rp {(ruangan.harga ?? 0).toLocaleString('id-ID')})
              </p>
              <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.4rem' }}>
                Rp {(totalHarga ?? 0).toLocaleString('id-ID')}
              </p>
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
    <div style={{ padding: '2rem 0', backgroundColor: 'var(--color-background)' }}>
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
                  ) : (
                    <span className={`badge ${ruangan.status === 'Tersedia' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {ruangan.status}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Rp {ruangan.harga.toLocaleString('id-ID')}
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
        @media (max-width: 768px) {
          h1 { font-size: 1.5rem !important; }
          .card { padding: 1.25rem !important; }
          img { height: 250px !important; }
          .form-group { margin-bottom: 1rem !important; }
          button { font-size: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default DetailRuangan;
