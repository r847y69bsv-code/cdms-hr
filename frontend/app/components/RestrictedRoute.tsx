'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../utils/auth';
import { hasPermission } from '../utils';
import { BASE_PATH } from '../api';
import { IUser } from '@/types/app';

interface RestrictedRouteProps {
    children: React.ReactNode;
    requiredPermissions: string[];
}

const RestrictedRoute = ({ children, requiredPermissions }: RestrictedRouteProps) => {
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const authData = isAuthenticated();

        if (!authData) {
            router.push(`${BASE_PATH || ''}/auth/login`);
            return;
        }

        const user: IUser = authData.user;
        const access = hasPermission(user, requiredPermissions);

        if (!access) {
            router.push(`${BASE_PATH || ''}/auth/access`);
            return;
        }

        setHasAccess(true);
    }, [router, requiredPermissions]);

    if (hasAccess === null) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }

    if (!hasAccess) {
        return null;
    }

    return <>{children}</>;
};

export default RestrictedRoute;
