const Footer = () => {
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
        gap: '1rem',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Sewa Ruang</h3>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px' }}>
          Platform penyewaan Office dan Meeting Room terbaik dan terpercaya untuk kebutuhan bisnis Anda.
        </p>
        <div style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Sewa Ruang. Hak Cipta Dilindungi.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
