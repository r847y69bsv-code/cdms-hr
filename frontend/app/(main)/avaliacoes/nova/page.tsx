'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { api } from '@/app/api';
import { IAvaliacao, ICicloAvaliacao } from '@/types/app';
import FormularioAvaliacao from '@/app/components/FormularioAvaliacao';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function NovaAvaliacaoPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [cicloActivo, setCicloActivo] = useState<ICicloAvaliacao | null>(null);
    const [avaliacao, setAvaliacao] = useState<IAvaliacao | null>(null);
    const [avaliacaoExistente, setAvaliacaoExistente] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            setErro(null);

            // Buscar ciclo activo
            const cicloResponse = await api.get('/ciclo-activo');
            const ciclo = cicloResponse.data.data;

            if (!ciclo) {
                setErro('Não existe nenhum ciclo de avaliação activo no momento.');
                setLoading(false);
                return;
            }

            if (ciclo.estado !== 'autoavaliacao') {
                setErro('O ciclo actual não está em período de autoavaliação.');
                setLoading(false);
                return;
            }

            setCicloActivo(ciclo);

            // Verificar se já existe avaliação
            const avaliacoesResponse = await api.get('/avaliacoes/minhas');
            const minhasAvaliacoes = avaliacoesResponse.data.data || [];

            const avaliacaoActual = minhasAvaliacoes.find(
                (av: IAvaliacao) => av.ciclo_id === ciclo.id
            );

            if (avaliacaoActual) {
                setAvaliacaoExistente(true);
                // Buscar detalhes completos da avaliação
                const detalhesResponse = await api.get(`/avaliacoes/${avaliacaoActual.id}`);
                setAvaliacao(detalhesResponse.data.data);
            } else {
                // Criar nova avaliação
                const novaResponse = await api.post('/avaliacoes', { ciclo_id: ciclo.id });
                const detalhesResponse = await api.get(`/avaliacoes/${novaResponse.data.data.id}`);
                setAvaliacao(detalhesResponse.data.data);
            }
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            setErro(error.response?.data?.message || 'Erro ao carregar dados da avaliação.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (itens: any[], observacoes: string) => {
        if (!avaliacao) return;

        await api.put(`/avaliacoes/${avaliacao.id}`, {
            itens: itens.map(item => ({
                id: item.id,
                pontuacao_auto: item.pontuacao_auto,
                justificacao_auto: item.justificacao_auto,
            })),
            observacoes_trabalhador: observacoes,
        });

        // Recarregar avaliação
        const response = await api.get(`/avaliacoes/${avaliacao.id}`);
        setAvaliacao(response.data.data);
    };

    const handleSubmit = async () => {
        if (!avaliacao) return;

        await api.post(`/avaliacoes/${avaliacao.id}/submeter-auto`);

        toast.current?.show({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Autoavaliação submetida com sucesso!',
            life: 3000,
        });

        // Redirecionar para o histórico
        setTimeout(() => {
            router.push('/avaliacoes/historico');
        }, 2000);
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    if (erro) {
        return (
            <RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
                <div className="p-4">
                    <Card>
                        <div className="text-center py-6">
                            <i className="pi pi-info-circle text-4xl text-blue-500 mb-3" />
                            <h3 className="mt-0">{erro}</h3>
                            <Button
                                label="Voltar ao Dashboard"
                                icon="pi pi-arrow-left"
                                onClick={() => router.push('/dashboard')}
                                className="mt-3"
                            />
                        </div>
                    </Card>
                </div>
            </RestrictedRoute>
        );
    }

    if (!avaliacao || !cicloActivo) {
        return (
            <RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
                <div className="p-4">
                    <Message severity="error" text="Não foi possível carregar a avaliação." className="w-full" />
                </div>
            </RestrictedRoute>
        );
    }

    // Se a avaliação já foi submetida, mostrar mensagem
    if (avaliacao.estado !== 'rascunho') {
        return (
            <RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
                <div className="p-4">
                    <Card>
                        <div className="text-center py-6">
                            <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
                            <h3 className="mt-0">Autoavaliação já submetida</h3>
                            <p className="text-500">
                                A sua autoavaliação para o ciclo {cicloActivo.nome} já foi submetida.
                            </p>
                            <div className="flex justify-content-center gap-2 mt-4">
                                <Button
                                    label="Ver Detalhes"
                                    icon="pi pi-eye"
                                    onClick={() => router.push(`/avaliacoes/${avaliacao.id}`)}
                                />
                                <Button
                                    label="Ver Histórico"
                                    icon="pi pi-list"
                                    className="p-button-outlined"
                                    onClick={() => router.push('/avaliacoes/historico')}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['criar autoavaliacao']}>
            <div className="p-4">
                <Toast ref={toast} />

                {avaliacaoExistente && (
                    <Message
                        severity="info"
                        text="Tem uma autoavaliação em rascunho. Continue de onde parou."
                        className="w-full mb-4"
                    />
                )}

                <FormularioAvaliacao
                    avaliacao={avaliacao}
                    modo="autoavaliacao"
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </RestrictedRoute>
    );
}
