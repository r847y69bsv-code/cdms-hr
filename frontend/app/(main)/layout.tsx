'use client';

import React from 'react';
import Layout from '@/layout/layout';
import { LayoutProvider } from '@/layout/context/layoutcontext';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <ProtectedRoute>
            <LayoutProvider>
                <Layout>{children}</Layout>
            </LayoutProvider>
        </ProtectedRoute>
    );
}
