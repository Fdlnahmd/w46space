import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPemesanan, updateStatusPemesanan, deletePemesanan } from '../../services/apiService';
import { Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal';

const statusOptions = ['Semua', 'Pending', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Dikonfirmasi': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    case 'Selesai':      return { backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' };
    case 'Dibatalkan':   return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    default:             return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return dateString.split('T')[0];
};

const KelolaPemesanan = () => {
  const [pemesanan, setPemesanan] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [loading, setLoading] = useState(false);

  const loadData = (page = 1) => {
    setLoading(true);
    getPemesanan(page).then(res => {
      // Backend return paginated object: { data: [], current_page: 1, ... }
      setPemesanan(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total
      });
    }).catch(err => {
      console.error('Error fetching bookings:', err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = () => {
    if (deleteModal.id) {
      deletePemesanan(deleteModal.id).then(() => {
        loadData(pagination.current_page);
        setDeleteModal({ isOpen: false, id: null });
      });
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusPemesanan(id, newStatus).then(() => loadData(pagination.current_page));
  };

  // Logika Filter (Hanya bisa filter data yang ada di halaman ini)
  const filteredData = Array.isArray(pemesanan) ? pemesanan.filter(item => {
    const matchSearch = (item.nama_pemesan || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (item.office?.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (item.perusahaan || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;

    return matchSearch && matchStatus;
  }) : [];

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
            style={{ marginBottom: 0, width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-background)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>Penyewa</th>
                <th style={{ padding: '1rem' }}>Ruangan</th>
                <th style={{ padding: '1rem' }}>Tanggal</th>
                <th style={{ padding: '1rem' }}>Total Harga</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Tidak ada data pemesanan.</td>
                </tr>
              ) : filteredData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    #{item.id}
                    {item.parent_id && (
                      <div style={{ 
                        fontSize: '0.6rem', color: 'var(--color-primary)', 
                        backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '2px 4px', 
                        borderRadius: '4px', marginTop: '4px', display: 'inline-block',
                        border: '1px solid rgba(37, 99, 235, 0.2)'
                      }}>
                        PERPANJANGAN
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{item.nama_pemesan || '—'}</div>
                    {item.perusahaan && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.perusahaan}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{item.office?.nama || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{formatDate(item.tanggal_mulai)}</div>
                    {item.tanggal_akhir && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        s/d {formatDate(item.tanggal_akhir)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Rp {Number(item.total_harga).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={item.status} 
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{ 
                        ...getStatusStyle(item.status),
                        padding: '0.35rem 0.75rem', borderRadius: '20px', 
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {statusOptions.filter(o => o !== 'Semua').map(opt => (
                        <option key={opt} value={opt} style={{ color: '#000', backgroundColor: '#fff' }}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <Link 
                        to={`/admin/pemesanan/${item.id}`} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', minWidth: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </Link>
                      <button 
                        onClick={() => setDeleteModal({ isOpen: false, id: item.id })} // Fix delete modal
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', minWidth: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-outline" 
          disabled={pagination.current_page === 1 || loading}
          onClick={() => loadData(pagination.current_page - 1)}
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ChevronLeft size={18} /> Sebelumnya
        </button>
        <div style={{ fontWeight: 600 }}>
          Halaman {pagination.current_page} dari {pagination.last_page}
        </div>
        <button 
          className="btn btn-outline" 
          disabled={pagination.current_page === pagination.last_page || loading}
          onClick={() => loadData(pagination.current_page + 1)}
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Selanjutnya <ChevronRight size={18} />
        </button>
      </div>

      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Pemesanan"
        message="Apakah Anda yakin ingin menghapus data pemesanan ini? Tindakan ini tidak dapat dibatalkan."
        type="danger"
      />
    </div>
  );
};

export default KelolaPemesanan;
