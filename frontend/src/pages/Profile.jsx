import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, changePassword } from '../services/apiService';
import { User, Lock, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Profile = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || user?.nama || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await updateProfile(profileData);
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setStatus({ type: 'success', message: t('profile_update_success') });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || t('profile_update_failed') });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
      setStatus({ type: 'success', message: t('password_change_success') });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || t('password_change_failed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '1000px' }}>
      {/* Tombol Kembali ke Landing Page */}
      <Link 
        to="/" 
        className="btn btn-outline" 
        style={{ 
          marginBottom: '1.5rem', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.9rem',
          padding: '0.5rem 1rem',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)'
        }}
      >
        <ArrowLeft size={16} /> {t('back_to_home_btn')}
      </Link>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{t('profile_settings')}</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>{t('profile_desc')}</p>
      </div>

      {status.message && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: 'var(--border-radius)', 
          marginBottom: '2rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: status.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{status.message}</span>
        </div>
      )}

      <div className="profile-layout">
        {/* Sidebar Info */}
        <div>
          <div className="card profile-sidebar">
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: 'rgba(37, 99, 235, 0.1)', 
              color: 'var(--color-primary)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem' 
            }}>
              <User size={40} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user?.name || user?.nama}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user?.email}</p>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.4rem 0.8rem', 
              backgroundColor: 'var(--color-secondary)', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              color: 'var(--color-primary)'
            }}>
              <Shield size={14} />
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'helpdesk' ? 'Helpdesk' : (lang === 'id' ? 'Penyewa' : 'Tenant')}
            </div>
          </div>
        </div>

        {/* Content Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Edit Profile Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--color-primary)" /> {t('profile_personal_info')}
            </h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">{t('profile_full_name')}</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{t('profile_email_address')}</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('submitting') : t('save_changes')}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--color-primary)" /> {t('profile_security')}
            </h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">{t('profile_current_password')}</label>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder={t('profile_current_password_placeholder')}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                />
              </div>
              <div className="password-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('profile_new_password')}</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder={t('profile_new_password_placeholder')}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('profile_confirm_password')}</label>
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder={t('profile_confirm_password_placeholder')}
                    value={passwordData.new_password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-outline" disabled={loading} style={{ borderColor: 'var(--color-text-main)' }}>
                {loading ? t('submitting') : t('change_password_btn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
