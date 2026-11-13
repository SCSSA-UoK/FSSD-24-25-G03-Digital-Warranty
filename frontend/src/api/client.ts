import axios from 'axios';
import { mockAdapter } from '../mock/mockAdapter';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// By default, standalone mock backend is ENABLED so frontend works out of the box without any backend server.
// Set VITE_USE_MOCK='false' in .env if connecting to a real backend.
export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(IS_MOCK_MODE ? { adapter: mockAdapter } : {}),
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
