'use client';

import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { isAuthenticated } from '@/app/utils/auth';
import { IUser } from '@/types/app';

const ProfilePage = () => {
    const [user, setUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const authData = isAuthenticated();
        if (authData && authData.user) {
            setUser(authData.user);
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="card">
                <p>Utilizador não encontrado.</p>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="grid">
            <div className="col-12">
                <Card>
                    <div className="flex flex-column md:flex-row align-items-center gap-4">
                        <Avatar
                            label={getInitials(user.name || 'U')}
                            size="xlarge"
                            shape="circle"
                            style={{ backgroundColor: '#3B82F6', color: '#ffffff', width: '6rem', height: '6rem', fontSize: '2rem' }}
                        />
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="m-0 mb-2">{user.name}</h2>
                            <p className="text-600 m-0">{user.email}</p>
                            <div className="mt-3 flex flex-wrap gap-2 justify-content-center md:justify-content-start">
                                {user.roles?.map((role, index) => (
                                    <Tag
                                        key={index}
                                        value={role.name}
                                        severity={role.name === 'admin' ? 'danger' : 'info'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="col-12 md:col-6">
                <Card title="Informações do Perfil">
                    <div className="flex flex-column gap-3">
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-500">Nome Completo</span>
                            <span className="font-medium">{user.name || '-'}</span>
                        </div>
                        <Divider className="my-1" />
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-500">Email</span>
                            <span className="font-medium">{user.email || '-'}</span>
                        </div>
                        <Divider className="my-1" />
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-500">Utilizador</span>
                            <span className="font-medium">{user.name || '-'}</span>
                        </div>
                        <Divider className="my-1" />
                        <div className="flex justify-content-between align-items-center">
                            <span className="text-500">ID</span>
                            <span className="font-medium">{user.id || '-'}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="col-12 md:col-6">
                <Card title="Permissões">
                    <div className="flex flex-wrap gap-2">
                        {(user.permission || user.permissions || []).length > 0 ? (
                            (user.permission || user.permissions || []).map((perm, index) => (
                                <Tag key={index} value={perm} severity="secondary" />
                            ))
                        ) : (
                            <p className="text-500 m-0">
                                {user.roles?.some(r => r.name === 'admin')
                                    ? 'Administrador - Acesso Total'
                                    : 'Nenhuma permissão atribuída'
                                }
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
