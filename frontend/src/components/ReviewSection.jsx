import { useState, useEffect, useCallback } from 'react';
import { getReviewsByOffice, createReview } from '../services/apiService';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ReviewSection = ({ officeId, canReview }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await getReviewsByOffice(officeId);
      setReviews(data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [officeId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchReviews();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await createReview({
        office_id: officeId,
        rating: newReview.rating,
        comment: newReview.comment
      });
      setSuccess(true);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 24 : 16}
            fill={star <= (interactive ? newReview.rating : rating) ? 'var(--color-warning)' : 'transparent'}
            color={star <= (interactive ? newReview.rating : rating) ? 'var(--color-warning)' : '#cbd5e1'}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={() => interactive && setNewReview({ ...newReview, rating: star })}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <MessageSquare size={24} color="var(--color-primary)" /> 
        Ulasan Pengguna ({reviews.length})
      </h2>

      {/* Form Tambah Review (Hanya jika login, bukan admin, dan punya izin dari backend) */}
      {user && user.role !== 'admin' && canReview && (
        <div className="card" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Berikan Ulasan Anda</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Rating</label>
              {renderStars(0, true)}
            </div>
            <div className="form-group">
              <label className="form-label">Komentar</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Bagikan pengalaman Anda menyewa ruangan ini..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
              ></textarea>
            </div>
            
            {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
            {success && <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '1rem' }}>Ulasan berhasil dikirim! Terima kasih.</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} /> {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
              *Hanya pengguna yang sudah menyelesaikan pemesanan yang dapat memberikan ulasan.
            </p>
          </form>
        </div>
      )}

      {/* List Reviews */}
      {loading ? (
        <p>Memuat ulasan...</p>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ 
              padding: '1.5rem', borderBottom: '1px solid var(--color-border)', 
              display: 'flex', gap: '1rem' 
            }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                backgroundColor: 'var(--color-secondary)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <User size={20} color="var(--color-text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontWeight: 600 }}>{review.user?.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {renderStars(review.rating)}
                <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-secondary)', borderRadius: 'var(--border-radius)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Belum ada ulasan untuk ruangan ini. Jadilah yang pertama!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
