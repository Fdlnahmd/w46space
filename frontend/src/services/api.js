import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Offices
export const officeService = {
  getAll: () => api.get('/offices'),
  getOne: (id) => api.get(`/offices/${id}`),
  create: (data) => api.post('/offices', data),
  update: (id, data) => api.put(`/offices/${id}`, data),
  delete: (id) => api.delete(`/offices/${id}`),
};

// Bookings
export const bookingService = {
  getAll: () => api.get('/bookings'),
  getOne: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  delete: (id) => api.delete(`/bookings/${id}`),
};

export default api;