'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import ExcelJS from 'exceljs';
import { IAvaliacao } from '@/types/app';
import { getEstadoAvaliacaoLabel } from '@/app/utils';

interface ExcelExportProps {
    data: IAvaliacao[];
    filename?: string;
    label?: string;
    icon?: string;
    className?: string;
    disabled?: boolean;
}

// Exportar avaliações para Excel
export function ExportarAvaliacoesExcel({
    data,
    filename = 'avaliacoes',
    label = 'Exportar Excel',
    icon = 'pi pi-file-excel',
    className = 'p-button-outlined p-button-success',
    disabled = false
}: ExcelExportProps) {
    const [loading, setLoading] = useState(false);

    const exportar = async () => {
        if (data.length === 0) return;

        setLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CDMS-HR';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Avaliações');

            // Cabeçalhos
            worksheet.columns = [
                { header: 'Nº Funcionário', key: 'numero', width: 15 },
                { header: 'Nome Completo', key: 'nome', width: 35 },
                { header: 'Departamento', key: 'departamento', width: 20 },
                { header: 'Cargo', key: 'cargo', width: 25 },
                { header: 'Categoria', key: 'categoria', width: 15 },
                { header: 'Ciclo', key: 'ciclo', width: 20 },
                { header: 'Estado', key: 'estado', width: 18 },
                { header: 'Pont. Auto', key: 'pontAuto', width: 12 },
                { header: 'Pont. Avaliador', key: 'pontAvaliador', width: 15 },
                { header: 'Pont. Final', key: 'pontFinal', width: 12 },
                { header: 'Classificação', key: 'classificacao', width: 15 },
                { header: 'Avaliador', key: 'avaliador', width: 25 },
                { header: 'Data Submissão', key: 'dataSubmissao', width: 15 },
            ];

            // Estilo do cabeçalho
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '3B82F6' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.height = 25;

            // Dados
            data.forEach(avaliacao => {
                worksheet.addRow({
                    numero: avaliacao.trabalhador?.numero_funcionario || '-',
                    nome: avaliacao.trabalhador?.nome_completo || '-',
                    departamento: avaliacao.trabalhador?.departamento || '-',
                    cargo: avaliacao.trabalhador?.cargo || '-',
                    categoria: avaliacao.trabalhador?.categoria?.replace('_', ' ').toUpperCase() || '-',
                    ciclo: avaliacao.ciclo?.nome || '-',
                    estado: getEstadoAvaliacaoLabel(avaliacao.estado),
                    pontAuto: avaliacao.pontuacao_auto?.toFixed(2) || '-',
                    pontAvaliador: avaliacao.pontuacao_avaliador?.toFixed(2) || '-',
                    pontFinal: avaliacao.pontuacao_final?.toFixed(2) || '-',
                    classificacao: avaliacao.classificacao_final || '-',
                    avaliador: avaliacao.avaliador?.name || '-',
                    dataSubmissao: avaliacao.data_submissao_auto
                        ? new Date(avaliacao.data_submissao_auto).toLocaleDateString('pt-PT')
                        : '-',
                });
            });

            // Formatar células de dados
            for (let i = 2; i <= data.length + 1; i++) {
                const row = worksheet.getRow(i);
                row.alignment = { vertical: 'middle' };

                // Colorir classificação
                const classificacaoCell = row.getCell('classificacao');
                const classificacao = classificacaoCell.value as string;
                if (classificacao && classificacao !== '-') {
                    classificacaoCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: getClassificacaoArgb(classificacao) }
                    };
                    classificacaoCell.font = { color: { argb: 'FFFFFF' }, bold: true };
                }

                // Formatar pontuações como números
                ['pontAuto', 'pontAvaliador', 'pontFinal'].forEach(key => {
                    const cell = row.getCell(key);
                    const value = cell.value as string;
                    if (value && value !== '-') {
                        cell.alignment = { horizontal: 'center' };
                    }
                });
            }

            // Adicionar bordas
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

            // Auto-filter
            worksheet.autoFilter = {
                from: 'A1',
                to: `M${data.length + 1}`
            };

            // Adicionar aba de resumo estatístico
            adicionarResumoEstatistico(workbook, data);

            // Gerar e baixar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            label={label}
            icon={icon}
            className={className}
            onClick={exportar}
            loading={loading}
            disabled={disabled || data.length === 0}
        />
    );
}

// Cores das classificações em ARGB
function getClassificacaoArgb(classificacao: string): string {
    const cores: Record<string, string> = {
        'Excelente': '22C55E',
        'Muito Bom': '3B82F6',
        'Bom': 'EAB308',
        'Regular': 'F97316',
        'Insuficiente': 'EF4444',
    };
    return cores[classificacao] || '6B7280';
}

// Adicionar aba de resumo estatístico
function adicionarResumoEstatistico(workbook: ExcelJS.Workbook, data: IAvaliacao[]) {
    const worksheet = workbook.addWorksheet('Resumo Estatístico');

    // Título
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Resumo Estatístico das Avaliações';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Estatísticas gerais
    const total = data.length;
    const concluidas = data.filter(a => ['aprovada', 'feedback_feito'].includes(a.estado)).length;
    const emProgresso = data.filter(a => !['aprovada', 'feedback_feito', 'contestada'].includes(a.estado)).length;
    const contestadas = data.filter(a => a.estado === 'contestada').length;
    const comPontuacao = data.filter(a => a.pontuacao_final);
    const media = comPontuacao.length > 0
        ? comPontuacao.reduce((acc, a) => acc + (a.pontuacao_final || 0), 0) / comPontuacao.length
        : 0;

    const estatisticas = [
        ['', ''],
        ['Estatísticas Gerais', ''],
        ['Total de Avaliações', total],
        ['Concluídas', concluidas],
        ['Em Progresso', emProgresso],
        ['Contestadas', contestadas],
        ['Média Global', media > 0 ? media.toFixed(2) : '-'],
        ['', ''],
    ];

    let row = 3;
    estatisticas.forEach(([label, value]) => {
        worksheet.getCell(`A${row}`).value = label;
        worksheet.getCell(`B${row}`).value = value;
        if (label === 'Estatísticas Gerais') {
            worksheet.getCell(`A${row}`).font = { bold: true };
        }
        row++;
    });

    // Distribuição por classificação
    worksheet.getCell(`A${row}`).value = 'Distribuição por Classificação';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    const classificacoes = ['Excelente', 'Muito Bom', 'Bom', 'Regular', 'Insuficiente'];
    classificacoes.forEach(classificacao => {
        const count = data.filter(a => a.classificacao_final === classificacao).length;
        worksheet.getCell(`A${row}`).value = classificacao;
        worksheet.getCell(`B${row}`).value = count;
        worksheet.getCell(`C${row}`).value = total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%';
        row++;
    });

    row++;

    // Distribuição por departamento
    worksheet.getCell(`A${row}`).value = 'Distribuição por Departamento';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    const departamentos = Array.from(new Set(data.map(a => a.trabalhador?.departamento).filter(Boolean))) as string[];
    departamentos.forEach(dept => {
        const avalDept = data.filter(a => a.trabalhador?.departamento === dept);
        const mediaDept = avalDept.filter(a => a.pontuacao_final);
        const avgDept = mediaDept.length > 0
            ? mediaDept.reduce((acc, a) => acc + (a.pontuacao_final || 0), 0) / mediaDept.length
            : 0;

        worksheet.getCell(`A${row}`).value = dept;
        worksheet.getCell(`B${row}`).value = avalDept.length;
        worksheet.getCell(`C${row}`).value = avgDept > 0 ? avgDept.toFixed(2) : '-';
        row++;
    });

    // Ajustar larguras
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 15;
}

// Componente para exportar ranking
interface RankingItem {
    posicao: number;
    trabalhador: string;
    departamento: string;
    pontuacao: number;
    classificacao: string;
}

interface ExportarRankingProps {
    data: RankingItem[];
    cicloNome?: string;
    filename?: string;
    label?: string;
}

export function ExportarRankingExcel({
    data,
    cicloNome = '',
    filename = 'ranking',
    label = 'Exportar Ranking'
}: ExportarRankingProps) {
    const [loading, setLoading] = useState(false);

    const exportar = async () => {
        if (data.length === 0) return;

        setLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CDMS-HR';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Ranking');

            // Título
            worksheet.mergeCells('A1:E1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Ranking de Desempenho${cicloNome ? ` - ${cicloNome}` : ''}`;
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center' };

            // Cabeçalhos
            worksheet.getRow(3).values = ['Posição', 'Trabalhador', 'Departamento', 'Pontuação', 'Classificação'];
            const headerRow = worksheet.getRow(3);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '6366F1' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

            // Larguras
            worksheet.getColumn(1).width = 10;
            worksheet.getColumn(2).width = 35;
            worksheet.getColumn(3).width = 25;
            worksheet.getColumn(4).width = 12;
            worksheet.getColumn(5).width = 15;

            // Dados
            data.forEach((item) => {
                const row = worksheet.addRow([
                    item.posicao,
                    item.trabalhador,
                    item.departamento,
                    item.pontuacao.toFixed(2),
                    item.classificacao
                ]);

                // Destacar top 3
                if (item.posicao <= 3) {
                    const colors = ['FFD700', 'C0C0C0', 'CD7F32'];
                    row.getCell(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: colors[item.posicao - 1] }
                    };
                    row.getCell(1).font = { bold: true };
                }

                // Colorir classificação
                const classificacaoCell = row.getCell(5);
                classificacaoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: getClassificacaoArgb(item.classificacao) }
                };
                classificacaoCell.font = { color: { argb: 'FFFFFF' }, bold: true };
                classificacaoCell.alignment = { horizontal: 'center' };
            });

            // Bordas
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber >= 3) {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'E5E7EB' } },
                            left: { style: 'thin', color: { argb: 'E5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
                            right: { style: 'thin', color: { argb: 'E5E7EB' } }
                        };
                    });
                }
            });

            // Gerar e baixar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            label={label}
            icon="pi pi-download"
            className="p-button-help"
            onClick={exportar}
            loading={loading}
            disabled={data.length === 0}
        />
    );
}

// Componente para exportar estatísticas por departamento
interface DepartamentoStats {
    departamento: string;
    total: number;
    media: number;
}

interface ExportarDepartamentosProps {
    data: DepartamentoStats[];
    cicloNome?: string;
    filename?: string;
    label?: string;
}

export function ExportarDepartamentosExcel({
    data,
    cicloNome = '',
    filename = 'departamentos',
    label = 'Exportar Departamentos'
}: ExportarDepartamentosProps) {
    const [loading, setLoading] = useState(false);

    const exportar = async () => {
        if (data.length === 0) return;

        setLoading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'CDMS-HR';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Por Departamento');

            // Título
            worksheet.mergeCells('A1:C1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Resumo por Departamento${cicloNome ? ` - ${cicloNome}` : ''}`;
            titleCell.font = { bold: true, size: 14 };
            titleCell.alignment = { horizontal: 'center' };

            // Cabeçalhos
            worksheet.getRow(3).values = ['Departamento', 'Total Avaliações', 'Média'];
            const headerRow = worksheet.getRow(3);
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '3B82F6' }
            };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

            // Larguras
            worksheet.getColumn(1).width = 30;
            worksheet.getColumn(2).width = 18;
            worksheet.getColumn(3).width = 12;

            // Dados ordenados por média
            const sortedData = [...data].sort((a, b) => b.media - a.media);
            sortedData.forEach(item => {
                const row = worksheet.addRow([
                    item.departamento,
                    item.total,
                    item.media.toFixed(2)
                ]);
                row.getCell(2).alignment = { horizontal: 'center' };
                row.getCell(3).alignment = { horizontal: 'center' };

                // Colorir média por performance
                const mediaCell = row.getCell(3);
                if (item.media >= 4) {
                    mediaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
                } else if (item.media >= 3) {
                    mediaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
                } else if (item.media > 0) {
                    mediaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
                }
            });

            // Linha de total
            const totalRow = worksheet.addRow([
                'TOTAL/MÉDIA',
                data.reduce((acc, d) => acc + d.total, 0),
                data.length > 0 ? (data.reduce((acc, d) => acc + d.media, 0) / data.length).toFixed(2) : '-'
            ]);
            totalRow.font = { bold: true };
            totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } };

            // Bordas
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber >= 3) {
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'E5E7EB' } },
                            left: { style: 'thin', color: { argb: 'E5E7EB' } },
                            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
                            right: { style: 'thin', color: { argb: 'E5E7EB' } }
                        };
                    });
                }
            });

            // Gerar e baixar
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            label={label}
            icon="pi pi-download"
            className="p-button-info"
            onClick={exportar}
            loading={loading}
            disabled={data.length === 0}
        />
    );
}
