'use client';

import React, { useEffect, useState } from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { AppMenuItem } from '@/types';
import { isAuthenticated } from '@/app/utils/auth';
import { IUser } from '@/types/app';

const AppMenu = () => {
    const [filteredMenu, setFilteredMenu] = useState<AppMenuItem[]>([]);
    const [mounted, setMounted] = useState(false);

    const model: AppMenuItem[] = [
        {
            label: 'Início',
            items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' },
                { label: 'Notificações', icon: 'pi pi-fw pi-bell', to: '/notificacoes' },
            ]
        },
        {
            label: 'As Minhas Avaliações',
            items: [
                { label: 'Nova Autoavaliação', icon: 'pi pi-fw pi-file-edit', to: '/avaliacoes/nova', permissions: ['criar autoavaliacao'] },
                { label: 'O Meu Histórico', icon: 'pi pi-fw pi-history', to: '/avaliacoes/historico', permissions: ['ver avaliacoes proprias'] },
            ],
            permissions: ['acesso modulo-avaliacao']
        },
        {
            label: 'Painel do Avaliador',
            items: [
                { label: 'Avaliações Pendentes', icon: 'pi pi-fw pi-clock', to: '/avaliador/pendentes', permissions: ['acesso painel-avaliador'] },
                { label: 'A Minha Equipa', icon: 'pi pi-fw pi-users', to: '/avaliador/equipa', permissions: ['ver avaliacoes equipa'] },
                { label: 'Planos de Melhoria', icon: 'pi pi-fw pi-chart-line', to: '/avaliador/planos-melhoria', permissions: ['criar plano-melhoria'] },
                { label: 'Registos One-on-One', icon: 'pi pi-fw pi-comments', to: '/one-on-one', permissions: ['registar one-on-one'] },
            ],
            permissions: ['acesso painel-avaliador']
        },
        {
            label: 'Revisão Departamental',
            items: [
                { label: 'Aprovações', icon: 'pi pi-fw pi-check-circle', to: '/departamento/aprovacoes', permissions: ['acesso revisao-departamental'] },
                { label: 'Resumo Departamento', icon: 'pi pi-fw pi-chart-bar', to: '/departamento/resumo', permissions: ['ver resumo-departamento'] },
            ],
            permissions: ['acesso revisao-departamental']
        },
        {
            label: 'Módulo RH',
            items: [
                { label: 'Ciclos de Avaliação', icon: 'pi pi-fw pi-calendar', to: '/rh/ciclos', permissions: ['gerir ciclos'] },
                { label: 'Todas as Avaliações', icon: 'pi pi-fw pi-list', to: '/rh/todas-avaliacoes', permissions: ['ver todas-avaliacoes'] },
                { label: 'Contestações', icon: 'pi pi-fw pi-flag', to: '/rh/contestacoes', permissions: ['aprovar avaliacao-rh'] },
                { label: 'Relatórios', icon: 'pi pi-fw pi-file-pdf', to: '/rh/relatorios', permissions: ['gerar relatorios'] },
            ],
            permissions: ['acesso modulo-rh']
        },
        {
            label: 'Administração',
            items: [
                { label: 'Gestão de Utilizadores', icon: 'pi pi-fw pi-user-edit', to: '/admin/utilizadores', permissions: ['gerir utilizadores'] },
                { label: 'Papéis', icon: 'pi pi-fw pi-id-card', to: '/admin/roles', permissions: ['gerir roles'] },
                { label: 'Logs de Auditoria', icon: 'pi pi-fw pi-eye', to: '/admin/logs', permissions: ['ver logs-auditoria'] },
            ],
            permissions: ['acesso administracao']
        }
    ];

    useEffect(() => {
        setMounted(true);
        const authData = isAuthenticated();
        if (authData && authData.user) {
            const user: IUser = authData.user;
            const filtered = filterMenuByPermissions(model, user);
            setFilteredMenu(filtered);
        }
    }, []);

    const hasPermission = (user: IUser, requiredPermissions?: string[]): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;

        // Admin tem acesso total
        if (user.roles && user.roles.some(role => role.name === 'admin')) return true;

        const userPerms = user.permission || user.permissions || [];
        if (!Array.isArray(userPerms)) return false;

        return requiredPermissions.some(perm => userPerms.includes(perm));
    };

    const filterMenuByPermissions = (menu: AppMenuItem[], user: IUser): AppMenuItem[] => {
        return menu
            .filter(section => hasPermission(user, section.permissions))
            .map(section => {
                if (!section.items) return section;

                const filteredItems = section.items.filter(item =>
                    hasPermission(user, item.permissions)
                );

                return { ...section, items: filteredItems };
            })
            .filter(section => !section.items || section.items.length > 0);
    };

    // Não renderizar até estar montado no cliente
    if (!mounted) {
        return null;
    }

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {filteredMenu.map((item, i) => {
                    return !item?.separator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator" key={i}></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
