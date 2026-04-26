/**
 * API utility - Configured axios instance for making HTTP requests to the backend.
 * Automatically includes authentication tokens in requests.
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './constants';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL
});

// Request interceptor to add authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
