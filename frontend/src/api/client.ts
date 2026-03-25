import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Do not reload the page if we are actively trying to log in or verify OTP
      if (error.config && !error.config.url?.includes('/auth/login') && !error.config.url?.includes('/auth/verify-otp')) {
        localStorage.removeItem('token');
        localStorage.removeItem('agent');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
