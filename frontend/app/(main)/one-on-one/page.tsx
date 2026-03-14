'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IAvaliacao } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function OneOnOnePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useRef<Toast>(null);

    const avaliacaoIdParam = searchParams.get('avaliacao');

    const [loading, setLoading] = useState(true);
    const [registos, setRegistos] = useState<any[]>([]);
    const [avaliacoesDisponiveis, setAvaliacoesDisponiveis] = useState<IAvaliacao[]>([]);

    // Dialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRegisto, setSelectedRegisto] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        avaliacao_id: null as number | null,
        data_reuniao: new Date(),
        duracao_minutos: 30,
        topicos_discutidos: '',
        accoes_acordadas: '',
        notas_privadas: '',
    });

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        if (avaliacaoIdParam) {
            setFormData(prev => ({
                ...prev,
                avaliacao_id: parseInt(avaliacaoIdParam),
            }));
            setDialogVisible(true);
        }
    }, [avaliacaoIdParam]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [registosRes, avaliacoesRes] = await Promise.all([
                api.get('/one-on-one/meus-registos'),
                api.get('/avaliacoes/equipa'),
            ]);
            setRegistos(registosRes.data.data || []);
            setAvaliacoesDisponiveis(avaliacoesRes.data.data || []);
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os dados.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const abrirNovoRegisto = () => {
        setEditMode(false);
        setSelectedRegisto(null);
        setFormData({
            avaliacao_id: avaliacaoIdParam ? parseInt(avaliacaoIdParam) : null,
            data_reuniao: new Date(),
            duracao_minutos: 30,
            topicos_discutidos: '',
            accoes_acordadas: '',
            notas_privadas: '',
        });
        setDialogVisible(true);
    };

    const abrirEditarRegisto = (registo: any) => {
        setEditMode(true);
        setSelectedRegisto(registo);
        setFormData({
            avaliacao_id: registo.avaliacao_id,
            data_reuniao: new Date(registo.data_reuniao),
            duracao_minutos: registo.duracao_minutos || 30,
            topicos_discutidos: registo.topicos_discutidos || '',
            accoes_acordadas: registo.accoes_acordadas || '',
            notas_privadas: registo.notas_privadas || '',
        });
        setDialogVisible(true);
    };

    const guardarRegisto = async () => {
        try {
            if (!formData.avaliacao_id) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Atenção',
                    detail: 'Seleccione uma avaliação.',
                    life: 3000,
                });
                return;
            }

            const dados = {
                ...formData,
                data_reuniao: formData.data_reuniao.toISOString().split('T')[0],
            };

            if (editMode && selectedRegisto) {
                await api.put(`/one-on-one/${selectedRegisto.id}`, dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Registo actualizado!',
                    life: 3000,
                });
            } else {
                await api.post('/one-on-one', dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Registo criado!',
                    life: 3000,
                });
            }

            setDialogVisible(false);
            carregarDados();
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível guardar.',
                life: 3000,
            });
        }
    };

    const eliminarRegisto = (registo: any) => {
        confirmDialog({
            message: 'Tem a certeza que deseja eliminar este registo?',
            header: 'Confirmar Eliminação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/one-on-one/${registo.id}`);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Registo eliminado!',
                        life: 3000,
                    });
                    carregarDados();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Não foi possível eliminar o registo.',
                        life: 3000,
                    });
                }
            },
        });
    };

    const trabalhadorTemplate = (rowData: any) => (
        <div className="flex align-items-center gap-3">
            <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center text-white text-sm font-bold">
                {rowData.avaliacao?.trabalhador?.nome_completo?.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-bold">{rowData.avaliacao?.trabalhador?.nome_completo}</div>
                <div className="text-500 text-sm">{rowData.avaliacao?.trabalhador?.cargo}</div>
            </div>
        </div>
    );

    const dataTemplate = (rowData: any) => {
        const data = new Date(rowData.data_reuniao);
        return data.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const resumoTemplate = (rowData: any) => {
        const texto = rowData.topicos_discutidos || '';
        return (
            <span className="text-sm">
                {texto.length > 100 ? texto.substring(0, 100) + '...' : texto}
            </span>
        );
    };

    const accoesTemplate = (rowData: any) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-eye"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Ver Detalhes"
                onClick={() => abrirEditarRegisto(rowData)}
            />
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-sm p-button-warning"
                tooltip="Editar"
                onClick={() => abrirEditarRegisto(rowData)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-sm p-button-danger"
                tooltip="Eliminar"
                onClick={() => eliminarRegisto(rowData)}
            />
        </div>
    );

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['registar one-on-one']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['registar one-on-one']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Reuniões One-on-One</h2>
                        <p className="text-500 mt-1 mb-0">
                            Registo de reuniões de feedback com a equipa
                        </p>
                    </div>
                    <Button
                        label="Nova Reunião"
                        icon="pi pi-plus"
                        onClick={abrirNovoRegisto}
                    />
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Total de Reuniões</div>
                            <div className="text-2xl font-bold text-primary">{registos.length}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Este Mês</div>
                            <div className="text-2xl font-bold text-green-500">
                                {registos.filter(r => {
                                    const dataReuniao = new Date(r.data_reuniao);
                                    const agora = new Date();
                                    return dataReuniao.getMonth() === agora.getMonth() &&
                                           dataReuniao.getFullYear() === agora.getFullYear();
                                }).length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Colaboradores</div>
                            <div className="text-2xl font-bold text-blue-500">
                                {new Set(registos.map(r => r.avaliacao?.trabalhador_id)).size}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Tabela */}
                <Card>
                    {registos.length === 0 ? (
                        <div className="text-center py-6">
                            <i className="pi pi-comments text-4xl text-500 mb-3" />
                            <h4 className="text-500 mt-0">Sem registos de reuniões</h4>
                            <p className="text-500">
                                Comece a registar as reuniões de feedback com a sua equipa.
                            </p>
                            <Button
                                label="Registar Primeira Reunião"
                                icon="pi pi-plus"
                                className="mt-3"
                                onClick={abrirNovoRegisto}
                            />
                        </div>
                    ) : (
                        <DataTable
                            value={registos}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            emptyMessage="Nenhum registo encontrado."
                            className="p-datatable-sm"
                            sortField="data_reuniao"
                            sortOrder={-1}
                        >
                            <Column header="Colaborador" body={trabalhadorTemplate} sortable sortField="avaliacao.trabalhador.nome_completo" />
                            <Column header="Data" body={dataTemplate} sortable sortField="data_reuniao" style={{ width: '120px' }} />
                            <Column header="Tópicos Discutidos" body={resumoTemplate} />
                            <Column header="Acções" body={accoesTemplate} style={{ width: '120px' }} />
                        </DataTable>
                    )}
                </Card>

                {/* Dialog */}
                <Dialog
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    header={editMode ? 'Editar Registo' : 'Nova Reunião One-on-One'}
                    style={{ width: '700px' }}
                    modal
                >
                    <div className="flex flex-column gap-4">
                        <div className="grid">
                            <div className="col-12 md:col-5">
                                <label className="block mb-2 font-bold">Colaborador *</label>
                                <Dropdown
                                    value={formData.avaliacao_id}
                                    options={avaliacoesDisponiveis.map(a => ({
                                        label: a.trabalhador?.nome_completo,
                                        value: a.id,
                                    }))}
                                    onChange={(e) => setFormData({ ...formData, avaliacao_id: e.value })}
                                    placeholder="Seleccione..."
                                    className="w-full"
                                    filter
                                    disabled={editMode}
                                />
                            </div>
                            <div className="col-12 md:col-4">
                                <label className="block mb-2 font-bold">Data da Reunião *</label>
                                <Calendar
                                    value={formData.data_reuniao}
                                    onChange={(e) => setFormData({ ...formData, data_reuniao: e.value as Date })}
                                    dateFormat="dd/mm/yy"
                                    className="w-full"
                                    showIcon
                                />
                            </div>
                            <div className="col-12 md:col-3">
                                <label className="block mb-2 font-bold">Duração (min)</label>
                                <Dropdown
                                    value={formData.duracao_minutos}
                                    options={[
                                        { label: '15 min', value: 15 },
                                        { label: '30 min', value: 30 },
                                        { label: '45 min', value: 45 },
                                        { label: '60 min', value: 60 },
                                        { label: '90 min', value: 90 },
                                        { label: '120 min', value: 120 },
                                    ]}
                                    onChange={(e) => setFormData({ ...formData, duracao_minutos: e.value })}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">
                                <i className="pi pi-list mr-2 text-primary" />
                                Tópicos Discutidos
                            </label>
                            <InputTextarea
                                value={formData.topicos_discutidos}
                                onChange={(e) => setFormData({ ...formData, topicos_discutidos: e.target.value })}
                                rows={4}
                                className="w-full"
                                placeholder="- Revisão do desempenho no período&#10;- Objectivos para o próximo trimestre&#10;- Necessidades de formação"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">
                                <i className="pi pi-check-square mr-2 text-green-500" />
                                Acções Acordadas
                            </label>
                            <InputTextarea
                                value={formData.accoes_acordadas}
                                onChange={(e) => setFormData({ ...formData, accoes_acordadas: e.target.value })}
                                rows={3}
                                className="w-full"
                                placeholder="- Completar formação de Excel&#10;- Assumir liderança no projecto X"
                            />
                        </div>

                        <div>
                            <div className="flex align-items-center gap-2 mb-2">
                                <label className="font-bold m-0">
                                    <i className="pi pi-lock mr-2 text-500" />
                                    Notas Privadas
                                </label>
                                <Tag value="Não partilhadas" severity="secondary" className="text-xs" />
                            </div>
                            <InputTextarea
                                value={formData.notas_privadas}
                                onChange={(e) => setFormData({ ...formData, notas_privadas: e.target.value })}
                                rows={3}
                                className="w-full"
                                placeholder="Notas pessoais sobre a reunião (visíveis apenas para si)..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-content-end gap-2 mt-4 pt-3 border-top-1 surface-border">
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setDialogVisible(false)}
                        />
                        <Button
                            label={editMode ? 'Actualizar' : 'Guardar'}
                            icon="pi pi-check"
                            onClick={guardarRegisto}
                        />
                    </div>
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
