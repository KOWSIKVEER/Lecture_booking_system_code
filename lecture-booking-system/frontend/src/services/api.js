import axios from 'axios';
import toast from 'react-hot-toast';

const isProduction = process.env.NODE_ENV === 'production';
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (isProduction ? 'https://lecture-booking-system-code.onrender.com/api' : 'http://localhost:5000/api'),
  timeout: 30000
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('Access denied.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
