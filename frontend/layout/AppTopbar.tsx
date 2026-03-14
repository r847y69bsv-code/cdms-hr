/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { signout } from '@/app/utils/auth';
import { useRouter } from 'next/navigation';
import { BASE_PATH } from '@/app/api';
import NotificationBell from '@/app/components/NotificationBell';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const router = useRouter();

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));

    return (
        <div className="layout-topbar">
            <Link href="/dashboard" className="layout-topbar-logo">
                <img src={`${BASE_PATH || ''}/layout/images/logo.svg`} height="32" alt="logo" />
                <span style={{ fontSize: '22px' }}>CDMS-HR</span>
            </Link>

            <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                <i className="pi pi-bars" />
            </button>

            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>

            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <NotificationBell />
                <button type="button" onClick={() => router.push('/user/profile')} className="p-link layout-topbar-button">
                    <i className="pi pi-user"></i>
                    <span>Perfil</span>
                </button>
                <button onClick={() => signout(() => router.push('/auth/login'))} type="button" className="p-link layout-topbar-button">
                    <i className="pi pi-sign-out"></i>
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
