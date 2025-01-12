import axios from 'axios';
import CryptoJS from 'crypto-js';
import {
    VITE_COUNTRIES_API_URL,
    VITE_COUNTRIES_API_KEY,
    VITE_PASSWORD_ENCRYPTION_KEY,
} from '@utils/env';

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
        const errorMessage =
            error.response?.data?.message || 'Error en la operación';
        return { success: false, message: errorMessage };
    }
};

export const userService = {
    create: (values) => handleResponse(axios.post('/users', values)),
    update: (id, values) => handleResponse(axios.put(`/users/${id}`, values)),
    delete: (id) => handleResponse(axios.delete(`/users/${id}`)),
};

export const companyService = {
    getSelected: () => handleResponse(axios.get('/companies/selected')),
    create: (values) => handleResponse(axios.post('/companies', values)),
    update: (id, values) =>
        handleResponse(axios.put(`/companies/${id}`, values)),
    delete: (id) => handleResponse(axios.delete(`/companies/${id}`)),
    changeDb: (id) => handleResponse(axios.post(`/companies/change-db/${id}`)),
};

export const branchService = {
    create: (values) => handleResponse(axios.post('/branches', values)),
    update: (id, values) =>
        handleResponse(axios.put(`/branches/${id}`, values)),
    delete: (id) => handleResponse(axios.delete(`/branches/${id}`)),
    requestMore: (values) =>
        handleResponse(axios.post('/branches/request_more_branches', values)),
};

export const categoryBonusService = {
    create: (values) => handleResponse(axios.post('/categories-bonus', values)),
    update: (id, values) =>
        handleResponse(axios.put(`/categories-bonus/${id}`, values)),
    delete: (id) => handleResponse(axios.delete(`/categories-bonus/${id}`)),
    assignMultipleUsers: (users, categoryBonusId) =>
        handleResponse(
            axios.post('/categories-bonus/assign-multiple-users', {
                users,
                category_bonus_id: categoryBonusId,
            })
        ),
};

export const bonusService = {
    create: (values) => handleResponse(axios.post('/bonuses', values)),
    assignMultipleUsers: (users, bonusId) =>
        handleResponse(
            axios.post('/bonuses/assign-multiple-users', {
                users,
                bonus_id: bonusId,
            })
        ),
    destroyMultipleUsers: (users, bonusId) =>
        handleResponse(
            axios.post('/bonuses/destroy-multiple-users', {
                users,
                bonus_id: bonusId,
            })
        ),
};

export const roleService = {
    create: (values) => handleResponse(axios.post('/roles', values)),
    update: (id, values) => handleResponse(axios.put(`/roles/${id}`, values)),
    delete: (id) => handleResponse(axios.delete(`/roles/${id}`)),
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

export const authService = {
    register: (values) => handleResponse(axios.post('/users/owner', values)),
    login: (values) => {
        const iv = CryptoJS.lib.WordArray.random(16);
        const key = CryptoJS.enc.Utf8.parse(VITE_PASSWORD_ENCRYPTION_KEY);

        const encrypted = CryptoJS.AES.encrypt(values.password, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const ivAndCiphertext = iv.concat(encrypted.ciphertext);
        const encryptedPassword =
            CryptoJS.enc.Base64.stringify(ivAndCiphertext);
        const encryptedValues = { ...values, password: encryptedPassword };
        return handleResponse(axios.post('/login', encryptedValues));
    },
};
