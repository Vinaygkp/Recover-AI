import axios from 'axios';

// Centralized API Base URL resolved safely from Vite environment variables
const getBaseUrl = (): string => {
  try {
    const env = (import.meta as any)?.env;
    if (env) {
      const baseUrl = env.VITE_API_BASE_URL || env.VITE_API_URL;
      if (baseUrl) {
        const cleanBase = baseUrl.replace(/\/$/, '');
        return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
      }
    }
  } catch (err) {
    console.error('Error resolving API base URL environment variable:', err);
  }
  
  // Production fallback directly pointing to the live Render backend
  return 'https://recover-ai-gyiv.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token securely
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('recover_ai_token') || sessionStorage.getItem('recover_ai_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to retrieve authentication token', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized cleanly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    // If unauthorized and not an auth route, clear stale tokens and redirect to login
    if (error.response?.status === 401 && !isAuthEndpoint) {
      try {
        localStorage.removeItem('recover_ai_token');
        localStorage.removeItem('recover_ai_user');
        sessionStorage.removeItem('recover_ai_token');
        sessionStorage.removeItem('recover_ai_user');
        
        // Prevent infinite loops and redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Failed to handle session expiration', err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;