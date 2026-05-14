import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const Modal = ({ isOpen, onClose, onConfirm, type = 'success', title, message, confirmText = 'Ya, Hapus' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)', animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: '#fff', padding: '2rem', borderRadius: 'var(--border-radius-lg)',
        width: '90%', maxWidth: '400px', textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative', animation: 'slideUp 0.3s ease'
      }}>
        {!onConfirm && (
          <button onClick={onClose} style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)'
          }}>
            <X size={20} />
          </button>
        )}

        <div style={{
          display: 'inline-flex', padding: '1rem', borderRadius: '50%',
          backgroundColor: type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 
                         type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          marginBottom: '1.5rem'
        }}>
          {type === 'success' && <CheckCircle2 size={48} color="var(--color-success)" />}
          {type === 'danger' && <AlertCircle size={48} color="var(--color-danger)" />}
          {type === 'warning' && <AlertCircle size={48} color="var(--color-warning)" />}
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>{message}</p>

        {onConfirm ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }}>
              Batal
            </button>
            <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1, padding: '0.75rem' }}>
              {confirmText}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            Tutup
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
