'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { IAvaliacao, IItemAvaliacao, IIndicador } from '@/types/app';
import ResumoCalculo from './ResumoCalculo';

interface FormularioAvaliacaoProps {
    avaliacao: IAvaliacao;
    modo: 'autoavaliacao' | 'avaliacao' | 'visualizacao';
    onSave: (itens: IItemAvaliacao[], observacoes: string) => Promise<void>;
    onSubmit: () => Promise<void>;
    onCancel?: () => void;
    loading?: boolean;
}

export default function FormularioAvaliacao({
    avaliacao,
    modo,
    onSave,
    onSubmit,
    onCancel,
    loading = false
}: FormularioAvaliacaoProps) {
    const [itens, setItens] = useState<IItemAvaliacao[]>(avaliacao.itens || []);
    const [observacoes, setObservacoes] = useState<string>(
        modo === 'autoavaliacao'
            ? avaliacao.observacoes_trabalhador || ''
            : avaliacao.observacoes_avaliador || ''
    );
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const toast = React.useRef<Toast>(null);

    const isReadOnly = modo === 'visualizacao';
    const camposPontuacao = modo === 'autoavaliacao' ? 'pontuacao_auto' : 'pontuacao_avaliador';
    const camposJustificacao = modo === 'autoavaliacao' ? 'justificacao_auto' : 'justificacao_avaliador';

    useEffect(() => {
        setItens(avaliacao.itens || []);
    }, [avaliacao]);

    const handlePontuacaoChange = (itemId: number, value: number | null) => {
        if (isReadOnly) return;

        setItens(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    [camposPontuacao]: value
                };
            }
            return item;
        }));
        setHasChanges(true);
    };

    const handleJustificacaoChange = (itemId: number, value: string) => {
        if (isReadOnly) return;

        setItens(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    [camposJustificacao]: value
                };
            }
            return item;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(itens, observacoes);
            setHasChanges(false);
            toast.current?.show({
                severity: 'success',
                summary: 'Guardado',
                detail: 'As alterações foram guardadas com sucesso.',
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Não foi possível guardar as alterações.',
                life: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = () => {
        // Verificar se todos os itens têm pontuação
        const itensIncompletos = itens.filter(item => {
            const pontuacao = modo === 'autoavaliacao' ? item.pontuacao_auto : item.pontuacao_avaliador;
            return !pontuacao;
        });

        if (itensIncompletos.length > 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Avaliação Incompleta',
                detail: `Faltam ${itensIncompletos.length} indicadores por avaliar.`,
                life: 5000
            });
            return;
        }

        confirmDialog({
            message: modo === 'autoavaliacao'
                ? 'Tem a certeza que deseja submeter a sua autoavaliação? Esta acção não pode ser revertida.'
                : 'Tem a certeza que deseja submeter a avaliação? Esta acção não pode ser revertida.',
            header: 'Confirmar Submissão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Submeter',
            rejectLabel: 'Cancelar',
            accept: async () => {
                setSubmitting(true);
                try {
                    // Guardar primeiro
                    await onSave(itens, observacoes);
                    // Depois submeter
                    await onSubmit();
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Submetido',
                        detail: modo === 'autoavaliacao'
                            ? 'A sua autoavaliação foi submetida com sucesso.'
                            : 'A avaliação foi submetida com sucesso.',
                        life: 3000
                    });
                } catch (error) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Não foi possível submeter a avaliação.',
                        life: 3000
                    });
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const calcularProgresso = () => {
        const total = itens.length;
        const preenchidos = itens.filter(item => {
            const pontuacao = modo === 'autoavaliacao' ? item.pontuacao_auto : item.pontuacao_avaliador;
            return pontuacao !== null && pontuacao !== undefined;
        }).length;
        return total > 0 ? Math.round((preenchidos / total) * 100) : 0;
    };

    const getDescricaoPontuacao = (valor: number | null | undefined): string => {
        if (!valor) return '';
        const descricoes: Record<number, string> = {
            1: 'Insuficiente',
            2: 'Regular',
            3: 'Bom',
            4: 'Muito Bom',
            5: 'Excelente'
        };
        return descricoes[valor] || '';
    };

    const getCorPontuacao = (valor: number | null | undefined): string => {
        if (!valor) return '';
        const cores: Record<number, string> = {
            1: '#ef4444',
            2: '#f97316',
            3: '#eab308',
            4: '#3b82f6',
            5: '#22c55e'
        };
        return cores[valor] || '#6b7280';
    };

    return (
        <div className="formavaliacao">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Cabeçalho */}
            <Card className="mb-4">
                <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
                    <div>
                        <h2 className="m-0 mb-2">
                            {modo === 'autoavaliacao' && 'Autoavaliação'}
                            {modo === 'avaliacao' && `Avaliação de ${avaliacao.trabalhador?.nome_completo}`}
                            {modo === 'visualizacao' && 'Visualização da Avaliação'}
                        </h2>
                        <p className="text-500 m-0">
                            Ciclo: {avaliacao.ciclo?.nome} | Ano: {avaliacao.ciclo?.ano}
                        </p>
                    </div>
                    <Tag
                        value={avaliacao.estado?.replace('_', ' ').toUpperCase()}
                        severity={avaliacao.estado === 'rascunho' ? 'warning' : 'info'}
                    />
                </div>

                {!isReadOnly && (
                    <div className="mt-4">
                        <div className="flex align-items-center gap-2 mb-2">
                            <span className="text-500">Progresso:</span>
                            <span className="font-bold">{calcularProgresso()}%</span>
                        </div>
                        <ProgressBar value={calcularProgresso()} showValue={false} style={{ height: '8px' }} />
                    </div>
                )}
            </Card>

            {/* Instruções */}
            {!isReadOnly && (
                <Message
                    severity="info"
                    className="mb-4 w-full"
                    text={modo === 'autoavaliacao'
                        ? 'Avalie o seu desempenho em cada indicador de 1 (Insuficiente) a 5 (Excelente). Adicione uma justificação para cada pontuação.'
                        : 'Avalie o desempenho do colaborador em cada indicador. Pode ver a autoavaliação para referência.'
                    }
                />
            )}

            {/* Itens de Avaliação */}
            <div className="grid">
                <div className="col-12 lg:col-8">
                    {itens.map((item, index) => (
                        <Card key={item.id} className="mb-3">
                            <div className="flex flex-column gap-3">
                                {/* Cabeçalho do Indicador */}
                                <div className="flex justify-content-between align-items-start">
                                    <div className="flex-1">
                                        <h4 className="m-0 mb-1">
                                            {index + 1}. {item.indicador?.nome}
                                        </h4>
                                        <p className="text-500 text-sm m-0">
                                            {item.indicador?.descricao}
                                        </p>
                                        <Tag
                                            value={`Peso: ${item.peso_aplicado}%`}
                                            severity="secondary"
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <Divider className="my-2" />

                                {/* Área de Pontuação */}
                                <div className="grid">
                                    {/* Autoavaliação (sempre visível em modo avaliação/visualização) */}
                                    {(modo === 'avaliacao' || modo === 'visualizacao') && (
                                        <div className="col-12 md:col-6">
                                            <label className="block text-500 mb-2">Autoavaliação</label>
                                            <div className="flex align-items-center gap-2">
                                                <Rating
                                                    value={item.pontuacao_auto || 0}
                                                    readOnly
                                                    cancel={false}
                                                    stars={5}
                                                />
                                                {item.pontuacao_auto && (
                                                    <Tag
                                                        value={getDescricaoPontuacao(item.pontuacao_auto)}
                                                        style={{ backgroundColor: getCorPontuacao(item.pontuacao_auto) }}
                                                    />
                                                )}
                                            </div>
                                            {item.justificacao_auto && (
                                                <p className="text-sm text-500 mt-2 p-2 surface-100 border-round">
                                                    {item.justificacao_auto}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Campo de Pontuação Editável */}
                                    <div className={`col-12 ${(modo === 'avaliacao' || modo === 'visualizacao') ? 'md:col-6' : ''}`}>
                                        <label className="block text-500 mb-2">
                                            {modo === 'autoavaliacao' ? 'A Minha Pontuação' : 'Pontuação do Avaliador'}
                                        </label>
                                        <div className="flex align-items-center gap-2">
                                            <Rating
                                                value={modo === 'autoavaliacao' ? (item.pontuacao_auto || 0) : (item.pontuacao_avaliador || 0)}
                                                onChange={(e) => handlePontuacaoChange(item.id, e.value || null)}
                                                readOnly={isReadOnly}
                                                cancel={false}
                                                stars={5}
                                            />
                                            {(() => {
                                                const valor = modo === 'autoavaliacao' ? item.pontuacao_auto : item.pontuacao_avaliador;
                                                return valor ? (
                                                    <Tag
                                                        value={getDescricaoPontuacao(valor)}
                                                        style={{ backgroundColor: getCorPontuacao(valor) }}
                                                    />
                                                ) : null;
                                            })()}
                                        </div>

                                        {/* Justificação */}
                                        {!isReadOnly ? (
                                            <InputTextarea
                                                value={modo === 'autoavaliacao' ? (item.justificacao_auto || '') : (item.justificacao_avaliador || '')}
                                                onChange={(e) => handleJustificacaoChange(item.id, e.target.value)}
                                                placeholder="Justifique a sua pontuação..."
                                                rows={3}
                                                className="w-full mt-2"
                                                maxLength={1000}
                                            />
                                        ) : (
                                            (modo === 'visualizacao' && item.justificacao_avaliador) && (
                                                <p className="text-sm text-500 mt-2 p-2 surface-100 border-round">
                                                    {item.justificacao_avaliador}
                                                </p>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Observações Gerais */}
                    <Card className="mb-3">
                        <h4 className="mt-0 mb-3">Observações Gerais</h4>
                        {!isReadOnly ? (
                            <InputTextarea
                                value={observacoes}
                                onChange={(e) => {
                                    setObservacoes(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder={modo === 'autoavaliacao'
                                    ? 'Adicione observações sobre o seu desempenho geral...'
                                    : 'Adicione observações sobre o desempenho do colaborador...'
                                }
                                rows={4}
                                className="w-full"
                                maxLength={2000}
                            />
                        ) : (
                            <div className="grid">
                                {avaliacao.observacoes_trabalhador && (
                                    <div className="col-12 md:col-6">
                                        <label className="block text-500 mb-2">Observações do Trabalhador</label>
                                        <p className="p-2 surface-100 border-round">{avaliacao.observacoes_trabalhador}</p>
                                    </div>
                                )}
                                {avaliacao.observacoes_avaliador && (
                                    <div className="col-12 md:col-6">
                                        <label className="block text-500 mb-2">Observações do Avaliador</label>
                                        <p className="p-2 surface-100 border-round">{avaliacao.observacoes_avaliador}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Botões de Acção */}
                    {!isReadOnly && (
                        <div className="flex justify-content-between gap-2">
                            <Button
                                label="Cancelar"
                                icon="pi pi-times"
                                className="p-button-text"
                                onClick={onCancel}
                            />
                            <div className="flex gap-2">
                                <Button
                                    label="Guardar Rascunho"
                                    icon="pi pi-save"
                                    className="p-button-outlined"
                                    onClick={handleSave}
                                    loading={saving}
                                    disabled={!hasChanges || submitting}
                                />
                                <Button
                                    label={modo === 'autoavaliacao' ? 'Submeter Autoavaliação' : 'Submeter Avaliação'}
                                    icon="pi pi-check"
                                    onClick={handleSubmit}
                                    loading={submitting}
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumo Lateral */}
                <div className="col-12 lg:col-4">
                    <ResumoCalculo
                        itens={itens}
                        modo={modo}
                        pontuacaoFinal={avaliacao.pontuacao_final}
                        classificacaoFinal={avaliacao.classificacao_final}
                    />
                </div>
            </div>
        </div>
    );
}
