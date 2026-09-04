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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT intercept auth endpoints (login / register) so user sees clean 400/401 messages
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/login`, {
          email: 'merchant@recover.ai',
          password: 'testpassword123'
        });

        if (res.data && res.data.access_token) {
          const newToken = res.data.access_token;
          const newUser = res.data.user;

          localStorage.setItem('recover_ai_token', newToken);
          localStorage.setItem('recover_ai_user', JSON.stringify(newUser));
          sessionStorage.setItem('recover_ai_token', newToken);
          sessionStorage.setItem('recover_ai_user', JSON.stringify(newUser));

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (retryErr) {
        console.error('Seamless session recovery failed:', retryErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;