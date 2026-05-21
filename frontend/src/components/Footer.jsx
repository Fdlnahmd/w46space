import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer style={{
      backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '3rem 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
          Wisma 46 Space
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
          {t('footer_address')}
        </p>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '460px', fontSize: '0.9rem' }}>
          {t('footer_desc')}
        </p>
        <div style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} {t('footer_copyright')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

