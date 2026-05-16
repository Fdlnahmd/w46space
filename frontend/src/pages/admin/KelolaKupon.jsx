import { useState, useEffect, useCallback } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/apiService';
import { Plus, Trash2, Edit2, Calendar, Users } from 'lucide-react';
import Modal from '../../components/Modal';

const KelolaKupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'add', data: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed',
    value: '',
    expiry_date: '',
    usage_limit: 100
  });

  const loadData = useCallback(() => {
    setLoading(true);
    getCoupons().then(res => {
      setCoupons(res);
    }).catch(err => {
      console.error('Error:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = modal.type === 'add' ? createCoupon(formData) : updateCoupon(modal.data.id, formData);
    
    action.then(() => {
      loadData();
      setModal({ isOpen: false, type: 'add', data: null });
      setFormData({ code: '', type: 'fixed', value: '', expiry_date: '', usage_limit: 100 });
    }).catch(err => {
      alert(err.response?.data?.message || 'Terjadi kesalahan');
    });
  };

  const openEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      usage_limit: coupon.usage_limit
    });
    setModal({ isOpen: true, type: 'edit', data: coupon });
  };

  const handleDelete = () => {
    deleteCoupon(deleteModal.id).then(() => {
      loadData();
      setDeleteModal({ isOpen: false, id: null });
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kelola Kupon Diskon</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            setFormData({ code: '', type: 'fixed', value: '', expiry_date: '', usage_limit: 100 });
            setModal({ isOpen: true, type: 'add', data: null });
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> Tambah Kupon
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
        {loading ? (
          <p>Memuat data...</p>
        ) : coupons.map(coupon => (
          <div key={coupon.id} className="card" style={{ padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                color: 'var(--color-primary)', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1.1rem',
                border: '2px dashed var(--color-primary)'
              }}>
                {coupon.code}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(coupon)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteModal({ isOpen: true, id: coupon.id })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              {coupon.type === 'percentage' ? `${Math.floor(coupon.value)}% Diskon` : `Rp ${Number(coupon.value).toLocaleString('id-ID')} Potongan`}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} /> Berakhir: {coupon.expiry_date || 'Selamanya'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} /> Digunakan: {coupon.used_count} / {coupon.usage_limit}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ isOpen: false, type: 'add', data: null })}
        title={modal.type === 'add' ? 'Tambah Kupon Baru' : 'Edit Kupon'}
        showIcon={false}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Kode Kupon</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              placeholder="Contoh: HEMAT50"
            />
          </div>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div>
              <label>Tipe Diskon</label>
              <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="fixed">Nominal Tetap (Rp)</option>
                <option value="percentage">Persentase (%)</option>
              </select>
            </div>
            <div>
              <label>Nilai Diskon</label>
              <input 
                type="number" 
                className="form-control" 
                required 
                value={formData.value} 
                onChange={e => setFormData({...formData, value: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div>
              <label>Batas Penggunaan</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.usage_limit} 
                onChange={e => setFormData({...formData, usage_limit: e.target.value})}
              />
            </div>
            <div>
              <label>Tanggal Kadaluarsa</label>
              <input 
                type="date" 
                className="form-control" 
                value={formData.expiry_date} 
                onChange={e => setFormData({...formData, expiry_date: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            {modal.type === 'add' ? 'Buat Kupon' : 'Simpan Perubahan'}
          </button>
        </form>
      </Modal>

      <Modal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        type="danger"
        title="Hapus Kupon"
        message="Apakah Anda yakin ingin menghapus kupon ini?"
      />
    </div>
  );
};

export default KelolaKupon;
