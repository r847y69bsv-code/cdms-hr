'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IAvaliacao, ICicloAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { PDFDownloadButton } from '@/app/components/PDFAvaliacao';
import { ExportarAvaliacoesExcel } from '@/app/components/ExcelExport';

export default function TodasAvaliacoesPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [avaliacoes, setAvaliacoes] = useState<IAvaliacao[]>([]);
    const [ciclos, setCiclos] = useState<ICicloAvaliacao[]>([]);
    const [departamentos, setDepartamentos] = useState<string[]>([]);

    // Filtros
    const [cicloFilter, setCicloFilter] = useState<number | null>(null);
    const [departamentoFilter, setDepartamentoFilter] = useState<string | null>(null);
    const [estadoFilter, setEstadoFilter] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');

    // Paginação
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(25);

    // Dialog de revisão RH
    const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
    const [selectedAvaliacao, setSelectedAvaliacao] = useState<IAvaliacao | null>(null);
    const [observacoesRH, setObservacoesRH] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        carregarAvaliacoes();
    }, [cicloFilter, departamentoFilter, estadoFilter]);

    const carregarDados = async () => {
        try {
            const [ciclosRes, deptsRes] = await Promise.all([
                api.get('/ciclos'),
                api.get('/trabalhadores/departamentos'),
            ]);
            setCiclos(ciclosRes.data.data || []);
            setDepartamentos(deptsRes.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const carregarAvaliacoes = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (cicloFilter) params.append('ciclo_id', cicloFilter.toString());
            if (departamentoFilter) params.append('departamento', departamentoFilter);
            if (estadoFilter) params.append('estado', estadoFilter);
            params.append('per_page', '100');

            const response = await api.get(`/avaliacoes?${params.toString()}`);
            setAvaliacoes(response.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar avaliações:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar as avaliações.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const estadosOptions = [
        { label: 'Todos', value: null },
        { label: 'Rascunho', value: 'rascunho' },
        { label: 'Auto Submetida', value: 'auto_submetida' },
        { label: 'Em Avaliação', value: 'aval_rascunho' },
        { label: 'Avaliação Submetida', value: 'aval_submetida' },
        { label: 'Revisão Departamental', value: 'rev_departamento' },
        { label: 'Revisão RH', value: 'rev_rh' },
        { label: 'Aprovada', value: 'aprovada' },
        { label: 'Feedback', value: 'feedback_feito' },
        { label: 'Contestada', value: 'contestada' },
    ];

    const getAvaliacoesFiltradas = () => {
        if (!globalFilter) return avaliacoes;

        const search = globalFilter.toLowerCase();
        return avaliacoes.filter(a =>
            a.trabalhador?.nome_completo?.toLowerCase().includes(search) ||
            a.trabalhador?.numero_funcionario?.toLowerCase().includes(search) ||
            a.avaliador?.name?.toLowerCase().includes(search)
        );
    };

    const trabalhadorTemplate = (rowData: IAvaliacao) => (
        <div>
            <div className="font-bold">{rowData.trabalhador?.nome_completo}</div>
            <div className="text-500 text-sm">{rowData.trabalhador?.numero_funcionario}</div>
        </div>
    );

    const estadoTemplate = (rowData: IAvaliacao) => (
        <Tag
            value={getEstadoAvaliacaoLabel(rowData.estado)}
            style={{ backgroundColor: getEstadoAvaliacaoColor(rowData.estado) }}
        />
    );

    const pontuacaoTemplate = (rowData: IAvaliacao) => {
        if (!rowData.pontuacao_final) {
            return <span className="text-500">-</span>;
        }
        return (
            <div className="flex align-items-center gap-2">
                <span className="font-bold">{rowData.pontuacao_final.toFixed(2)}</span>
                <Tag
                    value={rowData.classificacao_final || ''}
                    style={{ backgroundColor: getClassificacaoColor(rowData.classificacao_final || '') }}
                    className="text-xs"
                />
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
            {rowData.estado === 'rev_departamento' && (
                <Button
                    icon="pi pi-check-circle"
                    className="p-button-rounded p-button-text p-button-sm p-button-success"
                    tooltip="Rever e Aprovar"
                    onClick={() => abrirRevisao(rowData)}
                />
            )}
            <PDFDownloadButton avaliacao={rowData} iconOnly />
        </div>
    );

    const abrirRevisao = (avaliacao: IAvaliacao) => {
        setSelectedAvaliacao(avaliacao);
        setObservacoesRH('');
        setReviewDialogVisible(true);
    };

    const aprovarAvaliacao = async () => {
        if (!selectedAvaliacao) return;

        setSubmitting(true);
        try {
            await api.post(`/avaliacoes/${selectedAvaliacao.id}/aprovar-rh`, {
                observacoes_rh: observacoesRH,
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Avaliação aprovada com sucesso!',
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

    const devolverAvaliacao = () => {
        if (!selectedAvaliacao) return;

        confirmDialog({
            message: 'Tem a certeza que deseja devolver esta avaliação para revisão departamental?',
            header: 'Confirmar Devolução',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Devolver',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-warning',
            accept: async () => {
                setSubmitting(true);
                try {
                    await api.post(`/avaliacoes/${selectedAvaliacao.id}/devolver-rh`, {
                        observacoes_rh: observacoesRH,
                    });
                    toast.current?.show({
                        severity: 'info',
                        summary: 'Devolvida',
                        detail: 'Avaliação devolvida para revisão departamental.',
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

    // Estatísticas
    const calcularEstatisticas = () => {
        const total = avaliacoes.length;
        const concluidas = avaliacoes.filter(a => ['aprovada', 'feedback_feito'].includes(a.estado)).length;
        const pendentesRH = avaliacoes.filter(a => a.estado === 'rev_rh').length;
        const contestadas = avaliacoes.filter(a => a.estado === 'contestada').length;

        const comPontuacao = avaliacoes.filter(a => a.pontuacao_final);
        const media = comPontuacao.length > 0
            ? comPontuacao.reduce((acc, a) => acc + (a.pontuacao_final || 0), 0) / comPontuacao.length
            : 0;

        return { total, concluidas, pendentesRH, contestadas, media };
    };

    const stats = calcularEstatisticas();

    if (loading && avaliacoes.length === 0) {
        return (
            <RestrictedRoute requiredPermissions={['ver todas-avaliacoes']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['ver todas-avaliacoes']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Todas as Avaliações</h2>
                        <p className="text-500 mt-1 mb-0">
                            Visão completa de todas as avaliações da organização
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ExportarAvaliacoesExcel
                            data={getAvaliacoesFiltradas()}
                            filename={`avaliacoes${cicloFilter ? `_ciclo_${cicloFilter}` : ''}`}
                        />
                        <Button
                            label="Relatórios"
                            icon="pi pi-chart-bar"
                            onClick={() => router.push('/rh/relatorios')}
                        />
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-6 md:col-2">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Total</div>
                            <div className="text-2xl font-bold text-primary">{stats.total}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-2">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Concluídas</div>
                            <div className="text-2xl font-bold text-green-500">{stats.concluidas}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-2">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Pendentes RH</div>
                            <div className="text-2xl font-bold text-orange-500">{stats.pendentesRH}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-2">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Contestadas</div>
                            <div className="text-2xl font-bold text-red-500">{stats.contestadas}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 text-sm mb-1">Média Global</div>
                            <div className="text-2xl font-bold text-blue-500">
                                {stats.media > 0 ? stats.media.toFixed(2) : '-'}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="mb-4">
                    <div className="flex flex-column md:flex-row gap-3">
                        <div className="flex-1">
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-search" />
                                <InputText
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="Pesquisar por nome ou número..."
                                    className="w-full"
                                />
                            </span>
                        </div>
                        <Dropdown
                            value={cicloFilter}
                            options={[{ label: 'Todos os Ciclos', value: null }, ...ciclos.map(c => ({ label: c.nome, value: c.id }))]}
                            onChange={(e) => setCicloFilter(e.value)}
                            placeholder="Ciclo"
                            className="w-full md:w-auto"
                            style={{ minWidth: '180px' }}
                        />
                        <Dropdown
                            value={departamentoFilter}
                            options={[{ label: 'Todos os Dept.', value: null }, ...departamentos.map(d => ({ label: d, value: d }))]}
                            onChange={(e) => setDepartamentoFilter(e.value)}
                            placeholder="Departamento"
                            className="w-full md:w-auto"
                            style={{ minWidth: '180px' }}
                        />
                        <Dropdown
                            value={estadoFilter}
                            options={estadosOptions}
                            onChange={(e) => setEstadoFilter(e.value)}
                            placeholder="Estado"
                            className="w-full md:w-auto"
                            style={{ minWidth: '150px' }}
                        />
                    </div>
                </Card>

                {/* Tabela */}
                <Card>
                    <DataTable
                        value={getAvaliacoesFiltradas()}
                        paginator
                        first={first}
                        rows={rows}
                        onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        emptyMessage="Nenhuma avaliação encontrada."
                        className="p-datatable-sm"
                        loading={loading}
                        sortField="trabalhador.nome_completo"
                        sortOrder={1}
                    >
                        <Column header="Trabalhador" body={trabalhadorTemplate} sortable sortField="trabalhador.nome_completo" />
                        <Column field="trabalhador.departamento" header="Departamento" sortable />
                        <Column field="trabalhador.cargo" header="Cargo" sortable />
                        <Column field="avaliador.name" header="Avaliador" sortable />
                        <Column header="Estado" body={estadoTemplate} sortable sortField="estado" style={{ width: '140px' }} />
                        <Column header="Pontuação" body={pontuacaoTemplate} sortable sortField="pontuacao_final" style={{ width: '160px' }} />
                        <Column header="Acções" body={accoesTemplate} style={{ width: '120px' }} />
                    </DataTable>
                </Card>

                {/* Dialog de Revisão RH */}
                <Dialog
                    visible={reviewDialogVisible}
                    onHide={() => setReviewDialogVisible(false)}
                    header="Revisão RH"
                    style={{ width: '650px' }}
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
                                        <div className="text-500 text-sm">
                                            {selectedAvaliacao.trabalhador?.cargo} - {selectedAvaliacao.trabalhador?.departamento}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Resumo das Pontuações */}
                            <div className="grid">
                                <div className="col-3 text-center">
                                    <div className="text-500 text-sm">Autoavaliação</div>
                                    <div className="text-xl font-bold">
                                        {selectedAvaliacao.pontuacao_auto?.toFixed(2) || '-'}
                                    </div>
                                </div>
                                <div className="col-3 text-center">
                                    <div className="text-500 text-sm">Avaliador</div>
                                    <div className="text-xl font-bold text-primary">
                                        {selectedAvaliacao.pontuacao_avaliador?.toFixed(2) || '-'}
                                    </div>
                                </div>
                                <div className="col-3 text-center">
                                    <div className="text-500 text-sm">Final</div>
                                    <div className="text-xl font-bold text-green-500">
                                        {selectedAvaliacao.pontuacao_final?.toFixed(2) || '-'}
                                    </div>
                                </div>
                                <div className="col-3 text-center">
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

                            {/* Info do Revisor Departamental */}
                            {selectedAvaliacao.observacoes_revisor && (
                                <div className="p-3 surface-100 border-round">
                                    <div className="text-500 text-sm mb-1">Observações do Revisor Departamental:</div>
                                    <p className="m-0">{selectedAvaliacao.observacoes_revisor}</p>
                                </div>
                            )}

                            {/* Observações RH */}
                            <div>
                                <label className="block mb-2 font-bold">Observações RH</label>
                                <InputTextarea
                                    value={observacoesRH}
                                    onChange={(e) => setObservacoesRH(e.target.value)}
                                    rows={4}
                                    className="w-full"
                                    placeholder="Adicione observações sobre a revisão (opcional para aprovação, obrigatório para devolução)..."
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex justify-content-between gap-2">
                                <Button
                                    label="Devolver"
                                    icon="pi pi-replay"
                                    className="p-button-warning"
                                    onClick={devolverAvaliacao}
                                    loading={submitting}
                                    disabled={!observacoesRH.trim()}
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
                                        label="Aprovar Avaliação"
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
