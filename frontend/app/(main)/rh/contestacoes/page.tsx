'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IContestacao } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function ContestacoesPendentesPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [contestacoesPendentes, setContestacoesPendentes] = useState<IContestacao[]>([]);
    const [todasContestacoes, setTodasContestacoes] = useState<IContestacao[]>([]);
    const [activeTab, setActiveTab] = useState(0);

    // Dialog de resposta
    const [showRespostaDialog, setShowRespostaDialog] = useState(false);
    const [contestacaoSelecionada, setContestacaoSelecionada] = useState<IContestacao | null>(null);
    const [resposta, setResposta] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [pendentesRes, todasRes] = await Promise.all([
                api.get('/contestacoes/pendentes'),
                api.get('/contestacoes'),
            ]);
            setContestacoesPendentes(pendentesRes.data.data || []);
            setTodasContestacoes(todasRes.data.data || todasRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar contestações:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar as contestações.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendente': return '#f59e0b';
            case 'em_analise': return '#3b82f6';
            case 'aceite': return '#22c55e';
            case 'rejeitada': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'pendente': return 'Pendente';
            case 'em_analise': return 'Em Análise';
            case 'aceite': return 'Aceite';
            case 'rejeitada': return 'Rejeitada';
            default: return estado;
        }
    };

    const abrirResponder = (contestacao: IContestacao) => {
        setContestacaoSelecionada(contestacao);
        setResposta('');
        setShowRespostaDialog(true);
    };

    const marcarEmAnalise = async (contestacao: IContestacao) => {
        try {
            await api.post(`/contestacoes/${contestacao.id}/em-analise`);
            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Contestação marcada como em análise.',
                life: 3000,
            });
            carregarDados();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível actualizar a contestação.',
                life: 3000,
            });
        }
    };

    const responderContestacao = async (estado: 'aceite' | 'rejeitada') => {
        if (!resposta.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Por favor, insira uma resposta.',
                life: 3000,
            });
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/contestacoes/${contestacaoSelecionada?.id}/responder`, {
                estado,
                resposta,
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: `Contestação ${estado === 'aceite' ? 'aceite' : 'rejeitada'} com sucesso.`,
                life: 3000,
            });

            setShowRespostaDialog(false);
            carregarDados();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível responder à contestação.',
                life: 5000,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const trabalhadorTemplate = (rowData: IContestacao) => {
        return (
            <div>
                <div className="font-bold">{rowData.avaliacao?.trabalhador?.nome_completo}</div>
                <small className="text-500">{rowData.avaliacao?.trabalhador?.cargo}</small>
            </div>
        );
    };

    const cicloTemplate = (rowData: IContestacao) => {
        return rowData.avaliacao?.ciclo?.nome || '-';
    };

    const motivoTemplate = (rowData: IContestacao) => {
        return (
            <div>
                <div className="font-semibold mb-1">{rowData.motivo}</div>
                <small className="text-500 line-clamp-2">{rowData.descricao}</small>
            </div>
        );
    };

    const dataTemplate = (rowData: IContestacao) => {
        return new Date(rowData.created_at!).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const estadoTemplate = (rowData: IContestacao) => {
        return (
            <Tag
                value={getEstadoLabel(rowData.estado)}
                style={{ backgroundColor: getEstadoColor(rowData.estado) }}
            />
        );
    };

    const accoesTemplate = (rowData: IContestacao) => {
        const isPendente = rowData.estado === 'pendente';
        const isEmAnalise = rowData.estado === 'em_analise';

        return (
            <div className="flex gap-2">
                {isPendente && (
                    <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-info p-button-sm"
                        tooltip="Marcar em Análise"
                        onClick={() => marcarEmAnalise(rowData)}
                    />
                )}
                {(isPendente || isEmAnalise) && (
                    <Button
                        icon="pi pi-reply"
                        className="p-button-rounded p-button-success p-button-sm"
                        tooltip="Responder"
                        onClick={() => abrirResponder(rowData)}
                    />
                )}
                <Button
                    icon="pi pi-external-link"
                    className="p-button-rounded p-button-text p-button-sm"
                    tooltip="Ver Avaliação"
                    onClick={() => router.push(`/avaliacoes/${rowData.avaliacao_id}`)}
                />
            </div>
        );
    };

    const respostaTemplate = (rowData: IContestacao) => {
        if (!rowData.resposta) return <span className="text-500">-</span>;
        return (
            <div>
                <small className="text-500 line-clamp-2">{rowData.resposta}</small>
                {rowData.data_resposta && (
                    <div className="text-xs text-400 mt-1">
                        {new Date(rowData.data_resposta).toLocaleDateString('pt-PT')}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['aprovar avaliacao-rh']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['aprovar avaliacao-rh']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                {/* Cabeçalho */}
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Gestão de Contestações</h2>
                        <p className="text-500 mt-1 mb-0">
                            Analise e responda às contestações dos trabalhadores
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="surface-100 border-round p-3 text-center">
                            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                                {contestacoesPendentes.filter(c => c.estado === 'pendente').length}
                            </div>
                            <small className="text-500">Pendentes</small>
                        </div>
                        <div className="surface-100 border-round p-3 text-center">
                            <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                                {contestacoesPendentes.filter(c => c.estado === 'em_analise').length}
                            </div>
                            <small className="text-500">Em Análise</small>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Card>
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        {/* Tab: Pendentes */}
                        <TabPanel
                            header={`Pendentes (${contestacoesPendentes.length})`}
                            leftIcon="pi pi-clock mr-2"
                        >
                            {contestacoesPendentes.length > 0 ? (
                                <DataTable
                                    value={contestacoesPendentes}
                                    paginator
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    emptyMessage="Sem contestações pendentes"
                                    className="p-datatable-sm"
                                >
                                    <Column
                                        header="Trabalhador"
                                        body={trabalhadorTemplate}
                                        style={{ width: '200px' }}
                                    />
                                    <Column
                                        header="Ciclo"
                                        body={cicloTemplate}
                                        style={{ width: '150px' }}
                                    />
                                    <Column
                                        header="Motivo/Descrição"
                                        body={motivoTemplate}
                                    />
                                    <Column
                                        header="Data"
                                        body={dataTemplate}
                                        style={{ width: '100px' }}
                                    />
                                    <Column
                                        header="Estado"
                                        body={estadoTemplate}
                                        style={{ width: '120px' }}
                                    />
                                    <Column
                                        header="Acções"
                                        body={accoesTemplate}
                                        style={{ width: '150px' }}
                                    />
                                </DataTable>
                            ) : (
                                <div className="text-center py-6">
                                    <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
                                    <h4 className="mt-0 mb-2">Sem contestações pendentes</h4>
                                    <p className="text-500 m-0">
                                        Todas as contestações foram analisadas.
                                    </p>
                                </div>
                            )}
                        </TabPanel>

                        {/* Tab: Histórico */}
                        <TabPanel
                            header={`Histórico (${todasContestacoes.length})`}
                            leftIcon="pi pi-history mr-2"
                        >
                            <DataTable
                                value={todasContestacoes}
                                paginator
                                rows={10}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                emptyMessage="Sem contestações registadas"
                                className="p-datatable-sm"
                                sortField="created_at"
                                sortOrder={-1}
                            >
                                <Column
                                    header="Trabalhador"
                                    body={trabalhadorTemplate}
                                    style={{ width: '180px' }}
                                />
                                <Column
                                    header="Ciclo"
                                    body={cicloTemplate}
                                    style={{ width: '130px' }}
                                />
                                <Column
                                    header="Motivo"
                                    body={motivoTemplate}
                                />
                                <Column
                                    header="Data"
                                    body={dataTemplate}
                                    style={{ width: '90px' }}
                                />
                                <Column
                                    header="Estado"
                                    body={estadoTemplate}
                                    style={{ width: '100px' }}
                                />
                                <Column
                                    header="Resposta"
                                    body={respostaTemplate}
                                    style={{ width: '200px' }}
                                />
                                <Column
                                    header=""
                                    body={(rowData: IContestacao) => (
                                        <Button
                                            icon="pi pi-external-link"
                                            className="p-button-rounded p-button-text p-button-sm"
                                            tooltip="Ver Avaliação"
                                            onClick={() => router.push(`/avaliacoes/${rowData.avaliacao_id}`)}
                                        />
                                    )}
                                    style={{ width: '60px' }}
                                />
                            </DataTable>
                        </TabPanel>
                    </TabView>
                </Card>

                {/* Dialog de Resposta */}
                <Dialog
                    header="Responder à Contestação"
                    visible={showRespostaDialog}
                    style={{ width: '600px' }}
                    onHide={() => setShowRespostaDialog(false)}
                    modal
                >
                    {contestacaoSelecionada && (
                        <div>
                            {/* Info da contestação */}
                            <div className="surface-100 p-3 border-round mb-4">
                                <div className="flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <span className="font-bold">
                                            {contestacaoSelecionada.avaliacao?.trabalhador?.nome_completo}
                                        </span>
                                        <span className="text-500 ml-2">
                                            ({contestacaoSelecionada.avaliacao?.ciclo?.nome})
                                        </span>
                                    </div>
                                    <Tag
                                        value={getEstadoLabel(contestacaoSelecionada.estado)}
                                        style={{ backgroundColor: getEstadoColor(contestacaoSelecionada.estado) }}
                                    />
                                </div>
                                <div className="mb-2">
                                    <strong className="text-sm">Motivo:</strong>
                                    <span className="ml-2">{contestacaoSelecionada.motivo}</span>
                                </div>
                                <div>
                                    <strong className="text-sm">Descrição:</strong>
                                    <p className="m-0 mt-1 text-500">{contestacaoSelecionada.descricao}</p>
                                </div>
                            </div>

                            {/* Campo de resposta */}
                            <div className="field mb-4">
                                <label htmlFor="resposta" className="font-bold mb-2 block">
                                    Sua Resposta *
                                </label>
                                <InputTextarea
                                    id="resposta"
                                    value={resposta}
                                    onChange={(e) => setResposta(e.target.value)}
                                    placeholder="Escreva a sua análise e decisão sobre esta contestação..."
                                    rows={5}
                                    maxLength={2000}
                                    autoResize
                                    className="w-full"
                                />
                                <small className="text-500">{resposta.length}/2000 caracteres</small>
                            </div>

                            {/* Botões */}
                            <div className="flex justify-content-between">
                                <Button
                                    label="Cancelar"
                                    icon="pi pi-times"
                                    className="p-button-text"
                                    onClick={() => setShowRespostaDialog(false)}
                                    disabled={submitting}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        label="Rejeitar"
                                        icon="pi pi-times-circle"
                                        className="p-button-danger"
                                        loading={submitting}
                                        onClick={() => responderContestacao('rejeitada')}
                                    />
                                    <Button
                                        label="Aceitar"
                                        icon="pi pi-check-circle"
                                        className="p-button-success"
                                        loading={submitting}
                                        onClick={() => responderContestacao('aceite')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
