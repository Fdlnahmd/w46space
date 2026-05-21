import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh', 
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(37, 99, 235, 0.1)', 
        padding: '2rem', 
        borderRadius: '50%', 
        marginBottom: '2rem' 
      }}>
        <AlertCircle size={80} color="var(--color-primary)" />
      </div>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>{t('not_found_title')}</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '2.5rem' }}>
        {t('not_found_desc')}
      </p>
      <Link to="/" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 2rem' }}>
        <Home size={20} /> {t('back_to_home_btn')}
      </Link>
    </div>
  );
};

export default NotFound;
