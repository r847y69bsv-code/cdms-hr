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
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { PDFDownloadButton } from '@/app/components/PDFAvaliacao';
import { ExportarAvaliacoesExcel } from '@/app/components/ExcelExport';

export default function EquipaPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string | null>(null);

    const estadosOptions = [
        { label: 'Todos', value: null },
        { label: 'Rascunho', value: 'rascunho' },
        { label: 'Auto Submetida', value: 'auto_submetida' },
        { label: 'Em Avaliação', value: 'aval_rascunho' },
        { label: 'Avaliação Submetida', value: 'aval_submetida' },
        { label: 'Revisão Dept.', value: 'rev_departamento' },
        { label: 'Revisão RH', value: 'rev_rh' },
        { label: 'Aprovada', value: 'aprovada' },
        { label: 'Feedback', value: 'feedback_feito' },
    ];

    useEffect(() => {
        carregarEquipa();
    }, []);

    const carregarEquipa = async () => {
        try {
            setLoading(true);
            const response = await api.get('/avaliacoes/equipa');
            setAvaliacoes(response.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar equipa:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os dados da equipa.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const getAvaliacoesFiltradas = () => {
        let filtradas = avaliacoes;

        if (estadoFilter) {
            filtradas = filtradas.filter(a => a.estado === estadoFilter);
        }

        if (globalFilter) {
            const search = globalFilter.toLowerCase();
            filtradas = filtradas.filter(a =>
                a.trabalhador?.nome_completo?.toLowerCase().includes(search) ||
                a.trabalhador?.cargo?.toLowerCase().includes(search) ||
                a.trabalhador?.departamento?.toLowerCase().includes(search)
            );
        }

        return filtradas;
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

    const estadoTemplate = (rowData: IAvaliacao) => {
        return (
            <Tag
                value={getEstadoAvaliacaoLabel(rowData.estado)}
                style={{ backgroundColor: getEstadoAvaliacaoColor(rowData.estado) }}
            />
        );
    };

    const pontuacaoTemplate = (rowData: IAvaliacao) => {
        const auto = rowData.pontuacao_auto;
        const avaliador = rowData.pontuacao_avaliador;
        const final = rowData.pontuacao_final;

        return (
            <div className="flex flex-column gap-1">
                <div className="flex justify-content-between text-sm">
                    <span className="text-500">Auto:</span>
                    <span className="font-semibold">{auto?.toFixed(1) || '-'}</span>
                </div>
                <div className="flex justify-content-between text-sm">
                    <span className="text-500">Aval:</span>
                    <span className="font-semibold">{avaliador?.toFixed(1) || '-'}</span>
                </div>
                {final && (
                    <div className="flex justify-content-between">
                        <span className="text-500">Final:</span>
                        <Tag
                            value={final.toFixed(1)}
                            style={{ backgroundColor: getClassificacaoColor(rowData.classificacao_final || '') }}
                        />
                    </div>
                )}
            </div>
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

    const accoesTemplate = (rowData: IAvaliacao) => {
        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text p-button-sm"
                    tooltip="Ver Detalhes"
                    onClick={() => router.push(`/avaliacoes/${rowData.id}`)}
                />
                {rowData.estado === 'auto_submetida' && (
                    <Button
                        icon="pi pi-play"
                        className="p-button-rounded p-button-text p-button-sm p-button-success"
                        tooltip="Iniciar Avaliação"
                        onClick={() => iniciarAvaliacao(rowData.id)}
                    />
                )}
                {rowData.estado === 'aval_rascunho' && (
                    <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text p-button-sm p-button-warning"
                        tooltip="Continuar Avaliação"
                        onClick={() => router.push(`/avaliador/avaliar/${rowData.id}`)}
                    />
                )}
                {(rowData.estado === 'aprovada' || rowData.estado === 'feedback_feito') && (
                    <>
                        <Button
                            icon="pi pi-comments"
                            className="p-button-rounded p-button-text p-button-sm p-button-info"
                            tooltip="One-on-One"
                            onClick={() => router.push(`/one-on-one?avaliacao=${rowData.id}`)}
                        />
                        <PDFDownloadButton avaliacao={rowData} iconOnly />
                    </>
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
                detail: 'Avaliação iniciada!',
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

    // Estatísticas
    const calcularEstatisticas = () => {
        const total = avaliacoes.length;
        const concluidas = avaliacoes.filter(a =>
            ['aprovada', 'feedback_feito'].includes(a.estado)
        ).length;
        const pendentes = avaliacoes.filter(a =>
            ['auto_submetida', 'aval_rascunho'].includes(a.estado)
        ).length;

        const comPontuacao = avaliacoes.filter(a => a.pontuacao_final);
        const media = comPontuacao.length > 0
            ? comPontuacao.reduce((acc, a) => acc + (a.pontuacao_final || 0), 0) / comPontuacao.length
            : 0;

        return { total, concluidas, pendentes, media };
    };

    const stats = calcularEstatisticas();

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['ver avaliacoes equipa']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['ver avaliacoes equipa']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">A Minha Equipa</h2>
                        <p className="text-500 mt-1 mb-0">
                            Visão geral das avaliações da sua equipa
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ExportarAvaliacoesExcel
                            data={avaliacoes}
                            filename="avaliacoes_equipa"
                            label="Exportar"
                            className="p-button-outlined p-button-success"
                        />
                        <Button
                            label="Ver Pendentes"
                            icon="pi pi-clock"
                            badge={stats.pendentes.toString()}
                            badgeClassName="p-badge-danger"
                            onClick={() => router.push('/avaliador/pendentes')}
                        />
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-2">Total da Equipa</div>
                            <div className="text-3xl font-bold text-primary">{stats.total}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-2">Pendentes</div>
                            <div className="text-3xl font-bold text-orange-500">{stats.pendentes}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-2">Concluídas</div>
                            <div className="text-3xl font-bold text-green-500">{stats.concluidas}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-2">Média da Equipa</div>
                            <div className="text-3xl font-bold text-blue-500">
                                {stats.media > 0 ? stats.media.toFixed(2) : '-'}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Progresso */}
                {stats.total > 0 && (
                    <Card className="mb-4">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="font-bold">Progresso do Ciclo</span>
                            <span className="text-500">
                                {stats.concluidas} de {stats.total} concluídas
                            </span>
                        </div>
                        <ProgressBar
                            value={Math.round((stats.concluidas / stats.total) * 100)}
                            showValue
                        />
                    </Card>
                )}

                {/* Filtros */}
                <Card className="mb-4">
                    <div className="flex flex-column md:flex-row gap-3">
                        <div className="flex-1">
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-search" />
                                <InputText
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="Pesquisar trabalhador..."
                                    className="w-full"
                                />
                            </span>
                        </div>
                        <Dropdown
                            value={estadoFilter}
                            options={estadosOptions}
                            onChange={(e) => setEstadoFilter(e.value)}
                            placeholder="Filtrar por estado"
                            className="w-full md:w-auto"
                            style={{ minWidth: '200px' }}
                        />
                    </div>
                </Card>

                {/* Tabela */}
                <Card>
                    <DataTable
                        value={getAvaliacoesFiltradas()}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        emptyMessage="Nenhuma avaliação encontrada."
                        className="p-datatable-sm"
                        sortField="trabalhador.nome_completo"
                        sortOrder={1}
                    >
                        <Column
                            header="Trabalhador"
                            body={trabalhadorTemplate}
                            sortable
                            sortField="trabalhador.nome_completo"
                        />
                        <Column
                            field="trabalhador.departamento"
                            header="Departamento"
                            sortable
                        />
                        <Column
                            header="Estado"
                            body={estadoTemplate}
                            sortable
                            sortField="estado"
                        />
                        <Column
                            header="Pontuações"
                            body={pontuacaoTemplate}
                            style={{ width: '140px' }}
                        />
                        <Column
                            header="Classificação"
                            body={classificacaoTemplate}
                            sortable
                            sortField="classificacao_final"
                        />
                        <Column
                            header="Acções"
                            body={accoesTemplate}
                            style={{ width: '120px' }}
                        />
                    </DataTable>
                </Card>
            </div>
        </RestrictedRoute>
    );
}
