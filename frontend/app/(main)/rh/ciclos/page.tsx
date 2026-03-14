'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { ICicloAvaliacao } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function CiclosPage() {
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [ciclos, setCiclos] = useState<ICicloAvaliacao[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCiclo, setSelectedCiclo] = useState<ICicloAvaliacao | null>(null);
    const [formData, setFormData] = useState({
        ano: new Date().getFullYear(),
        nome: '',
        descricao: '',
        data_inicio_autoavaliacao: null as Date | null,
        data_fim_autoavaliacao: null as Date | null,
        data_inicio_avaliacao: null as Date | null,
        data_fim_avaliacao: null as Date | null,
        data_inicio_revisao: null as Date | null,
        data_fim_revisao: null as Date | null,
    });

    useEffect(() => {
        carregarCiclos();
    }, []);

    const carregarCiclos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/ciclos');
            setCiclos(response.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar ciclos:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os ciclos.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const abrirNovoCiclo = () => {
        setEditMode(false);
        setSelectedCiclo(null);
        setFormData({
            ano: new Date().getFullYear(),
            nome: `Avaliação de Desempenho ${new Date().getFullYear()}`,
            descricao: '',
            data_inicio_autoavaliacao: null,
            data_fim_autoavaliacao: null,
            data_inicio_avaliacao: null,
            data_fim_avaliacao: null,
            data_inicio_revisao: null,
            data_fim_revisao: null,
        });
        setDialogVisible(true);
    };

    const abrirEditarCiclo = (ciclo: ICicloAvaliacao) => {
        setEditMode(true);
        setSelectedCiclo(ciclo);
        setFormData({
            ano: ciclo.ano,
            nome: ciclo.nome,
            descricao: ciclo.descricao || '',
            data_inicio_autoavaliacao: ciclo.data_inicio_autoavaliacao ? new Date(ciclo.data_inicio_autoavaliacao) : null,
            data_fim_autoavaliacao: ciclo.data_fim_autoavaliacao ? new Date(ciclo.data_fim_autoavaliacao) : null,
            data_inicio_avaliacao: ciclo.data_inicio_avaliacao ? new Date(ciclo.data_inicio_avaliacao) : null,
            data_fim_avaliacao: ciclo.data_fim_avaliacao ? new Date(ciclo.data_fim_avaliacao) : null,
            data_inicio_revisao: ciclo.data_inicio_revisao ? new Date(ciclo.data_inicio_revisao) : null,
            data_fim_revisao: ciclo.data_fim_revisao ? new Date(ciclo.data_fim_revisao) : null,
        });
        setDialogVisible(true);
    };

    const guardarCiclo = async () => {
        try {
            const dados = {
                ...formData,
                data_inicio_autoavaliacao: formData.data_inicio_autoavaliacao?.toISOString().split('T')[0],
                data_fim_autoavaliacao: formData.data_fim_autoavaliacao?.toISOString().split('T')[0],
                data_inicio_avaliacao: formData.data_inicio_avaliacao?.toISOString().split('T')[0],
                data_fim_avaliacao: formData.data_fim_avaliacao?.toISOString().split('T')[0],
                data_inicio_revisao: formData.data_inicio_revisao?.toISOString().split('T')[0],
                data_fim_revisao: formData.data_fim_revisao?.toISOString().split('T')[0],
            };

            if (editMode && selectedCiclo) {
                await api.put(`/ciclos/${selectedCiclo.id}`, dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Ciclo actualizado com sucesso!',
                    life: 3000,
                });
            } else {
                await api.post('/ciclos', dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Ciclo criado com sucesso!',
                    life: 3000,
                });
            }

            setDialogVisible(false);
            carregarCiclos();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível guardar o ciclo.',
                life: 3000,
            });
        }
    };

    const alterarEstado = async (ciclo: ICicloAvaliacao, novoEstado: string) => {
        confirmDialog({
            message: `Tem a certeza que deseja alterar o estado para "${novoEstado}"?`,
            header: 'Confirmar Alteração',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: async () => {
                try {
                    await api.post(`/ciclos/${ciclo.id}/estado`, { estado: novoEstado });
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Estado alterado com sucesso!',
                        life: 3000,
                    });
                    carregarCiclos();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: error.response?.data?.message || 'Não foi possível alterar o estado.',
                        life: 3000,
                    });
                }
            },
        });
    };

    const getEstadoSeverity = (estado: string) => {
        const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            planeado: 'secondary',
            autoavaliacao: 'info',
            avaliacao: 'warning',
            revisao: 'danger',
            concluido: 'success',
        };
        return severities[estado] || 'secondary';
    };

    const estadoTemplate = (rowData: ICicloAvaliacao) => {
        return (
            <Tag
                value={rowData.estado.charAt(0).toUpperCase() + rowData.estado.slice(1)}
                severity={getEstadoSeverity(rowData.estado)}
            />
        );
    };

    const datasTemplate = (rowData: ICicloAvaliacao) => {
        const formatDate = (date: string | null) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
        };

        return (
            <div className="text-sm">
                <div className="flex justify-content-between gap-2">
                    <span className="text-500">Auto:</span>
                    <span>{formatDate(rowData.data_inicio_autoavaliacao)} - {formatDate(rowData.data_fim_autoavaliacao)}</span>
                </div>
                <div className="flex justify-content-between gap-2">
                    <span className="text-500">Aval:</span>
                    <span>{formatDate(rowData.data_inicio_avaliacao)} - {formatDate(rowData.data_fim_avaliacao)}</span>
                </div>
                <div className="flex justify-content-between gap-2">
                    <span className="text-500">Rev:</span>
                    <span>{formatDate(rowData.data_inicio_revisao)} - {formatDate(rowData.data_fim_revisao)}</span>
                </div>
            </div>
        );
    };

    const accoesTemplate = (rowData: ICicloAvaliacao) => {
        const proximoEstado: Record<string, string> = {
            planeado: 'autoavaliacao',
            autoavaliacao: 'avaliacao',
            avaliacao: 'revisao',
            revisao: 'concluido',
        };

        return (
            <div className="flex gap-1">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-sm"
                    tooltip="Editar"
                    onClick={() => abrirEditarCiclo(rowData)}
                    disabled={rowData.estado === 'concluido'}
                />
                {rowData.estado !== 'concluido' && proximoEstado[rowData.estado] && (
                    <Button
                        icon="pi pi-forward"
                        className="p-button-rounded p-button-text p-button-sm p-button-success"
                        tooltip={`Avançar para ${proximoEstado[rowData.estado]}`}
                        onClick={() => alterarEstado(rowData, proximoEstado[rowData.estado])}
                    />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['gerir ciclos']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['gerir ciclos']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Ciclos de Avaliação</h2>
                        <p className="text-500 mt-1 mb-0">
                            Gestão dos ciclos de avaliação de desempenho
                        </p>
                    </div>
                    <Button
                        label="Novo Ciclo"
                        icon="pi pi-plus"
                        onClick={abrirNovoCiclo}
                    />
                </div>

                <Card>
                    <DataTable
                        value={ciclos}
                        paginator
                        rows={10}
                        emptyMessage="Nenhum ciclo encontrado."
                        className="p-datatable-sm"
                        sortField="ano"
                        sortOrder={-1}
                    >
                        <Column field="ano" header="Ano" sortable style={{ width: '80px' }} />
                        <Column field="nome" header="Nome" sortable />
                        <Column header="Estado" body={estadoTemplate} sortable sortField="estado" style={{ width: '120px' }} />
                        <Column header="Períodos" body={datasTemplate} style={{ width: '250px' }} />
                        <Column header="Acções" body={accoesTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

                {/* Dialog de Criação/Edição */}
                <Dialog
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    header={editMode ? 'Editar Ciclo' : 'Novo Ciclo'}
                    style={{ width: '600px' }}
                    modal
                >
                    <div className="flex flex-column gap-4">
                        <div className="grid">
                            <div className="col-4">
                                <label className="block mb-2 font-bold">Ano</label>
                                <InputText
                                    type="number"
                                    value={formData.ano.toString()}
                                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div className="col-8">
                                <label className="block mb-2 font-bold">Nome</label>
                                <InputText
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">Descrição</label>
                            <InputTextarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                rows={2}
                                className="w-full"
                            />
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Início Autoavaliação</label>
                                <Calendar
                                    value={formData.data_inicio_autoavaliacao}
                                    onChange={(e) => setFormData({ ...formData, data_inicio_autoavaliacao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Fim Autoavaliação</label>
                                <Calendar
                                    value={formData.data_fim_autoavaliacao}
                                    onChange={(e) => setFormData({ ...formData, data_fim_autoavaliacao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Início Avaliação</label>
                                <Calendar
                                    value={formData.data_inicio_avaliacao}
                                    onChange={(e) => setFormData({ ...formData, data_inicio_avaliacao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Fim Avaliação</label>
                                <Calendar
                                    value={formData.data_fim_avaliacao}
                                    onChange={(e) => setFormData({ ...formData, data_fim_avaliacao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Início Revisão</label>
                                <Calendar
                                    value={formData.data_inicio_revisao}
                                    onChange={(e) => setFormData({ ...formData, data_inicio_revisao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                            <div className="col-6">
                                <label className="block mb-2 font-bold">Fim Revisão</label>
                                <Calendar
                                    value={formData.data_fim_revisao}
                                    onChange={(e) => setFormData({ ...formData, data_fim_revisao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-content-end gap-2 mt-4">
                            <Button
                                label="Cancelar"
                                icon="pi pi-times"
                                className="p-button-text"
                                onClick={() => setDialogVisible(false)}
                            />
                            <Button
                                label={editMode ? 'Actualizar' : 'Criar'}
                                icon="pi pi-check"
                                onClick={guardarCiclo}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
