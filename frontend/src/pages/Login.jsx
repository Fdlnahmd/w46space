import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, ArrowLeft, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'error'|'info', message: '' }
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'id' ? 'Terjadi kesalahan saat login' : 'An error occurred during login'));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404) {
        setModal({
          type: 'info',
          message: lang === 'id'
            ? 'Akun Google ini belum terdaftar. Silakan daftar terlebih dahulu.'
            : 'This Google account is not registered. Please register first.'
        });
      } else {
        setModal({ type: 'error', message: msg || (lang === 'id' ? 'Login Google gagal.' : 'Google login failed.') });
      }
    }
  };

  const handleGoogleError = () => {
    setModal({
      type: 'error',
      message: lang === 'id' ? 'Login Google dibatalkan atau gagal.' : 'Google login was cancelled or failed.'
    });
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

      {/* Alert Modal Popup */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setModal(null)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)'
            }}>
              <X size={20} />
            </button>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 1rem',
              backgroundColor: modal.type === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(37,99,235,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
            }}>
              {modal.type === 'error' ? '⚠️' : 'ℹ️'}
            </div>
            <p style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {modal.message}
            </p>
            {modal.type === 'info' && (
              <Link to="/register" onClick={() => setModal(null)}
                className="btn btn-primary"
                style={{ display: 'inline-block', padding: '0.6rem 1.5rem', textDecoration: 'none', marginRight: '0.75rem' }}>
                {lang === 'id' ? 'Daftar Sekarang' : 'Register Now'}
              </Link>
            )}
            <button onClick={() => setModal(null)} className="btn" style={{
              padding: '0.6rem 1.5rem',
              backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)'
            }}>
              {lang === 'id' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}

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

        {/* Tombol Google Login */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            theme="outline"
            locale={lang === 'id' ? 'id' : 'en'}
          />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {lang === 'id' ? 'atau masuk dengan email' : 'or sign in with email'}
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

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
