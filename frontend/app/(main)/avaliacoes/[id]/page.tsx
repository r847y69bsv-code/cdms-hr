'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { api } from '@/app/api';
import { IAvaliacao, IContestacao } from '@/types/app';
import { getEstadoAvaliacaoColor, getEstadoAvaliacaoLabel, getClassificacaoColor } from '@/app/utils';
import FormularioAvaliacao from '@/app/components/FormularioAvaliacao';
import RestrictedRoute from '@/app/components/RestrictedRoute';
import { PDFDownloadButton } from '@/app/components/PDFAvaliacao';

export default function DetalheAvaliacaoPage() {
    const router = useRouter();
    const params = useParams();
    const toast = useRef<Toast>(null);
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [avaliacao, setAvaliacao] = useState<IAvaliacao | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Contestação
    const [showContestacaoDialog, setShowContestacaoDialog] = useState(false);
    const [contestacaoMotivo, setContestacaoMotivo] = useState('');
    const [contestacaoDescricao, setContestacaoDescricao] = useState('');
    const [submittingContestacao, setSubmittingContestacao] = useState(false);
    const [contestacoes, setContestacoes] = useState<IContestacao[]>([]);

    useEffect(() => {
        if (id) {
            carregarAvaliacao();
            carregarContestacoes();
        }
    }, [id]);

    const carregarContestacoes = async () => {
        try {
            const response = await api.get('/contestacoes/minhas');
            const todas = response.data.data || [];
            // Filtrar apenas as contestações desta avaliação
            const destAvaliacao = todas.filter((c: IContestacao) => c.avaliacao_id === parseInt(id));
            setContestacoes(destAvaliacao);
        } catch (error) {
            console.error('Erro ao carregar contestações:', error);
        }
    };

    const podeContestar = () => {
        if (!avaliacao) return false;
        // Só pode contestar se estado for 'aprovada' ou 'feedback_feito'
        const estadosContestaveis = ['aprovada', 'feedback_feito'];
        if (!estadosContestaveis.includes(avaliacao.estado)) return false;
        // E não pode ter contestação pendente ou em análise
        const temContestacaoPendente = contestacoes.some(
            c => c.estado === 'pendente' || c.estado === 'em_analise'
        );
        return !temContestacaoPendente;
    };

    const handleSubmitContestacao = async () => {
        if (!contestacaoMotivo.trim() || !contestacaoDescricao.trim()) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Atenção',
                detail: 'Preencha todos os campos obrigatórios.',
                life: 3000,
            });
            return;
        }

        try {
            setSubmittingContestacao(true);
            await api.post('/contestacoes', {
                avaliacao_id: avaliacao?.id,
                motivo: contestacaoMotivo,
                descricao: contestacaoDescricao,
            });

            toast.current?.show({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Contestação registada com sucesso.',
                life: 3000,
            });

            setShowContestacaoDialog(false);
            setContestacaoMotivo('');
            setContestacaoDescricao('');
            carregarAvaliacao();
            carregarContestacoes();
        } catch (error: any) {
            console.error('Erro ao submeter contestação:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Não foi possível registar a contestação.',
                life: 5000,
            });
        } finally {
            setSubmittingContestacao(false);
        }
    };

    const getContestacaoEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendente': return '#f59e0b';
            case 'em_analise': return '#3b82f6';
            case 'aceite': return '#22c55e';
            case 'rejeitada': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getContestacaoEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'pendente': return 'Pendente';
            case 'em_analise': return 'Em Análise';
            case 'aceite': return 'Aceite';
            case 'rejeitada': return 'Rejeitada';
            default: return estado;
        }
    };

    const carregarAvaliacao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/avaliacoes/${id}`);
            setAvaliacao(response.data.data);
        } catch (error: any) {
            console.error('Erro ao carregar avaliação:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível carregar a avaliação.',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const getTimelineEvents = () => {
        if (!avaliacao) return [];

        const events = [];

        events.push({
            status: 'Criada',
            date: avaliacao.created_at,
            icon: 'pi pi-plus',
            color: '#6b7280',
        });

        if (avaliacao.data_submissao_auto) {
            events.push({
                status: 'Autoavaliação Submetida',
                date: avaliacao.data_submissao_auto,
                icon: 'pi pi-check',
                color: '#3b82f6',
            });
        }

        if (avaliacao.data_submissao_avaliador) {
            events.push({
                status: 'Avaliação Submetida',
                date: avaliacao.data_submissao_avaliador,
                icon: 'pi pi-user-edit',
                color: '#8b5cf6',
            });
        }

        if (avaliacao.data_revisao_departamental) {
            events.push({
                status: 'Revisão Departamental',
                date: avaliacao.data_revisao_departamental,
                icon: 'pi pi-building',
                color: '#ec4899',
            });
        }

        if (avaliacao.data_revisao_rh) {
            events.push({
                status: 'Aprovada pelo RH',
                date: avaliacao.data_revisao_rh,
                icon: 'pi pi-verified',
                color: '#22c55e',
            });
        }

        if (avaliacao.data_feedback) {
            events.push({
                status: 'Feedback Realizado',
                date: avaliacao.data_feedback,
                icon: 'pi pi-comments',
                color: '#10b981',
            });
        }

        return events;
    };

    const timelineTemplate = (item: any) => {
        return (
            <div className="flex flex-column">
                <span className="font-bold">{item.status}</span>
                <span className="text-500 text-sm">
                    {new Date(item.date).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>
        );
    };

    const timelineMarker = (item: any) => {
        return (
            <span
                className="flex align-items-center justify-content-center border-circle"
                style={{
                    width: '2rem',
                    height: '2rem',
                    backgroundColor: item.color,
                    color: 'white',
                }}
            >
                <i className={item.icon} />
            </span>
        );
    };

    if (loading) {
        return (
            <RestrictedRoute requiredPermissions={['acesso modulo-avaliacao']}>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <ProgressSpinner />
                </div>
            </RestrictedRoute>
        );
    }

    if (!avaliacao) {
        return (
            <RestrictedRoute requiredPermissions={['acesso modulo-avaliacao']}>
                <div className="p-4">
                    <Card>
                        <div className="text-center py-6">
                            <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3" />
                            <h3 className="mt-0">Avaliação não encontrada</h3>
                            <Button
                                label="Voltar ao Histórico"
                                icon="pi pi-arrow-left"
                                onClick={() => router.push('/avaliacoes/historico')}
                                className="mt-3"
                            />
                        </div>
                    </Card>
                </div>
            </RestrictedRoute>
        );
    }

    return (
        <RestrictedRoute requiredPermissions={['acesso modulo-avaliacao']}>
            <div className="p-4">
                <Toast ref={toast} />

                {/* Cabeçalho */}
                <div className="flex justify-content-between align-items-start mb-4">
                    <div>
                        <div className="flex align-items-center gap-2 mb-2">
                            <Button
                                icon="pi pi-arrow-left"
                                className="p-button-text p-button-plain"
                                onClick={() => router.back()}
                            />
                            <h2 className="m-0">Avaliação de Desempenho</h2>
                        </div>
                        <p className="text-500 mt-1 mb-0 ml-5">
                            {avaliacao.trabalhador?.nome_completo} | {avaliacao.ciclo?.nome}
                        </p>
                    </div>
                    <div className="flex align-items-center gap-3">
                        <PDFDownloadButton avaliacao={avaliacao} />
                        <Tag
                            value={getEstadoAvaliacaoLabel(avaliacao.estado)}
                            style={{ backgroundColor: getEstadoAvaliacaoColor(avaliacao.estado) }}
                            className="text-lg px-3 py-2"
                        />
                    </div>
                </div>

                {/* Resumo Principal */}
                <div className="grid mb-4">
                    <div className="col-12 md:col-3">
                        <Card className="text-center h-full">
                            <div className="text-500 mb-2">Autoavaliação</div>
                            <div className="text-3xl font-bold" style={{ color: '#3b82f6' }}>
                                {avaliacao.pontuacao_auto?.toFixed(2) || '-'}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center h-full">
                            <div className="text-500 mb-2">Avaliador</div>
                            <div className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>
                                {avaliacao.pontuacao_avaliador?.toFixed(2) || '-'}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center h-full">
                            <div className="text-500 mb-2">Pontuação Final</div>
                            <div
                                className="text-3xl font-bold"
                                style={{ color: getClassificacaoColor(avaliacao.classificacao_final || '') }}
                            >
                                {avaliacao.pontuacao_final?.toFixed(2) || '-'}
                            </div>
                        </Card>
                    </div>
                    <div className="col-12 md:col-3">
                        <Card className="text-center h-full">
                            <div className="text-500 mb-2">Classificação</div>
                            {avaliacao.classificacao_final ? (
                                <Tag
                                    value={avaliacao.classificacao_final}
                                    style={{
                                        backgroundColor: getClassificacaoColor(avaliacao.classificacao_final),
                                        fontSize: '1.2rem',
                                        padding: '0.5rem 1rem',
                                    }}
                                />
                            ) : (
                                <span className="text-3xl font-bold text-500">-</span>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Tabs */}
                <Card>
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        {/* Tab: Detalhes da Avaliação */}
                        <TabPanel header="Detalhes" leftIcon="pi pi-list mr-2">
                            <FormularioAvaliacao
                                avaliacao={avaliacao}
                                modo="visualizacao"
                                onSave={async () => {}}
                                onSubmit={async () => {}}
                            />
                        </TabPanel>

                        {/* Tab: Informações */}
                        <TabPanel header="Informações" leftIcon="pi pi-info-circle mr-2">
                            <div className="grid">
                                <div className="col-12 md:col-6">
                                    <h4 className="mt-0">Trabalhador</h4>
                                    <div className="surface-100 p-3 border-round">
                                        <div className="mb-2">
                                            <span className="text-500">Nome:</span>
                                            <span className="ml-2 font-bold">{avaliacao.trabalhador?.nome_completo}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-500">Departamento:</span>
                                            <span className="ml-2">{avaliacao.trabalhador?.departamento}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-500">Cargo:</span>
                                            <span className="ml-2">{avaliacao.trabalhador?.cargo}</span>
                                        </div>
                                        <div>
                                            <span className="text-500">Categoria:</span>
                                            <span className="ml-2">{avaliacao.trabalhador?.categoria}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <h4 className="mt-0">Avaliador</h4>
                                    <div className="surface-100 p-3 border-round">
                                        <div className="mb-2">
                                            <span className="text-500">Nome:</span>
                                            <span className="ml-2 font-bold">{avaliacao.avaliador?.name || 'Não atribuído'}</span>
                                        </div>
                                        {avaliacao.revisor_departamental && (
                                            <div className="mb-2">
                                                <span className="text-500">Revisor Departamental:</span>
                                                <span className="ml-2">{avaliacao.revisor_departamental.name}</span>
                                            </div>
                                        )}
                                        {avaliacao.revisor_rh && (
                                            <div>
                                                <span className="text-500">Revisor RH:</span>
                                                <span className="ml-2">{avaliacao.revisor_rh.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Divider />

                            {/* Observações */}
                            <h4>Observações</h4>
                            <div className="grid">
                                {avaliacao.observacoes_trabalhador && (
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-3 border-round">
                                            <div className="text-500 mb-2 font-bold">Do Trabalhador:</div>
                                            <p className="m-0">{avaliacao.observacoes_trabalhador}</p>
                                        </div>
                                    </div>
                                )}
                                {avaliacao.observacoes_avaliador && (
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-3 border-round">
                                            <div className="text-500 mb-2 font-bold">Do Avaliador:</div>
                                            <p className="m-0">{avaliacao.observacoes_avaliador}</p>
                                        </div>
                                    </div>
                                )}
                                {avaliacao.observacoes_revisor && (
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-3 border-round">
                                            <div className="text-500 mb-2 font-bold">Do Revisor:</div>
                                            <p className="m-0">{avaliacao.observacoes_revisor}</p>
                                        </div>
                                    </div>
                                )}
                                {avaliacao.observacoes_rh && (
                                    <div className="col-12 md:col-6">
                                        <div className="surface-100 p-3 border-round">
                                            <div className="text-500 mb-2 font-bold">Do RH:</div>
                                            <p className="m-0">{avaliacao.observacoes_rh}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabPanel>

                        {/* Tab: Histórico */}
                        <TabPanel header="Histórico" leftIcon="pi pi-history mr-2">
                            <h4 className="mt-0">Linha do Tempo</h4>
                            <Timeline
                                value={getTimelineEvents()}
                                content={timelineTemplate}
                                marker={timelineMarker}
                                className="mt-4"
                            />
                        </TabPanel>

                        {/* Tab: Planos de Melhoria */}
                        <TabPanel header="Planos de Melhoria" leftIcon="pi pi-chart-line mr-2">
                            {avaliacao.planos_melhoria && avaliacao.planos_melhoria.length > 0 ? (
                                <div className="grid">
                                    {avaliacao.planos_melhoria.map((plano: any, index: number) => (
                                        <div key={plano.id} className="col-12 md:col-6">
                                            <Card className="h-full">
                                                <div className="flex justify-content-between align-items-start mb-2">
                                                    <h5 className="m-0">{plano.area_melhoria}</h5>
                                                    <Tag
                                                        value={plano.estado}
                                                        severity={
                                                            plano.estado === 'concluido' ? 'success' :
                                                            plano.estado === 'em_curso' ? 'warning' : 'info'
                                                        }
                                                    />
                                                </div>
                                                <p className="text-500 mb-2">{plano.objectivo}</p>
                                                <div className="flex justify-content-between text-sm">
                                                    <span className="text-500">Progresso:</span>
                                                    <span className="font-bold">{plano.progresso}%</span>
                                                </div>
                                                {plano.prazo && (
                                                    <div className="flex justify-content-between text-sm mt-1">
                                                        <span className="text-500">Prazo:</span>
                                                        <span>{new Date(plano.prazo).toLocaleDateString('pt-PT')}</span>
                                                    </div>
                                                )}
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="pi pi-inbox text-3xl text-300 mb-2" />
                                    <p className="text-500">Sem planos de melhoria associados.</p>
                                </div>
                            )}
                        </TabPanel>

                        {/* Tab: Contestações */}
                        <TabPanel header="Contestações" leftIcon="pi pi-flag mr-2">
                            <div className="mb-4">
                                {podeContestar() && (
                                    <Button
                                        label="Nova Contestação"
                                        icon="pi pi-plus"
                                        onClick={() => setShowContestacaoDialog(true)}
                                        className="p-button-warning"
                                    />
                                )}
                            </div>

                            {contestacoes.length > 0 ? (
                                <div className="grid">
                                    {contestacoes.map((contestacao) => (
                                        <div key={contestacao.id} className="col-12">
                                            <Card className="mb-3">
                                                <div className="flex justify-content-between align-items-start mb-3">
                                                    <div>
                                                        <h5 className="m-0 mb-1">{contestacao.motivo}</h5>
                                                        <span className="text-500 text-sm">
                                                            {new Date(contestacao.created_at!).toLocaleDateString('pt-PT', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <Tag
                                                        value={getContestacaoEstadoLabel(contestacao.estado)}
                                                        style={{ backgroundColor: getContestacaoEstadoColor(contestacao.estado) }}
                                                    />
                                                </div>

                                                <div className="surface-100 p-3 border-round mb-3">
                                                    <div className="text-500 mb-1 font-bold text-sm">Descrição da Contestação:</div>
                                                    <p className="m-0">{contestacao.descricao}</p>
                                                </div>

                                                {contestacao.resposta && (
                                                    <div className="surface-50 border-1 border-300 p-3 border-round">
                                                        <div className="flex justify-content-between align-items-center mb-2">
                                                            <span className="text-500 font-bold text-sm">Resposta do RH:</span>
                                                            {contestacao.data_resposta && (
                                                                <span className="text-500 text-xs">
                                                                    {new Date(contestacao.data_resposta).toLocaleDateString('pt-PT', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="m-0">{contestacao.resposta}</p>
                                                    </div>
                                                )}
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="pi pi-inbox text-3xl text-300 mb-2" />
                                    <p className="text-500">Sem contestações registadas para esta avaliação.</p>
                                    {!podeContestar() && avaliacao.estado !== 'aprovada' && avaliacao.estado !== 'feedback_feito' && (
                                        <p className="text-sm text-400 mt-2">
                                            Só é possível contestar avaliações já aprovadas.
                                        </p>
                                    )}
                                </div>
                            )}
                        </TabPanel>
                    </TabView>
                </Card>

                {/* Dialog de Nova Contestação */}
                <Dialog
                    header="Nova Contestação"
                    visible={showContestacaoDialog}
                    style={{ width: '500px' }}
                    onHide={() => setShowContestacaoDialog(false)}
                    modal
                >
                    <div className="mb-4">
                        <div className="p-fluid">
                            <div className="field mb-4">
                                <label htmlFor="motivo" className="font-bold mb-2 block">
                                    Motivo da Contestação *
                                </label>
                                <InputText
                                    id="motivo"
                                    value={contestacaoMotivo}
                                    onChange={(e) => setContestacaoMotivo(e.target.value)}
                                    placeholder="Ex: Discordância com pontuação atribuída"
                                    maxLength={255}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="descricao" className="font-bold mb-2 block">
                                    Descrição Detalhada *
                                </label>
                                <InputTextarea
                                    id="descricao"
                                    value={contestacaoDescricao}
                                    onChange={(e) => setContestacaoDescricao(e.target.value)}
                                    placeholder="Descreva em detalhe os motivos da sua contestação e os pontos específicos que pretende contestar..."
                                    rows={6}
                                    maxLength={2000}
                                    autoResize
                                />
                                <small className="text-500">{contestacaoDescricao.length}/2000 caracteres</small>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label="Cancelar"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setShowContestacaoDialog(false)}
                        />
                        <Button
                            label="Submeter Contestação"
                            icon="pi pi-check"
                            className="p-button-warning"
                            loading={submittingContestacao}
                            onClick={handleSubmitContestacao}
                        />
                    </div>
                </Dialog>

                <ConfirmDialog />
            </div>
        </RestrictedRoute>
    );
}
