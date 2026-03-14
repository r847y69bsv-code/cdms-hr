'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { IAvaliacao, IItemAvaliacao } from '@/types/app';

// Estilos do PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '2px solid #6366f1',
        paddingBottom: 15,
    },
    logo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 5,
    },
    titulo: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitulo: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#f3f4f6',
        padding: 8,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '30%',
        color: '#666',
    },
    value: {
        width: '70%',
        fontWeight: 'bold',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#6366f1',
        color: 'white',
        padding: 8,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #e5e7eb',
        padding: 8,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottom: '1px solid #e5e7eb',
        padding: 8,
        backgroundColor: '#f9fafb',
    },
    colIndicador: {
        width: '35%',
    },
    colPeso: {
        width: '10%',
        textAlign: 'center',
    },
    colPontuacao: {
        width: '15%',
        textAlign: 'center',
    },
    colJustificacao: {
        width: '40%',
        fontSize: 9,
    },
    pontuacaoBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        padding: 15,
        backgroundColor: '#f3f4f6',
        borderRadius: 5,
    },
    pontuacaoItem: {
        textAlign: 'center',
    },
    pontuacaoLabel: {
        fontSize: 9,
        color: '#666',
        marginBottom: 3,
    },
    pontuacaoValor: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    classificacao: {
        textAlign: 'center',
        marginTop: 15,
        padding: 15,
        borderRadius: 5,
    },
    classificacaoLabel: {
        fontSize: 10,
        color: '#666',
    },
    classificacaoValor: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    observacoes: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 5,
    },
    observacoesLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    observacoesTexto: {
        fontSize: 9,
        color: '#333',
        lineHeight: 1.5,
    },
    assinaturas: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    assinaturaBox: {
        width: '45%',
        textAlign: 'center',
    },
    assinaturaLinha: {
        borderTop: '1px solid #333',
        marginTop: 40,
        paddingTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#999',
        fontSize: 8,
        borderTop: '1px solid #e5e7eb',
        paddingTop: 10,
    },
});

interface PDFAvaliacaoProps {
    avaliacao: IAvaliacao;
}

const getClassificacaoCor = (classificacao: string): string => {
    const cores: Record<string, string> = {
        'Excelente': '#22c55e',
        'Muito Bom': '#3b82f6',
        'Bom': '#eab308',
        'Regular': '#f97316',
        'Insuficiente': '#ef4444',
    };
    return cores[classificacao] || '#6b7280';
};

const getDescricaoPontuacao = (valor: number | null | undefined): string => {
    if (!valor) return '-';
    const descricoes: Record<number, string> = {
        1: 'Insuficiente',
        2: 'Regular',
        3: 'Bom',
        4: 'Muito Bom',
        5: 'Excelente'
    };
    return descricoes[valor] || '-';
};

export default function PDFAvaliacao({ avaliacao }: PDFAvaliacaoProps) {
    const dataActual = new Date().toLocaleDateString('pt-PT');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Cabeçalho */}
                <View style={styles.header}>
                    <Text style={styles.logo}>CORNELDER DE MOÇAMBIQUE</Text>
                    <Text style={styles.titulo}>FICHA DE AVALIAÇÃO DE DESEMPENHO</Text>
                    <Text style={styles.subtitulo}>
                        {avaliacao.ciclo?.nome} - Ano {avaliacao.ciclo?.ano}
                    </Text>
                </View>

                {/* Dados do Trabalhador */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DADOS DO TRABALHADOR</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nome Completo:</Text>
                        <Text style={styles.value}>{avaliacao.trabalhador?.nome_completo}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>N.º Funcionário:</Text>
                        <Text style={styles.value}>{avaliacao.trabalhador?.numero_funcionario}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cargo:</Text>
                        <Text style={styles.value}>{avaliacao.trabalhador?.cargo}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Departamento:</Text>
                        <Text style={styles.value}>{avaliacao.trabalhador?.departamento}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Categoria:</Text>
                        <Text style={styles.value}>
                            {avaliacao.trabalhador?.categoria?.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Avaliador:</Text>
                        <Text style={styles.value}>{avaliacao.avaliador?.name}</Text>
                    </View>
                </View>

                {/* Tabela de Indicadores */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AVALIAÇÃO POR INDICADORES</Text>

                    {/* Cabeçalho da Tabela */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colIndicador}>Indicador</Text>
                        <Text style={styles.colPeso}>Peso</Text>
                        <Text style={styles.colPontuacao}>Auto</Text>
                        <Text style={styles.colPontuacao}>Aval.</Text>
                        <Text style={styles.colJustificacao}>Observações</Text>
                    </View>

                    {/* Linhas da Tabela */}
                    {avaliacao.itens?.map((item, index) => (
                        <View
                            key={item.id}
                            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                        >
                            <View style={styles.colIndicador}>
                                <Text style={{ fontWeight: 'bold' }}>{item.indicador?.nome}</Text>
                            </View>
                            <Text style={styles.colPeso}>{item.peso_aplicado}%</Text>
                            <Text style={styles.colPontuacao}>
                                {item.pontuacao_auto || '-'}
                            </Text>
                            <Text style={styles.colPontuacao}>
                                {item.pontuacao_avaliador || '-'}
                            </Text>
                            <Text style={styles.colJustificacao}>
                                {item.justificacao_avaliador || item.justificacao_auto || '-'}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Pontuações */}
                <View style={styles.pontuacaoBox}>
                    <View style={styles.pontuacaoItem}>
                        <Text style={styles.pontuacaoLabel}>AUTOAVALIAÇÃO</Text>
                        <Text style={styles.pontuacaoValor}>
                            {avaliacao.pontuacao_auto?.toFixed(2) || '-'}
                        </Text>
                    </View>
                    <View style={styles.pontuacaoItem}>
                        <Text style={styles.pontuacaoLabel}>AVALIADOR</Text>
                        <Text style={styles.pontuacaoValor}>
                            {avaliacao.pontuacao_avaliador?.toFixed(2) || '-'}
                        </Text>
                    </View>
                    <View style={styles.pontuacaoItem}>
                        <Text style={styles.pontuacaoLabel}>PONTUAÇÃO FINAL</Text>
                        <Text style={styles.pontuacaoValor}>
                            {avaliacao.pontuacao_final?.toFixed(2) || '-'}
                        </Text>
                    </View>
                </View>

                {/* Classificação Final */}
                {avaliacao.classificacao_final && (
                    <View style={[
                        styles.classificacao,
                        { backgroundColor: getClassificacaoCor(avaliacao.classificacao_final) + '20' }
                    ]}>
                        <Text style={styles.classificacaoLabel}>CLASSIFICAÇÃO FINAL</Text>
                        <Text style={[
                            styles.classificacaoValor,
                            { color: getClassificacaoCor(avaliacao.classificacao_final) }
                        ]}>
                            {avaliacao.classificacao_final}
                        </Text>
                    </View>
                )}

                {/* Observações */}
                {(avaliacao.observacoes_trabalhador || avaliacao.observacoes_avaliador) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>

                        {avaliacao.observacoes_trabalhador && (
                            <View style={styles.observacoes}>
                                <Text style={styles.observacoesLabel}>Observações do Trabalhador:</Text>
                                <Text style={styles.observacoesTexto}>{avaliacao.observacoes_trabalhador}</Text>
                            </View>
                        )}

                        {avaliacao.observacoes_avaliador && (
                            <View style={styles.observacoes}>
                                <Text style={styles.observacoesLabel}>Observações do Avaliador:</Text>
                                <Text style={styles.observacoesTexto}>{avaliacao.observacoes_avaliador}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Assinaturas */}
                <View style={styles.assinaturas}>
                    <View style={styles.assinaturaBox}>
                        <View style={styles.assinaturaLinha}>
                            <Text>Trabalhador</Text>
                            <Text style={{ fontSize: 8, color: '#666', marginTop: 3 }}>
                                {avaliacao.trabalhador?.nome_completo}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.assinaturaBox}>
                        <View style={styles.assinaturaLinha}>
                            <Text>Avaliador</Text>
                            <Text style={{ fontSize: 8, color: '#666', marginTop: 3 }}>
                                {avaliacao.avaliador?.name}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Rodapé */}
                <View style={styles.footer}>
                    <Text>
                        Documento gerado em {dataActual} | CDMS-HR - Sistema de Gestão de Recursos Humanos
                    </Text>
                    <Text style={{ marginTop: 2 }}>
                        Este documento é confidencial e de uso interno
                    </Text>
                </View>
            </Page>
        </Document>
    );
}

// Componente auxiliar para gerar e descarregar o PDF
export function PDFDownloadButton({
    avaliacao,
    label = 'Exportar PDF',
    iconOnly = false
}: {
    avaliacao: IAvaliacao;
    label?: string;
    iconOnly?: boolean;
}) {
    const [loading, setLoading] = React.useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(<PDFAvaliacao avaliacao={avaliacao} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `avaliacao_${avaliacao.trabalhador?.nome_completo?.replace(/\s+/g, '_')}_${avaliacao.ciclo?.ano}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
        } finally {
            setLoading(false);
        }
    };

    if (iconOnly) {
        return (
            <button
                onClick={handleDownload}
                disabled={loading}
                className="p-button p-button-rounded p-button-text p-button-sm"
                style={{ color: '#ef4444' }}
                title="Exportar PDF"
            >
                <i className={`pi ${loading ? 'pi-spin pi-spinner' : 'pi-file-pdf'}`} />
            </button>
        );
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="p-button p-button-outlined"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: loading ? 'wait' : 'pointer',
                borderColor: '#ef4444',
                color: '#ef4444',
                backgroundColor: 'transparent',
            }}
        >
            <i className={`pi ${loading ? 'pi-spin pi-spinner' : 'pi-file-pdf'}`} />
            <span>{loading ? 'A gerar...' : label}</span>
        </button>
    );
}
