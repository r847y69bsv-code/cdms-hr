'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function AvaliacoesPendentesPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);

    useEffect(() => {
        carregarAvaliacoes();
    }, []);

    const carregarAvaliacoes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/avaliacoes/pendentes');
            setAvaliacoes(response.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar avaliações:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar as avaliações pendentes.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const trabalhadorTemplate = (rowData: IAvaliacao) => {
        return (
            <div className="flex align-items-center gap-3">
                <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center text-white font-bold">
                    {rowData.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-bold">{rowData.trabalhador?.nome_completo}</div>
                    <div className="text-500 text-sm">{rowData.trabalhador?.cargo}</div>
                </div>
            </div>
        );
    };

    const departamentoTemplate = (rowData: IAvaliacao) => {
        return (
            <span>{rowData.trabalhador?.departamento}</span>
        );
    };

    const estadoTemplate = (rowData: IAvaliacao) => {
        const isAutoSubmetida = rowData.estado === 'auto_submetida';

        return (
            <div className="flex align-items-center gap-2">
                <Tag
                    value={getEstadoAvaliacaoLabel(rowData.estado)}
                    style={{ backgroundColor: getEstadoAvaliacaoColor(rowData.estado) }}
                />
                {isAutoSubmetida && (
                    <Badge value="Novo" severity="danger" />
                )}
            </div>
        );
    };

    const pontuacaoAutoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.pontuacao_auto) {
            return <span className="text-500">-</span>;
        }

        return (
            <span className="font-bold">{rowData.pontuacao_auto.toFixed(2)}</span>
        );
    };

    const dataTemplate = (rowData: IAvaliacao) => {
        const data = rowData.data_submissao_auto;
        if (!data) return '-';

        const dataObj = new Date(data);
        const agora = new Date();
        const diasPassados = Math.floor((agora.getTime() - dataObj.getTime()) / (1000 * 60 * 60 * 24));

        return (
            <div>
                <div>{dataObj.toLocaleDateString('pt-PT')}</div>
                {diasPassados > 0 && (
                    <div className={`text-sm ${diasPassados > 5 ? 'text-orange-500' : 'text-500'}`}>
                        há {diasPassados} dias
                    </div>
                )}
            </div>
        );
    };

    const accoesTemplate = (rowData: IAvaliacao) => {
        const isAutoSubmetida = rowData.estado === 'auto_submetida';

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text"
                    tooltip="Ver Detalhes"
                    onClick={() => router.push(`/avaliacoes/${rowData.id}`)}
                />
                {isAutoSubmetida && (
                    <Button
                        label="Iniciar Avaliação"
                        icon="pi pi-play"
                        className="p-button-sm"
                        onClick={() => iniciarAvaliacao(rowData.id)}
                    />
                )}
                {rowData.estado === 'aval_rascunho' && (
                    <Button
                        label="Continuar"
                        icon="pi pi-pencil"
                        className="p-button-sm p-button-warning"
                        onClick={() => router.push(`/avaliador/avaliar/${rowData.id}`)}
                    />
                )}
            </div>
        );
    };

    const iniciarAvaliacao = async (avaliacaoId: number) => {
        try {
            await api.post(`/avaliacoes/${avaliacaoId}/iniciar`);
            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Avaliação iniciada com sucesso!',
                life: 2000,
            });
            router.push(`/avaliador/avaliar/${avaliacaoId}`);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível iniciar a avaliação.',
                life: 3000,
            });
        }
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['acesso painel-avaliador']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['acesso painel-avaliador']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Avaliações Pendentes</h2>
                        <p className="text-500 mt-1 mb-0">
                            Trabalhadores que aguardam a sua avaliação
                        </p>
                    </div>
                    <Button
                        label="Ver Equipa Completa"
                        icon="pi pi-users"
                        className="p-button-outlined"
                        onClick={() => router.push('/avaliador/equipa')}
                    />
                </div>

                {/* Resumo */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-blue-50">
                            <div className="text-500 mb-2">Aguardam Avaliação</div>
                            <div className="text-3xl font-bold text-blue-500">
                                {avaliacoes.filter(a => a.estado === 'auto_submetida').length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-orange-50">
                            <div className="text-500 mb-2">Em Progresso</div>
                            <div className="text-3xl font-bold text-orange-500">
                                {avaliacoes.filter(a => a.estado === 'aval_rascunho').length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-green-50">
                            <div className="text-500 mb-2">Total Pendente</div>
                            <div className="text-3xl font-bold text-green-500">
                                {avaliacoes.length}
                            </div>
                        </Card>
                    </div>
                </div>

                <Card>
                    {avaliacoes.length === 0 ? (
                        <div className="text-center py-6">
                            <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
                            <h4 className="text-500 mt-0">Tudo em dia!</h4>
                            <p className="text-500">
                                Não tem avaliações pendentes de momento.
                            </p>
                            <Button
                                label="Ver Histórico da Equipa"
                                icon="pi pi-users"
                                className="mt-3"
                                onClick={() => router.push('/avaliador/equipa')}
                            />
                        </div>
                    ) : (
                        <DataTable
                            value={avaliacoes}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            emptyMessage="Nenhuma avaliação pendente."
                            className="p-datatable-sm"
                            sortField="data_submissao_auto"
                            sortOrder={1}
                        >
                            <Column
                                header="Trabalhador"
                                body={trabalhadorTemplate}
                                sortable
                                sortField="trabalhador.nome_completo"
                            />
                            <Column
                                header="Departamento"
                                body={departamentoTemplate}
                                sortable
                                sortField="trabalhador.departamento"
                            />
                            <Column
                                header="Estado"
                                body={estadoTemplate}
                                sortable
                                sortField="estado"
                            />
                            <Column
                                header="Auto-Pont."
                                body={pontuacaoAutoTemplate}
                                sortable
                                sortField="pontuacao_auto"
                                style={{ width: '100px' }}
                            />
                            <Column
                                header="Submetida em"
                                body={dataTemplate}
                                sortable
                                sortField="data_submissao_auto"
                            />
                            <Column
                                header="Acções"
                                body={accoesTemplate}
                                style={{ width: '200px' }}
                            />
                        </DataTable>
                    )}
                </Card>
            </div>
        </RestrictedRoute>
    );
}
