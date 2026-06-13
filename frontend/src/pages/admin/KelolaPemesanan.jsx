import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPemesanan, updateStatusPemesanan, deletePemesanan } from '../../services/apiService';
import { Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import { useLanguage } from '../../contexts/LanguageContext';

const statusOptions = ['Semua', 'Pending', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Dikonfirmasi': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    case 'Selesai':      return { backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' };
    case 'Dibatalkan':   return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
    default:             return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
  }
};

const getStatusLabel = (opt, lang) => {
  if (lang === 'id') return opt;
  switch (opt) {
    case 'Semua': return 'All';
    case 'Pending': return 'Pending';
    case 'Dikonfirmasi': return 'Confirmed';
    case 'Selesai': return 'Completed';
    case 'Dibatalkan': return 'Canceled';
    default: return opt;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return dateString.split('T')[0];
};

const KelolaPemesanan = () => {
  const { lang } = useLanguage();
  const location = useLocation();
  const [pemesanan, setPemesanan] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [banner, setBanner] = useState({ show: false, type: 'success', message: '' });
  const [errorModal, setErrorModal] = useState(() => ({
    isOpen: !!location.state?.error,
    title: lang === 'id' ? 'Pesanan Tidak Ditemukan' : 'Booking Not Found',
    message: location.state?.error || '',
    type: 'warning'
  }));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.error) {
      // clear location state to prevent showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadData = useCallback((page = 1) => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleDelete = () => {
    if (deleteModal.id) {
      const deletedId = deleteModal.id;
      deletePemesanan(deletedId).then(() => {
        loadData(pagination.current_page);
        setDeleteModal({ isOpen: false, id: null });
        setBanner({
          show: true,
          type: 'success',
          message: lang === 'id'
            ? `Pemesanan #${deletedId} berhasil dihapus dari daftar.`
            : `Booking #${deletedId} was successfully removed from the list.`
        });
        setTimeout(() => setBanner({ show: false, type: 'success', message: '' }), 3500);
      }).catch((err) => {
        setDeleteModal({ isOpen: false, id: null });
        setBanner({
          show: true,
          type: 'error',
          message: err.response?.data?.message || (lang === 'id'
            ? 'Gagal menghapus pemesanan. Silakan coba lagi.'
            : 'Failed to delete booking. Please try again.')
        });
        setTimeout(() => setBanner({ show: false, type: 'success', message: '' }), 4500);
      });
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusPemesanan(id, newStatus)
      .then(() => loadData(pagination.current_page))
      .catch((err) => {
        const errMsg = err.response?.data?.message || (lang === 'id' ? 'Gagal mengubah status.' : 'Failed to update status.');
        setErrorModal({
          isOpen: true,
          title: lang === 'id' ? 'Gagal Mengubah Status' : 'Failed to Update Status',
          message: errMsg,
          type: 'warning'
        });
        loadData(pagination.current_page);
      });
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
        <h1>{lang === 'id' ? 'Kelola Pemesanan' : 'Manage Bookings'}</h1>
      </div>

      {banner.show && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            padding: '0.95rem 1rem',
            borderRadius: 'var(--border-radius)',
            backgroundColor: banner.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: banner.type === 'success' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: banner.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontWeight: 600
          }}
        >
          {banner.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card admin-filter-bar">
        <div className="admin-filter-search">
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={lang === 'id' ? 'Cari pemesan, perusahaan, atau ruangan...' : 'Search booking, company, or room...'} 
            className="form-control"
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            <Filter size={18} /> {lang === 'id' ? 'Filter Status:' : 'Filter Status:'}
          </div>
          <select 
            className="form-control" 
            style={{ marginBottom: 0, width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => <option key={opt} value={opt}>{getStatusLabel(opt, lang)}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="card hide-on-mobile" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-background)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '1rem' }}>ID</th>
                <th style={{ padding: '1rem' }}>{lang === 'id' ? 'Penyewa' : 'Tenant'}</th>
                <th style={{ padding: '1rem' }}>{lang === 'id' ? 'Ruangan' : 'Room'}</th>
                <th style={{ padding: '1rem' }}>{lang === 'id' ? 'Tanggal' : 'Date'}</th>
                <th style={{ padding: '1rem' }}>{lang === 'id' ? 'Total Harga' : 'Total Price'}</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>{lang === 'id' ? 'Aksi' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Memuat data...' : 'Loading data...'}</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Tidak ada data pemesanan.' : 'No booking data.'}</td>
                </tr>
              ) : filteredData.map(item => {
                const pendingAddons = item.addons ? item.addons.filter(addon => addon.pivot?.status === 'pending') : [];
                const hasPendingAddons = pendingAddons.length > 0;
                return (
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
                          {lang === 'id' ? 'PERPANJANGAN' : 'EXTENSION'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.nama_pemesan || '—'}</div>
                      {item.perusahaan && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.perusahaan}</div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>{item.office?.nama || '—'}</div>
                      {hasPendingAddons && (
                        <div style={{ marginTop: '6px' }}>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: 'var(--color-warning)',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                            title={lang === 'id' ? `${pendingAddons.length} fasilitas tambahan perlu konfirmasi` : `${pendingAddons.length} amenities need confirmation`}
                          >
                            ⚠️ {pendingAddons.length} {lang === 'id' ? 'Fasilitas Baru Perlu Konfirmasi' : 'New Amenities Need Confirmation'}
                          </span>
                        </div>
                      )}
                    </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{formatDate(item.tanggal_mulai)}</div>
                    {item.tanggal_akhir && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {lang === 'id' ? 's/d' : 'to'} {formatDate(item.tanggal_akhir)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      Rp {Number(item.total_harga).toLocaleString('id-ID')}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      {String(item.payment_status || 'Pending').toLowerCase() === 'paid' ? (
                        <span style={{ 
                          fontSize: '0.7rem', color: '#10b981', fontWeight: 600, 
                          backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', 
                          borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' 
                        }}>
                          {lang === 'id' ? 'Lunas' : 'Paid'}
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600, 
                          backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: '2px 6px', 
                          borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' 
                        }}>
                          {lang === 'id' ? 'Belum Bayar' : 'Unpaid'}
                        </span>
                      )}
                    </div>
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
                        <option key={opt} value={opt} style={{ color: '#000', backgroundColor: '#fff' }}>{getStatusLabel(opt, lang)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <Link 
                        to={`/admin/pemesanan/${item.id}`} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem', minWidth: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title={lang === 'id' ? 'Lihat Detail' : 'View Details'}
                      >
                        <Eye size={16} />
                      </Link>
                      <button 
                        onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                        className="btn btn-outline-danger" 
                        style={{ padding: '0.4rem', minWidth: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title={lang === 'id' ? 'Hapus' : 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="show-only-on-mobile">
        {loading ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Memuat data...' : 'Loading data...'}</div>
        ) : filteredData.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Tidak ada data pemesanan.' : 'No booking data.'}</div>
        ) : filteredData.map(item => {
          const pendingAddons = item.addons ? item.addons.filter(addon => addon.pivot?.status === 'pending') : [];
          const hasPendingAddons = pendingAddons.length > 0;
          return (
            <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>#{item.id}</span>
                  {item.parent_id && (
                    <span style={{ 
                      fontSize: '0.6rem', color: 'var(--color-primary)', 
                      backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '2px 6px', 
                      borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold',
                      border: '1px solid rgba(37, 99, 235, 0.2)', display: 'inline-block'
                    }}>
                      {lang === 'id' ? 'PERPANJANGAN' : 'EXTENSION'}
                    </span>
                  )}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.25rem' }}>{item.nama_pemesan || '—'}</h3>
                  {item.perusahaan && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>{item.perusahaan}</p>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
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
                      <option key={opt} value={opt} style={{ color: '#000', backgroundColor: '#fff' }}>{getStatusLabel(opt, lang)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{lang === 'id' ? 'Ruangan:' : 'Room:'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontWeight: 500, textAlign: 'right' }}>{item.office?.nama || '—'}</span>
                    {hasPendingAddons && (
                      <div style={{ marginTop: '2px' }}>
                        <span 
                          style={{ 
                            fontSize: '0.65rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: 'var(--color-warning)',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          ⚠️ {pendingAddons.length} {lang === 'id' ? 'Fasilitas Baru' : 'New Amenities'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{lang === 'id' ? 'Tanggal:' : 'Date:'}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>
                    {formatDate(item.tanggal_mulai)}
                    {item.tanggal_akhir && ` ${lang === 'id' ? 's/d' : 'to'} ${formatDate(item.tanggal_akhir)}`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{lang === 'id' ? 'Total Harga:' : 'Total Price:'}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                      Rp {Number(item.total_harga).toLocaleString('id-ID')}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: String(item.payment_status || 'Pending').toLowerCase() === 'paid' ? '#10b981' : '#f59e0b', 
                      fontWeight: 600, 
                      marginTop: '2px' 
                    }}>
                      {String(item.payment_status || 'Pending').toLowerCase() === 'paid' 
                        ? (lang === 'id' ? 'Lunas' : 'Paid') 
                        : (lang === 'id' ? 'Belum Bayar' : 'Unpaid')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <Link 
                  to={`/admin/pemesanan/${item.id}`} 
                  className="btn btn-outline" 
                  style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                  title={lang === 'id' ? 'Lihat Detail' : 'View Details'}
                >
                  <Eye size={16} /> {lang === 'id' ? 'Detail' : 'Details'}
                </Link>
                <button 
                  onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                  className="btn btn-outline-danger" 
                  style={{ flex: 1, padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                  title={lang === 'id' ? 'Hapus' : 'Delete'}
                >
                  <Trash2 size={16} /> {lang === 'id' ? 'Hapus' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button 
          className="btn btn-outline" 
          disabled={pagination.current_page === 1 || loading}
          onClick={() => loadData(pagination.current_page - 1)}
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ChevronLeft size={18} /> {lang === 'id' ? 'Sebelumnya' : 'Previous'}
        </button>
        <div style={{ fontWeight: 600 }}>
          {lang === 'id' ? `Halaman ${pagination.current_page} dari ${pagination.last_page}` : `Page ${pagination.current_page} of ${pagination.last_page}`}
        </div>
        <button 
          className="btn btn-outline" 
          disabled={pagination.current_page === pagination.last_page || loading}
          onClick={() => loadData(pagination.current_page + 1)}
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {lang === 'id' ? 'Selanjutnya' : 'Next'} <ChevronRight size={18} />
        </button>
      </div>

      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title={lang === 'id' ? 'Hapus Pemesanan' : 'Delete Booking'}
        message={lang === 'id' ? 'Apakah Anda yakin ingin menghapus data pemesanan ini? Tindakan ini tidak dapat dibatalkan.' : 'Are you sure you want to delete this booking? This action cannot be undone.'}
        type="danger"
        confirmText={lang === 'id' ? 'Ya, Hapus' : 'Yes, Delete'}
      />

      <Modal 
        isOpen={errorModal.isOpen} 
        onClose={() => setErrorModal({ isOpen: false, message: '', title: '', type: 'warning' })}
        title={errorModal.title || (lang === 'id' ? 'Peringatan' : 'Warning')}
        message={errorModal.message}
        type={errorModal.type || 'warning'}
      />
    </div>
  );
};

export default KelolaPemesanan;
