import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan, deleteRuangan } from '../../services/apiService';
import { Plus, Edit, Trash2, Star, Search } from 'lucide-react';
import Modal from '../../components/Modal';

const KelolaRuangan = () => {
  const [ruangan, setRuangan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const loadData = () => {
    getRuangan().then(data => setRuangan(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = () => {
    if (deleteModal.id) {
      deleteRuangan(deleteModal.id).then(() => {
        loadData();
        setDeleteModal({ isOpen: false, id: null });
      });
    }
  };

  const filteredData = ruangan.filter(item => 
    (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kelola Ruangan</h1>
        <Link to="/admin/ruangan/tambah" className="btn btn-primary">
          <Plus size={18} /> Tambah Ruangan
        </Link>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari nama ruangan atau kategori..." 
            className="form-control"
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Nama Ruangan</th>
              <th style={{ padding: '1rem' }}>Kapasitas</th>
              <th style={{ padding: '1rem' }}>Harga/Hari</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Populer</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.nama}</td>
                <td style={{ padding: '1rem' }}>{item.kapasitas} org</td>
                <td style={{ padding: '1rem' }}>Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {item.is_popular ? (
                    <Star size={20} fill="var(--color-warning)" color="var(--color-warning)" />
                  ) : (
                    <Star size={20} color="var(--color-border)" />
                  )}
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <Link to={`/admin/ruangan/edit/${item.id}`} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                    <Edit size={16} />
                  </Link>
                  <button onClick={() => setDeleteModal({ isOpen: true, id: item.id })} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {searchTerm ? 'Tidak ada ruangan yang cocok dengan pencarian Anda.' : 'Belum ada data ruangan.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        type="danger"
        title="Hapus Ruangan?"
        message="Apakah Anda yakin ingin menghapus ruangan ini? Data yang sudah dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
};

export default KelolaRuangan;
