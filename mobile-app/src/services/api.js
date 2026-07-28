import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

// Function to get dynamic API URL based on company configuration
const getApiUrl = async () => {
  //remove later
  //return "http://127.0.0.1:8000/api/mobile";
  try {
    const { value: companyName } = await Preferences.get({ key: 'company_name' });
    if (companyName) {
      return `https://${companyName}.rentamania.cl/api/mobile`;
    }
  } catch (error) {
    console.error('Error getting company name:', error);
  }
  // Fallback to env variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/mobile';
};

export const getBaseUrl = async () => {
  const apiUrl = await getApiUrl();
  return apiUrl.replace(/\/api\/mobile$/, '');
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    // Set dynamic baseURL for each request
    config.baseURL = await getApiUrl();
    
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

  // Todas las transacciones de la pasillera van por la API de pasillera:
  // suman a los totales del turno y descuentan de su propio saldo, sin tocar la caja.
  registerTransaction: async (formData) => {
    const response = await api.post('/pasillera/transaction', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateTransaction: async (id, data) => {
    const response = await api.put(`/pasillera/transaction/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/pasillera/transaction/${id}`);
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
