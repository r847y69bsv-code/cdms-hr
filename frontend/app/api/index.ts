import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';

export const API_HOST = process.env.NEXT_PUBLIC_API_HOST;
export const API_HOST_FILES = process.env.NEXT_PUBLIC_STORAGE_HOST + '/';
export const API = API_HOST + '/api';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

export const api = axios.create({
    baseURL: API,
});

// Request interceptor - always get fresh token from cookie
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined' && hasCookie('cdmshr_userjwt')) {
            try {
                const jwtData = JSON.parse(getCookie('cdmshr_userjwt') as string);
                if (jwtData?.token) {
                    config.headers.Authorization = `Bearer ${jwtData.token}`;
                }
            } catch (e) {
                console.error('Error parsing JWT cookie:', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined') {
            if (error.response?.status === 302) {
                // Password expired
                window.location.href = `${BASE_PATH || ''}/user/profile`;
            } else if (error.response?.status === 401 && error.response?.config.url !== '/login') {
                // Unauthenticated - redirect to login
                import('../utils/auth').then(({ signout }) => {
                    signout(() => (window.location.href = `${BASE_PATH || ''}/auth/login`));
                });
            } else if (error.response?.status >= 500 && process.env.NODE_ENV === 'production') {
                window.location.href = `${BASE_PATH || ''}/auth/error`;
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const login = async (data: { email: string; password: string }) => {
    try {
        const res = await api.post('/login', data);
        return res;
    } catch (err: any) {
        return err?.response?.data;
    }
};

export const logout = async () => {
    try {
        const res = await api.post('/logout');
        return res.data;
    } catch (err: any) {
        return err?.response?.data;
    }
};

export const updatePassword = async (data: { old_password: string; new_password: string; new_password_confirmation: string }) => {
    try {
        const res = await api.post('/updatepassword', data);
        return res.data;
    } catch (err: any) {
        return err?.response?.data;
    }
};

export const getMe = async () => {
    try {
        const res = await api.get('/me');
        return res.data;
    } catch (err: any) {
        return err?.response?.data;
    }
};
