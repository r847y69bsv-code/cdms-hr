'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './utils/auth';
import { BASE_PATH } from './api';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated()) {
            router.push(`${BASE_PATH || ''}/dashboard`);
        } else {
            router.push(`${BASE_PATH || ''}/auth/login`);
        }
    }, [router]);

    return (
        <div className="flex align-items-center justify-content-center min-h-screen">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        </div>
    );
}
