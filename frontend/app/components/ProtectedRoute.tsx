'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../utils/auth';
import { BASE_PATH } from '../api';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push(`${BASE_PATH || ''}/auth/login`);
        }
    }, [router]);

    if (!isAuthenticated()) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
