import type { Metadata } from 'next';
import { PrimeReactProvider } from 'primereact/api';

import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';

export const metadata: Metadata = {
    title: 'CDMS-HR | Avaliação de Desempenho',
    description: 'Módulo de Avaliação de Desempenho - Cornelder de Moçambique',
    icons: {
        icon: '/favicon.ico'
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt">
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet" />
            </head>
            <body>
                <PrimeReactProvider>
                    {children}
                </PrimeReactProvider>
            </body>
        </html>
    );
}
