import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRuanganById, createRuangan, updateRuangan } from '../../services/apiService';
import { ArrowLeft, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const FormRuangan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [imageType, setImageType] = useState('url'); // 'url' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [formData, setFormData] = useState({
    nama: '',
    kapasitas: '',
    harga: '',
    fasilitas: '',
    deskripsi: '',
    gambar: '',
    kategori: '',
    status: 'Tersedia',
    is_popular: false
  });

  useEffect(() => {
    if (isEdit) {
      getRuanganById(id).then(data => {
        if (data) {
          setFormData({
            ...data,
            fasilitas: Array.isArray(data.fasilitas) ? data.fasilitas.join(', ') : data.fasilitas
          });
          setPreviewUrl(data.gambar);
        }
      });
    }
  }, [id, isEdit]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (name === 'gambar') {
      setPreviewUrl(value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Gunakan FormData jika ada upload file
    let submitData;
    
    if (imageType === 'upload' && selectedFile) {
      submitData = new FormData();
      submitData.append('nama', formData.nama);
      submitData.append('kategori', formData.kategori);
      submitData.append('kapasitas', parseInt(formData.kapasitas));
      submitData.append('harga', parseInt(formData.harga));
      submitData.append('deskripsi', formData.deskripsi);
      submitData.append('status', formData.status);
      submitData.append('is_popular', formData.is_popular ? 1 : 0);
      submitData.append('image_file', selectedFile);
      
      // Fasilitas dikirim sebagai string yang dipisah koma, atau loop append
      const fasilitasArr = formData.fasilitas.split(',').map(f => f.trim()).filter(f => f);
      fasilitasArr.forEach(f => submitData.append('fasilitas[]', f));
    } else {
      submitData = {
        ...formData,
        kapasitas: parseInt(formData.kapasitas),
        harga: parseInt(formData.harga),
        fasilitas: formData.fasilitas.split(',').map(f => f.trim()).filter(f => f)
      };
    }

    if (isEdit) {
      updateRuangan(id, submitData).then(() => navigate('/admin/ruangan'));
    } else {
      createRuangan(submitData).then(() => navigate('/admin/ruangan'));
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
          <div className="form-group">
            <label className="form-label">Nama Ruangan</label>
            <input required type="text" name="nama" value={formData.nama} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <select required name="kategori" value={formData.kategori} onChange={handleChange} className="form-control">
              <option value="">Pilih Kategori</option>
              <option value="Office">Office</option>
              <option value="Private Office">Private Office</option>
              <option value="Meeting Room">Meeting Room</option>
              <option value="Coworking Space">Coworking Space</option>
              <option value="Creative Space">Creative Space</option>
            </select>
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
            <textarea required name="deskripsi" value={formData.deskripsi} onChange={handleChange} className="form-control" rows="3"></textarea>
          </div>

          {/* Bagian Gambar */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Foto Ruangan</label>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button 
                type="button" 
                onClick={() => setImageType('url')}
                style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 'var(--border-radius)', cursor: 'pointer',
                  border: `1px solid ${imageType === 'url' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: imageType === 'url' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                  color: imageType === 'url' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: imageType === 'url' ? 600 : 400
                }}
              >
                <LinkIcon size={18} /> URL Gambar
              </button>
              <button 
                type="button" 
                onClick={() => setImageType('upload')}
                style={{ 
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 'var(--border-radius)', cursor: 'pointer',
                  border: `1px solid ${imageType === 'upload' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: imageType === 'upload' ? 'rgba(37, 99, 235, 0.05)' : 'white',
                  color: imageType === 'upload' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: imageType === 'upload' ? 600 : 400
                }}
              >
                <Upload size={18} /> Upload File
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Input Area */}
              <div style={{ width: '100%' }}>
                {imageType === 'url' ? (
                  <input 
                    required type="text" name="gambar" 
                    value={formData.gambar} onChange={handleChange} 
                    className="form-control" placeholder="Masukkan URL gambar (contoh: https://images.unsplash.com/...)"
                  />
                ) : (
                  <div style={{ 
                    border: '2px dashed var(--color-border)', borderRadius: 'var(--border-radius)',
                    padding: '1.5rem', textAlign: 'center', position: 'relative',
                    backgroundColor: 'var(--color-secondary)'
                  }}>
                    <input 
                      type="file" accept="image/*" onChange={handleFileChange}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                    <Upload size={32} color="var(--color-text-muted)" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
                      {selectedFile ? selectedFile.name : 'Klik atau seret gambar ke sini'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Mendukung format JPG, PNG, atau WEBP
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Area (Full Width) */}
              {previewUrl && (
                <div style={{ 
                  width: '100%', maxHeight: '300px', 
                  borderRadius: 'var(--border-radius)', overflow: 'hidden',
                  backgroundColor: 'var(--color-secondary)', border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                </div>
              )}
              {!previewUrl && (
                <div style={{ 
                  width: '100%', height: '100px', border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: 'var(--color-text-muted)', backgroundColor: '#fafafa'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <ImageIcon size={24} style={{ opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>Pratinjau foto akan muncul di sini</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="form-control">
              <option value="Tersedia">Tersedia</option>
              <option value="Penuh">Penuh</option>
              <option value="Pemeliharaan">Pemeliharaan</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', gridColumn: '1 / -1' }}>
            <input 
              type="checkbox" 
              name="is_popular" 
              id="is_popular"
              checked={formData.is_popular} 
              onChange={handleChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="is_popular" style={{ cursor: 'pointer', fontWeight: 500, marginBottom: 0 }}>Tampilkan di Ruangan Populer (Halaman Utama)</label>
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
