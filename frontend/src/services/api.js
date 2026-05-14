import axios from 'axios';

// URL backend Laravel di Docker (biasanya localhost:8000)
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk menambahkan Token ke setiap request jika ada
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      // console.log('Token sent:', user.token); // Hapus komentar ini jika ingin debug di console
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;