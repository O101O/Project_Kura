export const APP_ROUTES = {
  auth: '/auth',
  root: '/',
  dashboard: '/dashboard',
  chat: '/chat',
  contacts: '/contacts',
  settings: '/settings'
};

export const STORAGE_KEYS = {
  token: 'kura_token',
  theme: 'kura_theme'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
