'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/app/api';
import { INotification } from '@/types/app';
import { isAuthenticated } from '@/app/utils/auth';

interface NotificationContextType {
    notifications: INotification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        const auth = isAuthenticated();
        if (!auth) return;

        try {
            setLoading(true);
            const response = await api.get('/notificacoes');
            const data = response.data.data || [];
            setNotifications(data);
            setUnreadCount(data.filter((n: INotification) => !n.read_at).length);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.post(`/notificacoes/${id}/marcar-lida`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.post('/notificacoes/marcar-todas-lidas');
            setNotifications(prev =>
                prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas notificações como lidas:', error);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        try {
            await api.delete(`/notificacoes/${id}`);
            setNotifications(prev => {
                const notification = prev.find(n => n.id === id);
                if (notification && !notification.read_at) {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n.id !== id);
            });
        } catch (error) {
            console.error('Erro ao eliminar notificação:', error);
        }
    }, []);

    // Carregar notificações ao montar e a cada 60 segundos
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
