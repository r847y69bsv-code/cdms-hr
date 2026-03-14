<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avaliacao;
use App\Models\CicloAvaliacao;
use App\Models\Trabalhador;
use App\Models\Indicador;
use App\Models\MatrizPesos;
use App\Models\ItemAvaliacao;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AvaliacaoController extends Controller
{
    /**
     * Listar avaliações
     */
    public function index(Request $request): JsonResponse
    {
        $query = Avaliacao::with(['ciclo', 'trabalhador', 'avaliador']);

        // Filtros
        if ($request->has('ciclo_id')) {
            $query->where('ciclo_id', $request->ciclo_id);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('departamento')) {
            $query->whereHas('trabalhador', function ($q) use ($request) {
                $q->where('departamento', $request->departamento);
            });
        }

        if ($request->has('classificacao_final')) {
            $query->where('classificacao_final', $request->classificacao_final);
        }

        // Ordenação
        $query->orderBy('created_at', 'desc');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $avaliacoes = $query->paginate($perPage);

        return response()->json($avaliacoes);
    }

    /**
     * Criar nova avaliação (iniciar autoavaliação)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ciclo_id' => 'required|exists:ciclos_avaliacao,id',
        ]);

        // Verificar se o ciclo está em período de autoavaliação
        $ciclo = CicloAvaliacao::find($validated['ciclo_id']);
        if ($ciclo->estado !== CicloAvaliacao::ESTADO_AUTOAVALIACAO) {
            return response()->json([
                'message' => 'O ciclo não está em período de autoavaliação.'
            ], 422);
        }

        // Obter trabalhador do utilizador
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        if (!$trabalhador) {
            return response()->json([
                'message' => 'Perfil de trabalhador não encontrado.'
            ], 404);
        }

        // Verificar se já existe avaliação para este ciclo
        $avaliacaoExistente = Avaliacao::where('ciclo_id', $validated['ciclo_id'])
            ->where('trabalhador_id', $trabalhador->id)
            ->first();

        if ($avaliacaoExistente) {
            return response()->json([
                'message' => 'Já existe uma avaliação para este ciclo.',
                'data' => $avaliacaoExistente
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Criar avaliação
            $avaliacao = Avaliacao::create([
                'ciclo_id' => $validated['ciclo_id'],
                'trabalhador_id' => $trabalhador->id,
                'avaliador_id' => $trabalhador->superiorDirecto?->user_id,
                'estado' => Avaliacao::ESTADO_RASCUNHO,
            ]);

            // Criar itens de avaliação para cada indicador activo
            $indicadores = Indicador::where('activo', true)->orderBy('ordem')->get();
            $pesos = MatrizPesos::where('categoria', $trabalhador->categoria)
                ->pluck('peso', 'indicador_id');

            foreach ($indicadores as $indicador) {
                ItemAvaliacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'indicador_id' => $indicador->id,
                    'peso_aplicado' => $pesos[$indicador->id] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Autoavaliação iniciada com sucesso.',
                'data' => $avaliacao->load(['ciclo', 'trabalhador', 'itens.indicador'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao criar avaliação: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar uma avaliação específica
     */
    public function show(Avaliacao $avaliacao): JsonResponse
    {
        return response()->json([
            'data' => $avaliacao->load([
                'ciclo',
                'trabalhador.superiorDirecto',
                'avaliador',
                'revisorDepartamental',
                'revisorRH',
                'itens.indicador',
                'contestacoes',
                'planosMelhoria',
            ])
        ]);
    }

    /**
     * Actualizar avaliação (guardar rascunho)
     */
    public function update(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        // Verificar permissão
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $isOwner = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;
        $isAvaliador = $avaliacao->avaliador_id === auth()->id();

        if (!$isOwner && !$isAvaliador) {
            return response()->json([
                'message' => 'Não tem permissão para editar esta avaliação.'
            ], 403);
        }

        // Validar estado
        $estadosEditaveis = [
            Avaliacao::ESTADO_RASCUNHO,
            Avaliacao::ESTADO_AVAL_RASCUNHO,
        ];

        if (!in_array($avaliacao->estado, $estadosEditaveis)) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser editada no estado actual.'
            ], 422);
        }

        $validated = $request->validate([
            'observacoes_trabalhador' => 'nullable|string',
            'observacoes_avaliador' => 'nullable|string',
            'itens' => 'array',
            'itens.*.id' => 'required|exists:itens_avaliacao,id',
            'itens.*.pontuacao_auto' => 'nullable|integer|min:1|max:5',
            'itens.*.justificacao_auto' => 'nullable|string',
            'itens.*.pontuacao_avaliador' => 'nullable|integer|min:1|max:5',
            'itens.*.justificacao_avaliador' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Actualizar observações
            if (isset($validated['observacoes_trabalhador']) && $isOwner) {
                $avaliacao->update(['observacoes_trabalhador' => $validated['observacoes_trabalhador']]);
            }

            if (isset($validated['observacoes_avaliador']) && $isAvaliador) {
                $avaliacao->update(['observacoes_avaliador' => $validated['observacoes_avaliador']]);
            }

            // Actualizar itens
            if (isset($validated['itens'])) {
                foreach ($validated['itens'] as $itemData) {
                    $item = ItemAvaliacao::find($itemData['id']);
                    if ($item->avaliacao_id !== $avaliacao->id) {
                        continue;
                    }

                    $updateData = [];

                    if ($isOwner && $avaliacao->estado === Avaliacao::ESTADO_RASCUNHO) {
                        if (isset($itemData['pontuacao_auto'])) {
                            $updateData['pontuacao_auto'] = $itemData['pontuacao_auto'];
                        }
                        if (isset($itemData['justificacao_auto'])) {
                            $updateData['justificacao_auto'] = $itemData['justificacao_auto'];
                        }
                    }

                    if ($isAvaliador && $avaliacao->estado === Avaliacao::ESTADO_AVAL_RASCUNHO) {
                        if (isset($itemData['pontuacao_avaliador'])) {
                            $updateData['pontuacao_avaliador'] = $itemData['pontuacao_avaliador'];
                        }
                        if (isset($itemData['justificacao_avaliador'])) {
                            $updateData['justificacao_avaliador'] = $itemData['justificacao_avaliador'];
                        }
                    }

                    if (!empty($updateData)) {
                        $item->update($updateData);
                    }
                }
            }

            // Recalcular pontuações
            $this->recalcularPontuacoes($avaliacao);

            DB::commit();

            return response()->json([
                'message' => 'Avaliação actualizada com sucesso.',
                'data' => $avaliacao->fresh()->load(['itens.indicador'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erro ao actualizar avaliação: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submeter autoavaliação
     */
    public function submeterAutoavaliacao(Avaliacao $avaliacao): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador || $avaliacao->trabalhador_id !== $trabalhador->id) {
            return response()->json([
                'message' => 'Não tem permissão para submeter esta avaliação.'
            ], 403);
        }

        if ($avaliacao->estado !== Avaliacao::ESTADO_RASCUNHO) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser submetida no estado actual.'
            ], 422);
        }

        // Verificar se todos os itens têm pontuação
        $itensIncompletos = $avaliacao->itens()->whereNull('pontuacao_auto')->count();
        if ($itensIncompletos > 0) {
            return response()->json([
                'message' => 'Todos os indicadores devem ter uma pontuação antes de submeter.'
            ], 422);
        }

        $this->recalcularPontuacoes($avaliacao);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_AUTO_SUBMETIDA,
            'data_submissao_auto' => now(),
        ]);

        return response()->json([
            'message' => 'Autoavaliação submetida com sucesso.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Iniciar avaliação pelo avaliador
     */
    public function iniciarAvaliacao(Avaliacao $avaliacao): JsonResponse
    {
        if ($avaliacao->avaliador_id !== auth()->id()) {
            return response()->json([
                'message' => 'Não tem permissão para avaliar este trabalhador.'
            ], 403);
        }

        if ($avaliacao->estado !== Avaliacao::ESTADO_AUTO_SUBMETIDA) {
            return response()->json([
                'message' => 'Esta avaliação não está pronta para ser avaliada.'
            ], 422);
        }

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_AVAL_RASCUNHO,
        ]);

        return response()->json([
            'message' => 'Avaliação iniciada.',
            'data' => $avaliacao->fresh()->load(['itens.indicador'])
        ]);
    }

    /**
     * Submeter avaliação pelo avaliador
     */
    public function submeterAvaliacao(Avaliacao $avaliacao): JsonResponse
    {
        if ($avaliacao->avaliador_id !== auth()->id()) {
            return response()->json([
                'message' => 'Não tem permissão para submeter esta avaliação.'
            ], 403);
        }

        if ($avaliacao->estado !== Avaliacao::ESTADO_AVAL_RASCUNHO) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser submetida no estado actual.'
            ], 422);
        }

        // Verificar se todos os itens têm pontuação do avaliador
        $itensIncompletos = $avaliacao->itens()->whereNull('pontuacao_avaliador')->count();
        if ($itensIncompletos > 0) {
            return response()->json([
                'message' => 'Todos os indicadores devem ter uma pontuação antes de submeter.'
            ], 422);
        }

        $this->recalcularPontuacoes($avaliacao);
        $this->calcularPontuacaoFinal($avaliacao);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_AVAL_SUBMETIDA,
            'data_submissao_avaliador' => now(),
        ]);

        return response()->json([
            'message' => 'Avaliação submetida com sucesso.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Minhas avaliações (do trabalhador autenticado)
     */
    public function minhasAvaliacoes(Request $request): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'message' => 'Perfil de trabalhador não encontrado.',
                'data' => []
            ]);
        }

        $avaliacoes = Avaliacao::where('trabalhador_id', $trabalhador->id)
            ->with(['ciclo', 'avaliador'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Avaliações pendentes (para o avaliador)
     */
    public function pendentes(Request $request): JsonResponse
    {
        $avaliacoes = Avaliacao::where('avaliador_id', auth()->id())
            ->whereIn('estado', [
                Avaliacao::ESTADO_AUTO_SUBMETIDA,
                Avaliacao::ESTADO_AVAL_RASCUNHO,
            ])
            ->with(['ciclo', 'trabalhador'])
            ->orderBy('data_submissao_auto', 'asc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Avaliações da equipa (para o avaliador)
     */
    public function equipa(Request $request): JsonResponse
    {
        $avaliacoes = Avaliacao::where('avaliador_id', auth()->id())
            ->with(['ciclo', 'trabalhador'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Avaliações pendentes de revisão departamental
     */
    public function departamentoPendentes(Request $request): JsonResponse
    {
        // Obter trabalhador do utilizador (chefe de departamento)
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador || !$trabalhador->is_lider) {
            return response()->json([
                'message' => 'Não tem permissão para ver avaliações departamentais.',
                'data' => []
            ]);
        }

        $avaliacoes = Avaliacao::where('estado', Avaliacao::ESTADO_AVAL_SUBMETIDA)
            ->whereHas('trabalhador', function ($q) use ($trabalhador) {
                $q->where('departamento', $trabalhador->departamento);
            })
            ->with(['ciclo', 'trabalhador', 'avaliador'])
            ->orderBy('data_submissao_avaliador', 'asc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Todas as avaliações do departamento
     */
    public function departamento(Request $request): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'message' => 'Perfil de trabalhador não encontrado.',
                'data' => []
            ]);
        }

        $avaliacoes = Avaliacao::whereHas('trabalhador', function ($q) use ($trabalhador) {
                $q->where('departamento', $trabalhador->departamento);
            })
            ->with(['ciclo', 'trabalhador', 'avaliador'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Aprovar avaliação (revisão departamental)
     */
    public function aprovarDepartamento(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        // Verificar se é do mesmo departamento
        if (!$trabalhador || $trabalhador->departamento !== $avaliacao->trabalhador->departamento) {
            return response()->json([
                'message' => 'Não tem permissão para aprovar esta avaliação.'
            ], 403);
        }

        // Verificar estado
        if ($avaliacao->estado !== Avaliacao::ESTADO_AVAL_SUBMETIDA) {
            return response()->json([
                'message' => 'Esta avaliação não está no estado correcto para aprovação departamental.'
            ], 422);
        }

        $validated = $request->validate([
            'observacoes_revisor' => 'nullable|string|max:2000',
        ]);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_REV_DEPARTAMENTO,
            'revisor_departamental_id' => auth()->id(),
            'data_revisao_departamental' => now(),
            'observacoes_revisor' => $validated['observacoes_revisor'] ?? null,
        ]);

        return response()->json([
            'message' => 'Avaliação aprovada e enviada para revisão RH.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Devolver avaliação para correcção
     */
    public function devolver(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        // Verificar se é do mesmo departamento
        if (!$trabalhador || $trabalhador->departamento !== $avaliacao->trabalhador->departamento) {
            return response()->json([
                'message' => 'Não tem permissão para devolver esta avaliação.'
            ], 403);
        }

        // Verificar estado
        if (!in_array($avaliacao->estado, [Avaliacao::ESTADO_AVAL_SUBMETIDA, Avaliacao::ESTADO_REV_DEPARTAMENTO])) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser devolvida no estado actual.'
            ], 422);
        }

        $validated = $request->validate([
            'observacoes_revisor' => 'required|string|max:2000',
        ]);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_AVAL_RASCUNHO,
            'observacoes_revisor' => $validated['observacoes_revisor'],
        ]);

        return response()->json([
            'message' => 'Avaliação devolvida ao avaliador para correcção.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Avaliações pendentes de revisão RH
     */
    public function rhPendentes(Request $request): JsonResponse
    {
        $avaliacoes = Avaliacao::where('estado', Avaliacao::ESTADO_REV_DEPARTAMENTO)
            ->with(['ciclo', 'trabalhador', 'avaliador', 'revisorDepartamental'])
            ->orderBy('data_revisao_departamental', 'asc')
            ->get();

        return response()->json([
            'data' => $avaliacoes
        ]);
    }

    /**
     * Aprovar avaliação (revisão RH)
     */
    public function aprovarRH(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        // Verificar estado
        if ($avaliacao->estado !== Avaliacao::ESTADO_REV_DEPARTAMENTO) {
            return response()->json([
                'message' => 'Esta avaliação não está no estado correcto para aprovação RH.'
            ], 422);
        }

        $validated = $request->validate([
            'observacoes_rh' => 'nullable|string|max:2000',
        ]);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_APROVADA,
            'revisor_rh_id' => auth()->id(),
            'data_revisao_rh' => now(),
            'observacoes_rh' => $validated['observacoes_rh'] ?? null,
        ]);

        return response()->json([
            'message' => 'Avaliação aprovada com sucesso.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Devolver avaliação RH para revisão departamental
     */
    public function devolverRH(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        // Verificar estado
        if ($avaliacao->estado !== Avaliacao::ESTADO_REV_DEPARTAMENTO) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser devolvida no estado actual.'
            ], 422);
        }

        $validated = $request->validate([
            'observacoes_rh' => 'required|string|max:2000',
        ]);

        $avaliacao->update([
            'estado' => Avaliacao::ESTADO_AVAL_SUBMETIDA,
            'observacoes_rh' => $validated['observacoes_rh'],
            'revisor_departamental_id' => null,
            'data_revisao_departamental' => null,
        ]);

        return response()->json([
            'message' => 'Avaliação devolvida para revisão departamental.',
            'data' => $avaliacao->fresh()
        ]);
    }

    /**
     * Recalcular pontuações de uma avaliação
     */
    private function recalcularPontuacoes(Avaliacao $avaliacao): void
    {
        $itens = $avaliacao->itens;

        $totalPontuacaoAuto = 0;
        $totalPontuacaoAvaliador = 0;
        $totalPeso = 0;

        foreach ($itens as $item) {
            if ($item->pontuacao_auto && $item->peso_aplicado) {
                $ponderadaAuto = ($item->pontuacao_auto * $item->peso_aplicado) / 100;
                $totalPontuacaoAuto += $ponderadaAuto;
            }

            if ($item->pontuacao_avaliador && $item->peso_aplicado) {
                $ponderadaAvaliador = ($item->pontuacao_avaliador * $item->peso_aplicado) / 100;
                $totalPontuacaoAvaliador += $ponderadaAvaliador;

                // Actualizar pontuação ponderada no item
                $item->update([
                    'pontuacao_final' => $item->pontuacao_avaliador,
                    'pontuacao_ponderada' => $ponderadaAvaliador,
                ]);
            }

            $totalPeso += $item->peso_aplicado;
        }

        // Normalizar para escala 1-5 se necessário
        if ($totalPeso > 0) {
            $avaliacao->update([
                'pontuacao_auto' => round($totalPontuacaoAuto * 5 / $totalPeso, 2),
                'pontuacao_avaliador' => $totalPontuacaoAvaliador > 0
                    ? round($totalPontuacaoAvaliador * 5 / $totalPeso, 2)
                    : null,
            ]);
        }
    }

    /**
     * Calcular pontuação final e classificação
     */
    private function calcularPontuacaoFinal(Avaliacao $avaliacao): void
    {
        $pontuacao = $avaliacao->pontuacao_avaliador ?? $avaliacao->pontuacao_auto;

        if (!$pontuacao) {
            return;
        }

        // Determinar classificação
        $classificacao = match (true) {
            $pontuacao >= 4.5 => Avaliacao::CLASSIFICACAO_EXCELENTE,
            $pontuacao >= 3.5 => Avaliacao::CLASSIFICACAO_MUITO_BOM,
            $pontuacao >= 2.5 => Avaliacao::CLASSIFICACAO_BOM,
            $pontuacao >= 1.5 => Avaliacao::CLASSIFICACAO_REGULAR,
            default => Avaliacao::CLASSIFICACAO_INSUFICIENTE,
        };

        $avaliacao->update([
            'pontuacao_final' => $pontuacao,
            'classificacao_final' => $classificacao,
        ]);
    }
}
