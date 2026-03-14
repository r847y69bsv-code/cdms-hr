'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { IItemAvaliacao } from '@/types/app';

interface PainelIndicadorProps {
    item: IItemAvaliacao;
    index: number;
    modo: 'autoavaliacao' | 'avaliacao' | 'visualizacao';
    onPontuacaoChange: (itemId: number, value: number | null) => void;
    onJustificacaoChange: (itemId: number, value: string) => void;
}

export default function PainelIndicador({
    item,
    index,
    modo,
    onPontuacaoChange,
    onJustificacaoChange
}: PainelIndicadorProps) {
    const isReadOnly = modo === 'visualizacao';

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

    const getPontuacaoActual = () => {
        if (modo === 'autoavaliacao') return item.pontuacao_auto;
        if (modo === 'avaliacao') return item.pontuacao_avaliador;
        return item.pontuacao_final;
    };

    const getJustificacaoActual = () => {
        if (modo === 'autoavaliacao') return item.justificacao_auto;
        if (modo === 'avaliacao') return item.justificacao_avaliador;
        return item.justificacao_avaliador || item.justificacao_auto;
    };

    return (
        <Card className="mb-3 painel-indicador">
            <div className="flex flex-column gap-3">
                {/* Cabeçalho do Indicador */}
                <div className="flex justify-content-between align-items-start">
                    <div className="flex-1">
                        <div className="flex align-items-center gap-2 mb-1">
                            <span className="text-primary font-bold">{index + 1}</span>
                            <h4 className="m-0">{item.indicador?.nome}</h4>
                        </div>
                        <p className="text-500 text-sm m-0 line-height-3">
                            {item.indicador?.descricao}
                        </p>
                    </div>
                    <Tag
                        value={`${item.peso_aplicado}%`}
                        severity="info"
                        className="ml-2"
                    />
                </div>

                <Divider className="my-2" />

                {/* Área de Avaliação */}
                <div className="grid">
                    {/* Mostrar autoavaliação em modo avaliação/visualização */}
                    {(modo === 'avaliacao' || modo === 'visualizacao') && (
                        <div className="col-12 md:col-6">
                            <div className="p-3 surface-50 border-round">
                                <label className="block text-500 text-sm mb-2">
                                    <i className="pi pi-user mr-2" />
                                    Autoavaliação
                                </label>
                                <div className="flex align-items-center gap-2 mb-2">
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
                                    <p className="text-sm m-0 text-600 line-height-3">
                                        "{item.justificacao_auto}"
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Campo de Pontuação Editável */}
                    <div className={`col-12 ${(modo === 'avaliacao' || modo === 'visualizacao') ? 'md:col-6' : ''}`}>
                        <div className={`p-3 border-round ${isReadOnly ? 'surface-50' : 'surface-card border-1 surface-border'}`}>
                            <label className="block text-500 text-sm mb-2">
                                <i className={`pi ${modo === 'autoavaliacao' ? 'pi-star' : 'pi-user-edit'} mr-2`} />
                                {modo === 'autoavaliacao' ? 'A Minha Pontuação' : 'Pontuação do Avaliador'}
                            </label>

                            <div className="flex align-items-center gap-2 mb-3">
                                <Rating
                                    value={getPontuacaoActual() || 0}
                                    onChange={(e) => !isReadOnly && onPontuacaoChange(item.id, e.value || null)}
                                    readOnly={isReadOnly}
                                    cancel={false}
                                    stars={5}
                                />
                                {getPontuacaoActual() && (
                                    <Tag
                                        value={getDescricaoPontuacao(getPontuacaoActual())}
                                        style={{ backgroundColor: getCorPontuacao(getPontuacaoActual()) }}
                                    />
                                )}
                            </div>

                            {!isReadOnly ? (
                                <InputTextarea
                                    value={getJustificacaoActual() || ''}
                                    onChange={(e) => onJustificacaoChange(item.id, e.target.value)}
                                    placeholder="Justifique a sua pontuação (obrigatório)..."
                                    rows={3}
                                    className="w-full"
                                    maxLength={1000}
                                />
                            ) : (
                                getJustificacaoActual() && (
                                    <p className="text-sm m-0 text-600 line-height-3">
                                        "{getJustificacaoActual()}"
                                    </p>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Indicador de Pontuação Ponderada (visualização) */}
                {modo === 'visualizacao' && item.pontuacao_ponderada && (
                    <div className="flex justify-content-end">
                        <div className="text-right">
                            <span className="text-500 text-sm mr-2">Contribuição:</span>
                            <Tag
                                value={`${item.pontuacao_ponderada.toFixed(2)} pts`}
                                severity="success"
                            />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
