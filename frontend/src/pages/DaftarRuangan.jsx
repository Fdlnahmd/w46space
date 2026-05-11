import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRuangan } from '../services/mockData';
import { Search, Users, MapPin, Filter } from 'lucide-react';

const DaftarRuangan = () => {
  const [ruangan, setRuangan] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getRuangan().then(data => setRuangan(data));
  }, []);

  const filteredRuangan = ruangan.filter(r => 
    r.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', color: 'var(--color-text-main)' }}>Daftar Ruangan</h1>
        
        {/* Search Bar */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--box-shadow)', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cari nama ruangan..." 
              className="form-control"
              style={{ paddingLeft: '3rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={18} /> Filter
          </button>
        </div>

        {/* List Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3">
          {filteredRuangan.map(item => (
            <div key={item.id} className="card">
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={item.gambar} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{item.nama}</h3>
                  <span className={`badge ${item.status === 'Tersedia' ? 'badge-success' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </div>
                
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.deskripsi}
                </p>

                <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={16} /> Kapasitas: {item.kapasitas} orang
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>Rp {item.harga.toLocaleString('id-ID')}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/hari</span></p>
                  </div>
                  <Link to={`/ruangan/${item.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredRuangan.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
            <h3>Ruangan tidak ditemukan.</h3>
            <p>Silakan coba kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaftarRuangan;
