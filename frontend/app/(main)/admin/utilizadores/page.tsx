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
import { Password } from 'primereact/password';
import { MultiSelect } from 'primereact/multiselect';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IUser, IRole } from '@/types/app';
import RestrictedRoute from '@/app/components/RestrictedRoute';

export default function UtilizadoresPage() {
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<IUser[]>([]);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Dialog
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        roles: [] as string[],
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/roles'),
            ]);
            setUsers(usersRes.data.data || []);
            setRoles(rolesRes.data.data || []);
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

    const abrirNovoUser = () => {
        setEditMode(false);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            is_active: true,
            roles: ['trabalhador'],
        });
        setDialogVisible(true);
    };

    const abrirEditarUser = (user: IUser) => {
        setEditMode(true);
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            is_active: user.is_active,
            roles: user.roles?.map(r => r.name) || [],
        });
        setDialogVisible(true);
    };

    const guardarUser = async () => {
        try {
            const dados: any = {
                name: formData.name,
                email: formData.email,
                is_active: formData.is_active,
                roles: formData.roles,
            };

            if (formData.password) {
                dados.password = formData.password;
                dados.password_confirmation = formData.password_confirmation;
            }

            if (editMode && selectedUser) {
                await api.put(`/users/${selectedUser.id}`, dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Utilizador actualizado!',
                    life: 3000,
                });
            } else {
                await api.post('/users', dados);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Utilizador criado!',
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

    const toggleActivo = async (user: IUser) => {
        const novoEstado = !user.is_active;
        const accao = novoEstado ? 'activar' : 'desactivar';

        confirmDialog({
            message: `Tem a certeza que deseja ${accao} o utilizador "${user.name}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: async () => {
                try {
                    if (novoEstado) {
                        await api.post(`/users/${user.id}/activar`);
                    } else {
                        await api.delete(`/users/${user.id}`);
                    }
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: `Utilizador ${accao}do!`,
                        life: 3000,
                    });
                    carregarDados();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: error.response?.data?.message || 'Operação falhou.',
                        life: 3000,
                    });
                }
            },
        });
    };

    const getUsersFiltrados = () => {
        if (!globalFilter) return users;
        const search = globalFilter.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
    };

    const nomeTemplate = (rowData: IUser) => (
        <div className="flex align-items-center gap-3">
            <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center text-white text-sm font-bold">
                {rowData.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="font-bold">{rowData.name}</div>
                <div className="text-500 text-sm">{rowData.email}</div>
            </div>
        </div>
    );

    const rolesTemplate = (rowData: IUser) => (
        <div className="flex flex-wrap gap-1">
            {rowData.roles?.map(role => (
                <Tag
                    key={role.id}
                    value={role.name}
                    severity={role.name === 'admin' ? 'danger' : 'info'}
                    className="text-xs"
                />
            ))}
        </div>
    );

    const estadoTemplate = (rowData: IUser) => (
        <Tag
            value={rowData.is_active ? 'Activo' : 'Inactivo'}
            severity={rowData.is_active ? 'success' : 'danger'}
        />
    );

    const accoesTemplate = (rowData: IUser) => (
        <div className="flex gap-1">
            <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-sm"
                tooltip="Editar"
                onClick={() => abrirEditarUser(rowData)}
            />
            <Button
                icon={rowData.is_active ? 'pi pi-lock' : 'pi pi-lock-open'}
                className={`p-button-rounded p-button-text p-button-sm ${rowData.is_active ? 'p-button-danger' : 'p-button-success'}`}
                tooltip={rowData.is_active ? 'Desactivar' : 'Activar'}
                onClick={() => toggleActivo(rowData)}
            />
        </div>
    );

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['gerir utilizadores']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['gerir utilizadores']}>
            <div className="p-4">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Gestão de Utilizadores</h2>
                        <p className="text-500 mt-1 mb-0">
                            Gerir utilizadores e permissões do sistema
                        </p>
                    </div>
                    <Button
                        label="Novo Utilizador"
                        icon="pi pi-plus"
                        onClick={abrirNovoUser}
                    />
                </div>

                {/* Estatísticas */}
                <div className="grid mb-4">
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Total</div>
                            <div className="text-2xl font-bold text-primary">{users.length}</div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Activos</div>
                            <div className="text-2xl font-bold text-green-500">
                                {users.filter(u => u.is_active).length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Inactivos</div>
                            <div className="text-2xl font-bold text-red-500">
                                {users.filter(u => !u.is_active).length}
                            </div>
                        </Card>
                    </div>
                    <div className="col-6 md:col-3">
                        <Card className="text-center">
                            <div className="text-500 mb-1">Administradores</div>
                            <div className="text-2xl font-bold text-purple-500">
                                {users.filter(u => u.roles?.some(r => r.name === 'admin')).length}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Pesquisa */}
                <Card className="mb-4">
                    <span className="p-input-icon-left w-full md:w-auto">
                        <i className="pi pi-search" />
                        <InputText
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Pesquisar utilizador..."
                            style={{ minWidth: '300px' }}
                        />
                    </span>
                </Card>

                {/* Tabela */}
                <Card>
                    <DataTable
                        value={getUsersFiltrados()}
                        paginator
                        rows={15}
                        rowsPerPageOptions={[10, 15, 25, 50]}
                        emptyMessage="Nenhum utilizador encontrado."
                        className="p-datatable-sm"
                        sortField="name"
                        sortOrder={1}
                    >
                        <Column header="Utilizador" body={nomeTemplate} sortable sortField="name" />
                        <Column header="Papéis" body={rolesTemplate} />
                        <Column header="Estado" body={estadoTemplate} sortable sortField="is_active" style={{ width: '100px' }} />
                        <Column header="Acções" body={accoesTemplate} style={{ width: '100px' }} />
                    </DataTable>
                </Card>

                {/* Dialog */}
                <Dialog
                    visible={dialogVisible}
                    onHide={() => setDialogVisible(false)}
                    header={editMode ? 'Editar Utilizador' : 'Novo Utilizador'}
                    style={{ width: '500px' }}
                    modal
                >
                    <div className="flex flex-column gap-4">
                        <div>
                            <label className="block mb-2 font-bold">Nome *</label>
                            <InputText
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">Email *</label>
                            <InputText
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-bold">
                                Password {editMode ? '(deixar vazio para manter)' : '*'}
                            </label>
                            <Password
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                toggleMask
                                className="w-full"
                                inputClassName="w-full"
                            />
                        </div>

                        {formData.password && (
                            <div>
                                <label className="block mb-2 font-bold">Confirmar Password *</label>
                                <Password
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    toggleMask
                                    feedback={false}
                                    className="w-full"
                                    inputClassName="w-full"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block mb-2 font-bold">Papéis *</label>
                            <MultiSelect
                                value={formData.roles}
                                options={roles.map(r => ({ label: r.name, value: r.name }))}
                                onChange={(e) => setFormData({ ...formData, roles: e.value })}
                                placeholder="Seleccione papéis"
                                className="w-full"
                                display="chip"
                            />
                        </div>

                        <div className="flex align-items-center gap-2">
                            <InputSwitch
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.value })}
                            />
                            <label>Utilizador activo</label>
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
                                onClick={guardarUser}
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
