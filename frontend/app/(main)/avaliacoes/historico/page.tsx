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
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { PDFDownloadButton } from '@/app/components/PDFAvaliacao';
import { ExportarAvaliacoesExcel } from '@/app/components/ExcelExport';

export default function HistoricoAvaliacoesPage() {
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
            const response = await api.get('/avaliacoes/minhas');
            setAvaliacoes(response.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar avaliações:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar o histórico de avaliações.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const cicloTemplate = (rowData: IAvaliacao) => {
        return (
            <div>
                <div className="font-bold">{rowData.ciclo?.nome}</div>
                <div className="text-500 text-sm">{rowData.ciclo?.ano}</div>
            </div>
        );
    };

    const estadoTemplate = (rowData: IAvaliacao) => {
        return (
            <Tag
                value={getEstadoAvaliacaoLabel(rowData.estado)}
                style={{ backgroundColor: getEstadoAvaliacaoColor(rowData.estado) }}
            />
        );
    };

    const pontuacaoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.pontuacao_final && !rowData.pontuacao_auto) {
            return <span className="text-500">-</span>;
        }

        const pontuacao = rowData.pontuacao_final || rowData.pontuacao_auto;

        return (
            <div className="flex align-items-center gap-2">
                <span className="font-bold text-lg">{pontuacao?.toFixed(2)}</span>
                {rowData.classificacao_final && (
                    <Tag
                        value={rowData.classificacao_final}
                        style={{ backgroundColor: getClassificacaoColor(rowData.classificacao_final) }}
                    />
                )}
            </div>
        );
    };

    const dataTemplate = (rowData: IAvaliacao) => {
        const data = rowData.data_submissao_auto || rowData.created_at;
        if (!data) return '-';

        return new Date(data).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const accoesTemplate = (rowData: IAvaliacao) => {
        const podeEditar = rowData.estado === 'rascunho';

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text"
                    tooltip="Ver Detalhes"
                    onClick={() => router.push(`/avaliacoes/${rowData.id}`)}
                />
                {podeEditar && (
                    <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text p-button-warning"
                        tooltip="Continuar Avaliação"
                        onClick={() => router.push('/avaliacoes/nova')}
                    />
                )}
                {(rowData.estado === 'aprovada' || rowData.estado === 'feedback_feito') && (
                    <PDFDownloadButton avaliacao={rowData} iconOnly />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['ver avaliacoes proprias']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['ver avaliacoes proprias']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">O Meu Histórico de Avaliações</h2>
                        <p className="text-500 mt-1 mb-0">
                            Consulte todas as suas avaliações de desempenho
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {avaliacoes.length > 0 && (
                            <ExportarAvaliacoesExcel
                                data={avaliacoes}
                                filename="meu_historico_avaliacoes"
                                label="Exportar"
                                className="p-button-outlined p-button-success"
                            />
                        )}
                        <Button
                            label="Nova Autoavaliação"
                            icon="pi pi-plus"
                            onClick={() => router.push('/avaliacoes/nova')}
                        />
                    </div>
                </div>

                <Card>
                    {avaliacoes.length === 0 ? (
                        <div className="text-center py-6">
                            <i className="pi pi-inbox text-4xl text-300 mb-3" />
                            <h4 className="text-500 mt-0">Sem avaliações</h4>
                            <p className="text-500">
                                Ainda não tem avaliações registadas.
                            </p>
                            <Button
                                label="Iniciar Autoavaliação"
                                icon="pi pi-plus"
                                onClick={() => router.push('/avaliacoes/nova')}
                                className="mt-3"
                            />
                        </div>
                    ) : (
                        <DataTable
                            value={avaliacoes}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            emptyMessage="Nenhuma avaliação encontrada."
                            className="p-datatable-sm"
                            sortField="created_at"
                            sortOrder={-1}
                        >
                            <Column
                                header="Ciclo"
                                body={cicloTemplate}
                                sortable
                                sortField="ciclo.ano"
                            />
                            <Column
                                header="Estado"
                                body={estadoTemplate}
                                sortable
                                sortField="estado"
                            />
                            <Column
                                header="Pontuação"
                                body={pontuacaoTemplate}
                                sortable
                                sortField="pontuacao_final"
                            />
                            <Column
                                header="Data"
                                body={dataTemplate}
                                sortable
                                sortField="created_at"
                            />
                            <Column
                                header="Acções"
                                body={accoesTemplate}
                                style={{ width: '150px' }}
                            />
                        </DataTable>
                    )}
                </Card>

                {/* Resumo Estatístico */}
                {avaliacoes.length > 0 && (
                    <div className="grid mt-4">
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-500 mb-2">Total de Avaliações</div>
                                <div className="text-3xl font-bold text-primary">
                                    {avaliacoes.length}
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-500 mb-2">Média Global</div>
                                <div className="text-3xl font-bold text-green-500">
                                    {(() => {
                                        const comPontuacao = avaliacoes.filter(a => a.pontuacao_final);
                                        if (comPontuacao.length === 0) return '-';
                                        const media = comPontuacao.reduce((acc, a) => acc + (a.pontuacao_final || 0), 0) / comPontuacao.length;
                                        return media.toFixed(2);
                                    })()}
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-500 mb-2">Melhor Pontuação</div>
                                <div className="text-3xl font-bold text-blue-500">
                                    {(() => {
                                        const pontuacoes = avaliacoes.filter(a => a.pontuacao_final).map(a => a.pontuacao_final || 0);
                                        return pontuacoes.length > 0 ? Math.max(...pontuacoes).toFixed(2) : '-';
                                    })()}
                                </div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-500 mb-2">Concluídas</div>
                                <div className="text-3xl font-bold text-purple-500">
                                    {avaliacoes.filter(a => ['aprovada', 'feedback_feito'].includes(a.estado)).length}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </RestrictedRoute>
    );
}
