<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avaliacao;
use App\Models\CicloAvaliacao;
use App\Models\Trabalhador;
use App\Models\Indicador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RelatorioController extends Controller
{
    /**
     * Relatório geral de um ciclo
     */
    public function ciclo(CicloAvaliacao $ciclo): JsonResponse
    {
        $avaliacoes = Avaliacao::where('ciclo_id', $ciclo->id)
            ->with(['trabalhador', 'avaliador'])
            ->get();

        // Estatísticas gerais
        $total = $avaliacoes->count();
        $concluidas = $avaliacoes->whereIn('estado', [
            Avaliacao::ESTADO_APROVADA,
            Avaliacao::ESTADO_FEEDBACK_FEITO,
        ])->count();

        $mediaPontuacao = $avaliacoes->whereNotNull('pontuacao_final')->avg('pontuacao_final');

        // Distribuição por classificação
        $distribuicaoClassificacao = $avaliacoes
            ->whereNotNull('classificacao_final')
            ->groupBy('classificacao_final')
            ->map->count();

        // Distribuição por estado
        $distribuicaoEstado = $avaliacoes
            ->groupBy('estado')
            ->map->count();

        // Por departamento
        $porDepartamento = $avaliacoes
            ->groupBy(fn($av) => $av->trabalhador->departamento)
            ->map(function ($items, $dept) {
                return [
                    'departamento' => $dept,
                    'total' => $items->count(),
                    'media' => round($items->whereNotNull('pontuacao_final')->avg('pontuacao_final'), 2),
                    'concluidas' => $items->whereIn('estado', [
                        Avaliacao::ESTADO_APROVADA,
                        Avaliacao::ESTADO_FEEDBACK_FEITO,
                    ])->count(),
                ];
            })
            ->values();

        // Por categoria
        $porCategoria = $avaliacoes
            ->groupBy(fn($av) => $av->trabalhador->categoria)
            ->map(function ($items, $cat) {
                return [
                    'categoria' => $cat,
                    'total' => $items->count(),
                    'media' => round($items->whereNotNull('pontuacao_final')->avg('pontuacao_final'), 2),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'ciclo' => $ciclo,
                'estatisticas' => [
                    'total' => $total,
                    'concluidas' => $concluidas,
                    'progresso' => $total > 0 ? round(($concluidas / $total) * 100) : 0,
                    'media_pontuacao' => round($mediaPontuacao, 2),
                ],
                'distribuicao_classificacao' => $distribuicaoClassificacao,
                'distribuicao_estado' => $distribuicaoEstado,
                'por_departamento' => $porDepartamento,
                'por_categoria' => $porCategoria,
            ]
        ]);
    }

    /**
     * Relatório por departamento
     */
    public function departamento(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'departamento' => 'required|string',
            'ciclo_id' => 'nullable|exists:ciclos_avaliacao,id',
        ]);

        $query = Avaliacao::whereHas('trabalhador', function ($q) use ($validated) {
            $q->where('departamento', $validated['departamento']);
        })->with(['trabalhador', 'avaliador', 'itens.indicador']);

        if (isset($validated['ciclo_id'])) {
            $query->where('ciclo_id', $validated['ciclo_id']);
        }

        $avaliacoes = $query->get();

        // Lista detalhada
        $listaDetalhada = $avaliacoes->map(function ($av) {
            return [
                'id' => $av->id,
                'trabalhador' => $av->trabalhador->nome_completo,
                'cargo' => $av->trabalhador->cargo,
                'categoria' => $av->trabalhador->categoria,
                'avaliador' => $av->avaliador?->name,
                'estado' => $av->estado,
                'pontuacao_auto' => $av->pontuacao_auto,
                'pontuacao_avaliador' => $av->pontuacao_avaliador,
                'pontuacao_final' => $av->pontuacao_final,
                'classificacao_final' => $av->classificacao_final,
            ];
        });

        // Médias por indicador
        $mediasPorIndicador = [];
        $indicadores = Indicador::where('activo', true)->get();

        foreach ($indicadores as $indicador) {
            $pontuacoes = $avaliacoes->flatMap(function ($av) use ($indicador) {
                $item = $av->itens->firstWhere('indicador_id', $indicador->id);
                return $item && $item->pontuacao_final ? [$item->pontuacao_final] : [];
            });

            $mediasPorIndicador[] = [
                'indicador' => $indicador->nome,
                'codigo' => $indicador->codigo,
                'media' => $pontuacoes->count() > 0 ? round($pontuacoes->avg(), 2) : null,
            ];
        }

        return response()->json([
            'data' => [
                'departamento' => $validated['departamento'],
                'total' => $avaliacoes->count(),
                'media_global' => round($avaliacoes->whereNotNull('pontuacao_final')->avg('pontuacao_final'), 2),
                'lista_detalhada' => $listaDetalhada,
                'medias_por_indicador' => $mediasPorIndicador,
            ]
        ]);
    }

    /**
     * Relatório individual de um trabalhador
     */
    public function trabalhador(Trabalhador $trabalhador): JsonResponse
    {
        $avaliacoes = Avaliacao::where('trabalhador_id', $trabalhador->id)
            ->with(['ciclo', 'avaliador', 'itens.indicador'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Evolução ao longo dos ciclos
        $evolucao = $avaliacoes->map(function ($av) {
            return [
                'ciclo' => $av->ciclo->nome,
                'ano' => $av->ciclo->ano,
                'pontuacao_final' => $av->pontuacao_final,
                'classificacao_final' => $av->classificacao_final,
            ];
        })->reverse()->values();

        // Média por indicador (última avaliação)
        $ultimaAvaliacao = $avaliacoes->first();
        $pontuacoesPorIndicador = [];

        if ($ultimaAvaliacao) {
            foreach ($ultimaAvaliacao->itens as $item) {
                $pontuacoesPorIndicador[] = [
                    'indicador' => $item->indicador->nome,
                    'codigo' => $item->indicador->codigo,
                    'pontuacao_auto' => $item->pontuacao_auto,
                    'pontuacao_avaliador' => $item->pontuacao_avaliador,
                    'pontuacao_final' => $item->pontuacao_final,
                ];
            }
        }

        return response()->json([
            'data' => [
                'trabalhador' => $trabalhador->load('superiorDirecto'),
                'total_avaliacoes' => $avaliacoes->count(),
                'media_historica' => round($avaliacoes->whereNotNull('pontuacao_final')->avg('pontuacao_final'), 2),
                'evolucao' => $evolucao,
                'ultima_avaliacao' => $ultimaAvaliacao ? [
                    'ciclo' => $ultimaAvaliacao->ciclo->nome,
                    'estado' => $ultimaAvaliacao->estado,
                    'pontuacao_final' => $ultimaAvaliacao->pontuacao_final,
                    'classificacao_final' => $ultimaAvaliacao->classificacao_final,
                    'pontuacoes_por_indicador' => $pontuacoesPorIndicador,
                ] : null,
            ]
        ]);
    }

    /**
     * Relatório comparativo entre departamentos
     */
    public function comparativoDepartamentos(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ciclo_id' => 'required|exists:ciclos_avaliacao,id',
        ]);

        $ciclo = CicloAvaliacao::find($validated['ciclo_id']);

        $departamentos = Trabalhador::distinct()->pluck('departamento');

        $comparativo = [];

        foreach ($departamentos as $dept) {
            $avaliacoes = Avaliacao::where('ciclo_id', $validated['ciclo_id'])
                ->whereHas('trabalhador', function ($q) use ($dept) {
                    $q->where('departamento', $dept);
                })
                ->get();

            $comparativo[] = [
                'departamento' => $dept,
                'total' => $avaliacoes->count(),
                'media' => round($avaliacoes->whereNotNull('pontuacao_final')->avg('pontuacao_final'), 2),
                'excelentes' => $avaliacoes->where('classificacao_final', Avaliacao::CLASSIFICACAO_EXCELENTE)->count(),
                'muito_bons' => $avaliacoes->where('classificacao_final', Avaliacao::CLASSIFICACAO_MUITO_BOM)->count(),
                'bons' => $avaliacoes->where('classificacao_final', Avaliacao::CLASSIFICACAO_BOM)->count(),
                'regulares' => $avaliacoes->where('classificacao_final', Avaliacao::CLASSIFICACAO_REGULAR)->count(),
                'insuficientes' => $avaliacoes->where('classificacao_final', Avaliacao::CLASSIFICACAO_INSUFICIENTE)->count(),
            ];
        }

        // Ordenar por média
        usort($comparativo, fn($a, $b) => $b['media'] <=> $a['media']);

        return response()->json([
            'data' => [
                'ciclo' => $ciclo,
                'comparativo' => $comparativo,
            ]
        ]);
    }

    /**
     * Exportar dados para Excel (retorna dados para processamento no frontend)
     */
    public function exportar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ciclo_id' => 'required|exists:ciclos_avaliacao,id',
            'departamento' => 'nullable|string',
        ]);

        $query = Avaliacao::where('ciclo_id', $validated['ciclo_id'])
            ->with(['ciclo', 'trabalhador', 'avaliador', 'itens.indicador']);

        if (isset($validated['departamento'])) {
            $query->whereHas('trabalhador', function ($q) use ($validated) {
                $q->where('departamento', $validated['departamento']);
            });
        }

        $avaliacoes = $query->get();

        $dados = $avaliacoes->map(function ($av) {
            $itens = [];
            foreach ($av->itens as $item) {
                $itens[$item->indicador->codigo . '_auto'] = $item->pontuacao_auto;
                $itens[$item->indicador->codigo . '_avaliador'] = $item->pontuacao_avaliador;
                $itens[$item->indicador->codigo . '_final'] = $item->pontuacao_final;
            }

            return array_merge([
                'numero_funcionario' => $av->trabalhador->numero_funcionario,
                'nome_completo' => $av->trabalhador->nome_completo,
                'departamento' => $av->trabalhador->departamento,
                'cargo' => $av->trabalhador->cargo,
                'categoria' => $av->trabalhador->categoria,
                'avaliador' => $av->avaliador?->name,
                'estado' => $av->estado,
                'pontuacao_auto' => $av->pontuacao_auto,
                'pontuacao_avaliador' => $av->pontuacao_avaliador,
                'pontuacao_final' => $av->pontuacao_final,
                'classificacao_final' => $av->classificacao_final,
            ], $itens);
        });

        return response()->json([
            'data' => $dados
        ]);
    }
}
