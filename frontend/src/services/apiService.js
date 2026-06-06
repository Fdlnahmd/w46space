import api from './api';

const API_URL = '/api';

let midtransSnapPromise = null;

export const ensureMidtransSnap = (clientKey, snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js') => {
  if (window.snap?.pay) return Promise.resolve();

  if (!clientKey) {
    return Promise.reject(new Error('Midtrans client key is not configured.'));
  }

  if (midtransSnapPromise) return midtransSnapPromise;

  midtransSnapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = snapUrl;
    script.async = true;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve();
    script.onerror = () => {
      midtransSnapPromise = null;
      reject(new Error('Failed to load Midtrans Snap script.'));
    };
    document.body.appendChild(script);
  });

  return midtransSnapPromise;
};

/**
 * Service API untuk berinteraksi dengan Backend Laravel.
 */

// --- Services untuk Ruangan ---

export const getRuangan = async () => {
  const response = await api.get('/offices');
  return response.data;
};

export const getRuanganById = async (id) => {
  const response = await api.get(`/offices/${id}`);
  return response.data;
};

export const createRuangan = async (data) => {
  // Jika data adalah FormData, biarkan axios menangani headers-nya
  const response = await api.post('/offices', data);
  return response.data;
};

export const updateRuangan = async (id, data) => {
  // Workaround Laravel PUT multipart: Gunakan POST dengan _method=PUT jika mengirim file (FormData)
  if (data instanceof FormData) {
    data.append('_method', 'PUT');
    const response = await api.post(`/offices/${id}`, data);
    return response.data;
  }
  
  const response = await api.put(`/offices/${id}`, data);
  return response.data;
};

export const deleteRuangan = async (id) => {
  const response = await api.delete(`/offices/${id}`);
  return response.data;
};


// --- Services untuk Pemesanan ---

export const getPemesanan = async (page = 1) => {
  const response = await api.get(`/bookings?page=${page}`);
  return response.data;
};

export const getPemesananById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const createPemesanan = async (data) => {
  const response = await api.post('/bookings', data);
  return response.data;
};

export const updatePemesanan = async (id, data) => {
  const response = await api.put(`/bookings/${id}`, data);
  return response.data;
};

export const updateStatusPemesanan = async (id, status) => {
  const response = await api.patch(`/bookings/${id}/status`, { status });
  return response.data;
};

export const addAddonsToBooking = async (id, addonIds) => {
  const response = await api.post(`/bookings/${id}/addons`, { addon_ids: addonIds });
  return response.data;
};

export const confirmAddon = async (bookingId, addonId) => {
  const response = await api.patch(`/bookings/${bookingId}/addons/confirm`, { addon_id: addonId });
  return response.data;
};

export const createSnapToken = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/pay`);
  return response.data;
};



// --- INVOICE ---
export const getInvoiceUrl = (id, lang = 'id') => {
  return `${API_URL}/bookings/${id}/invoice?lang=${lang}`;
};

export const downloadInvoicePdf = async (id, lang = 'id') => {
  const fallbackFilename = `INV-${String(id).padStart(5, '0')}.pdf`;

  try {
    const response = await api.get(`/bookings/${id}/invoice?lang=${lang}`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });

    const contentDisposition = response.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] || fallbackFilename;
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('Gagal mengunduh invoice:', error);
    alert(lang === 'id' ? 'Gagal mengunduh invoice.' : 'Failed to download invoice.');
  }
};

// --- ANALYTICS ---
export const getAdminAnalytics = async () => {
  const response = await api.get('/admin/analytics');
  return response.data;
};

export const deletePemesanan = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const getPemesananByUser = async (page = 1) => {
  const response = await api.get(`/bookings?page=${page}`);
  return response.data;
};

export const batalkanPemesanan = async (id) => {
  const response = await api.patch(`/bookings/${id}/status`, { status: 'Dibatalkan' });
  return response.data;
};


// --- Services Auth ---

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return {
    ...response.data.user,
    token: response.data.token
  };
};

export const registerUser = async (data) => {
  const response = await api.post('/register', data);
  return {
    ...response.data.user,
    token: response.data.token
  };
};

export const googleLogin = async (credential) => {
  const response = await api.post('/auth/google/login', { credential });
  return {
    ...response.data.user,
    token: response.data.token
  };
};

export const updateProfile = async (data) => {
  const response = await api.put('/profile', data);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put('/profile/password', data);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/reset-password', data);
  return response.data;
};

// --- Services untuk Review ---

export const getReviewsByOffice = async (officeId) => {
  const response = await api.get(`/offices/${officeId}/reviews`);
  return response.data;
};

export const getLatestReviews = async () => {
  const response = await api.get('/reviews/latest');
  return response.data;
};

export const createReview = async (data) => {
  const response = await api.post('/reviews', data);
  return response.data;
};

export const getAllReviewsAdmin = async () => {
  const response = await api.get('/admin/reviews');
  return response.data;
};

export const deleteReviewAdmin = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export const getCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data;
};

export const createCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data;
};

export const updateCoupon = async (id, data) => {
  const response = await api.put(`/admin/coupons/${id}`, data);
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

// --- Aliases ---
export const mockLogin = loginUser;
export const mockRegister = registerUser;

// --- Services untuk Addons & Coupons & Notifications ---
export const getAddons = async () => {
  const response = await api.get('/addons');
  return response.data;
};

export const checkCoupon = async (code) => {
  const response = await api.post('/coupons/check', { code });
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
