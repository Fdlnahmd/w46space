import api from './api';

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

export const getPemesanan = async () => {
  const response = await api.get('/bookings');
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

// Aliases agar tidak merusak AuthContext yang memanggil mockLogin/mockRegister
export const mockLogin = loginUser;
export const mockRegister = registerUser;
