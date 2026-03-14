'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNotifications } from '@/app/context/NotificationContext';
import { INotification } from '@/types/app';

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

// Formatar tempo relativo
const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
};

interface NotificationItemProps {
    notification: INotification;
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onClick: (notification: INotification) => void;
}

function NotificationItem({ notification, onRead, onDelete, onClick }: NotificationItemProps) {
    const isUnread = !notification.read_at;
    const tipo = notification.data.tipo;

    return (
        <div
            className={`flex gap-3 p-3 cursor-pointer hover:surface-100 border-round transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
            onClick={() => onClick(notification)}
        >
            <div
                className="w-2rem h-2rem border-circle flex align-items-center justify-content-center flex-shrink-0"
                style={{ backgroundColor: getNotificationColor(tipo) }}
            >
                <i className={`pi ${getNotificationIcon(tipo)} text-white text-sm`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-content-between align-items-start gap-2">
                    <span className={`text-sm ${isUnread ? 'font-bold' : ''}`}>
                        {notification.data.titulo || 'Notificação'}
                    </span>
                    <span className="text-xs text-500 white-space-nowrap">
                        {formatTimeAgo(notification.created_at)}
                    </span>
                </div>
                <p className="text-sm text-600 m-0 mt-1 overflow-hidden text-overflow-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {notification.data.mensagem || ''}
                </p>
            </div>
            <div className="flex flex-column gap-1">
                {isUnread && (
                    <Button
                        icon="pi pi-check"
                        className="p-button-rounded p-button-text p-button-sm p-button-success"
                        tooltip="Marcar como lida"
                        tooltipOptions={{ position: 'left' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRead(notification.id);
                        }}
                        style={{ width: '1.5rem', height: '1.5rem' }}
                    />
                )}
                <Button
                    icon="pi pi-times"
                    className="p-button-rounded p-button-text p-button-sm p-button-secondary"
                    tooltip="Eliminar"
                    tooltipOptions={{ position: 'left' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                    }}
                    style={{ width: '1.5rem', height: '1.5rem' }}
                />
            </div>
        </div>
    );
}

export default function NotificationBell() {
    const router = useRouter();
    const overlayRef = useRef<OverlayPanel>(null);
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const filteredNotifications = showUnreadOnly
        ? notifications.filter(n => !n.read_at)
        : notifications;

    const displayNotifications = filteredNotifications.slice(0, 10);

    const handleNotificationClick = (notification: INotification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        if (notification.data.link) {
            overlayRef.current?.hide();
            router.push(notification.data.link);
        }
    };

    const handleViewAll = () => {
        overlayRef.current?.hide();
        router.push('/notificacoes');
    };

    return (
        <>
            <button
                type="button"
                className="p-link layout-topbar-button p-overlay-badge"
                onClick={(e) => overlayRef.current?.toggle(e)}
            >
                <i className="pi pi-bell" />
                {unreadCount > 0 && (
                    <Badge
                        value={unreadCount > 99 ? '99+' : unreadCount}
                        severity="danger"
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            minWidth: '18px',
                            height: '18px',
                            fontSize: '10px',
                            lineHeight: '18px'
                        }}
                    />
                )}
                <span>Notificações</span>
            </button>

            <OverlayPanel
                ref={overlayRef}
                className="notification-panel"
                style={{ width: '380px' }}
                pt={{
                    content: { className: 'p-0' }
                }}
            >
                {/* Cabeçalho */}
                <div className="flex justify-content-between align-items-center p-3 border-bottom-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <span className="font-bold text-lg">Notificações</span>
                        {unreadCount > 0 && (
                            <Badge value={unreadCount} severity="danger" />
                        )}
                    </div>
                    <div className="flex gap-1">
                        <Button
                            icon={showUnreadOnly ? 'pi pi-eye' : 'pi pi-eye-slash'}
                            className="p-button-rounded p-button-text p-button-sm"
                            tooltip={showUnreadOnly ? 'Mostrar todas' : 'Mostrar não lidas'}
                            tooltipOptions={{ position: 'bottom' }}
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                        />
                        {unreadCount > 0 && (
                            <Button
                                icon="pi pi-check-circle"
                                className="p-button-rounded p-button-text p-button-sm"
                                tooltip="Marcar todas como lidas"
                                tooltipOptions={{ position: 'bottom' }}
                                onClick={markAllAsRead}
                            />
                        )}
                    </div>
                </div>

                {/* Lista de Notificações */}
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="flex justify-content-center align-items-center py-5">
                            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        </div>
                    ) : displayNotifications.length === 0 ? (
                        <div className="flex flex-column align-items-center justify-content-center py-5 text-500">
                            <i className="pi pi-inbox text-4xl mb-2" />
                            <span>{showUnreadOnly ? 'Sem notificações não lidas' : 'Sem notificações'}</span>
                        </div>
                    ) : (
                        displayNotifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                                {index > 0 && <Divider className="m-0" />}
                                <NotificationItem
                                    notification={notification}
                                    onRead={markAsRead}
                                    onDelete={deleteNotification}
                                    onClick={handleNotificationClick}
                                />
                            </React.Fragment>
                        ))
                    )}
                </div>

                {/* Rodapé */}
                {notifications.length > 0 && (
                    <>
                        <Divider className="m-0" />
                        <div className="p-3 text-center">
                            <Button
                                label="Ver todas as notificações"
                                className="p-button-text p-button-sm"
                                onClick={handleViewAll}
                            />
                        </div>
                    </>
                )}
            </OverlayPanel>
        </>
    );
}
