import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Login = () => {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // Semua role (admin & user) diarahkan ke beranda setelah login
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'id' ? 'Terjadi kesalahan saat login' : 'An error occurred during login'));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', position: 'relative' }}>
      {/* Tombol Back ke Landing Page */}
      <Link to="/" style={{ 
        position: 'absolute', top: '2rem', left: '2rem', 
        display: 'flex', alignItems: 'center', gap: '0.5rem', 
        color: 'var(--color-text-muted)', fontWeight: 500, textDecoration: 'none' 
      }}>
        <ArrowLeft size={18} /> {t('back_to_home')}
      </Link>

      <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <LogIn size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-main)' }}>{t('login_title')}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('login_subtitle')}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('login_email')}</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder="nama@email.com" />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">{t('login_password')}</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="••••••••" />
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>{t('login_forgot')}</Link>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {t('login_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {t('login_no_account')} <Link to="/register" style={{ fontWeight: 600 }}>{t('login_register_link')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
