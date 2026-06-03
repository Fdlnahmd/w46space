import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowLeft, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [googleId, setGoogleId] = useState(null);
  const [googleAvatar, setGoogleAvatar] = useState(null);
  const [googlePrefilled, setGooglePrefilled] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      // Coba cek ke backend apakah akun sudah ada
      await loginWithGoogle(credentialResponse.credential);

      // Akun SUDAH ADA → tampilkan popup, jangan auto-login
      setModal({
        type: 'info',
        message: lang === 'id'
          ? 'Email ini sudah terdaftar. Silakan login.'
          : 'This email is already registered. Please login instead.'
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        // Akun BELUM ADA → decode token untuk pre-fill form, minta password
        try {
          const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          setFormData((prev) => ({
            ...prev,
            name: payload.name || prev.name,
            email: payload.email || prev.email,
          }));
          setGoogleId(payload.sub);
          setGoogleAvatar(payload.picture);
          setGooglePrefilled(true);
        } catch {
          setError(lang === 'id' ? 'Gagal membaca data dari Google.' : 'Failed to read Google data.');
        }
      } else {
        setModal({
          type: 'error',
          message: err.response?.data?.message || (lang === 'id' ? 'Terjadi kesalahan Google.' : 'Google error occurred.')
        });
      }
    }
  };

  const handleGoogleError = () => {
    setModal({
      type: 'error',
      message: lang === 'id' ? 'Proses Google dibatalkan atau gagal.' : 'Google process was cancelled or failed.'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...formData,
        google_id: googleId || undefined,
        avatar: googleAvatar || undefined,
      };
      await register(payload);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 409) {
        setModal({
          type: 'info',
          message: lang === 'id'
            ? 'Email ini sudah terdaftar. Silakan login.'
            : 'This email is already registered. Please login instead.'
        });
      } else {
        setError(msg || (lang === 'id' ? 'Terjadi kesalahan saat registrasi' : 'An error occurred during registration'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '2rem 0', position: 'relative' }}>
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
              <Link to="/login" onClick={() => setModal(null)}
                className="btn btn-primary"
                style={{ display: 'inline-block', padding: '0.6rem 1.5rem', textDecoration: 'none', marginRight: '0.75rem' }}>
                {lang === 'id' ? 'Masuk' : 'Login'}
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

      <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <UserPlus size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-main)' }}>{t('register_title')}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('register_subtitle')}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Tampilkan tombol Google HANYA jika belum pre-fill */}
        {!googlePrefilled && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signup_with"
                shape="rectangular"
                theme="outline"
                locale={lang === 'id' ? 'id' : 'en'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {lang === 'id' ? 'atau daftar dengan email' : 'or register with email'}
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
            </div>
          </>
        )}

        {/* Banner jika Google pre-fill aktif */}
        {googlePrefilled && (
          <div style={{
            backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: 'var(--border-radius)', padding: '0.75rem 1rem',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
              ✓ {lang === 'id'
                ? 'Akun belum terdaftar. Buat password untuk melanjutkan.'
                : 'Account not found. Set a password to continue.'}
            </span>
            <button onClick={() => { setGooglePrefilled(false); setGoogleId(null); setGoogleAvatar(null); setFormData({ name: '', email: '', password: '' }); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('register_name')}</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" placeholder="Budi Santoso" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('login_email')}</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder="nama@email.com"
              readOnly={googlePrefilled}
              style={googlePrefilled ? { backgroundColor: 'var(--color-surface)', opacity: 0.7 } : {}} />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">{t('login_password')}</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="form-control"
              placeholder={t('profile_new_password_placeholder')} minLength={6} />
            {googlePrefilled && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                {lang === 'id' ? '* Buat password untuk mengamankan akun Anda.' : '* Create a password to secure your account.'}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {t('register_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {t('register_has_account')} <Link to="/login" style={{ fontWeight: 600 }}>{t('register_login_link')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
