import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/apiService';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ResetPassword = () => {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Ambil email, dan bersihkan jika ada teks "amp;" (efek copy dari HTML log)
  const rawEmail = searchParams.get('email') || searchParams.get('amp;email') || '';
  
  const [formData, setFormData] = useState({
    email: rawEmail,
    token: searchParams.get('token') || '',
    password: '',
    password_confirmation: '',
  });

  const [status, setStatus] = useState(() => {
    if (!rawEmail || !searchParams.get('token')) {
      return { type: 'error', message: lang === 'id' ? 'Link reset tidak valid atau sudah kadaluarsa.' : 'Reset link is invalid or has expired.' };
    }
    return { type: '', message: '' };
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await resetPassword(formData);
      setStatus({ type: 'success', message: response.message });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || (lang === 'id' ? 'Gagal meriset password' : 'Failed to reset password') });
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
        <ArrowLeft size={18} /> {t('back_to_home')}
      </Link>

      <div className="card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Lock size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{lang === 'id' ? 'Password Baru' : 'New Password'}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            {lang === 'id' ? 'Silakan masukkan password baru Anda untuk mengamankan akun.' : 'Please enter your new password to secure your account.'}
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
          <div className="form-group">
            <label className="form-label">{t('profile_new_password')}</label>
            <input
              type="password"
              required
              placeholder={t('profile_new_password_placeholder')}
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">{t('profile_confirm_password')}</label>
            <input
              type="password"
              required
              placeholder={t('profile_confirm_password_placeholder')}
              className="form-control"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading || status.type === 'success'}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (lang === 'id' ? 'Setel Ulang Password' : 'Reset Password')}
          </button>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> {lang === 'id' ? 'Kembali ke Login' : 'Back to Sign In'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
