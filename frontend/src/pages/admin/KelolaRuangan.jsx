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
      <div className="page-header-admin">
        <h1>Kelola Ruangan</h1>
        <Link to="/admin/ruangan/tambah" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
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

      {/* Desktop Table View */}
      <div className="card hide-on-mobile">
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
                  {item.is_booked ? (
                    <span className="badge badge-danger">Penuh</span>
                  ) : item.status === 'Maintenance' || item.status === 'Pemeliharaan' ? (
                    <span className="badge badge-warning">Pemeliharaan</span>
                  ) : (
                    <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`}>
                      {item.status}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {item.is_popular ? (
                    <Star size={20} fill="var(--color-warning)" color="var(--color-warning)" />
                  ) : (
                    <Star size={20} color="var(--color-border)" />
                  )}
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                  <Link to={`/admin/ruangan/edit/${item.id}`} className="btn btn-outline" style={{ padding: '0.4rem', minWidth: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Ruangan">
                    <Edit size={16} />
                  </Link>
                  <button onClick={() => setDeleteModal({ isOpen: true, id: item.id })} className="btn btn-outline-danger" style={{ padding: '0.4rem', minWidth: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus Ruangan">
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

      {/* Mobile Card List View */}
      <div className="show-only-on-mobile">
        {filteredData.map(item => (
          <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.35rem', lineHeight: '1.3' }}>{item.nama}</h3>
                {item.is_booked ? (
                  <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Penuh</span>
                ) : item.status === 'Maintenance' || item.status === 'Pemeliharaan' ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Pemeliharaan</span>
                ) : (
                  <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.75rem' }}>
                    {item.status}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                {item.is_popular ? (
                  <Star size={18} fill="var(--color-warning)" color="var(--color-warning)" />
                ) : (
                  <Star size={18} color="var(--color-border)" />
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', marginBottom: '2px', opacity: 0.8 }}>Kapasitas</p>
                <strong style={{ color: 'var(--color-text-main)' }}>{item.kapasitas} org</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', marginBottom: '2px', opacity: 0.8 }}>Harga / Hari</p>
                <strong style={{ color: 'var(--color-primary)' }}>Rp {(item.harga ?? 0).toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <Link to={`/admin/ruangan/edit/${item.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Edit size={16} /> Edit
              </Link>
              <button onClick={() => setDeleteModal({ isOpen: true, id: item.id })} className="btn btn-outline-danger" style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {searchTerm ? 'Tidak ada ruangan yang cocok dengan pencarian Anda.' : 'Belum ada data ruangan.'}
          </div>
        )}
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
