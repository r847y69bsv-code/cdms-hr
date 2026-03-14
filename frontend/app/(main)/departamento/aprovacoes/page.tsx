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
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { PDFDownloadButton } from '@/app/components/PDFAvaliacao';

export default function AprovacoesDepartamentoPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);

    // Dialog de revisão
    const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
    const [selectedAvaliacao, setSelectedAvaliacao] = useState<IAvaliacao | null>(null);
    const [observacoesRevisor, setObservacoesRevisor] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        carregarAvaliacoes();
    }, []);

    const carregarAvaliacoes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/avaliacoes/departamento/pendentes');
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

    const abrirRevisao = (avaliacao: IAvaliacao) => {
        setSelectedAvaliacao(avaliacao);
        setObservacoesRevisor('');
        setReviewDialogVisible(true);
    };

    const aprovarAvaliacao = async () => {
        if (!selectedAvaliacao) return;

        setSubmitting(true);
        try {
            await api.post(`/avaliacoes/${selectedAvaliacao.id}/aprovar-departamento`, {
                observacoes_revisor: observacoesRevisor,
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Avaliação aprovada e enviada para RH!',
                life: 3000,
            });
            setReviewDialogVisible(false);
            carregarAvaliacoes();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível aprovar a avaliação.',
                life: 3000,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const rejeitarAvaliacao = () => {
        if (!selectedAvaliacao) return;

        confirmDialog({
            message: 'Tem a certeza que deseja devolver esta avaliação para correcção?',
            header: 'Confirmar Devolução',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Devolver',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-warning',
            accept: async () => {
                setSubmitting(true);
                try {
                    await api.post(`/avaliacoes/${selectedAvaliacao.id}/devolver`, {
                        observacoes_revisor: observacoesRevisor,
                    });
                    toast.current?.show({
                        severity: 'info',
                        summary: 'Devolvida',
                        detail: 'Avaliação devolvida ao avaliador para correcção.',
                        life: 3000,
                    });
                    setReviewDialogVisible(false);
                    carregarAvaliacoes();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: error.response?.data?.message || 'Não foi possível devolver a avaliação.',
                        life: 3000,
                    });
                } finally {
                    setSubmitting(false);
                }
            },
        });
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

    const avaliadorTemplate = (rowData: IAvaliacao) => (
        <span>{rowData.avaliador?.name}</span>
    );

    const pontuacaoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.pontuacao_avaliador) {
            return <span className="text-500">-</span>;
        }
        return (
            <div className="flex align-items-center gap-2">
                <span className="font-bold">{rowData.pontuacao_avaliador.toFixed(2)}</span>
                {rowData.classificacao_final && (
                    <Tag
                        value={rowData.classificacao_final}
                        style={{ backgroundColor: getClassificacaoColor(rowData.classificacao_final) }}
                        className="text-xs"
                    />
                )}
            </div>
        );
    };

    const comparacaoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.pontuacao_auto || !rowData.pontuacao_avaliador) {
            return <span className="text-500">-</span>;
        }

        const diferenca = rowData.pontuacao_avaliador - rowData.pontuacao_auto;
        const cor = diferenca > 0 ? 'text-green-500' : diferenca < 0 ? 'text-red-500' : 'text-500';

        return (
            <div className="text-center">
                <div className="text-sm text-500">Auto: {rowData.pontuacao_auto.toFixed(1)}</div>
                <div className={`font-bold ${cor}`}>
                    {diferenca > 0 ? '+' : ''}{diferenca.toFixed(2)}
                </div>
            </div>
        );
    };

    const accoesTemplate = (rowData: IAvaliacao) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Ver Detalhes"
                onClick={() => router.push(`/avaliacoes/${rowData.id}`)}
            />
            <Button
                icon="pi pi-check-circle"
                className="p-button-rounded p-button-text p-button-sm p-button-success"
                tooltip="Rever e Aprovar"
                onClick={() => abrirRevisao(rowData)}
            />
            <PDFDownloadButton avaliacao={rowData} iconOnly />
        </div>
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
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Aprovações Departamentais</h2>
                        <p className="text-500 mt-1 mb-0">
                            Avaliações pendentes de revisão do seu departamento
                        </p>
                    </div>
                    <Button
                        label="Ver Resumo"
                        icon="pi pi-chart-bar"
                        className="p-button-outlined"
                        onClick={() => router.push('/departamento/resumo')}
                    />
                </div>

                {/* Resumo */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-orange-50">
                            <div className="text-500 mb-1">Pendentes de Revisão</div>
                            <div className="text-3xl font-bold text-orange-500">
                                {avaliacoes.filter(a => a.estado === 'rev_departamento').length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-blue-50">
                            <div className="text-500 mb-1">Avaliações Submetidas</div>
                            <div className="text-3xl font-bold text-blue-500">
                                {avaliacoes.filter(a => a.estado === 'aval_submetida').length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center bg-green-50">
                            <div className="text-500 mb-1">Total</div>
                            <div className="text-3xl font-bold text-green-500">{avaliacoes.length}</div>
                        </Card>
                    </div>
                </div>

                {/* Tabela */}
                <Card>
                    {avaliacoes.length === 0 ? (
                        <div className="text-center py-6">
                            <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
                            <h4 className="text-500 mt-0">Nenhuma avaliação pendente</h4>
                            <p className="text-500">
                                Não tem avaliações pendentes de revisão no momento.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            value={avaliacoes}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            emptyMessage="Nenhuma avaliação pendente."
                            className="p-datatable-sm"
                        >
                            <Column header="Trabalhador" body={trabalhadorTemplate} sortable sortField="trabalhador.nome_completo" />
                            <Column header="Avaliador" body={avaliadorTemplate} sortable sortField="avaliador.name" />
                            <Column header="Pontuação" body={pontuacaoTemplate} sortable sortField="pontuacao_avaliador" style={{ width: '150px' }} />
                            <Column header="Comparação" body={comparacaoTemplate} style={{ width: '120px' }} />
                            <Column header="Acções" body={accoesTemplate} style={{ width: '100px' }} />
                        </DataTable>
                    )}
                </Card>

                {/* Dialog de Revisão */}
                <Dialog
                    visible={reviewDialogVisible}
                    onHide={() => setReviewDialogVisible(false)}
                    header="Revisão da Avaliação"
                    style={{ width: '600px' }}
                    modal
                >
                    {selectedAvaliacao && (
                        <div className="flex flex-column gap-4">
                            {/* Info do Trabalhador */}
                            <Card className="bg-primary-50">
                                <div className="flex align-items-center gap-3">
                                    <div className="w-3rem h-3rem bg-primary border-circle flex align-items-center justify-content-center text-white font-bold">
                                        {selectedAvaliacao.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold">{selectedAvaliacao.trabalhador?.nome_completo}</div>
                                        <div className="text-500 text-sm">{selectedAvaliacao.trabalhador?.cargo}</div>
                                    </div>
                                </div>
                            </Card>

                            {/* Resumo das Pontuações */}
                            <div className="grid">
                                <div className="col-4 text-center">
                                    <div className="text-500 text-sm">Autoavaliação</div>
                                    <div className="text-xl font-bold">
                                        {selectedAvaliacao.pontuacao_auto?.toFixed(2) || '-'}
                                    </div>
                                </div>
                                <div className="col-4 text-center">
                                    <div className="text-500 text-sm">Avaliador</div>
                                    <div className="text-xl font-bold text-primary">
                                        {selectedAvaliacao.pontuacao_avaliador?.toFixed(2) || '-'}
                                    </div>
                                </div>
                                <div className="col-4 text-center">
                                    <div className="text-500 text-sm">Classificação</div>
                                    {selectedAvaliacao.classificacao_final ? (
                                        <Tag
                                            value={selectedAvaliacao.classificacao_final}
                                            style={{ backgroundColor: getClassificacaoColor(selectedAvaliacao.classificacao_final) }}
                                        />
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block mb-2 font-bold">Observações da Revisão</label>
                                <InputTextarea
                                    value={observacoesRevisor}
                                    onChange={(e) => setObservacoesRevisor(e.target.value)}
                                    rows={4}
                                    className="w-full"
                                    placeholder="Adicione observações sobre a revisão (opcional)..."
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label="Devolver"
                                    icon="pi pi-replay"
                                    className="p-button-warning"
                                    onClick={rejeitarAvaliacao}
                                    loading={submitting}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        label="Ver Detalhes"
                                        icon="pi pi-eye"
                                        className="p-button-outlined"
                                        onClick={() => {
                                            setReviewDialogVisible(false);
                                            router.push(`/avaliacoes/${selectedAvaliacao.id}`);
                                        }}
                                    />
                                    <Button
                                        label="Aprovar e Enviar para RH"
                                        icon="pi pi-check"
                                        onClick={aprovarAvaliacao}
                                        loading={submitting}
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
