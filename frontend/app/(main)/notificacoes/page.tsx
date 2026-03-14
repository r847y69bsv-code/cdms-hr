'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNotifications } from '@/app/context/NotificationContext';
import { INotification } from '@/types/app';
import { api } from '@/app/api';

// Ícones por tipo de notificação
const getNotificationIcon = (tipo?: string): string => {
    const icons: Record<string, string> = {
        avaliacao: 'pi-file-edit',
        aprovacao: 'pi-check-circle',
        contestacao: 'pi-exclamation-triangle',
        feedback: 'pi-comments',
        ciclo: 'pi-calendar',
        sistema: 'pi-cog',
        lembrete: 'pi-bell',
    };
    return icons[tipo || ''] || 'pi-bell';
};

// Cores por tipo de notificação
const getNotificationColor = (tipo?: string): string => {
    const colors: Record<string, string> = {
        avaliacao: '#3B82F6',
        aprovacao: '#22C55E',
        contestacao: '#F97316',
        feedback: '#8B5CF6',
        ciclo: '#6366F1',
        sistema: '#6B7280',
        lembrete: '#EAB308',
    };
    return colors[tipo || ''] || '#6B7280';
};

// Labels para tipos de notificação
const getNotificationLabel = (tipo?: string): string => {
    const labels: Record<string, string> = {
        avaliacao: 'Avaliação',
        aprovacao: 'Aprovação',
        contestacao: 'Contestação',
        feedback: 'Feedback',
        ciclo: 'Ciclo',
        sistema: 'Sistema',
        lembrete: 'Lembrete',
    };
    return labels[tipo || ''] || 'Notificação';
};

// Formatar data
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function NotificacoesPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications
    } = useNotifications();

    const [activeTab, setActiveTab] = useState(0);
    const [deleting, setDeleting] = useState(false);

    const unreadNotifications = notifications.filter(n => !n.read_at);
    const readNotifications = notifications.filter(n => n.read_at);

    const handleNotificationClick = async (notification: INotification) => {
        if (!notification.read_at) {
            await markAsRead(notification.id);
        }

        if (notification.data.link) {
            router.push(notification.data.link);
        }
    };

    const handleDeleteAll = () => {
        confirmDialog({
            message: 'Tem a certeza que deseja eliminar todas as notificações?',
            header: 'Confirmar Eliminação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setDeleting(true);
                try {
                    await api.delete('/notificacoes');
                    await fetchNotifications();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Todas as notificações foram eliminadas.',
                        life: 3000,
                    });
                } catch {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Não foi possível eliminar as notificações.',
                        life: 3000,
                    });
                } finally {
                    setDeleting(false);
                }
            }
        });
    };

    const renderNotificationCard = (notification: INotification) => {
        const tipo = notification.data.tipo;
        const isUnread = !notification.read_at;

        return (
            <Card
                key={notification.id}
                className={`mb-3 cursor-pointer ${isUnread ? 'border-left-3 border-primary' : ''}`}
                onClick={() => handleNotificationClick(notification)}
            >
                <div className="flex gap-3">
                    <div
                        className="w-3rem h-3rem border-circle flex align-items-center justify-content-center flex-shrink-0"
                        style={{ backgroundColor: getNotificationColor(tipo) }}
                    >
                        <i className={`pi ${getNotificationIcon(tipo)} text-white text-xl`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                            <div className="flex align-items-center gap-2">
                                <span className={`text-lg ${isUnread ? 'font-bold' : ''}`}>
                                    {notification.data.titulo || 'Notificação'}
                                </span>
                                <Tag
                                    value={getNotificationLabel(tipo)}
                                    style={{ backgroundColor: getNotificationColor(tipo) }}
                                    className="text-xs"
                                />
                                {isUnread && (
                                    <Tag value="Nova" severity="info" className="text-xs" />
                                )}
                            </div>
                            <span className="text-sm text-500">
                                {formatDate(notification.created_at)}
                            </span>
                        </div>
                        <p className="text-600 m-0 mb-3">
                            {notification.data.mensagem || ''}
                        </p>
                        <div className="flex justify-content-between align-items-center">
                            {notification.data.link && (
                                <Button
                                    label="Ver Detalhes"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    className="p-button-text p-button-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationClick(notification);
                                    }}
                                />
                            )}
                            <div className="flex gap-2 ml-auto">
                                {isUnread && (
                                    <Button
                                        icon="pi pi-check"
                                        className="p-button-rounded p-button-text p-button-sm p-button-success"
                                        tooltip="Marcar como lida"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                    />
                                )}
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-rounded p-button-text p-button-sm p-button-danger"
                                    tooltip="Eliminar"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const renderEmptyState = (message: string) => (
        <div className="flex flex-column align-items-center justify-content-center py-8 text-500">
            <i className="pi pi-inbox text-6xl mb-3" />
            <h4 className="m-0 mb-2">{message}</h4>
            <p className="m-0 text-center">
                As suas notificações aparecerão aqui quando houver actividade relevante.
            </p>
        </div>
    );

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0">Notificações</h2>
                    <p className="text-500 mt-1 mb-0">
                        Gerir as suas notificações e alertas
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            label="Marcar todas como lidas"
                            icon="pi pi-check-circle"
                            className="p-button-outlined"
                            onClick={markAllAsRead}
                        />
                    )}
                    {notifications.length > 0 && (
                        <Button
                            label="Eliminar todas"
                            icon="pi pi-trash"
                            className="p-button-outlined p-button-danger"
                            onClick={handleDeleteAll}
                            loading={deleting}
                        />
                    )}
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid mb-4">
                <div className="col-6 md:col-3">
                    <Card className="text-center">
                        <div className="text-500 text-sm mb-1">Total</div>
                        <div className="text-2xl font-bold text-primary">{notifications.length}</div>
                    </Card>
                </div>
                <div className="col-6 md:col-3">
                    <Card className="text-center">
                        <div className="text-500 text-sm mb-1">Não Lidas</div>
                        <div className="text-2xl font-bold text-orange-500">{unreadCount}</div>
                    </Card>
                </div>
                <div className="col-6 md:col-3">
                    <Card className="text-center">
                        <div className="text-500 text-sm mb-1">Lidas</div>
                        <div className="text-2xl font-bold text-green-500">{readNotifications.length}</div>
                    </Card>
                </div>
                <div className="col-6 md:col-3">
                    <Card className="text-center">
                        <div className="text-500 text-sm mb-1">Última Actualização</div>
                        <div className="text-sm font-bold text-blue-500">
                            {notifications.length > 0
                                ? formatDate(notifications[0].created_at)
                                : '-'
                            }
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tabs de notificações */}
            <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                <TabPanel
                    header={
                        <span className="flex align-items-center gap-2">
                            <span>Todas</span>
                            <Tag value={notifications.length} severity="info" className="text-xs" />
                        </span>
                    }
                >
                    {notifications.length === 0
                        ? renderEmptyState('Sem notificações')
                        : notifications.map(renderNotificationCard)
                    }
                </TabPanel>

                <TabPanel
                    header={
                        <span className="flex align-items-center gap-2">
                            <span>Não Lidas</span>
                            {unreadCount > 0 && (
                                <Tag value={unreadCount} severity="danger" className="text-xs" />
                            )}
                        </span>
                    }
                >
                    {unreadNotifications.length === 0
                        ? renderEmptyState('Sem notificações não lidas')
                        : unreadNotifications.map(renderNotificationCard)
                    }
                </TabPanel>

                <TabPanel header="Lidas">
                    {readNotifications.length === 0
                        ? renderEmptyState('Sem notificações lidas')
                        : readNotifications.map(renderNotificationCard)
                    }
                </TabPanel>
            </TabView>
        </div>
    );
}
