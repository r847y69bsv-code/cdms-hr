'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';
import { api } from '@/app/api';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import ExcelJS from 'exceljs';

interface LogEntry {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_type: string;
    causer_id: number;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    properties: {
        old?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
        ip_address?: string;
        user_agent?: string;
        [key: string]: unknown;
    };
    created_at: string;
}

interface Paginacao {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Estatisticas {
    total: number;
    hoje: number;
    semana: number;
    por_tipo: Record<string, number>;
    por_accao: Record<string, number>;
    actividade_recente: Array<{ data: string; count: number }>;
}

export default function LogsPage() {
    const toast = useRef<Toast>(null);

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
    const [paginacao, setPaginacao] = useState<Paginacao>({
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
    });

    // Filtros
    const [filtros, setFiltros] = useState({
        search: '',
        log_name: null as string | null,
        accao: null as string | null,
        data_inicio: null as Date | null,
        data_fim: null as Date | null,
    });

    // Vista
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
    const [activeTab, setActiveTab] = useState(0);

    // Dialog de detalhes
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

    // Exportação
    const [exporting, setExporting] = useState(false);

    const logNames = [
        { label: 'Todos', value: null },
        { label: 'Autenticação', value: 'autenticacao' },
        { label: 'Avaliações', value: 'avaliacoes' },
        { label: 'Utilizadores', value: 'utilizadores' },
        { label: 'Ciclos', value: 'ciclos' },
        { label: 'Trabalhadores', value: 'trabalhadores' },
        { label: 'Notificações', value: 'notificacoes' },
        { label: 'Sistema', value: 'sistema' },
    ];

    const accoes = [
        { label: 'Todas', value: null },
        { label: 'Criar', value: 'created' },
        { label: 'Actualizar', value: 'updated' },
        { label: 'Eliminar', value: 'deleted' },
        { label: 'Login', value: 'login' },
        { label: 'Logout', value: 'logout' },
        { label: 'Submeter', value: 'submitted' },
        { label: 'Aprovar', value: 'approved' },
    ];

    const viewOptions = [
        { icon: 'pi pi-table', value: 'table' },
        { icon: 'pi pi-clock', value: 'timeline' },
    ];

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        await Promise.all([carregarLogs(1), carregarEstatisticas()]);
    };

    const carregarEstatisticas = async () => {
        try {
            const response = await api.get('/logs/estatisticas');
            setEstatisticas(response.data.data);
        } catch (error) {
            // Usar estatísticas locais se o endpoint não existir
            calcularEstatisticasLocais();
        }
    };

    const calcularEstatisticasLocais = () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const semanaAtras = new Date(hoje);
        semanaAtras.setDate(semanaAtras.getDate() - 7);

        const stats: Estatisticas = {
            total: logs.length,
            hoje: logs.filter(l => new Date(l.created_at) >= hoje).length,
            semana: logs.filter(l => new Date(l.created_at) >= semanaAtras).length,
            por_tipo: {},
            por_accao: {},
            actividade_recente: [],
        };

        logs.forEach(log => {
            stats.por_tipo[log.log_name] = (stats.por_tipo[log.log_name] || 0) + 1;

            const accao = getAccaoFromDescription(log.description);
            stats.por_accao[accao] = (stats.por_accao[accao] || 0) + 1;
        });

        setEstatisticas(stats);
    };

    const getAccaoFromDescription = (desc: string): string => {
        if (desc.includes('criado') || desc.includes('created')) return 'Criar';
        if (desc.includes('actualizado') || desc.includes('updated')) return 'Actualizar';
        if (desc.includes('eliminado') || desc.includes('deleted')) return 'Eliminar';
        if (desc.includes('login')) return 'Login';
        if (desc.includes('logout')) return 'Logout';
        if (desc.includes('submetido') || desc.includes('submitted')) return 'Submeter';
        if (desc.includes('aprovado') || desc.includes('approved')) return 'Aprovar';
        return 'Outro';
    };

    const carregarLogs = async (pagina: number = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', pagina.toString());
            params.append('per_page', '25');

            if (filtros.search) params.append('search', filtros.search);
            if (filtros.log_name) params.append('log_name', filtros.log_name);
            if (filtros.accao) params.append('accao', filtros.accao);
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio.toISOString().split('T')[0]);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim.toISOString().split('T')[0]);

            const response = await api.get(`/logs?${params.toString()}`);
            setLogs(response.data.data || []);
            setPaginacao({
                current_page: response.data.meta?.current_page || 1,
                last_page: response.data.meta?.last_page || 1,
                per_page: response.data.meta?.per_page || 25,
                total: response.data.meta?.total || 0,
            });
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar os logs.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        carregarLogs(1);
    };

    const limparFiltros = () => {
        setFiltros({
            search: '',
            log_name: null,
            accao: null,
            data_inicio: null,
            data_fim: null,
        });
        carregarLogs(1);
    };

    const verDetalhes = (log: LogEntry) => {
        setSelectedLog(log);
        setDetailsVisible(true);
    };

    const exportarExcel = async () => {
        setExporting(true);
        try {
            // Carregar todos os logs para exportação
            const params = new URLSearchParams();
            params.append('per_page', '10000');
            if (filtros.log_name) params.append('log_name', filtros.log_name);
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio.toISOString().split('T')[0]);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim.toISOString().split('T')[0]);

            const response = await api.get(`/logs?${params.toString()}`);
            const allLogs = response.data.data || logs;

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CDMS-HR';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Logs de Auditoria');

            // Cabeçalhos
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Data/Hora', key: 'data', width: 20 },
                { header: 'Tipo', key: 'tipo', width: 15 },
                { header: 'Descrição', key: 'descricao', width: 40 },
                { header: 'Utilizador', key: 'utilizador', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Entidade', key: 'entidade', width: 20 },
                { header: 'ID Entidade', key: 'entidade_id', width: 12 },
                { header: 'IP', key: 'ip', width: 15 },
            ];

            // Estilo do cabeçalho
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '6366F1' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

            // Dados
            allLogs.forEach((log: LogEntry) => {
                worksheet.addRow({
                    id: log.id,
                    data: new Date(log.created_at).toLocaleString('pt-PT'),
                    tipo: log.log_name,
                    descricao: log.description,
                    utilizador: log.causer?.name || 'Sistema',
                    email: log.causer?.email || '-',
                    entidade: log.subject_type?.split('\\').pop() || '-',
                    entidade_id: log.subject_id || '-',
                    ip: log.properties?.ip_address || '-',
                });
            });

            // Bordas
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'E5E7EB' } },
                        left: { style: 'thin', color: { argb: 'E5E7EB' } },
                        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
                        right: { style: 'thin', color: { argb: 'E5E7EB' } }
                    };
                });
            });

            // Gerar e baixar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `logs_auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);

            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Logs exportados com sucesso!',
                life: 3000,
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível exportar os logs.',
                life: 3000,
            });
        } finally {
            setExporting(false);
        }
    };

    // Cores e ícones
    const getLogNameColor = (logName: string): string => {
        const cores: Record<string, string> = {
            autenticacao: '#3B82F6',
            avaliacoes: '#22C55E',
            utilizadores: '#F97316',
            ciclos: '#8B5CF6',
            trabalhadores: '#06B6D4',
            notificacoes: '#EAB308',
            sistema: '#EF4444',
        };
        return cores[logName] || '#6B7280';
    };

    const getLogNameSeverity = (logName: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' => {
        const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
            autenticacao: 'info',
            avaliacoes: 'success',
            utilizadores: 'warning',
            ciclos: 'secondary',
            sistema: 'danger',
        };
        return severities[logName] || 'secondary';
    };

    const getDescriptionIcon = (description: string): string => {
        if (description.includes('criado') || description.includes('created')) return 'pi-plus-circle';
        if (description.includes('actualizado') || description.includes('updated')) return 'pi-pencil';
        if (description.includes('eliminado') || description.includes('deleted')) return 'pi-trash';
        if (description.includes('login')) return 'pi-sign-in';
        if (description.includes('logout')) return 'pi-sign-out';
        if (description.includes('submetido') || description.includes('submitted')) return 'pi-send';
        if (description.includes('aprovado') || description.includes('approved')) return 'pi-check-circle';
        return 'pi-info-circle';
    };

    // Gráficos
    const chartPorTipo = {
        labels: estatisticas ? Object.keys(estatisticas.por_tipo) : [],
        datasets: [{
            data: estatisticas ? Object.values(estatisticas.por_tipo) : [],
            backgroundColor: [
                '#3B82F6', '#22C55E', '#F97316', '#8B5CF6',
                '#06B6D4', '#EAB308', '#EF4444', '#6B7280'
            ],
        }]
    };

    const chartPorAccao = {
        labels: estatisticas ? Object.keys(estatisticas.por_accao) : [],
        datasets: [{
            label: 'Acções',
            data: estatisticas ? Object.values(estatisticas.por_accao) : [],
            backgroundColor: '#6366F1',
        }]
    };

    // Templates
    const dataTemplate = (rowData: LogEntry) => {
        const data = new Date(rowData.created_at);
        return (
            <div>
                <div className="font-medium">{data.toLocaleDateString('pt-PT')}</div>
                <div className="text-500 text-sm">{data.toLocaleTimeString('pt-PT')}</div>
            </div>
        );
    };

    const logNameTemplate = (rowData: LogEntry) => (
        <Tag
            value={rowData.log_name}
            style={{ backgroundColor: getLogNameColor(rowData.log_name) }}
        />
    );

    const descricaoTemplate = (rowData: LogEntry) => (
        <div className="flex align-items-center gap-2">
            <i className={`pi ${getDescriptionIcon(rowData.description)} text-500`} />
            <span>{rowData.description}</span>
        </div>
    );

    const utilizadorTemplate = (rowData: LogEntry) => {
        if (!rowData.causer) {
            return (
                <div className="flex align-items-center gap-2">
                    <div className="w-2rem h-2rem bg-gray-400 border-circle flex align-items-center justify-content-center text-white text-sm">
                        <i className="pi pi-cog" />
                    </div>
                    <span className="text-500">Sistema</span>
                </div>
            );
        }
        return (
            <div className="flex align-items-center gap-2">
                <div className="w-2rem h-2rem bg-primary border-circle flex align-items-center justify-content-center text-white text-sm font-bold">
                    {rowData.causer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="font-medium">{rowData.causer.name}</div>
                    <div className="text-500 text-xs">{rowData.causer.email}</div>
                </div>
            </div>
        );
    };

    const subjectTemplate = (rowData: LogEntry) => {
        if (!rowData.subject_type) return <span className="text-500">-</span>;

        const tipo = rowData.subject_type.split('\\').pop() || rowData.subject_type;
        return (
            <div>
                <div className="text-sm font-medium">{tipo}</div>
                <div className="text-500 text-xs">ID: {rowData.subject_id}</div>
            </div>
        );
    };

    const accoesTemplate = (rowData: LogEntry) => (
        <Button
            icon="pi pi-eye"
            className="p-button-rounded p-button-text p-button-sm"
            tooltip="Ver Detalhes"
            onClick={() => verDetalhes(rowData)}
        />
    );

    // Timeline customizada
    const timelineContent = (log: LogEntry) => (
        <Card className="mb-3 shadow-none border-1 surface-border">
            <div className="flex justify-content-between align-items-start mb-2">
                <div className="flex align-items-center gap-2">
                    <Tag
                        value={log.log_name}
                        style={{ backgroundColor: getLogNameColor(log.log_name) }}
                    />
                    <span className="text-500 text-sm">
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                    </span>
                </div>
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text p-button-sm"
                    onClick={() => verDetalhes(log)}
                />
            </div>
            <p className="m-0 mb-2 font-medium">{log.description}</p>
            <div className="flex align-items-center gap-2 text-500 text-sm">
                <i className="pi pi-user" />
                <span>{log.causer?.name || 'Sistema'}</span>
                {log.subject_type && (
                    <>
                        <span className="mx-1">•</span>
                        <span>{log.subject_type.split('\\').pop()} #{log.subject_id}</span>
                    </>
                )}
            </div>
        </Card>
    );

    const timelineMarker = (log: LogEntry) => (
        <div
            className="w-2rem h-2rem border-circle flex align-items-center justify-content-center text-white"
            style={{ backgroundColor: getLogNameColor(log.log_name) }}
        >
            <i className={`pi ${getDescriptionIcon(log.description)} text-sm`} />
        </div>
    );

    // Render das alterações no Dialog
    const renderChanges = () => {
        if (!selectedLog?.properties) return null;

        const { old: oldValues, attributes: newValues } = selectedLog.properties;

        if (!oldValues && !newValues) return null;

        const allKeys = new Set([
            ...Object.keys(oldValues || {}),
            ...Object.keys(newValues || {})
        ]);

        if (allKeys.size === 0) return null;

        return (
            <div className="mt-3">
                <label className="block text-500 text-sm mb-2">Alterações</label>
                <div className="surface-100 border-round overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="surface-200">
                                <th className="p-2 text-left">Campo</th>
                                <th className="p-2 text-left">Valor Anterior</th>
                                <th className="p-2 text-left">Novo Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(allKeys).map(key => {
                                const oldVal = oldValues?.[key];
                                const newVal = newValues?.[key];
                                const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                                return (
                                    <tr key={key} className={changed ? 'bg-yellow-50' : ''}>
                                        <td className="p-2 font-medium">{key}</td>
                                        <td className="p-2 text-red-600">
                                            {oldVal !== undefined ? String(oldVal) : '-'}
                                        </td>
                                        <td className="p-2 text-green-600">
                                            {newVal !== undefined ? String(newVal) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading && logs.length === 0) {
        return (
            <RestrictedRoute requiredPermissions={['ver logs']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['ver logs']}>
            <div className="p-4">
                <Toast ref={toast} />

                <div className="flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="m-0">Logs de Auditoria</h2>
                        <p className="text-500 mt-1 mb-0">
                            Registo completo de actividades do sistema
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="Exportar"
                            icon="pi pi-file-excel"
                            className="p-button-outlined p-button-success"
                            onClick={exportarExcel}
                            loading={exporting}
                        />
                        <Button
                            icon="pi pi-refresh"
                            className="p-button-outlined"
                            onClick={carregarDados}
                            loading={loading}
                            tooltip="Actualizar"
                        />
                    </div>
                </div>

                <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                    {/* Tab Dashboard */}
                    <TabPanel header="Dashboard">
                        {/* Estatísticas */}
                        <div className="grid mb-4">
                            <div className="col-6 md:col-3">
                                <Card className="text-center h-full">
                                    <i className="pi pi-list text-4xl text-primary mb-2" />
                                    <div className="text-500 text-sm mb-1">Total de Registos</div>
                                    <div className="text-3xl font-bold text-primary">{paginacao.total}</div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center h-full">
                                    <i className="pi pi-calendar text-4xl text-green-500 mb-2" />
                                    <div className="text-500 text-sm mb-1">Hoje</div>
                                    <div className="text-3xl font-bold text-green-500">{estatisticas?.hoje || 0}</div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center h-full">
                                    <i className="pi pi-chart-line text-4xl text-orange-500 mb-2" />
                                    <div className="text-500 text-sm mb-1">Esta Semana</div>
                                    <div className="text-3xl font-bold text-orange-500">{estatisticas?.semana || 0}</div>
                                </Card>
                            </div>
                            <div className="col-6 md:col-3">
                                <Card className="text-center h-full">
                                    <i className="pi pi-tags text-4xl text-purple-500 mb-2" />
                                    <div className="text-500 text-sm mb-1">Tipos</div>
                                    <div className="text-3xl font-bold text-purple-500">
                                        {estatisticas ? Object.keys(estatisticas.por_tipo).length : 0}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Gráficos */}
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <Card title="Por Tipo de Actividade">
                                    <div style={{ height: '300px' }}>
                                        <Chart
                                            type="doughnut"
                                            data={chartPorTipo}
                                            options={{
                                                plugins: { legend: { position: 'bottom' } },
                                                maintainAspectRatio: false
                                            }}
                                        />
                                    </div>
                                </Card>
                            </div>
                            <div className="col-12 md:col-6">
                                <Card title="Por Tipo de Acção">
                                    <div style={{ height: '300px' }}>
                                        <Chart
                                            type="bar"
                                            data={chartPorAccao}
                                            options={{
                                                plugins: { legend: { display: false } },
                                                scales: { y: { beginAtZero: true } },
                                                maintainAspectRatio: false
                                            }}
                                        />
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Actividade Recente */}
                        <Card title="Actividade Recente" className="mt-4">
                            <Timeline
                                value={logs.slice(0, 5)}
                                content={timelineContent}
                                marker={timelineMarker}
                                className="customized-timeline"
                            />
                            {logs.length === 0 && (
                                <div className="text-center py-4 text-500">
                                    <i className="pi pi-inbox text-4xl mb-2" />
                                    <p>Sem actividade recente</p>
                                </div>
                            )}
                        </Card>
                    </TabPanel>

                    {/* Tab Registos */}
                    <TabPanel header="Registos">
                        {/* Filtros */}
                        <Card className="mb-4">
                            <div className="flex flex-column md:flex-row gap-3 align-items-end">
                                <div className="flex-1">
                                    <label className="block text-500 text-sm mb-1">Pesquisar</label>
                                    <span className="p-input-icon-left w-full">
                                        <i className="pi pi-search" />
                                        <InputText
                                            value={filtros.search}
                                            onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
                                            placeholder="Descrição, utilizador..."
                                            className="w-full"
                                            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                                        />
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-500 text-sm mb-1">Tipo</label>
                                    <Dropdown
                                        value={filtros.log_name}
                                        options={logNames}
                                        onChange={(e) => setFiltros({ ...filtros, log_name: e.value })}
                                        placeholder="Tipo"
                                        style={{ minWidth: '140px' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-500 text-sm mb-1">Acção</label>
                                    <Dropdown
                                        value={filtros.accao}
                                        options={accoes}
                                        onChange={(e) => setFiltros({ ...filtros, accao: e.value })}
                                        placeholder="Acção"
                                        style={{ minWidth: '140px' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-500 text-sm mb-1">De</label>
                                    <Calendar
                                        value={filtros.data_inicio}
                                        onChange={(e) => setFiltros({ ...filtros, data_inicio: e.value as Date })}
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                        style={{ width: '140px' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-500 text-sm mb-1">Até</label>
                                    <Calendar
                                        value={filtros.data_fim}
                                        onChange={(e) => setFiltros({ ...filtros, data_fim: e.value as Date })}
                                        dateFormat="dd/mm/yy"
                                        showIcon
                                        style={{ width: '140px' }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button icon="pi pi-search" onClick={aplicarFiltros} />
                                    <Button icon="pi pi-times" className="p-button-outlined" onClick={limparFiltros} />
                                </div>
                                <SelectButton
                                    value={viewMode}
                                    options={viewOptions}
                                    onChange={(e) => setViewMode(e.value)}
                                    optionLabel="icon"
                                    itemTemplate={(option) => <i className={`pi ${option.icon}`} />}
                                />
                            </div>
                        </Card>

                        {/* Vista Tabela ou Timeline */}
                        {viewMode === 'table' ? (
                            <Card>
                                <DataTable
                                    value={logs}
                                    loading={loading}
                                    emptyMessage="Nenhum registo encontrado."
                                    className="p-datatable-sm"
                                >
                                    <Column header="Data/Hora" body={dataTemplate} style={{ width: '140px' }} />
                                    <Column header="Tipo" body={logNameTemplate} style={{ width: '120px' }} />
                                    <Column header="Descrição" body={descricaoTemplate} />
                                    <Column header="Utilizador" body={utilizadorTemplate} style={{ width: '220px' }} />
                                    <Column header="Entidade" body={subjectTemplate} style={{ width: '130px' }} />
                                    <Column header="" body={accoesTemplate} style={{ width: '60px' }} />
                                </DataTable>

                                {/* Paginação */}
                                {paginacao.total > paginacao.per_page && (
                                    <div className="flex justify-content-between align-items-center mt-4">
                                        <span className="text-500 text-sm">
                                            Mostrando {((paginacao.current_page - 1) * paginacao.per_page) + 1} a{' '}
                                            {Math.min(paginacao.current_page * paginacao.per_page, paginacao.total)} de{' '}
                                            {paginacao.total}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                icon="pi pi-angle-double-left"
                                                className="p-button-outlined p-button-sm"
                                                disabled={paginacao.current_page === 1}
                                                onClick={() => carregarLogs(1)}
                                            />
                                            <Button
                                                icon="pi pi-angle-left"
                                                className="p-button-outlined p-button-sm"
                                                disabled={paginacao.current_page === 1}
                                                onClick={() => carregarLogs(paginacao.current_page - 1)}
                                            />
                                            <span className="flex align-items-center px-3 surface-100 border-round">
                                                {paginacao.current_page} / {paginacao.last_page}
                                            </span>
                                            <Button
                                                icon="pi pi-angle-right"
                                                className="p-button-outlined p-button-sm"
                                                disabled={paginacao.current_page === paginacao.last_page}
                                                onClick={() => carregarLogs(paginacao.current_page + 1)}
                                            />
                                            <Button
                                                icon="pi pi-angle-double-right"
                                                className="p-button-outlined p-button-sm"
                                                disabled={paginacao.current_page === paginacao.last_page}
                                                onClick={() => carregarLogs(paginacao.last_page)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ) : (
                            <Card>
                                <Timeline
                                    value={logs}
                                    content={timelineContent}
                                    marker={timelineMarker}
                                    className="customized-timeline"
                                />
                                {logs.length === 0 && (
                                    <div className="text-center py-6 text-500">
                                        <i className="pi pi-inbox text-4xl mb-2" />
                                        <p>Sem registos encontrados</p>
                                    </div>
                                )}
                            </Card>
                        )}
                    </TabPanel>
                </TabView>

                {/* Dialog de Detalhes */}
                <Dialog
                    visible={detailsVisible}
                    onHide={() => setDetailsVisible(false)}
                    header="Detalhes do Registo de Auditoria"
                    style={{ width: '700px' }}
                    modal
                >
                    {selectedLog && (
                        <div className="flex flex-column gap-4">
                            {/* Cabeçalho */}
                            <div className="flex align-items-center gap-3 p-3 surface-100 border-round">
                                <div
                                    className="w-3rem h-3rem border-circle flex align-items-center justify-content-center text-white"
                                    style={{ backgroundColor: getLogNameColor(selectedLog.log_name) }}
                                >
                                    <i className={`pi ${getDescriptionIcon(selectedLog.description)} text-xl`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex align-items-center gap-2 mb-1">
                                        <Tag
                                            value={selectedLog.log_name}
                                            severity={getLogNameSeverity(selectedLog.log_name)}
                                        />
                                        <span className="text-500 text-sm">
                                            ID: {selectedLog.id}
                                        </span>
                                    </div>
                                    <p className="m-0 font-bold">{selectedLog.description}</p>
                                </div>
                            </div>

                            {/* Informações */}
                            <div className="grid">
                                <div className="col-6">
                                    <label className="block text-500 text-sm mb-1">Data/Hora</label>
                                    <span className="font-medium">
                                        {new Date(selectedLog.created_at).toLocaleString('pt-PT')}
                                    </span>
                                </div>
                                <div className="col-6">
                                    <label className="block text-500 text-sm mb-1">Utilizador</label>
                                    {selectedLog.causer ? (
                                        <div>
                                            <div className="font-medium">{selectedLog.causer.name}</div>
                                            <div className="text-500 text-sm">{selectedLog.causer.email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-500">Sistema</span>
                                    )}
                                </div>
                                <div className="col-6">
                                    <label className="block text-500 text-sm mb-1">Entidade Afectada</label>
                                    {selectedLog.subject_type ? (
                                        <div>
                                            <div className="font-medium">
                                                {selectedLog.subject_type.split('\\').pop()}
                                            </div>
                                            <div className="text-500 text-sm">ID: {selectedLog.subject_id}</div>
                                        </div>
                                    ) : (
                                        <span className="text-500">-</span>
                                    )}
                                </div>
                                <div className="col-6">
                                    <label className="block text-500 text-sm mb-1">Endereço IP</label>
                                    <span className="font-medium">
                                        {selectedLog.properties?.ip_address || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* User Agent */}
                            {selectedLog.properties?.user_agent && (
                                <div>
                                    <label className="block text-500 text-sm mb-1">User Agent</label>
                                    <div className="p-2 surface-100 border-round text-sm text-600">
                                        {String(selectedLog.properties.user_agent)}
                                    </div>
                                </div>
                            )}

                            {/* Alterações */}
                            {renderChanges()}

                            {/* Dados Adicionais (raw) */}
                            {selectedLog.properties && Object.keys(selectedLog.properties).length > 0 && (
                                <div>
                                    <label className="block text-500 text-sm mb-2">Dados Completos (JSON)</label>
                                    <div className="surface-100 p-3 border-round overflow-auto" style={{ maxHeight: '200px' }}>
                                        <pre className="m-0 text-xs" style={{ whiteSpace: 'pre-wrap' }}>
                                            {JSON.stringify(selectedLog.properties, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Dialog>
            </div>
        </RestrictedRoute>
    );
}
