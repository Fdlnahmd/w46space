import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Register = () => {
  const { t, lang } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/'); // Redirect to home after successful registration/login
    } catch (err) {
      setError(err.response?.data?.message || (lang === 'id' ? 'Terjadi kesalahan saat registrasi' : 'An error occurred during registration'));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '2rem 0', position: 'relative' }}>
      {/* Tombol Back ke Landing Page */}
      <Link to="/" style={{ 
        position: 'absolute', top: '2rem', left: '2rem', 
        display: 'flex', alignItems: 'center', gap: '0.5rem', 
        color: 'var(--color-text-muted)', fontWeight: 500, textDecoration: 'none' 
      }}>
        <ArrowLeft size={18} /> {t('back_to_home')}
      </Link>

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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('register_name')}</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" placeholder="Budi Santoso" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('login_email')}</label>
            <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder="nama@email.com" />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">{t('login_password')}</label>
            <input required type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder={t('profile_new_password_placeholder')} minLength={6} />
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
