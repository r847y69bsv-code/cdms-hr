<?php

namespace App\Services;

use App\Models\Avaliacao;
use App\Models\CicloAvaliacao;
use App\Models\Trabalhador;
use App\Models\Indicador;
use Illuminate\Support\Collection;

class RelatorioService
{
    protected AvaliacaoService $avaliacaoService;

    public function __construct(AvaliacaoService $avaliacaoService)
    {
        $this->avaliacaoService = $avaliacaoService;
    }

    /**
     * Gerar relatório completo de um ciclo
     */
    public function relatorioCiclo(int $cicloId): array
    {
        $ciclo = CicloAvaliacao::findOrFail($cicloId);
        $avaliacoes = Avaliacao::where('ciclo_id', $cicloId)
            ->with(['trabalhador', 'avaliador', 'itens.indicador'])
            ->get();

        return [
            'ciclo' => [
                'id' => $ciclo->id,
                'nome' => $ciclo->nome,
                'ano' => $ciclo->ano,
                'estado' => $ciclo->estado,
                'periodo_autoavaliacao' => [
                    'inicio' => $ciclo->data_inicio_autoavaliacao,
                    'fim' => $ciclo->data_fim_autoavaliacao,
                ],
                'periodo_avaliacao' => [
                    'inicio' => $ciclo->data_inicio_avaliacao,
                    'fim' => $ciclo->data_fim_avaliacao,
                ],
                'periodo_revisao' => [
                    'inicio' => $ciclo->data_inicio_revisao,
                    'fim' => $ciclo->data_fim_revisao,
                ],
            ],
            'resumo' => $this->gerarResumoGeral($avaliacoes),
            'por_departamento' => $this->agruparPorDepartamento($avaliacoes),
            'por_categoria' => $this->agruparPorCategoria($avaliacoes),
            'por_classificacao' => $this->distribuicaoPorClassificacao($avaliacoes),
            'por_indicador' => $this->mediasPorIndicador($avaliacoes),
            'top_performers' => $this->topPerformers($avaliacoes, 10),
            'necessitam_atencao' => $this->necessitamAtencao($avaliacoes),
        ];
    }

    /**
     * Gerar resumo geral
     */
    protected function gerarResumoGeral(Collection $avaliacoes): array
    {
        $concluidas = $avaliacoes->whereIn('estado', [
            Avaliacao::ESTADO_APROVADA,
            Avaliacao::ESTADO_FEEDBACK_FEITO,
        ]);

        $comPontuacao = $avaliacoes->whereNotNull('pontuacao_final');

        return [
            'total_avaliacoes' => $avaliacoes->count(),
            'concluidas' => $concluidas->count(),
            'em_progresso' => $avaliacoes->count() - $concluidas->count(),
            'taxa_conclusao' => $avaliacoes->count() > 0
                ? round(($concluidas->count() / $avaliacoes->count()) * 100, 1)
                : 0,
            'media_global' => $comPontuacao->count() > 0
                ? round($comPontuacao->avg('pontuacao_final'), 2)
                : null,
            'media_auto' => $avaliacoes->whereNotNull('pontuacao_auto')->avg('pontuacao_auto')
                ? round($avaliacoes->whereNotNull('pontuacao_auto')->avg('pontuacao_auto'), 2)
                : null,
            'media_avaliador' => $avaliacoes->whereNotNull('pontuacao_avaliador')->avg('pontuacao_avaliador')
                ? round($avaliacoes->whereNotNull('pontuacao_avaliador')->avg('pontuacao_avaliador'), 2)
                : null,
            'diferenca_media_auto_avaliador' => $this->calcularDiferencaMediaAutoAvaliador($avaliacoes),
        ];
    }

    /**
     * Calcular diferença média entre autoavaliação e avaliação
     */
    protected function calcularDiferencaMediaAutoAvaliador(Collection $avaliacoes): ?float
    {
        $comAmbas = $avaliacoes->filter(function ($av) {
            return $av->pontuacao_auto && $av->pontuacao_avaliador;
        });

        if ($comAmbas->isEmpty()) {
            return null;
        }

        $diferencas = $comAmbas->map(function ($av) {
            return $av->pontuacao_avaliador - $av->pontuacao_auto;
        });

        return round($diferencas->avg(), 2);
    }

    /**
     * Agrupar avaliações por departamento
     */
    protected function agruparPorDepartamento(Collection $avaliacoes): array
    {
        return $avaliacoes
            ->groupBy(fn($av) => $av->trabalhador->departamento)
            ->map(function ($grupo, $departamento) {
                $comPontuacao = $grupo->whereNotNull('pontuacao_final');

                return [
                    'departamento' => $departamento,
                    'total' => $grupo->count(),
                    'media' => $comPontuacao->count() > 0
                        ? round($comPontuacao->avg('pontuacao_final'), 2)
                        : null,
                    'concluidas' => $grupo->whereIn('estado', [
                        Avaliacao::ESTADO_APROVADA,
                        Avaliacao::ESTADO_FEEDBACK_FEITO,
                    ])->count(),
                    'distribuicao' => $grupo->whereNotNull('classificacao_final')
                        ->groupBy('classificacao_final')
                        ->map->count()
                        ->toArray(),
                ];
            })
            ->sortByDesc('media')
            ->values()
            ->toArray();
    }

    /**
     * Agrupar avaliações por categoria de trabalhador
     */
    protected function agruparPorCategoria(Collection $avaliacoes): array
    {
        $nomesCategoria = [
            'nao_lider' => 'Não Líder',
            'supervisor' => 'Supervisor',
            'chefe_seccao' => 'Chefe de Secção',
            'chefe_departamento' => 'Chefe de Departamento',
            'director' => 'Director',
            'director_geral' => 'Director Geral',
        ];

        return $avaliacoes
            ->groupBy(fn($av) => $av->trabalhador->categoria)
            ->map(function ($grupo, $categoria) use ($nomesCategoria) {
                $comPontuacao = $grupo->whereNotNull('pontuacao_final');

                return [
                    'categoria' => $categoria,
                    'nome' => $nomesCategoria[$categoria] ?? $categoria,
                    'total' => $grupo->count(),
                    'media' => $comPontuacao->count() > 0
                        ? round($comPontuacao->avg('pontuacao_final'), 2)
                        : null,
                ];
            })
            ->sortByDesc('media')
            ->values()
            ->toArray();
    }

    /**
     * Distribuição por classificação
     */
    protected function distribuicaoPorClassificacao(Collection $avaliacoes): array
    {
        $classificacoes = [
            Avaliacao::CLASSIFICACAO_EXCELENTE => ['cor' => '#22c55e', 'ordem' => 1],
            Avaliacao::CLASSIFICACAO_MUITO_BOM => ['cor' => '#3b82f6', 'ordem' => 2],
            Avaliacao::CLASSIFICACAO_BOM => ['cor' => '#eab308', 'ordem' => 3],
            Avaliacao::CLASSIFICACAO_REGULAR => ['cor' => '#f97316', 'ordem' => 4],
            Avaliacao::CLASSIFICACAO_INSUFICIENTE => ['cor' => '#ef4444', 'ordem' => 5],
        ];

        $distribuicao = $avaliacoes
            ->whereNotNull('classificacao_final')
            ->groupBy('classificacao_final')
            ->map(function ($grupo, $classificacao) use ($classificacoes, $avaliacoes) {
                $total = $avaliacoes->whereNotNull('classificacao_final')->count();
                return [
                    'classificacao' => $classificacao,
                    'total' => $grupo->count(),
                    'percentagem' => $total > 0 ? round(($grupo->count() / $total) * 100, 1) : 0,
                    'cor' => $classificacoes[$classificacao]['cor'] ?? '#6b7280',
                    'ordem' => $classificacoes[$classificacao]['ordem'] ?? 99,
                ];
            })
            ->sortBy('ordem')
            ->values()
            ->toArray();

        return $distribuicao;
    }

    /**
     * Médias por indicador
     */
    protected function mediasPorIndicador(Collection $avaliacoes): array
    {
        $indicadores = Indicador::where('activo', true)->orderBy('ordem')->get();

        return $indicadores->map(function ($indicador) use ($avaliacoes) {
            $pontuacoesAuto = [];
            $pontuacoesAvaliador = [];
            $pontuacoesFinais = [];

            foreach ($avaliacoes as $avaliacao) {
                $item = $avaliacao->itens->firstWhere('indicador_id', $indicador->id);
                if ($item) {
                    if ($item->pontuacao_auto) {
                        $pontuacoesAuto[] = $item->pontuacao_auto;
                    }
                    if ($item->pontuacao_avaliador) {
                        $pontuacoesAvaliador[] = $item->pontuacao_avaliador;
                    }
                    if ($item->pontuacao_final) {
                        $pontuacoesFinais[] = $item->pontuacao_final;
                    }
                }
            }

            return [
                'indicador' => $indicador->nome,
                'codigo' => $indicador->codigo,
                'media_auto' => count($pontuacoesAuto) > 0
                    ? round(array_sum($pontuacoesAuto) / count($pontuacoesAuto), 2)
                    : null,
                'media_avaliador' => count($pontuacoesAvaliador) > 0
                    ? round(array_sum($pontuacoesAvaliador) / count($pontuacoesAvaliador), 2)
                    : null,
                'media_final' => count($pontuacoesFinais) > 0
                    ? round(array_sum($pontuacoesFinais) / count($pontuacoesFinais), 2)
                    : null,
                'total_avaliacoes' => count($pontuacoesFinais),
            ];
        })->toArray();
    }

    /**
     * Top performers
     */
    protected function topPerformers(Collection $avaliacoes, int $limite = 10): array
    {
        return $avaliacoes
            ->whereNotNull('pontuacao_final')
            ->sortByDesc('pontuacao_final')
            ->take($limite)
            ->map(function ($av) {
                return [
                    'trabalhador' => $av->trabalhador->nome_completo,
                    'departamento' => $av->trabalhador->departamento,
                    'cargo' => $av->trabalhador->cargo,
                    'pontuacao' => $av->pontuacao_final,
                    'classificacao' => $av->classificacao_final,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Trabalhadores que necessitam atenção (classificação Regular ou Insuficiente)
     */
    protected function necessitamAtencao(Collection $avaliacoes): array
    {
        return $avaliacoes
            ->whereIn('classificacao_final', [
                Avaliacao::CLASSIFICACAO_REGULAR,
                Avaliacao::CLASSIFICACAO_INSUFICIENTE,
            ])
            ->sortBy('pontuacao_final')
            ->map(function ($av) {
                return [
                    'trabalhador' => $av->trabalhador->nome_completo,
                    'departamento' => $av->trabalhador->departamento,
                    'cargo' => $av->trabalhador->cargo,
                    'pontuacao' => $av->pontuacao_final,
                    'classificacao' => $av->classificacao_final,
                    'avaliador' => $av->avaliador?->name,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Gerar relatório comparativo entre ciclos
     */
    public function relatorioComparativoCiclos(array $cicloIds): array
    {
        $ciclos = CicloAvaliacao::whereIn('id', $cicloIds)
            ->orderBy('ano')
            ->get();

        $comparativo = [];

        foreach ($ciclos as $ciclo) {
            $avaliacoes = Avaliacao::where('ciclo_id', $ciclo->id)
                ->whereNotNull('pontuacao_final')
                ->with('trabalhador')
                ->get();

            $comparativo[] = [
                'ciclo_id' => $ciclo->id,
                'nome' => $ciclo->nome,
                'ano' => $ciclo->ano,
                'total_avaliacoes' => $avaliacoes->count(),
                'media_global' => round($avaliacoes->avg('pontuacao_final'), 2),
                'distribuicao' => $avaliacoes->groupBy('classificacao_final')
                    ->map->count()
                    ->toArray(),
            ];
        }

        // Calcular tendência
        if (count($comparativo) >= 2) {
            $primeiro = $comparativo[0]['media_global'];
            $ultimo = $comparativo[count($comparativo) - 1]['media_global'];
            $tendencia = $ultimo - $primeiro;
        } else {
            $tendencia = null;
        }

        return [
            'ciclos' => $comparativo,
            'tendencia' => $tendencia,
            'tendencia_descricao' => $tendencia > 0 ? 'Melhoria' : ($tendencia < 0 ? 'Declínio' : 'Estável'),
        ];
    }

    /**
     * Gerar relatório de evolução de um trabalhador
     */
    public function relatorioEvolucaoTrabalhador(int $trabalhadorId): array
    {
        $trabalhador = Trabalhador::findOrFail($trabalhadorId);

        $avaliacoes = Avaliacao::where('trabalhador_id', $trabalhadorId)
            ->whereNotNull('pontuacao_final')
            ->with(['ciclo', 'itens.indicador'])
            ->orderBy('created_at')
            ->get();

        $evolucao = $avaliacoes->map(function ($av) {
            return [
                'ciclo' => $av->ciclo->nome,
                'ano' => $av->ciclo->ano,
                'pontuacao' => $av->pontuacao_final,
                'classificacao' => $av->classificacao_final,
                'pontuacoes_indicadores' => $av->itens->map(function ($item) {
                    return [
                        'indicador' => $item->indicador->codigo,
                        'pontuacao' => $item->pontuacao_final,
                    ];
                })->pluck('pontuacao', 'indicador'),
            ];
        });

        // Calcular tendência
        $pontuacoes = $evolucao->pluck('pontuacao');
        $tendencia = null;
        if ($pontuacoes->count() >= 2) {
            $tendencia = $pontuacoes->last() - $pontuacoes->first();
        }

        return [
            'trabalhador' => [
                'id' => $trabalhador->id,
                'nome' => $trabalhador->nome_completo,
                'departamento' => $trabalhador->departamento,
                'cargo' => $trabalhador->cargo,
            ],
            'total_avaliacoes' => $avaliacoes->count(),
            'media_historica' => round($pontuacoes->avg(), 2),
            'melhor_pontuacao' => $pontuacoes->max(),
            'pior_pontuacao' => $pontuacoes->min(),
            'tendencia' => $tendencia,
            'evolucao' => $evolucao->toArray(),
        ];
    }

    /**
     * Gerar dados para exportação Excel
     */
    public function dadosParaExportacao(int $cicloId, ?string $departamento = null): array
    {
        $query = Avaliacao::where('ciclo_id', $cicloId)
            ->with(['ciclo', 'trabalhador', 'avaliador', 'itens.indicador']);

        if ($departamento) {
            $query->whereHas('trabalhador', function ($q) use ($departamento) {
                $q->where('departamento', $departamento);
            });
        }

        $avaliacoes = $query->get();
        $indicadores = Indicador::where('activo', true)->orderBy('ordem')->get();

        // Cabeçalhos
        $cabecalhos = [
            'Número Funcionário',
            'Nome Completo',
            'Departamento',
            'Cargo',
            'Categoria',
            'Avaliador',
            'Estado',
            'Pontuação Auto',
            'Pontuação Avaliador',
            'Pontuação Final',
            'Classificação',
        ];

        foreach ($indicadores as $indicador) {
            $cabecalhos[] = $indicador->nome . ' (Auto)';
            $cabecalhos[] = $indicador->nome . ' (Avaliador)';
            $cabecalhos[] = $indicador->nome . ' (Final)';
        }

        // Dados
        $linhas = $avaliacoes->map(function ($av) use ($indicadores) {
            $linha = [
                $av->trabalhador->numero_funcionario,
                $av->trabalhador->nome_completo,
                $av->trabalhador->departamento,
                $av->trabalhador->cargo,
                $av->trabalhador->categoria,
                $av->avaliador?->name ?? '',
                $av->estado,
                $av->pontuacao_auto,
                $av->pontuacao_avaliador,
                $av->pontuacao_final,
                $av->classificacao_final,
            ];

            foreach ($indicadores as $indicador) {
                $item = $av->itens->firstWhere('indicador_id', $indicador->id);
                $linha[] = $item?->pontuacao_auto;
                $linha[] = $item?->pontuacao_avaliador;
                $linha[] = $item?->pontuacao_final;
            }

            return $linha;
        })->toArray();

        return [
            'cabecalhos' => $cabecalhos,
            'linhas' => $linhas,
            'meta' => [
                'ciclo' => CicloAvaliacao::find($cicloId)->nome,
                'departamento' => $departamento ?? 'Todos',
                'gerado_em' => now()->format('Y-m-d H:i:s'),
                'total_registos' => count($linhas),
            ],
        ];
    }
}
