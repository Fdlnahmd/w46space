import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan, deleteRuangan } from '../../services/apiService';
import { Plus, Edit, Trash2 } from 'lucide-react';

const KelolaRuangan = () => {
  const [ruangan, setRuangan] = useState([]);

  const loadData = () => {
    getRuangan().then(data => setRuangan(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
      deleteRuangan(id).then(() => {
        loadData();
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kelola Ruangan</h1>
        <Link to="/admin/ruangan/tambah" className="btn btn-primary">
          <Plus size={18} /> Tambah Ruangan
        </Link>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Nama Ruangan</th>
              <th style={{ padding: '1rem' }}>Kapasitas</th>
              <th style={{ padding: '1rem' }}>Harga/Hari</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {ruangan.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{item.nama}</td>
                <td style={{ padding: '1rem' }}>{item.kapasitas} org</td>
                <td style={{ padding: '1rem' }}>Rp {(item.harga ?? 0).toLocaleString('id-ID')}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <Link to={`/admin/ruangan/edit/${item.id}`} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                    <Edit size={16} />
                  </Link>
                  <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {ruangan.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada data ruangan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KelolaRuangan;
