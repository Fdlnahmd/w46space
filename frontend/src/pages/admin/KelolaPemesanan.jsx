import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPemesanan, updateStatusPemesanan, deletePemesanan } from '../../services/mockData';
import { Trash2, Eye } from 'lucide-react';

const statusOptions = ['Pending', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Dikonfirmasi': return { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' };
    case 'Pending':      return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    case 'Dibatalkan':   return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
    case 'Selesai':      return { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
    default:             return { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
  }
};

const KelolaPemesanan = () => {
  const [pemesanan, setPemesanan] = useState([]);

  const loadData = () => getPemesanan().then(data => setPemesanan(data));

  useEffect(() => { loadData(); }, []);

  const handleDelete = (id) => {
    if (window.confirm('Hapus pemesanan ini secara permanen?')) {
      deletePemesanan(id).then(() => loadData());
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusPemesanan(id, newStatus).then(() => loadData());
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Kelola Pemesanan</h1>
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
            {pemesanan.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>

                {/* ID */}
                <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  #{item.id}
                </td>

                {/* Pemesan */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{item.namaPemesan}</div>
                  {item.perusahaan && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.perusahaan}</div>
                  )}
                </td>

                {/* Ruangan */}
                <td style={{ padding: '1rem' }}>{item.ruangan?.nama || '—'}</td>

                {/* Tanggal Kontrak — FIXED: tampilkan tanggalMulai & tanggalAkhir */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 500 }}>{item.tanggalMulai || '—'}</div>
                  {item.tanggalAkhir && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      s/d {item.tanggalAkhir}
                    </div>
                  )}
                </td>

                {/* Durasi */}
                <td style={{ padding: '1rem' }}>
                  {item.durasi ? `${item.durasi} Bulan` : '—'}
                </td>

                {/* Total Harga */}
                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  Rp {item.totalHarga?.toLocaleString('id-ID') || '—'}
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
                    {statusOptions.map(s => (
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
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.4rem 0.6rem', borderRadius: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pemesanan.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Belum ada data pemesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KelolaPemesanan;
