'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { api } from '@/app/api';
import { IAvaliacao, IItemAvaliacao } from '@/types/app';
import FormularioAvaliacao from '@/app/components/FormularioAvaliacao';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function AvaliarPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const avaliacaoId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [avaliacao, setAvaliacao] = useState<IAvaliacao | null>(null);
    const [iniciando, setIniciando] = useState(false);

    useEffect(() => {
        if (avaliacaoId) {
            carregarAvaliacao();
        }
    }, [avaliacaoId]);

    const carregarAvaliacao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/avaliacoes/${avaliacaoId}`);
            const avaliacaoData = response.data.data;

            // Se o estado é 'auto_submetida', iniciar automaticamente
            if (avaliacaoData.estado === 'auto_submetida') {
                await iniciarAvaliacao(avaliacaoData);
            } else {
                setAvaliacao(avaliacaoData);
            }
        } catch (error: any) {
            console.error('Erro ao carregar avaliação:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar a avaliação.',
                life: 3000,
            });
            router.push('/avaliador/pendentes');
        } finally {
            setLoading(false);
        }
    };

    const iniciarAvaliacao = async (avaliacaoData: IAvaliacao) => {
        try {
            setIniciando(true);
            await api.post(`/avaliacoes/${avaliacaoData.id}/iniciar`);
            // Recarregar para obter o estado atualizado
            const response = await api.get(`/avaliacoes/${avaliacaoId}`);
            setAvaliacao(response.data.data);
        } catch (error: any) {
            console.error('Erro ao iniciar avaliação:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível iniciar a avaliação.',
                life: 3000,
            });
            router.push('/avaliador/pendentes');
        } finally {
            setIniciando(false);
        }
    };

    const handleSave = async (itens: IItemAvaliacao[], observacoes: string) => {
        const dados = {
            itens: itens.map(item => ({
                id: item.id,
                pontuacao_avaliador: item.pontuacao_avaliador,
                justificacao_avaliador: item.justificacao_avaliador,
            })),
            observacoes_avaliador: observacoes,
        };

        await api.put(`/avaliacoes/${avaliacaoId}`, dados);
        await carregarAvaliacao();
    };

    const handleSubmit = async () => {
        await api.post(`/avaliacoes/${avaliacaoId}/submeter`);
        toast.current?.show({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Avaliação submetida com sucesso!',
            life: 2000,
        });
        setTimeout(() => {
            router.push('/avaliador/equipa');
        }, 2000);
    };

    const handleCancel = () => {
        router.push('/avaliador/pendentes');
    };

    if (loading || iniciando) {
        return (
            <RestrictedRoute requiredPermissions={['criar avaliacao']}>
                <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                    {iniciando && <p className="mt-3 text-500">A iniciar avaliação...</p>}
                </div>
            </RestrictedRoute>
        );
    }

    if (!avaliacao) {
        return (
            <RestrictedRoute requiredPermissions={['criar avaliacao']}>
                <div className="p-4">
                    <Card className="text-center py-6">
                        <i className="pi pi-exclamation-circle text-4xl text-orange-500 mb-3" />
                        <h4 className="mt-0">Avaliação não encontrada</h4>
                        <Button
                            label="Voltar"
                            icon="pi pi-arrow-left"
                            onClick={() => router.push('/avaliador/pendentes')}
                        />
                    </Card>
                </div>
            </RestrictedRoute>
        );
    }

    // Verificar se a avaliação está no estado correcto para ser avaliada
    const podeAvaliar = ['auto_submetida', 'aval_rascunho'].includes(avaliacao.estado);

    if (!podeAvaliar) {
        return (
            <RestrictedRoute requiredPermissions={['criar avaliacao']}>
                <div className="p-4">
                    <Toast ref={toast} />
                    <Card className="text-center py-6">
                        <i className="pi pi-lock text-4xl text-500 mb-3" />
                        <h4 className="mt-0">Esta avaliação não está disponível para edição</h4>
                        <p className="text-500">
                            Estado actual: <Tag value={avaliacao.estado.replace('_', ' ').toUpperCase()} />
                        </p>
                        <Button
                            label="Ver Detalhes"
                            icon="pi pi-eye"
                            className="mr-2"
                            onClick={() => router.push(`/avaliacoes/${avaliacaoId}`)}
                        />
                        <Button
                            label="Voltar"
                            icon="pi pi-arrow-left"
                            className="p-button-outlined"
                            onClick={() => router.push('/avaliador/equipa')}
                        />
                    </Card>
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['criar avaliacao']}>
            <div className="p-4">
                <Toast ref={toast} />

                {/* Informações do Trabalhador */}
                <Card className="mb-4">
                    <div className="flex flex-column md:flex-row gap-4">
                        <div className="flex align-items-center gap-3">
                            <div className="w-4rem h-4rem bg-primary border-circle flex align-items-center justify-content-center text-white text-2xl font-bold">
                                {avaliacao.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="m-0">{avaliacao.trabalhador?.nome_completo}</h3>
                                <p className="text-500 m-0">{avaliacao.trabalhador?.cargo}</p>
                            </div>
                        </div>
                        <Divider layout="vertical" className="hidden md:block" />
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <span className="text-500 text-sm block">Departamento</span>
                                <span className="font-semibold">{avaliacao.trabalhador?.departamento}</span>
                            </div>
                            <div>
                                <span className="text-500 text-sm block">N.º Funcionário</span>
                                <span className="font-semibold">{avaliacao.trabalhador?.numero_funcionario}</span>
                            </div>
                            <div>
                                <span className="text-500 text-sm block">Categoria</span>
                                <Tag value={avaliacao.trabalhador?.categoria?.replace('_', ' ').toUpperCase()} />
                            </div>
                        </div>
                    </div>

                    {/* Pontuação da Autoavaliação */}
                    {avaliacao.pontuacao_auto && (
                        <>
                            <Divider />
                            <div className="flex align-items-center gap-3">
                                <i className="pi pi-user text-2xl text-primary" />
                                <div>
                                    <span className="text-500 text-sm block">Autoavaliação do Trabalhador</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {avaliacao.pontuacao_auto.toFixed(2)}
                                    </span>
                                    <span className="text-500 ml-2">/ 5.00</span>
                                </div>
                            </div>
                        </>
                    )}
                </Card>

                {/* Formulário de Avaliação */}
                <FormularioAvaliacao
                    avaliacao={avaliacao}
                    modo="avaliacao"
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </RestrictedRoute>
    );
}
