'use client';

import React, { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Chart } from 'primereact/chart';
import { IItemAvaliacao } from '@/types/app';
import { getClassificacao, getClassificacaoColor } from '@/app/utils';

interface ResumoCalculoProps {
    itens: IItemAvaliacao[];
    modo: 'autoavaliacao' | 'avaliacao' | 'visualizacao';
    pontuacaoFinal?: number | null;
    classificacaoFinal?: string | null;
}

export default function ResumoCalculo({
    itens,
    modo,
    pontuacaoFinal,
    classificacaoFinal
}: ResumoCalculoProps) {

    const calculos = useMemo(() => {
        let somaPonderada = 0;
        let somaPesos = 0;
        let itensPreenchidos = 0;

        itens.forEach(item => {
            const pontuacao = modo === 'autoavaliacao'
                ? item.pontuacao_auto
                : (modo === 'avaliacao' ? item.pontuacao_avaliador : item.pontuacao_final);

            if (pontuacao && item.peso_aplicado) {
                somaPonderada += pontuacao * item.peso_aplicado;
                somaPesos += item.peso_aplicado;
                itensPreenchidos++;
            }
        });

        const media = somaPesos > 0 ? somaPonderada / somaPesos : 0;
        const progresso = itens.length > 0 ? (itensPreenchidos / itens.length) * 100 : 0;

        return {
            media: Math.round(media * 100) / 100,
            progresso: Math.round(progresso),
            itensPreenchidos,
            totalItens: itens.length,
            classificacao: getClassificacao(media),
            cor: getClassificacaoColor(getClassificacao(media))
        };
    }, [itens, modo]);

    // Dados para o gráfico radar
    const chartData = useMemo(() => {
        const labels = itens.map(item => item.indicador?.nome || '');

        const datasets = [];

        if (modo === 'autoavaliacao' || modo === 'visualizacao') {
            datasets.push({
                label: 'Autoavaliação',
                data: itens.map(item => item.pontuacao_auto || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            });
        }

        if (modo === 'avaliacao' || modo === 'visualizacao') {
            datasets.push({
                label: 'Avaliador',
                data: itens.map(item => item.pontuacao_avaliador || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgba(34, 197, 94, 1)',
                pointBackgroundColor: 'rgba(34, 197, 94, 1)',
            });
        }

        return { labels, datasets };
    }, [itens, modo]);

    const chartOptions = {
        plugins: {
            legend: {
                display: modo === 'visualizacao' || modo === 'avaliacao',
                position: 'bottom' as const
            }
        },
        scales: {
            r: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1
                }
            }
        },
        maintainAspectRatio: false
    };

    // Dados para comparação (modo avaliação/visualização)
    const comparacao = useMemo(() => {
        if (modo === 'autoavaliacao') return null;

        const itensComparacao = itens.filter(item =>
            item.pontuacao_auto && item.pontuacao_avaliador
        );

        if (itensComparacao.length === 0) return null;

        const diferencas = itensComparacao.map(item => ({
            indicador: item.indicador?.nome || '',
            auto: item.pontuacao_auto || 0,
            avaliador: item.pontuacao_avaliador || 0,
            diferenca: (item.pontuacao_avaliador || 0) - (item.pontuacao_auto || 0)
        }));

        const diferencaMedia = diferencas.reduce((acc, d) => acc + d.diferenca, 0) / diferencas.length;

        return {
            diferencas,
            diferencaMedia: Math.round(diferencaMedia * 100) / 100
        };
    }, [itens, modo]);

    return (
        <div className="resumo-calculo">
            {/* Pontuação Actual */}
            <Card className="mb-3">
                <div className="text-center">
                    <h4 className="mt-0 mb-3 text-500">
                        {modo === 'visualizacao' ? 'Pontuação Final' : 'Pontuação Actual'}
                    </h4>

                    <div
                        className="text-6xl font-bold mb-2"
                        style={{ color: calculos.cor }}
                    >
                        {pontuacaoFinal !== null && pontuacaoFinal !== undefined
                            ? pontuacaoFinal.toFixed(2)
                            : calculos.media.toFixed(2)
                        }
                    </div>

                    <Tag
                        value={classificacaoFinal || calculos.classificacao}
                        style={{
                            backgroundColor: calculos.cor,
                            fontSize: '1rem',
                            padding: '0.5rem 1rem'
                        }}
                    />

                    <Divider />

                    <div className="flex justify-content-between text-sm">
                        <span className="text-500">Indicadores avaliados:</span>
                        <span className="font-bold">
                            {calculos.itensPreenchidos} de {calculos.totalItens}
                        </span>
                    </div>

                    <div className="flex justify-content-between text-sm mt-2">
                        <span className="text-500">Progresso:</span>
                        <span className="font-bold">{calculos.progresso}%</span>
                    </div>
                </div>
            </Card>

            {/* Gráfico Radar */}
            {itens.length > 0 && (
                <Card className="mb-3">
                    <h5 className="mt-0 mb-3 text-center">Perfil de Competências</h5>
                    <div style={{ height: '250px' }}>
                        <Chart
                            type="radar"
                            data={chartData}
                            options={chartOptions}
                        />
                    </div>
                </Card>
            )}

            {/* Comparação Auto vs Avaliador */}
            {comparacao && (
                <Card className="mb-3">
                    <h5 className="mt-0 mb-3">Comparação</h5>

                    <div className="flex justify-content-between align-items-center mb-3 p-2 surface-100 border-round">
                        <span className="text-500">Diferença Média:</span>
                        <Tag
                            value={comparacao.diferencaMedia > 0
                                ? `+${comparacao.diferencaMedia}`
                                : comparacao.diferencaMedia.toString()
                            }
                            severity={comparacao.diferencaMedia > 0
                                ? 'success'
                                : comparacao.diferencaMedia < 0
                                    ? 'danger'
                                    : 'secondary'
                            }
                        />
                    </div>

                    <div className="text-sm">
                        {comparacao.diferencas.map((d, index) => (
                            <div
                                key={index}
                                className="flex justify-content-between py-2 border-bottom-1 surface-border"
                            >
                                <span className="text-500 text-xs" style={{ maxWidth: '60%' }}>
                                    {d.indicador}
                                </span>
                                <div className="flex gap-2 align-items-center">
                                    <span className="text-blue-500">{d.auto}</span>
                                    <i className="pi pi-arrow-right text-xs text-400" />
                                    <span className="text-green-500">{d.avaliador}</span>
                                    <Tag
                                        value={d.diferenca > 0 ? `+${d.diferenca}` : d.diferenca.toString()}
                                        severity={d.diferenca > 0 ? 'success' : d.diferenca < 0 ? 'danger' : 'secondary'}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Escala de Pontuação */}
            <Card>
                <h5 className="mt-0 mb-3">Escala de Avaliação</h5>
                <div className="text-sm">
                    <div className="flex align-items-center gap-2 mb-2">
                        <div className="w-1rem h-1rem border-round" style={{ backgroundColor: '#22c55e' }} />
                        <span>5 - Excelente</span>
                    </div>
                    <div className="flex align-items-center gap-2 mb-2">
                        <div className="w-1rem h-1rem border-round" style={{ backgroundColor: '#3b82f6' }} />
                        <span>4 - Muito Bom</span>
                    </div>
                    <div className="flex align-items-center gap-2 mb-2">
                        <div className="w-1rem h-1rem border-round" style={{ backgroundColor: '#eab308' }} />
                        <span>3 - Bom</span>
                    </div>
                    <div className="flex align-items-center gap-2 mb-2">
                        <div className="w-1rem h-1rem border-round" style={{ backgroundColor: '#f97316' }} />
                        <span>2 - Regular</span>
                    </div>
                    <div className="flex align-items-center gap-2">
                        <div className="w-1rem h-1rem border-round" style={{ backgroundColor: '#ef4444' }} />
                        <span>1 - Insuficiente</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
