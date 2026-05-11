import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      // Semua role (admin & user) diarahkan ke beranda setelah login
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
      <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <LogIn size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-main)' }}>Selamat Datang</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="nama@email.com" />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            Masuk
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Belum punya akun? <Link to="/register" style={{ fontWeight: 600 }}>Daftar sekarang</Link>
        </div>
        
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)', fontSize: '0.85rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Akun Demo:</p>
          <ul style={{ listStylePosition: 'inside', color: 'var(--color-text-muted)' }}>
            <li>Admin: admin@sewaruang.com / password</li>
            <li>User: budi@gmail.com / password</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
