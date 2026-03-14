'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { login, BASE_PATH } from '@/app/api';
import { authenticate, isAuthenticated } from '@/app/utils/auth';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (isAuthenticated()) {
            router.push(`${BASE_PATH || ''}/dashboard`);
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Campos obrigatórios',
                detail: 'Por favor preencha todos os campos',
                life: 3000
            });
            return;
        }

        setLoading(true);

        try {
            const response = await login({ email, password });

            if (response?.data) {
                authenticate(
                    {
                        token: response.data.access_token,
                        user: response.data.user
                    },
                    () => {
                        router.push(`${BASE_PATH || ''}/dashboard`);
                    }
                );
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Erro de autenticação',
                    detail: response?.message || 'Credenciais inválidas',
                    life: 3000
                });
            }
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Ocorreu um erro ao fazer login',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <Toast ref={toast} />
            <div className="flex flex-column align-items-center justify-content-center">
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <div className="text-900 text-3xl font-medium mb-3">CDMS-HR</div>
                            <span className="text-600 font-medium">Módulo de Avaliação de Desempenho</span>
                        </div>

                        <form onSubmit={handleLogin}>
                            <label htmlFor="email" className="block text-900 text-xl font-medium mb-2">
                                Email
                            </label>
                            <InputText
                                id="email"
                                type="email"
                                placeholder="Endereço de email"
                                className="w-full md:w-30rem mb-5"
                                style={{ padding: '1rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <label htmlFor="password" className="block text-900 font-medium text-xl mb-2">
                                Password
                            </label>
                            <Password
                                inputId="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                toggleMask
                                className="w-full mb-5"
                                inputClassName="w-full p-3 md:w-30rem"
                                feedback={false}
                            />

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                                <a
                                    className="font-medium no-underline ml-2 text-right cursor-pointer"
                                    style={{ color: 'var(--primary-color)' }}
                                    onClick={() => router.push('/auth/forgot-password')}
                                >
                                    Esqueceu a password?
                                </a>
                            </div>
                            <Button
                                label="Entrar"
                                className="w-full p-3 text-xl"
                                type="submit"
                                loading={loading}
                            />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
