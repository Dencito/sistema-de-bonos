import axios from '@/Utils/axios';

import countries from '@utils/countries.json';
import { getCompanyFromUrl } from '@utils/helpers';

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

const getCompanyPath = (path) => {
  const company = window.location.pathname.split('/')[1];
  return `/${company}${path}`;
};

export const userService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/users'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/users/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/users/${id}`))),
  clearFingerprints: (id) => handleResponse(axios.delete(getCompanyPath(`/users/${id}/fingerprints`))),
  filterByBonus: (params) => handleResponse(axios.get(getCompanyPath('/api/users/filter-by-bonus'), { params })),
  searchPlayers: (params) => handleResponse(axios.get(getCompanyPath('/api/users/search-players'), { params })),
};

export const companyService = {
  getSelected: () => handleResponse(axios.get(getCompanyPath('/companies/selected'))),
  create: (values) => handleResponse(axios.post(getCompanyPath('/companies'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/companies/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/companies/${id}`))),
  changeDb: (id) => handleResponse(axios.post(getCompanyPath(`/companies/change-db/${id}`))),
};

export const branchService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/branches'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/branches/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/branches/${id}`))),
  requestMore: (values) => handleResponse(axios.post(getCompanyPath('/branches/request_more_branches'), values)),
};

export const categoryBonusService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/categories-bonus'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/categories-bonus/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/categories-bonus/${id}`))),
  assignMultipleUsers: (users, categoryBonusId) =>
    handleResponse(
      axios.post(getCompanyPath('/categories-bonus/assign-multiple-users'), {
        users,
        category_bonus_id: categoryBonusId,
      }),
    ),
};

export const bonusService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/bonuses'), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/bonuses/${id}`))),
  createMultiple: (values) => handleResponse(axios.post(getCompanyPath('/bonuses/create-multiple'), values)),
  assignMultipleUsers: (users, bonusId) =>
    handleResponse(
      axios.post(getCompanyPath('/bonuses/assign-multiple-users'), {
        users,
        bonus_id: bonusId,
      }),
    ),
  destroyMultipleUsers: (users, bonusId) =>
    handleResponse(
      axios.post(getCompanyPath('/bonuses/destroy-multiple-users'), {
        users,
        bonus_id: bonusId,
      }),
    ),
};

export const roleService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/roles'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/roles/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/roles/${id}`))),
};

export const productService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/products'), values)),
  update: (id, values) => handleResponse(axios.put(getCompanyPath(`/products/${id}`), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/products/${id}`))),
};

export const orderService = {
  create: (values) => handleResponse(axios.post(getCompanyPath('/orders'), values)),
  delete: (id) => handleResponse(axios.delete(getCompanyPath(`/orders/${id}`))),
  withdraw: (values) => handleResponse(axios.post(getCompanyPath('/orders/withdraw'), values)),
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
    return handleResponse(axios.post(getCompanyPath('/login'), values));
  },
};
