/**
 * Authentication context - Manages user authentication state and provides auth methods.
 * Handles login, register, logout, and user session persistence.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user session on app start
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (_error) {
        localStorage.removeItem(STORAGE_KEYS.token);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Login user
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(STORAGE_KEYS.token, data.token);
    setUser(data.user);
  };

  // Register new user
  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    localStorage.setItem(STORAGE_KEYS.token, data.token);
    setUser(data.user);
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    login,
    register,
    logout
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
