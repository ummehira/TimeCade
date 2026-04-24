// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 60 seconds — handles Neon cold start
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('juw_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('juw_token');
      localStorage.removeItem('juw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;