import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Dummy WhatsApp number (ganti dengan nomor asli saat production)
const WA_NUMBER = '6281584350420';

const FloatingWhatsApp = () => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const messages = {
    id: {
      tooltip: 'Hubungi Kami',
      title: 'Wisma 46 Space',
      subtitle: 'Tim Sales · Biasanya membalas segera',
      confirmOrder: '✅ Konfirmasi Pesanan',
      confirmOrderMsg: 'Halo Wisma 46 Space, saya ingin mengkonfirmasi pesanan sewa ruangan saya.',
      paymentInfo: '💳 Informasi Pembayaran',
      paymentInfoMsg: 'Halo Wisma 46 Space, saya ingin menanyakan informasi dan tata cara pembayaran sewa ruangan.',
      generalChat: '💬 Tanya-Tanya Dulu',
      generalChatMsg: 'Halo Wisma 46 Space, saya tertarik menyewa ruangan dan ingin mendapatkan informasi lebih lanjut.',
    },
    en: {
      tooltip: 'Contact Us',
      title: 'Wisma 46 Space',
      subtitle: 'Sales Team · Usually replies instantly',
      confirmOrder: '✅ Confirm Booking',
      confirmOrderMsg: 'Hello Wisma 46 Space, I would like to confirm my room booking.',
      paymentInfo: '💳 Payment Information',
      paymentInfoMsg: 'Hello Wisma 46 Space, I would like to inquire about payment methods for my room rental.',
      generalChat: '💬 General Inquiry',
      generalChatMsg: 'Hello Wisma 46 Space, I am interested in renting a room and would like more information.',
    },
  };

  const m = messages[lang] || messages.id;

  const openWA = (msg) => {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Popup Card */}
      {isOpen && (
        <>
          {/* Backdrop untuk tutup saat klik luar */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
            }}
          />

          <div style={{
            position: 'fixed',
            bottom: '108px',
            right: '36px',
            zIndex: 9999,
            width: '300px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            animation: 'waPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              padding: '1.25rem 1.25rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              {/* WA Icon */}
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{m.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', margin: 0, marginTop: '0.1rem' }}>{m.subtitle}</p>
              </div>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                  border: 'none', cursor: 'pointer', color: 'white',
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700, flexShrink: 0,
                }}
              >×</button>
            </div>

            {/* Options */}
            <div style={{ backgroundColor: '#f0f4f8', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => openWA(m.confirmOrderMsg)}
                style={{
                  width: '100%', padding: '0.85rem 1rem',
                  backgroundColor: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer',
                  textAlign: 'left', fontSize: '0.9rem', fontWeight: 600,
                  color: '#1a202c', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                {m.confirmOrder}
              </button>

              <button
                onClick={() => openWA(m.paymentInfoMsg)}
                style={{
                  width: '100%', padding: '0.85rem 1rem',
                  backgroundColor: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer',
                  textAlign: 'left', fontSize: '0.9rem', fontWeight: 600,
                  color: '#1a202c', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                {m.paymentInfo}
              </button>

              <button
                onClick={() => openWA(m.generalChatMsg)}
                style={{
                  width: '100%', padding: '0.85rem 1rem',
                  backgroundColor: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', cursor: 'pointer',
                  textAlign: 'left', fontSize: '0.9rem', fontWeight: 600,
                  color: '#1a202c', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7fafc'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                {m.generalChat}
              </button>
            </div>

            {/* Footer note */}
            <div style={{
              backgroundColor: '#f0f4f8', padding: '0.5rem 0.75rem 0.75rem',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.7rem', color: '#718096', margin: 0 }}>
                📞 Sales: 0812345678910
              </p>
            </div>
          </div>
        </>
      )}

      {/* Floating Button */}
      <div style={{ position: 'fixed', bottom: '40px', right: '36px', zIndex: 9997 }}>
        {/* Tooltip */}
        {isHovered && !isOpen && (
          <div style={{
            position: 'absolute', right: '60px', top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1a202c', color: 'white',
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}>
            {m.tooltip}
            <div style={{
              position: 'absolute', right: '-5px', top: '50%',
              transform: 'translateY(-50%)',
              width: 0, height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '5px solid #1a202c',
            }} />
          </div>
        )}

        {/* Ping animation ring */}
        {!isOpen && (
          <span style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            backgroundColor: '#25D366',
            animation: 'waPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            opacity: 0.4,
          }} />
        )}

        <button
          onClick={() => setIsOpen(prev => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="WhatsApp"
          style={{
            position: 'relative',
            width: '56px', height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(37, 211, 102, 0.5)',
            transform: isOpen ? 'rotate(45deg) scale(1.05)' : isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          )}
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes waPing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes waPopIn {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default FloatingWhatsApp;
