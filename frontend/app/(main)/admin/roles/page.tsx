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
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { api } from '@/app/api';
import { IRole, IPermission } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

interface PermissaoAgrupada {
    modulo: string;
    permissoes: IPermission[];
}

export default function RolesPage() {
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [permissoesAgrupadas, setPermissoesAgrupadas] = useState<PermissaoAgrupada[]>([]);

    // Dialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        permissions: [] as string[],
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [rolesRes, permissionsRes] = await Promise.all([
                api.get('/roles'),
                api.get('/permissions'),
            ]);
            setRoles(rolesRes.data.data || []);
            const perms = permissionsRes.data.data || [];
            setPermissions(perms);

            // Agrupar permissões por módulo
            const grupos: Record<string, IPermission[]> = {};
            perms.forEach((p: IPermission) => {
                // Extrair módulo do nome da permissão (ex: "acesso modulo-avaliacao" -> "modulo-avaliacao")
                const partes = p.name.split(' ');
                let modulo = 'geral';
                if (partes.length > 1) {
                    modulo = partes[partes.length - 1];
                    if (modulo.includes('-')) {
                        modulo = modulo.split('-')[0];
                    }
                }
                // Simplificar agrupamento
                if (p.name.includes('avaliacao') || p.name.includes('autoavaliacao')) {
                    modulo = 'avaliacoes';
                } else if (p.name.includes('ciclo')) {
                    modulo = 'ciclos';
                } else if (p.name.includes('utilizador') || p.name.includes('user')) {
                    modulo = 'utilizadores';
                } else if (p.name.includes('role') || p.name.includes('permission')) {
                    modulo = 'permissoes';
                } else if (p.name.includes('trabalhador') || p.name.includes('equipa')) {
                    modulo = 'trabalhadores';
                } else if (p.name.includes('one-on-one') || p.name.includes('plano')) {
                    modulo = 'feedback';
                } else if (p.name.includes('relatorio') || p.name.includes('dashboard')) {
                    modulo = 'relatorios';
                } else if (p.name.includes('admin') || p.name.includes('configuracao')) {
                    modulo = 'administracao';
                }

                if (!grupos[modulo]) {
                    grupos[modulo] = [];
                }
                grupos[modulo].push(p);
            });

            setPermissoesAgrupadas(
                Object.entries(grupos).map(([modulo, permissoes]) => ({
                    modulo,
                    permissoes,
                }))
            );
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

    const abrirNovoRole = () => {
        setEditMode(false);
        setSelectedRole(null);
        setFormData({
            name: '',
            permissions: [],
        });
        setDialogVisible(true);
    };

    const abrirEditarRole = (role: IRole) => {
        setEditMode(true);
        setSelectedRole(role);
        setFormData({
            name: role.name,
            permissions: role.permissions?.map(p => p.name) || [],
        });
        setDialogVisible(true);
    };

    const guardarRole = async () => {
        try {
            if (!formData.name.trim()) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Atenção',
                    detail: 'O nome do papel é obrigatório.',
                    life: 3000,
                });
                return;
            }

            if (editMode && selectedRole) {
                await api.put(`/roles/${selectedRole.id}`, formData);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Papel actualizado!',
                    life: 3000,
                });
            } else {
                await api.post('/roles', formData);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Papel criado!',
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

    const eliminarRole = (role: IRole) => {
        if (['admin', 'rh', 'avaliador', 'trabalhador'].includes(role.name)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Não é possível eliminar papéis do sistema.',
                life: 3000,
            });
            return;
        }

        confirmDialog({
            message: `Tem a certeza que deseja eliminar o papel "${role.name}"?`,
            header: 'Confirmar Eliminação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/roles/${role.id}`);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Papel eliminado!',
                        life: 3000,
                    });
                    carregarDados();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Não foi possível eliminar o papel.',
                        life: 3000,
                    });
                }
            },
        });
    };

    const togglePermission = (permissionName: string) => {
        setFormData(prev => {
            const perms = [...prev.permissions];
            const index = perms.indexOf(permissionName);
            if (index > -1) {
                perms.splice(index, 1);
            } else {
                perms.push(permissionName);
            }
            return { ...prev, permissions: perms };
        });
    };

    const toggleModulo = (modulo: PermissaoAgrupada) => {
        const todasPermissoesModulo = modulo.permissoes.map(p => p.name);
        const todasSeleccionadas = todasPermissoesModulo.every(p => formData.permissions.includes(p));

        setFormData(prev => {
            let perms = [...prev.permissions];
            if (todasSeleccionadas) {
                // Remover todas
                perms = perms.filter(p => !todasPermissoesModulo.includes(p));
            } else {
                // Adicionar todas que faltam
                todasPermissoesModulo.forEach(p => {
                    if (!perms.includes(p)) {
                        perms.push(p);
                    }
                });
            }
            return { ...prev, permissions: perms };
        });
    };

    const nomeTemplate = (rowData: IRole) => (
        <div className="flex align-items-center gap-2">
            <i className="pi pi-shield text-primary" />
            <span className="font-bold">{rowData.name}</span>
            {['admin', 'rh', 'avaliador', 'trabalhador', 'chefe_departamento'].includes(rowData.name) && (
                <Tag value="Sistema" severity="secondary" className="text-xs" />
            )}
        </div>
    );

    const permissoesTemplate = (rowData: IRole) => {
        const count = rowData.permissions?.length || 0;
        return (
            <div className="flex align-items-center gap-2">
                <Tag value={count.toString()} severity={count > 0 ? 'info' : 'secondary'} />
                <span className="text-500 text-sm">
                    {count === 1 ? 'permissão' : 'permissões'}
                </span>
            </div>
        );
    };

    const utilizadoresTemplate = (rowData: IRole) => {
        const count = rowData.users_count || 0;
        return (
            <span className={count > 0 ? 'font-semibold' : 'text-500'}>
                {count}
            </span>
        );
    };

    const accoesTemplate = (rowData: IRole) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Editar"
                onClick={() => abrirEditarRole(rowData)}
            />
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-sm p-button-danger"
                tooltip="Eliminar"
                onClick={() => eliminarRole(rowData)}
                disabled={['admin', 'rh', 'avaliador', 'trabalhador', 'chefe_departamento'].includes(rowData.name)}
            />
        </div>
    );

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['gerir roles']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['gerir roles']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Gestão de Papéis</h2>
                        <p className="text-500 mt-1 mb-0">
                            Configurar papéis e permissões do sistema
                        </p>
                    </div>
                    <Button
                        label="Novo Papel"
                        icon="pi pi-plus"
                        onClick={abrirNovoRole}
                    />
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Total de Papéis</div>
                            <div className="text-2xl font-bold text-primary">{roles.length}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Permissões Disponíveis</div>
                            <div className="text-2xl font-bold text-blue-500">{permissions.length}</div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-4">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Módulos</div>
                            <div className="text-2xl font-bold text-green-500">{permissoesAgrupadas.length}</div>
                        </Card>
                    </div>
                </div>

                {/* Tabela */}
                <Card>
                    <DataTable
                        value={roles}
                        paginator
                        rows={10}
                        emptyMessage="Nenhum papel encontrado."
                        className="p-datatable-sm"
                    >
                        <Column header="Papel" body={nomeTemplate} sortable sortField="name" />
                        <Column header="Permissões" body={permissoesTemplate} />
                        <Column header="Utilizadores" body={utilizadoresTemplate} style={{ width: '120px' }} />
                        <Column header="Acções" body={accoesTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

                {/* Dialog */}
                <Dialog
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    header={editMode ? 'Editar Papel' : 'Novo Papel'}
                    style={{ width: '700px' }}
                    modal
                >
                    <div className="flex flex-column gap-4">
                        <div>
                            <label className="block mb-2 font-bold">Nome do Papel *</label>
                            <InputText
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full"
                                placeholder="Ex: supervisor"
                                disabled={editMode && ['admin', 'rh', 'avaliador', 'trabalhador', 'chefe_departamento'].includes(selectedRole?.name || '')}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">
                                Permissões ({formData.permissions.length} seleccionadas)
                            </label>
                            <Accordion multiple>
                                {permissoesAgrupadas.map((grupo, index) => {
                                    const todasSeleccionadas = grupo.permissoes.every(p =>
                                        formData.permissions.includes(p.name)
                                    );
                                    const algumaSeleccionada = grupo.permissoes.some(p =>
                                        formData.permissions.includes(p.name)
                                    );

                                    return (
                                        <AccordionTab
                                            key={grupo.modulo}
                                            header={
                                                <div className="flex align-items-center gap-2">
                                                    <Checkbox
                                                        checked={todasSeleccionadas}
                                                        onChange={() => toggleModulo(grupo)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="font-semibold">
                                                        {grupo.modulo.charAt(0).toUpperCase() + grupo.modulo.slice(1)}
                                                    </span>
                                                    <Tag
                                                        value={`${grupo.permissoes.filter(p => formData.permissions.includes(p.name)).length}/${grupo.permissoes.length}`}
                                                        severity={algumaSeleccionada ? 'success' : 'secondary'}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            }
                                        >
                                            <div className="grid">
                                                {grupo.permissoes.map(permissao => (
                                                    <div key={permissao.id} className="col-12 md:col-6">
                                                        <div className="flex align-items-center gap-2 p-2 hover:surface-100 border-round">
                                                            <Checkbox
                                                                inputId={`perm-${permissao.id}`}
                                                                checked={formData.permissions.includes(permissao.name)}
                                                                onChange={() => togglePermission(permissao.name)}
                                                            />
                                                            <label
                                                                htmlFor={`perm-${permissao.id}`}
                                                                className="cursor-pointer text-sm"
                                                            >
                                                                {permissao.name}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionTab>
                                    );
                                })}
                            </Accordion>
                        </div>

                        <div className="flex justify-content-end gap-2 mt-2">
                            <Button
                                label="Cancelar"
                                icon="pi pi-times"
                                className="p-button-text"
                                onClick={() => setDialogVisible(false)}
                            />
                            <Button
                                label={editMode ? 'Actualizar' : 'Criar'}
                                icon="pi pi-check"
                                onClick={guardarRole}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
