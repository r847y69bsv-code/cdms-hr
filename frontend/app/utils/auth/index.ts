import { ILogin } from '@/types/app';
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next';
import { logout } from '../../api';

interface Callback {
    (): void;
}

export const isAuthenticated = () => {
    if (!hasCookie('cdmshr_userjwt')) return false;
    const jwtCookie = JSON.parse(getCookie('cdmshr_userjwt')!);
    return jwtCookie;
};

export const signout = async (callback: Callback) => {
    deleteCookie('cdmshr_userjwt');
    callback();
    await logout();
};

export const authenticate = (data: ILogin, callback?: Callback) => {
    try {
        setCookie('cdmshr_userjwt', JSON.stringify(data), {
            maxAge: 15 * 24 * 60 * 60, // 15 days
        });
        if (callback) callback();
    } catch (error) {
        console.error('Error setting cookie:', error);
    }
};

export const updateLocal = (login: ILogin) => {
    if (hasCookie('cdmshr_userjwt')) {
        const currentData = JSON.parse(getCookie('cdmshr_userjwt')!);
        authenticate({
            token: currentData.token,
            user: login.user
        });
    }
};

export const formatDate = (date_input: Date, options: { hour?: boolean; minute?: boolean; locale?: string }) => {
    const { hour, minute, locale } = options;
    const date = new Date(date_input);

    const formatter = new Intl.DateTimeFormat(locale || 'pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: hour ? '2-digit' : undefined,
        minute: minute ? '2-digit' : undefined,
    });

    return formatter.format(date);
};
