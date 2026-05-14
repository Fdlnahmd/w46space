import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPemesanan, updateStatusPemesanan, deletePemesanan } from '../../services/apiService';
import { Trash2, Eye, Search, Filter } from 'lucide-react';
import Modal from '../../components/Modal';

const statusOptions = ['Semua', 'Pending', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Dikonfirmasi': return { backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #10b981' };
    case 'Selesai':      return { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1' };
    case 'Dibatalkan':   return { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444' };
    default:             return { backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fbbf24' };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return dateString.split('T')[0];
};

const KelolaPemesanan = () => {
  const [pemesanan, setPemesanan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const loadData = () => {
    getPemesanan().then(data => {
      setPemesanan(data);
    }).catch(err => {
      console.error('Error fetching bookings:', err);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = () => {
    if (deleteModal.id) {
      deletePemesanan(deleteModal.id).then(() => {
        loadData();
        setDeleteModal({ isOpen: false, id: null });
      });
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusPemesanan(id, newStatus).then(() => loadData());
  };

  // Logika Filter
  const filteredData = pemesanan.filter(item => {
    const matchSearch = (item.nama_pemesan || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (item.office?.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (item.perusahaan || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kelola Pemesanan</h1>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Cari pemesan, perusahaan, atau ruangan..." 
            className="form-control"
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            <Filter size={18} /> Filter Status:
          </div>
          <select 
            className="form-control" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
        {(searchTerm || statusFilter !== 'Semua') && (
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('Semua'); }}
            style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Pemesan</th>
              <th style={{ padding: '1rem' }}>Ruangan</th>
              <th style={{ padding: '1rem' }}>Tanggal Kontrak</th>
              <th style={{ padding: '1rem' }}>Durasi</th>
              <th style={{ padding: '1rem' }}>Total Harga</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>

                {/* ID */}
                <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  #{item.id}
                </td>

                {/* Pemesan */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{item.nama_pemesan || '—'}</div>
                  {item.perusahaan && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.perusahaan}</div>
                  )}
                </td>

                {/* Ruangan */}
                <td style={{ padding: '1rem' }}>{item.office?.nama || '—'}</td>

                {/* Tanggal Kontrak */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{formatDate(item.tanggal_mulai)}</div>
                  {item.tanggal_akhir && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      s/d {formatDate(item.tanggal_akhir)}
                    </div>
                  )}
                </td>

                {/* Durasi */}
                <td style={{ padding: '1rem' }}>
                  {item.durasi ? `${item.durasi} Bulan` : '—'}
                </td>

                {/* Total Harga */}
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}
                </td>

                {/* Status — dropdown */}
                <td style={{ padding: '1rem' }}>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    style={{
                      padding: '0.3rem 0.5rem',
                      borderRadius: 'var(--border-radius)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      ...getStatusStyle(item.status)
                    }}
                  >
                    {statusOptions.filter(s => s !== 'Semua').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>

                {/* Aksi */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {/* Lihat Detail */}
                    <Link
                      to={`/admin/pemesanan/${item.id}`}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                    >
                      <Eye size={15} /> Detail
                    </Link>
                    {/* Hapus */}
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                      className="btn btn-danger"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {searchTerm || statusFilter !== 'Semua' ? 'Tidak ada data yang cocok dengan filter Anda.' : 'Belum ada data pemesanan.'}
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
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus pemesanan ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
      />
    </div>
  );
};

export default KelolaPemesanan;
