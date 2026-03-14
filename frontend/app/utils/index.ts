import { IUser } from '@/types/app';
import { getCookie, setCookie } from 'cookies-next';

export const dateformat = (date: string | number | Date | undefined, dateStyle: 'full' | 'long' | 'medium' | 'short', timeStyle?: 'long' | 'medium' | 'short') => {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
        dateStyle,
        timeZone: 'Africa/Maputo',
    };

    if (timeStyle) {
        options.timeStyle = timeStyle;
    }

    return new Intl.DateTimeFormat('pt-PT', options).format(new Date(date));
};

export const getLocale = () => {
    let locale: string | null = '';
    if (typeof window !== 'undefined') {
        locale = getCookie('locale') as string | null;
    }
    return locale || 'pt';
};

export const setLocale = (locale: string) => {
    if (typeof window !== 'undefined') {
        setCookie('locale', locale);
    }
};

/**
 * Verificar se o utilizador tem as permissões necessárias
 */
export const hasPermission = (user: IUser | any, requiredPermissions: string[]): boolean => {
    try {
        if (!user) return false;

        // Admin tem acesso total
        if (user.roles && Array.isArray(user.roles)) {
            const isAdmin = user.roles.some((role: any) => role.name === 'admin');
            if (isAdmin) return true;
        }

        // Verificar permissões - o campo pode ser 'permission' ou 'permissions'
        const userPermissions = user.permission || user.permissions;

        if (!userPermissions || !Array.isArray(userPermissions)) {
            return false;
        }

        return requiredPermissions.some(requiredPermission =>
            userPermissions.includes(requiredPermission)
        );
    } catch (exception) {
        console.error('Error checking permissions:', exception);
        return false;
    }
};

/**
 * Obter cor para estado de avaliação
 */
export const getEstadoAvaliacaoColor = (estado: string): string => {
    switch (estado) {
        case 'rascunho':
            return '#64748B';
        case 'auto_submetida':
            return '#3B82F6';
        case 'aval_rascunho':
            return '#F59E0B';
        case 'aval_submetida':
            return '#10B981';
        case 'rev_departamento':
            return '#8B5CF6';
        case 'rev_rh':
            return '#EC4899';
        case 'aprovada':
            return '#22C55E';
        case 'feedback_feito':
            return '#06B6D4';
        case 'contestada':
            return '#EF4444';
        default:
            return '#6B7280';
    }
};

/**
 * Obter label para estado de avaliação
 */
export const getEstadoAvaliacaoLabel = (estado: string): string => {
    const labels: Record<string, string> = {
        'rascunho': 'Rascunho',
        'auto_submetida': 'Autoavaliação Submetida',
        'aval_rascunho': 'Avaliação em Rascunho',
        'aval_submetida': 'Avaliação Submetida',
        'rev_departamento': 'Em Revisão Departamental',
        'rev_rh': 'Em Revisão RH',
        'aprovada': 'Aprovada',
        'feedback_feito': 'Feedback Realizado',
        'contestada': 'Contestada',
    };
    return labels[estado] || estado;
};

/**
 * Obter classificação baseada na pontuação
 */
export const getClassificacao = (pontuacao: number): string => {
    if (pontuacao >= 4.5) return 'Excelente';
    if (pontuacao >= 3.5) return 'Muito Bom';
    if (pontuacao >= 2.5) return 'Bom';
    if (pontuacao >= 1.5) return 'Regular';
    return 'Insuficiente';
};

/**
 * Obter cor para classificação
 */
export const getClassificacaoColor = (classificacao: string): string => {
    switch (classificacao) {
        case 'Excelente':
            return '#22C55E';
        case 'Muito Bom':
            return '#10B981';
        case 'Bom':
            return '#3B82F6';
        case 'Regular':
            return '#F59E0B';
        case 'Insuficiente':
            return '#EF4444';
        default:
            return '#6B7280';
    }
};
