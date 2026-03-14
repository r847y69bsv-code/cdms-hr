'use client';

import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { isAuthenticated } from '@/app/utils/auth';
import { IUser } from '@/types/app';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
    const [user, setUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const authData = isAuthenticated();
        if (authData && authData.user) {
            setUser(authData.user);
        }
        setLoading(false);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const isAdmin = () => {
        return user?.roles?.some(role => role.name === 'admin');
    };

    const hasPermission = (permissions: string[]): boolean => {
        if (!user) return false;
        if (isAdmin()) return true;

        const userPerms = user.permission || user.permissions || [];
        return permissions.some(p => userPerms.includes(p));
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <h2>{getGreeting()}, {user?.name || 'Utilizador'}</h2>
                    <p className="text-600">Bem-vindo ao Sistema de Avaliação de Desempenho da Cornelder de Moçambique</p>
                </div>
            </div>

            {hasPermission(['criar autoavaliacao', 'acesso modulo-avaliacao']) && (
                <div className="col-12 lg:col-6 xl:col-3">
                    <Card className="mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Autoavaliação</span>
                                <div className="text-900 font-medium text-xl">Criar Nova</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-file-edit text-blue-500 text-xl"></i>
                            </div>
                        </div>
                        <Button label="Iniciar" icon="pi pi-arrow-right" className="p-button-text" onClick={() => router.push('/avaliacoes/nova')} />
                    </Card>
                </div>
            )}

            {hasPermission(['ver avaliacoes proprias', 'acesso modulo-avaliacao']) && (
                <div className="col-12 lg:col-6 xl:col-3">
                    <Card className="mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Histórico</span>
                                <div className="text-900 font-medium text-xl">As Minhas Avaliações</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-history text-orange-500 text-xl"></i>
                            </div>
                        </div>
                        <Button label="Ver" icon="pi pi-arrow-right" className="p-button-text" onClick={() => router.push('/avaliacoes/historico')} />
                    </Card>
                </div>
            )}

            {hasPermission(['acesso painel-avaliador', 'avaliar colaboradores']) && (
                <div className="col-12 lg:col-6 xl:col-3">
                    <Card className="mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Avaliador</span>
                                <div className="text-900 font-medium text-xl">Avaliações Pendentes</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-clock text-cyan-500 text-xl"></i>
                            </div>
                        </div>
                        <Button label="Ver" icon="pi pi-arrow-right" className="p-button-text" onClick={() => router.push('/avaliador/pendentes')} />
                    </Card>
                </div>
            )}

            {hasPermission(['acesso modulo-rh', 'gerir ciclos']) && (
                <div className="col-12 lg:col-6 xl:col-3">
                    <Card className="mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Recursos Humanos</span>
                                <div className="text-900 font-medium text-xl">Ciclos de Avaliação</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-calendar text-purple-500 text-xl"></i>
                            </div>
                        </div>
                        <Button label="Gerir" icon="pi pi-arrow-right" className="p-button-text" onClick={() => router.push('/rh/ciclos')} />
                    </Card>
                </div>
            )}

            {hasPermission(['acesso administracao', 'gerir utilizadores']) && (
                <div className="col-12 lg:col-6 xl:col-3">
                    <Card className="mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Administração</span>
                                <div className="text-900 font-medium text-xl">Gestão de Utilizadores</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-red-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-users text-red-500 text-xl"></i>
                            </div>
                        </div>
                        <Button label="Gerir" icon="pi pi-arrow-right" className="p-button-text" onClick={() => router.push('/admin/utilizadores')} />
                    </Card>
                </div>
            )}

            <div className="col-12">
                <Card title="Sobre o Sistema">
                    <p className="m-0 text-600 line-height-3">
                        O Sistema de Avaliação de Desempenho CDMS-HR digitaliza o processo de avaliação anual
                        definido na Ordem de Serviço N.º 13 de 2025, substituindo o actual fluxo baseado em Excel.
                    </p>
                    <p className="m-0 mt-3 text-600 line-height-3">
                        O sistema permite a gestão completa do ciclo de avaliação, desde a autoavaliação do trabalhador
                        até à aprovação final pelos Recursos Humanos, incluindo funcionalidades de contestação,
                        planos de melhoria e registos de reuniões One-on-One.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
