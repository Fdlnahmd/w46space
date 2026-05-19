import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPemesananById, getRuangan, updatePemesanan } from '../../services/apiService';
import { ArrowLeft, Save, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const hitungTanggalAkhir = (tanggalMulai, durasi) => {
  const d = new Date(tanggalMulai);
  d.setMonth(d.getMonth() + parseInt(durasi));
  return d.toISOString().split('T')[0];
};

const FormPemesanan = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ruanganList, setRuanganList] = useState([]);
  const [formData, setFormData] = useState({
    nama_pemesan: '',
    perusahaan: '',
    id_ruangan: '',
    tanggal_mulai: '',
    durasi: 1,
    waktu_mulai: '08:00',
    waktu_selesai: '17:00',
    status: 'Pending',
    total_harga: 0,
  });
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    getRuangan().then(data => setRuanganList(data));
  }, []);

  useEffect(() => {
    if (id) {
      getPemesananById(id).then(data => {
        if (!data) { navigate('/admin/pemesanan'); return; }
        setFormData({
          nama_pemesan:  data.nama_pemesan  || '',
          perusahaan:    data.perusahaan    || '',
          id_ruangan:     data.id_ruangan    || data.office_id || '',
          tanggal_mulai: data.tanggal_mulai || '',
          durasi:        data.durasi        || 1,
          waktu_mulai:   data.waktu_mulai   || '08:00',
          waktu_selesai: data.waktu_selesai || '17:00',
          status:        data.status        || 'Pending',
          total_harga:   data.total_harga   || 0,
        });
        setLoading(false);
      }).catch(err => {
        console.error(err);
        navigate('/admin/pemesanan');
      });
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Hitung harga jika id_ruangan atau durasi berubah
      if (name === 'id_ruangan' || name === 'durasi') {
        const rId = name === 'id_ruangan' ? parseInt(value) : parseInt(prev.id_ruangan);
        const dur = name === 'durasi' ? parseInt(value) : parseInt(prev.durasi);
        const ruangan = ruanganList.find(r => r.id === rId);
        if (ruangan) {
          newData.total_harga = ruangan.harga * 26 * dur;
        }
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tanggal_akhir = formData.tanggal_mulai
      ? hitungTanggalAkhir(formData.tanggal_mulai, formData.durasi)
      : '';

    updatePemesanan(id, {
      ...formData,
      id_ruangan:  parseInt(formData.id_ruangan),
      durasi:      parseInt(formData.durasi),
      total_harga: parseInt(formData.total_harga),
      tanggal_akhir,
    }).then(() => {
      navigate(`/admin/pemesanan/${id}`);
    }).catch(err => alert(err.message));
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat...</div>;

  const tanggal_akhirPreview = formData.tanggal_mulai
    ? hitungTanggalAkhir(formData.tanggal_mulai, formData.durasi)
    : '—';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(id ? `/admin/pemesanan/${id}` : '/admin/pemesanan')} className="btn btn-outline" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>Edit / Perpanjang Kontrak Pemesanan</h1>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2" style={{ gap: '1.5rem' }}>

          {/* Nama Pemesan */}
          <div className="form-group">
            <label className="form-label">Nama Pemesan</label>
            <input required type="text" name="nama_pemesan" value={formData.nama_pemesan} onChange={handleChange} className="form-control" />
          </div>

          {/* Perusahaan */}
          <div className="form-group">
            <label className="form-label">Perusahaan (Opsional)</label>
            <input type="text" name="perusahaan" value={formData.perusahaan} onChange={handleChange} className="form-control" placeholder="PT. Nama Perusahaan" />
          </div>

          {/* Ruangan */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Ruangan</label>
            <select required name="id_ruangan" value={formData.id_ruangan} onChange={handleChange} className="form-control">
              <option value="">-- Pilih Ruangan --</option>
              {ruanganList.map(r => (
                <option key={r.id} value={r.id}>{r.nama} (Rp {(r.harga ?? 0).toLocaleString('id-ID')}/hari)</option>
              ))}
            </select>
          </div>

          {/* Tanggal Mulai */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} color="var(--color-primary)" /> Tanggal Mulai Kontrak
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <Calendar 
                onChange={(date) => {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  setFormData(prev => ({ ...prev, tanggal_mulai: `${yyyy}-${mm}-${dd}` }));
                }}
                value={formData.tanggal_mulai ? new Date(formData.tanggal_mulai) : new Date()}
                tileClassName="custom-tile"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-main)' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
              Dipilih: <strong>{formData.tanggal_mulai || 'Belum dipilih'}</strong>
            </p>
          </div>

          {/* Durasi */}
          <div className="form-group">
            <label className="form-label">Durasi Kontrak (Bulan)</label>
            <select name="durasi" value={formData.durasi} onChange={handleChange} className="form-control">
              <option value={1}>1 Bulan</option>
              <option value={2}>2 Bulan</option>
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={12}>12 Bulan (1 Tahun)</option>
            </select>
          </div>

          {/* Jam Operasional */}
          <div className="form-group">
            <label className="form-label">Jam Masuk</label>
            <input type="time" name="waktu_mulai" value={formData.waktu_mulai} onChange={handleChange} className="form-control" />
          </div>
          <div className="form-group">
            <label className="form-label">Jam Keluar</label>
            <input type="time" name="waktu_selesai" value={formData.waktu_selesai} onChange={handleChange} className="form-control" />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="form-control">
              <option value="Pending">Pending</option>
              <option value="Dikonfirmasi">Dikonfirmasi</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Total Harga (editable) */}
          <div className="form-group">
            <label className="form-label">Total Harga (Rp) — auto atau ubah manual</label>
            <input type="number" name="total_harga" value={formData.total_harga} onChange={handleChange} className="form-control" />
          </div>

          {/* Ringkasan */}
          <div style={{ gridColumn: '1 / -1', backgroundColor: 'var(--color-secondary)', padding: '1.25rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Tanggal Akhir Kontrak (otomatis)</p>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{tanggal_akhirPreview}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Total Harga</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                  Rp {parseInt(formData.total_harga || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate(`/admin/pemesanan/${id}`)} className="btn btn-outline">
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
              <Save size={18} /> Simpan Perubahan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default FormPemesanan;
