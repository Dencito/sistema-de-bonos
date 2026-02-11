import axios from 'axios';

import countries from '@utils/countries.json';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const handleResponse = async (promise) => {
  try {
    const response = await promise;
    return {
      success: true,
      message: response?.data?.message,
      data: response?.data,
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error en la operación';
    return { success: false, message: errorMessage };
  }
};

export const userService = {
  create: (values) => handleResponse(axios.post('/users', values)),
  update: (id, values) => handleResponse(axios.put(`/users/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/users/${id}`)),
  filterByBonus: (params) => handleResponse(axios.get('/api/users/filter-by-bonus', { params })),
};

export const companyService = {
  getSelected: () => handleResponse(axios.get('/companies/selected')),
  create: (values) => handleResponse(axios.post('/companies', values)),
  update: (id, values) => handleResponse(axios.put(`/companies/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/companies/${id}`)),
  changeDb: (id) => handleResponse(axios.post(`/companies/change-db/${id}`)),
};

export const branchService = {
  create: (values) => handleResponse(axios.post('/branches', values)),
  update: (id, values) => handleResponse(axios.put(`/branches/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/branches/${id}`)),
  requestMore: (values) => handleResponse(axios.post('/branches/request_more_branches', values)),
};

export const categoryBonusService = {
  create: (values) => handleResponse(axios.post('/categories-bonus', values)),
  update: (id, values) => handleResponse(axios.put(`/categories-bonus/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/categories-bonus/${id}`)),
  assignMultipleUsers: (users, categoryBonusId) =>
    handleResponse(
      axios.post('/categories-bonus/assign-multiple-users', {
        users,
        category_bonus_id: categoryBonusId,
      }),
    ),
};

export const bonusService = {
  create: (values) => handleResponse(axios.post('/bonuses', values)),
  delete: (id) => handleResponse(axios.delete(`/bonuses/${id}`)),
  createMultiple: (values) => handleResponse(axios.post('/bonuses/create-multiple', values)),
  assignMultipleUsers: (users, bonusId) =>
    handleResponse(
      axios.post('/bonuses/assign-multiple-users', {
        users,
        bonus_id: bonusId,
      }),
    ),
  destroyMultipleUsers: (users, bonusId) =>
    handleResponse(
      axios.post('/bonuses/destroy-multiple-users', {
        users,
        bonus_id: bonusId,
      }),
    ),
};

export const roleService = {
  create: (values) => handleResponse(axios.post('/roles', values)),
  update: (id, values) => handleResponse(axios.put(`/roles/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/roles/${id}`)),
};

export const productService = {
  create: (values) => handleResponse(axios.post('/products', values)),
  update: (id, values) => handleResponse(axios.put(`/products/${id}`, values)),
  delete: (id) => handleResponse(axios.delete(`/products/${id}`)),
};

export const orderService = {
  create: (values) => handleResponse(axios.post('/orders', values)),
  delete: (id) => handleResponse(axios.delete(`/orders/${id}`)),
  withdraw: (values) => handleResponse(axios.post('/orders/withdraw', values)),
};

export const countriesService = {
  getAll: () => countries.countries,

  getStates: (country) => {
    const c = countries?.countries.find((c) => c.name === country);
    return c?.provinces || c?.states || c?.parishes || c?.districts || [];
  },
};

export const authService = {
  register: (values) => handleResponse(axios.post('/users/owner', values)),
  login: (values) => {
    // Enviar las credenciales sin encriptar
    return handleResponse(axios.post('/login', values));
  },
};
