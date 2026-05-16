import api from './api';

const API_URL = '/api';

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


// --- INVOICE ---
export const getInvoiceUrl = (id) => {
  return `${API_URL}/bookings/${id}/invoice`;
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

export const getPemesananByUser = async () => {
  const response = await api.get('/bookings');
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

// Aliases agar tidak merusak AuthContext yang memanggil mockLogin/mockRegister
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
