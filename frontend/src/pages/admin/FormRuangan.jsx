import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRuanganById, createRuangan, updateRuangan } from '../../services/mockData';
import { ArrowLeft } from 'lucide-react';

const FormRuangan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    nama: '',
    kapasitas: '',
    harga: '',
    fasilitas: '',
    deskripsi: '',
    gambar: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    status: 'Tersedia'
  });

  useEffect(() => {
    if (isEdit) {
      getRuanganById(id).then(data => {
        if (data) {
          setFormData({
            ...data,
            fasilitas: Array.isArray(data.fasilitas) ? data.fasilitas.join(', ') : data.fasilitas
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format data
    const submitData = {
      ...formData,
      kapasitas: parseInt(formData.kapasitas),
      harga: parseInt(formData.harga),
      fasilitas: formData.fasilitas.split(',').map(f => f.trim()).filter(f => f)
    };

    if (isEdit) {
      updateRuangan(id, submitData).then(() => {
        navigate('/admin/ruangan');
      });
    } else {
      createRuangan(submitData).then(() => {
        navigate('/admin/ruangan');
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/admin/ruangan')} className="btn btn-outline" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>{isEdit ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</h1>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2" style={{ gap: '1.5rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nama Ruangan</label>
            <input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Kapasitas (Orang)</label>
            <input required type="number" name="kapasitas" value={formData.kapasitas} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Harga per Hari (Rp)</label>
            <input required type="number" name="harga" value={formData.harga} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Fasilitas (Pisahkan dengan koma)</label>
            <input required type="text" name="fasilitas" value={formData.fasilitas} onChange={handleChange} className="form-control" placeholder="Contoh: AC, Proyektor, WiFi" />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Deskripsi</label>
            <textarea required name="deskripsi" value={formData.deskripsi} onChange={handleChange} className="form-control" rows="4"></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">URL Gambar</label>
            <input required type="text" name="gambar" value={formData.gambar} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="form-control">
              <option value="Tersedia">Tersedia</option>
              <option value="Penuh">Penuh</option>
              <option value="Pemeliharaan">Pemeliharaan</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Ruangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormRuangan;
