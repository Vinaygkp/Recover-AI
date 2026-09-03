import api from './api';
import { User, AuthResponse } from '../types';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Authentication login request failed', error);
      throw error;
    }
  },

  register: async (userData: { email: string; password: string; full_name: string; company_name?: string }): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Authentication registration request failed', error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve current authenticated user', error);
      throw error;
    }
  },
};