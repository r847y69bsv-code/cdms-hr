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
import { ProgressBar } from 'primereact/progressbar';
import { Chart } from 'primereact/chart';
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';

interface EstatisticasDepartamento {
    total: number;
    por_estado: Record<string, number>;
    media: number;
    por_classificacao: Record<string, number>;
}

export default function ResumoDepartamentoPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [estatisticas, setEstatisticas] = useState<EstatisticasDepartamento | null>(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [avaliacoesRes, statsRes] = await Promise.all([
                api.get('/avaliacoes/departamento'),
                api.get('/dashboard/departamento'),
            ]);
            setAvaliacoes(avaliacoesRes.data.data || []);
            setEstatisticas(statsRes.data.data?.estatisticas || null);
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os dados do departamento.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Gráfico de classificações
    const chartClassificacao = {
        labels: estatisticas ? Object.keys(estatisticas.por_classificacao) : [],
        datasets: [
            {
                data: estatisticas ? Object.values(estatisticas.por_classificacao) : [],
                backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'],
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'right' as const,
            },
        },
        maintainAspectRatio: false,
    };

    const calcularProgresso = () => {
        if (!estatisticas) return 0;
        const concluidas = (estatisticas.por_estado['aprovada'] || 0) + (estatisticas.por_estado['feedback_feito'] || 0);
        return estatisticas.total > 0 ? Math.round((concluidas / estatisticas.total) * 100) : 0;
    };

    const trabalhadorTemplate = (rowData: IAvaliacao) => (
        <div className="flex align-items-center gap-3">
            <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center text-white text-sm font-bold">
                {rowData.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-bold">{rowData.trabalhador?.nome_completo}</div>
                <div className="text-500 text-sm">{rowData.trabalhador?.cargo}</div>
            </div>
        </div>
    );

    const estadoTemplate = (rowData: IAvaliacao) => (
        <Tag
            value={getEstadoAvaliacaoLabel(rowData.estado)}
            style={{ backgroundColor: getEstadoAvaliacaoColor(rowData.estado) }}
        />
    );

    const pontuacaoTemplate = (rowData: IAvaliacao) => {
        const pontuacao = rowData.pontuacao_final || rowData.pontuacao_avaliador;
        if (!pontuacao) {
            return <span className="text-500">-</span>;
        }
        return (
            <span className="font-bold">{pontuacao.toFixed(2)}</span>
        );
    };

    const classificacaoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.classificacao_final) {
            return <span className="text-500">-</span>;
        }
        return (
            <Tag
                value={rowData.classificacao_final}
                style={{ backgroundColor: getClassificacaoColor(rowData.classificacao_final) }}
            />
        );
    };

    const accoesTemplate = (rowData: IAvaliacao) => (
        <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Ver Detalhes"
            onClick={() => router.push(`/avaliacoes/${rowData.id}`)}
        />
    );

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['acesso revisao-departamental']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['acesso revisao-departamental']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Resumo do Departamento</h2>
                        <p className="text-500 mt-1 mb-0">
                            Visão geral das avaliações do seu departamento
                        </p>
                    </div>
                    <Button
                        label="Aprovações Pendentes"
                        icon="pi pi-check-circle"
                        onClick={() => router.push('/departamento/aprovacoes')}
                    />
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Total Avaliações</div>
                            <div className="text-3xl font-bold text-primary">{estatisticas?.total || 0}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Concluídas</div>
                            <div className="text-3xl font-bold text-green-500">
                                {(estatisticas?.por_estado['aprovada'] || 0) + (estatisticas?.por_estado['feedback_feito'] || 0)}
                            </div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Pendentes Revisão</div>
                            <div className="text-3xl font-bold text-orange-500">
                                {(estatisticas?.por_estado['aval_submetida'] || 0) + (estatisticas?.por_estado['rev_departamento'] || 0)}
                            </div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Média Departamento</div>
                            <div className="text-3xl font-bold text-blue-500">
                                {estatisticas?.media?.toFixed(2) || '-'}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Progresso e Gráfico */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-6">
                        <Card title="Progresso do Ciclo">
                            <div className="flex justify-content-between mb-2">
                                <span>Avaliações Concluídas</span>
                                <span className="font-bold">{calcularProgresso()}%</span>
                            </div>
                            <ProgressBar value={calcularProgresso()} showValue={false} />

                            <div className="mt-4">
                                <h5 className="mb-3">Por Estado</h5>
                                {estatisticas?.por_estado && Object.entries(estatisticas.por_estado).map(([estado, count]) => (
                                    <div key={estado} className="flex justify-content-between align-items-center mb-2">
                                        <Tag
                                            value={getEstadoAvaliacaoLabel(estado)}
                                            style={{ backgroundColor: getEstadoAvaliacaoColor(estado) }}
                                        />
                                        <span className="font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-6">
                        <Card title="Distribuição por Classificação">
                            {estatisticas?.por_classificacao && Object.keys(estatisticas.por_classificacao).length > 0 ? (
                                <div style={{ height: '250px' }}>
                                    <Chart type="doughnut" data={chartClassificacao} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="text-center py-4 text-500">
                                    Sem dados de classificação disponíveis
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Tabela de Avaliações */}
                <Card title="Todas as Avaliações do Departamento">
                    <DataTable
                        value={avaliacoes}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        emptyMessage="Nenhuma avaliação encontrada."
                        className="p-datatable-sm"
                        sortField="trabalhador.nome_completo"
                        sortOrder={1}
                    >
                        <Column header="Trabalhador" body={trabalhadorTemplate} sortable sortField="trabalhador.nome_completo" />
                        <Column field="avaliador.name" header="Avaliador" sortable />
                        <Column header="Estado" body={estadoTemplate} sortable sortField="estado" style={{ width: '160px' }} />
                        <Column header="Pontuação" body={pontuacaoTemplate} sortable sortField="pontuacao_final" style={{ width: '100px' }} />
                        <Column header="Classificação" body={classificacaoTemplate} sortable sortField="classificacao_final" style={{ width: '130px' }} />
                        <Column header="" body={accoesTemplate} style={{ width: '60px' }} />
                    </DataTable>
                </Card>
            </div>
        </RestrictedRoute>
    );
}
