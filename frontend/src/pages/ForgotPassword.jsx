import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/apiService';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await forgotPassword(email);
      setStatus({ type: 'success', message: response.message });
      setEmail('');
    } catch (error) {
      const msg = error.response?.data?.debug_status 
        ? `${error.response.data.message}: ${error.response.data.debug_status}`
        : error.response?.data?.message || 'Terjadi kesalahan saat mengirim link';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '1rem', position: 'relative' }}>
      {/* Tombol Back ke Landing Page */}
      <Link to="/" style={{ 
        position: 'absolute', top: '2rem', left: '2rem', 
        display: 'flex', alignItems: 'center', gap: '0.5rem', 
        color: 'var(--color-text-muted)', fontWeight: 500, textDecoration: 'none' 
      }}>
        <ArrowLeft size={18} /> Kembali ke Beranda
      </Link>

      <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Mail size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Lupa Password?</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Kami akan mengirimkan instruksi untuk meriset password Anda melalui email.
          </p>
        </div>

        {status.message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: 'var(--border-radius)', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.type === 'success' ? '#059669' : '#dc2626',
            fontSize: '0.9rem'
          }}>
            {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Alamat Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
