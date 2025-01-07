import axios from 'axios';
import { VITE_COUNTRIES_API_URL, VITE_COUNTRIES_API_KEY } from '@utils/env';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

export const userService = {
    login: (values) => axios.post('/users/owner', values),
    update: (id, values) => axios.put(`/users/${id}`, values),
    delete: (id) => axios.delete(`/users/${id}`),
    create: (values) => axios.post('/users', values),
};

export const companyService = {
    getSelected: () => axios.get('/companies/selected'),
    create: (values) => axios.post('/companies', values),
    update: (id, values) => axios.put('/companies', { id, ...values }),
    delete: (id) => axios.delete(`/companies/${id}`),
    changeDb: (id) => axios.post(`/companies/change-db/${id}`),
};

export const branchService = {
    create: (values) => axios.post('/branches', values),
    update: (values) => axios.put('/branches', values),
    delete: (id) => axios.delete(`/branches/${id}`),
};

export const categoryBonusService = {
    create: (values) => axios.post('/categories-bonus', values),
    update: (id, values) => axios.put(`/categories-bonus/${id}`, values),
    delete: (id) => axios.delete(`/categories-bonus/${id}`),
    assignMultipleUsers: (users, categoryBonusId) =>
        axios.post('/categories-bonus/assign-multiple-users', {
            users,
            category_bonus_id: categoryBonusId,
        }),
};

export const bonusService = {
    create: (values) => axios.post('/bonuses', values),
    assignMultipleUsers: (users, bonusId) =>
        axios.post('/bonuses/assign-multiple-users', {
            users,
            bonus_id: bonusId,
        }),
    destroyMultipleUsers: (users, bonusId) =>
        axios.post('/bonuses/destroy-multiple-users', {
            users,
            bonus_id: bonusId,
        }),
};

export const countriesService = {
    getAll: () =>
        fetch(`${VITE_COUNTRIES_API_URL}/countries`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${VITE_COUNTRIES_API_KEY}`,
            },
        }).then((res) => res.json()),

    getStates: (country) =>
        fetch(`${VITE_COUNTRIES_API_URL}/countries/${country}/states`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${VITE_COUNTRIES_API_KEY}`,
            },
        }).then((res) => res.json()),
};
