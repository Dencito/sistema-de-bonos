import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/mobile';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const { value: token } = await Preferences.get({ key: 'auth_token' });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'user_data' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/login', {
      username,
      password,
      device_name: 'mobile-app',
    });
    
    if (response.data.success) {
      await Preferences.set({
        key: 'auth_token',
        value: response.data.data.token,
      });
      await Preferences.set({
        key: 'user_data',
        value: JSON.stringify(response.data.data.user),
      });
    }
    
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await Preferences.remove({ key: 'auth_token' });
      await Preferences.remove({ key: 'user_data' });
    }
  },

  getMe: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  getStoredToken: async () => {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  },

  getStoredUser: async () => {
    const { value } = await Preferences.get({ key: 'user_data' });
    return value ? JSON.parse(value) : null;
  },
};

export const pasilleraService = {
  getMyActive: async () => {
    const response = await api.get('/pasillera/my-active');
    return response.data;
  },

  registerExpense: async (amount, machine, description = '') => {
    const response = await api.post('/pasillera/expense', {
      amount,
      machine,
      description,
    });
    return response.data;
  },

  getBalance: async () => {
    const response = await api.get('/pasillera/balance');
    return response.data;
  },

  getHistory: async (limit = 50) => {
    const response = await api.get(`/pasillera/history?limit=${limit}`);
    return response.data;
  },

  getMachines: async () => {
    const response = await api.get('/pasillera/machines');
    return response.data;
  },

  finalizeShift: async () => {
    const response = await api.post('/pasillera/finalize-shift');
    return response.data;
  },
};

export default api;
