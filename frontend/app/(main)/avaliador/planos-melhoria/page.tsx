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
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IPlanoMelhoria, IAvaliacao } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function PlanosMelhoriaPage() {
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [planos, setPlanos] = useState<IPlanoMelhoria[]>([]);
    const [planosAVencer, setPlanosAVencer] = useState<IPlanoMelhoria[]>([]);
    const [avaliacoesDisponiveis, setAvaliacoesDisponiveis] = useState<IAvaliacao[]>([]);
    const [activeTab, setActiveTab] = useState(0);

    // Dialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPlano, setSelectedPlano] = useState<IPlanoMelhoria | null>(null);
    const [formData, setFormData] = useState({
        avaliacao_id: null as number | null,
        area_melhoria: '',
        objectivo: '',
        accoes: '',
        recursos_necessarios: '',
        prazo: null as Date | null,
        estado: 'planeado',
        progresso: 0,
        notas_acompanhamento: '',
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [planosRes, aVencerRes, avaliacoesRes] = await Promise.all([
                api.get('/planos-melhoria/equipa'),
                api.get('/planos-melhoria/a-vencer'),
                api.get('/avaliacoes/equipa'),
            ]);
            setPlanos(planosRes.data.data || []);
            setPlanosAVencer(aVencerRes.data.data || []);
            setAvaliacoesDisponiveis(avaliacoesRes.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os planos de melhoria.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'planeado': return '#6b7280';
            case 'em_curso': return '#f59e0b';
            case 'concluido': return '#22c55e';
            case 'cancelado': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'planeado': return 'Planeado';
            case 'em_curso': return 'Em Curso';
            case 'concluido': return 'Concluído';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    };

    const abrirNovoPlano = () => {
        setEditMode(false);
        setSelectedPlano(null);
        setFormData({
            avaliacao_id: null,
            area_melhoria: '',
            objectivo: '',
            accoes: '',
            recursos_necessarios: '',
            prazo: null,
            estado: 'planeado',
            progresso: 0,
            notas_acompanhamento: '',
        });
        setDialogVisible(true);
    };

    const abrirEditarPlano = (plano: IPlanoMelhoria) => {
        setEditMode(true);
        setSelectedPlano(plano);
        setFormData({
            avaliacao_id: plano.avaliacao_id,
            area_melhoria: plano.area_melhoria,
            objectivo: plano.objectivo,
            accoes: plano.accoes,
            recursos_necessarios: plano.recursos_necessarios || '',
            prazo: plano.prazo ? new Date(plano.prazo) : null,
            estado: plano.estado,
            progresso: plano.progresso,
            notas_acompanhamento: plano.notas_acompanhamento || '',
        });
        setDialogVisible(true);
    };

    const guardarPlano = async () => {
        try {
            if (!formData.avaliacao_id && !editMode) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Atenção',
                    detail: 'Seleccione uma avaliação.',
                    life: 3000,
                });
                return;
            }

            if (!formData.area_melhoria.trim() || !formData.objectivo.trim()) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Atenção',
                    detail: 'Preencha a área de melhoria e o objectivo.',
                    life: 3000,
                });
                return;
            }

            const dados = {
                ...formData,
                prazo: formData.prazo ? formData.prazo.toISOString().split('T')[0] : null,
            };

            if (editMode && selectedPlano) {
                await api.put(`/planos-melhoria/${selectedPlano.id}`, dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Plano actualizado com sucesso!',
                    life: 3000,
                });
            } else {
                await api.post('/planos-melhoria', dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Plano criado com sucesso!',
                    life: 3000,
                });
            }

            setDialogVisible(false);
            carregarDados();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível guardar o plano.',
                life: 3000,
            });
        }
    };

    const eliminarPlano = (plano: IPlanoMelhoria) => {
        confirmDialog({
            message: 'Tem a certeza que deseja eliminar este plano?',
            header: 'Confirmar Eliminação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/planos-melhoria/${plano.id}`);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Plano eliminado!',
                        life: 3000,
                    });
                    carregarDados();
                } catch (error) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Não foi possível eliminar o plano.',
                        life: 3000,
                    });
                }
            },
        });
    };

    const trabalhadorTemplate = (rowData: IPlanoMelhoria) => (
        <div className="flex align-items-center gap-3">
            <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center text-white text-sm font-bold">
                {rowData.avaliacao?.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-bold">{rowData.avaliacao?.trabalhador?.nome_completo}</div>
                <div className="text-500 text-sm">{rowData.avaliacao?.ciclo?.nome}</div>
            </div>
        </div>
    );

    const areaTemplate = (rowData: IPlanoMelhoria) => (
        <div>
            <div className="font-semibold">{rowData.area_melhoria}</div>
            <small className="text-500 line-clamp-1">{rowData.objectivo}</small>
        </div>
    );

    const prazoTemplate = (rowData: IPlanoMelhoria) => {
        if (!rowData.prazo) return <span className="text-500">Sem prazo</span>;

        const prazo = new Date(rowData.prazo);
        const hoje = new Date();
        const diffDays = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        let severityClass = 'text-500';
        if (diffDays < 0) severityClass = 'text-red-500 font-bold';
        else if (diffDays <= 7) severityClass = 'text-orange-500 font-bold';
        else if (diffDays <= 30) severityClass = 'text-yellow-600';

        return (
            <span className={severityClass}>
                {prazo.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
        );
    };

    const progressoTemplate = (rowData: IPlanoMelhoria) => (
        <div className="w-8rem">
            <ProgressBar
                value={rowData.progresso}
                showValue={true}
                style={{ height: '20px' }}
                color={rowData.progresso === 100 ? '#22c55e' : undefined}
            />
        </div>
    );

    const estadoTemplate = (rowData: IPlanoMelhoria) => (
        <Tag
            value={getEstadoLabel(rowData.estado)}
            style={{ backgroundColor: getEstadoColor(rowData.estado) }}
        />
    );

    const accoesTemplate = (rowData: IPlanoMelhoria) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Editar"
                onClick={() => abrirEditarPlano(rowData)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-sm p-button-danger"
                tooltip="Eliminar"
                onClick={() => eliminarPlano(rowData)}
            />
            <Button
                icon="pi pi-external-link"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Ver Avaliação"
                onClick={() => router.push(`/avaliacoes/${rowData.avaliacao_id}`)}
            />
        </div>
    );

    // Estatísticas
    const estatisticas = {
        total: planos.length,
        emCurso: planos.filter(p => p.estado === 'em_curso').length,
        concluidos: planos.filter(p => p.estado === 'concluido').length,
        aVencer: planosAVencer.length,
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['criar plano-melhoria']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['criar plano-melhoria']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                {/* Cabeçalho */}
                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Planos de Melhoria</h2>
                        <p className="text-500 mt-1 mb-0">
                            Acompanhamento dos planos de desenvolvimento da equipa
                        </p>
                    </div>
                    <Button
                        label="Novo Plano"
                        icon="pi pi-plus"
                        onClick={abrirNovoPlano}
                    />
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Total</div>
                            <div className="text-2xl font-bold text-primary">{estatisticas.total}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Em Curso</div>
                            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                                {estatisticas.emCurso}
                            </div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Concluídos</div>
                            <div className="text-2xl font-bold text-green-500">{estatisticas.concluidos}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">A Vencer (30 dias)</div>
                            <div className="text-2xl font-bold text-orange-500">{estatisticas.aVencer}</div>
                        </Card>
                    </div>
                </div>

                {/* Tabs */}
                <Card>
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        <TabPanel header={`Todos os Planos (${planos.length})`} leftIcon="pi pi-list mr-2">
                            {planos.length === 0 ? (
                                <div className="text-center py-6">
                                    <i className="pi pi-chart-line text-4xl text-500 mb-3" />
                                    <h4 className="text-500 mt-0">Sem planos de melhoria</h4>
                                    <p className="text-500">
                                        Crie planos de desenvolvimento para acompanhar o progresso da sua equipa.
                                    </p>
                                    <Button
                                        label="Criar Primeiro Plano"
                                        icon="pi pi-plus"
                                        className="mt-3"
                                        onClick={abrirNovoPlano}
                                    />
                                </div>
                            ) : (
                                <DataTable
                                    value={planos}
                                    paginator
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    emptyMessage="Nenhum plano encontrado."
                                    className="p-datatable-sm"
                                    sortField="prazo"
                                    sortOrder={1}
                                >
                                    <Column header="Colaborador" body={trabalhadorTemplate} style={{ width: '200px' }} />
                                    <Column header="Área/Objectivo" body={areaTemplate} />
                                    <Column header="Prazo" body={prazoTemplate} style={{ width: '120px' }} sortable sortField="prazo" />
                                    <Column header="Progresso" body={progressoTemplate} style={{ width: '140px' }} />
                                    <Column header="Estado" body={estadoTemplate} style={{ width: '100px' }} />
                                    <Column header="Acções" body={accoesTemplate} style={{ width: '120px' }} />
                                </DataTable>
                            )}
                        </TabPanel>

                        <TabPanel
                            header={`A Vencer (${planosAVencer.length})`}
                            leftIcon="pi pi-clock mr-2"
                        >
                            {planosAVencer.length === 0 ? (
                                <div className="text-center py-6">
                                    <i className="pi pi-check-circle text-4xl text-green-500 mb-3" />
                                    <h4 className="mt-0 mb-2">Sem prazos próximos</h4>
                                    <p className="text-500">Não há planos com prazo nos próximos 30 dias.</p>
                                </div>
                            ) : (
                                <DataTable
                                    value={planosAVencer}
                                    emptyMessage="Nenhum plano a vencer."
                                    className="p-datatable-sm"
                                >
                                    <Column header="Colaborador" body={trabalhadorTemplate} style={{ width: '200px' }} />
                                    <Column header="Área/Objectivo" body={areaTemplate} />
                                    <Column header="Prazo" body={prazoTemplate} style={{ width: '120px' }} />
                                    <Column header="Progresso" body={progressoTemplate} style={{ width: '140px' }} />
                                    <Column header="Acções" body={accoesTemplate} style={{ width: '100px' }} />
                                </DataTable>
                            )}
                        </TabPanel>
                    </TabView>
                </Card>

                {/* Dialog */}
                <Dialog
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    header={editMode ? 'Editar Plano de Melhoria' : 'Novo Plano de Melhoria'}
                    style={{ width: '700px' }}
                    modal
                >
                    <div className="flex flex-column gap-4">
                        {!editMode && (
                            <div>
                                <label className="block mb-2 font-bold">Colaborador *</label>
                                <Dropdown
                                    value={formData.avaliacao_id}
                                    options={avaliacoesDisponiveis.map(a => ({
                                        label: `${a.trabalhador?.nome_completo} - ${a.ciclo?.nome}`,
                                        value: a.id,
                                    }))}
                                    onChange={(e) => setFormData({ ...formData, avaliacao_id: e.value })}
                                    placeholder="Seleccione a avaliação..."
                                    className="w-full"
                                    filter
                                />
                            </div>
                        )}

                        <div className="grid">
                            <div className="col-12 md:col-8">
                                <label className="block mb-2 font-bold">Área de Melhoria *</label>
                                <InputText
                                    value={formData.area_melhoria}
                                    onChange={(e) => setFormData({ ...formData, area_melhoria: e.target.value })}
                                    placeholder="Ex: Conhecimentos Técnicos, Comunicação..."
                                    className="w-full"
                                />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold">Prazo</label>
                                <Calendar
                                    value={formData.prazo}
                                    onChange={(e) => setFormData({ ...formData, prazo: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                    showIcon
                                    minDate={new Date()}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">Objectivo *</label>
                            <InputTextarea
                                value={formData.objectivo}
                                onChange={(e) => setFormData({ ...formData, objectivo: e.target.value })}
                                rows={2}
                                className="w-full"
                                placeholder="Descreva o objectivo a atingir..."
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">Acções a Tomar</label>
                            <InputTextarea
                                value={formData.accoes}
                                onChange={(e) => setFormData({ ...formData, accoes: e.target.value })}
                                rows={3}
                                className="w-full"
                                placeholder="1. Completar formação X&#10;2. Praticar técnica Y&#10;3. Obter certificação Z"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">Recursos Necessários</label>
                            <InputText
                                value={formData.recursos_necessarios}
                                onChange={(e) => setFormData({ ...formData, recursos_necessarios: e.target.value })}
                                placeholder="Ex: Inscrição em curso, material, tempo de estudo..."
                                className="w-full"
                            />
                        </div>

                        {editMode && (
                            <>
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <label className="block mb-2 font-bold">Estado</label>
                                        <Dropdown
                                            value={formData.estado}
                                            options={[
                                                { label: 'Planeado', value: 'planeado' },
                                                { label: 'Em Curso', value: 'em_curso' },
                                                { label: 'Concluído', value: 'concluido' },
                                                { label: 'Cancelado', value: 'cancelado' },
                                            ]}
                                            onChange={(e) => setFormData({ ...formData, estado: e.value })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <label className="block mb-2 font-bold">
                                            Progresso: {formData.progresso}%
                                        </label>
                                        <Slider
                                            value={formData.progresso}
                                            onChange={(e) => setFormData({ ...formData, progresso: e.value as number })}
                                            className="w-full mt-3"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-2 font-bold">Notas de Acompanhamento</label>
                                    <InputTextarea
                                        value={formData.notas_acompanhamento}
                                        onChange={(e) => setFormData({ ...formData, notas_acompanhamento: e.target.value })}
                                        rows={2}
                                        className="w-full"
                                        placeholder="Notas sobre o progresso do plano..."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setDialogVisible(false)}
                        />
                        <Button
                            label={editMode ? 'Actualizar' : 'Criar Plano'}
                            icon="pi pi-check"
                            onClick={guardarPlano}
                        />
                    </div>
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
