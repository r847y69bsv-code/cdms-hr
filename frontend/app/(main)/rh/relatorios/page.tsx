'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Chart } from 'primereact/chart';
import { api } from '@/app/api';
import { ICicloAvaliacao, IAvaliacao } from '@/types/app';
import { getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { ExportarAvaliacoesExcel, ExportarRankingExcel, ExportarDepartamentosExcel } from '@/app/components/ExcelExport';

interface EstatisticasGerais {
    total_avaliacoes: number;
    concluidas: number;
    em_progresso: number;
    media_geral: number;
    por_classificacao: Record<string, number>;
    por_departamento: Array<{
        departamento: string;
        total: number;
        media: number;
    }>;
    por_categoria: Array<{
        categoria: string;
        total: number;
        media: number;
    }>;
}

interface RankingItem {
    posicao: number;
    trabalhador: string;
    departamento: string;
    pontuacao: number;
    classificacao: string;
}

export default function RelatoriosPage() {
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [ciclos, setCiclos] = useState<ICicloAvaliacao[]>([]);
    const [cicloSelecionado, setCicloSelecionado] = useState<number | null>(null);
    const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
    const [rankingTop, setRankingTop] = useState<RankingItem[]>([]);
    const [rankingCompleto, setRankingCompleto] = useState<RankingItem[]>([]);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        carregarCiclos();
    }, []);

    useEffect(() => {
        if (cicloSelecionado) {
            carregarEstatisticas();
        }
    }, [cicloSelecionado]);

    const carregarCiclos = async () => {
        try {
            const response = await api.get('/ciclos');
            const ciclosData = response.data.data || [];
            setCiclos(ciclosData);

            // Seleccionar ciclo activo por defeito
            const cicloActivo = ciclosData.find((c: ICicloAvaliacao) => c.estado !== 'planeado' && c.estado !== 'concluido');
            if (cicloActivo) {
                setCicloSelecionado(cicloActivo.id);
            } else if (ciclosData.length > 0) {
                setCicloSelecionado(ciclosData[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar ciclos:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarEstatisticas = async () => {
        try {
            setLoading(true);
            const [statsRes, rankingRes, rankingCompletoRes, avaliacoesRes] = await Promise.all([
                api.get(`/relatorios/estatisticas?ciclo_id=${cicloSelecionado}`),
                api.get(`/relatorios/ranking?ciclo_id=${cicloSelecionado}&limite=10`),
                api.get(`/relatorios/ranking?ciclo_id=${cicloSelecionado}&limite=1000`),
                api.get(`/avaliacoes?ciclo_id=${cicloSelecionado}&per_page=1000`),
            ]);
            setEstatisticas(statsRes.data.data);
            setRankingTop(rankingRes.data.data || []);
            setRankingCompleto(rankingCompletoRes.data.data || []);
            setAvaliacoes(avaliacoesRes.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar estatísticas:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar as estatísticas.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Obter nome do ciclo seleccionado
    const getCicloNome = () => {
        const ciclo = ciclos.find(c => c.id === cicloSelecionado);
        return ciclo?.nome || '';
    };

    // Dados para gráficos
    const chartClassificacao = {
        labels: estatisticas ? Object.keys(estatisticas.por_classificacao) : [],
        datasets: [
            {
                data: estatisticas ? Object.values(estatisticas.por_classificacao) : [],
                backgroundColor: [
                    '#22c55e', // Excelente
                    '#3b82f6', // Muito Bom
                    '#eab308', // Bom
                    '#f97316', // Regular
                    '#ef4444', // Insuficiente
                ],
            },
        ],
    };

    const chartDepartamento = {
        labels: estatisticas?.por_departamento?.map(d => d.departamento) || [],
        datasets: [
            {
                label: 'Média',
                data: estatisticas?.por_departamento?.map(d => d.media) || [],
                backgroundColor: '#6366f1',
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
        maintainAspectRatio: false,
    };

    const barOptions = {
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 5,
            },
        },
        maintainAspectRatio: false,
    };

    const posicaoTemplate = (rowData: RankingItem) => (
        <div className="flex align-items-center gap-2">
            {rowData.posicao <= 3 ? (
                <i className={`pi pi-star-fill ${rowData.posicao === 1 ? 'text-yellow-500' : rowData.posicao === 2 ? 'text-400' : 'text-orange-400'}`} />
            ) : (
                <span className="text-500">{rowData.posicao}º</span>
            )}
        </div>
    );

    const classificacaoTemplate = (rowData: RankingItem) => (
        <Tag
            value={rowData.classificacao}
            style={{ backgroundColor: getClassificacaoColor(rowData.classificacao) }}
        />
    );

    if (loading && !estatisticas) {
        return (
            <RestrictedRoute requiredPermissions={['ver relatorios']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['ver relatorios']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Relatórios e Estatísticas</h2>
                        <p className="text-500 mt-1 mb-0">
                            Análise do desempenho organizacional
                        </p>
                    </div>
                    <div className="flex gap-2 align-items-center">
                        <Dropdown
                            value={cicloSelecionado}
                            options={ciclos.map(c => ({ label: c.nome, value: c.id }))}
                            onChange={(e) => setCicloSelecionado(e.value)}
                            placeholder="Seleccione o ciclo"
                            className="w-auto"
                            style={{ minWidth: '250px' }}
                        />
                        <Button
                            icon="pi pi-refresh"
                            className="p-button-outlined"
                            onClick={carregarEstatisticas}
                            loading={loading}
                            tooltip="Actualizar"
                        />
                    </div>
                </div>

                {estatisticas && (
                    <>
                        {/* Cards de Resumo */}
                        <div className="grid mb-4">
                            <div className="col-6 md:col-3">
                                <Card className="text-center">
                                    <div className="text-500 text-sm mb-1">Total Avaliações</div>
                                    <div className="text-3xl font-bold text-primary">{estatisticas.total_avaliacoes}</div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center">
                                    <div className="text-500 text-sm mb-1">Concluídas</div>
                                    <div className="text-3xl font-bold text-green-500">{estatisticas.concluidas}</div>
                                    <div className="text-sm text-500">
                                        {estatisticas.total_avaliacoes > 0
                                            ? `${Math.round((estatisticas.concluidas / estatisticas.total_avaliacoes) * 100)}%`
                                            : '0%'}
                                    </div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center">
                                    <div className="text-500 text-sm mb-1">Em Progresso</div>
                                    <div className="text-3xl font-bold text-orange-500">{estatisticas.em_progresso}</div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center">
                                    <div className="text-500 text-sm mb-1">Média Geral</div>
                                    <div className="text-3xl font-bold text-blue-500">
                                        {estatisticas.media_geral?.toFixed(2) || '-'}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                            <TabPanel header="Visão Geral">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <Card title="Distribuição por Classificação">
                                            <div style={{ height: '300px' }}>
                                                <Chart type="doughnut" data={chartClassificacao} options={chartOptions} />
                                            </div>
                                        </Card>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <Card title="Média por Departamento">
                                            <div style={{ height: '300px' }}>
                                                <Chart type="bar" data={chartDepartamento} options={barOptions} />
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </TabPanel>

                            <TabPanel header="Por Departamento">
                                <Card>
                                    <DataTable
                                        value={estatisticas.por_departamento || []}
                                        emptyMessage="Sem dados disponíveis."
                                        className="p-datatable-sm"
                                    >
                                        <Column field="departamento" header="Departamento" sortable />
                                        <Column field="total" header="Total" sortable style={{ width: '100px' }} />
                                        <Column
                                            field="media"
                                            header="Média"
                                            sortable
                                            body={(rowData) => (
                                                <span className="font-bold">{rowData.media?.toFixed(2)}</span>
                                            )}
                                            style={{ width: '100px' }}
                                        />
                                    </DataTable>
                                </Card>
                            </TabPanel>

                            <TabPanel header="Por Categoria">
                                <Card>
                                    <DataTable
                                        value={estatisticas.por_categoria || []}
                                        emptyMessage="Sem dados disponíveis."
                                        className="p-datatable-sm"
                                    >
                                        <Column
                                            field="categoria"
                                            header="Categoria"
                                            sortable
                                            body={(rowData) => (
                                                <Tag value={rowData.categoria?.replace('_', ' ').toUpperCase()} />
                                            )}
                                        />
                                        <Column field="total" header="Total" sortable style={{ width: '100px' }} />
                                        <Column
                                            field="media"
                                            header="Média"
                                            sortable
                                            body={(rowData) => (
                                                <span className="font-bold">{rowData.media?.toFixed(2)}</span>
                                            )}
                                            style={{ width: '100px' }}
                                        />
                                    </DataTable>
                                </Card>
                            </TabPanel>

                            <TabPanel header="Top 10">
                                <Card title="Melhores Desempenhos">
                                    <DataTable
                                        value={rankingTop}
                                        emptyMessage="Sem dados disponíveis."
                                        className="p-datatable-sm"
                                    >
                                        <Column header="#" body={posicaoTemplate} style={{ width: '60px' }} />
                                        <Column field="trabalhador" header="Trabalhador" sortable />
                                        <Column field="departamento" header="Departamento" sortable />
                                        <Column
                                            field="pontuacao"
                                            header="Pontuação"
                                            sortable
                                            body={(rowData) => (
                                                <span className="font-bold text-primary">{rowData.pontuacao?.toFixed(2)}</span>
                                            )}
                                            style={{ width: '120px' }}
                                        />
                                        <Column header="Classificação" body={classificacaoTemplate} style={{ width: '140px' }} />
                                    </DataTable>
                                </Card>
                            </TabPanel>

                            <TabPanel header="Exportar">
                                <div className="grid">
                                    <div className="col-12 md:col-4">
                                        <Card className="text-center">
                                            <i className="pi pi-file-excel text-4xl text-green-500 mb-3" />
                                            <h4 className="mt-0">Relatório Completo</h4>
                                            <p className="text-500 text-sm">
                                                Todas as avaliações com detalhes completos
                                            </p>
                                            <ExportarAvaliacoesExcel
                                                data={avaliacoes}
                                                filename={`relatorio_completo_${getCicloNome()}`}
                                                label="Exportar Excel"
                                                className="p-button-success"
                                            />
                                        </Card>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <Card className="text-center">
                                            <i className="pi pi-chart-bar text-4xl text-blue-500 mb-3" />
                                            <h4 className="mt-0">Resumo por Departamento</h4>
                                            <p className="text-500 text-sm">
                                                Estatísticas agrupadas por departamento
                                            </p>
                                            <ExportarDepartamentosExcel
                                                data={estatisticas?.por_departamento || []}
                                                cicloNome={getCicloNome()}
                                                filename={`departamentos_${getCicloNome()}`}
                                                label="Exportar Excel"
                                            />
                                        </Card>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <Card className="text-center">
                                            <i className="pi pi-users text-4xl text-purple-500 mb-3" />
                                            <h4 className="mt-0">Ranking Geral</h4>
                                            <p className="text-500 text-sm">
                                                Lista ordenada por pontuação
                                            </p>
                                            <ExportarRankingExcel
                                                data={rankingCompleto}
                                                cicloNome={getCicloNome()}
                                                filename={`ranking_${getCicloNome()}`}
                                                label="Exportar Excel"
                                            />
                                        </Card>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabView>
                    </>
                )}
            </div>
        </RestrictedRoute>
    );
}
