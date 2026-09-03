import { useState, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('recover_ai_user') || localStorage.getItem('recover_ai_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = sessionStorage.getItem('recover_ai_token') || localStorage.getItem('recover_ai_token');
      return !!token;
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const data = await authService.login(credentials);
      if (data && data.access_token && data.user) {
        sessionStorage.setItem('recover_ai_token', data.access_token);
        sessionStorage.setItem('recover_ai_user', JSON.stringify(data.user));
        localStorage.setItem('recover_ai_token', data.access_token);
        localStorage.setItem('recover_ai_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return data;
    } catch (error: unknown) {
      console.error('Login action failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: { email: string; password: string; full_name: string; company_name?: string }) => {
    try {
      setIsLoading(true);
      const data = await authService.register(userData);
      if (data && data.access_token && data.user) {
        sessionStorage.setItem('recover_ai_token', data.access_token);
        sessionStorage.setItem('recover_ai_user', JSON.stringify(data.user));
        localStorage.setItem('recover_ai_token', data.access_token);
        localStorage.setItem('recover_ai_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return data;
    } catch (error: unknown) {
      console.error('Registration action failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem('recover_ai_token');
      sessionStorage.removeItem('recover_ai_user');
      localStorage.removeItem('recover_ai_token');
      localStorage.removeItem('recover_ai_user');
    } catch (err: unknown) {
      console.error('Failed clearing session storage during logout:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  return { user, isAuthenticated, isLoading, login, register, logout };
}