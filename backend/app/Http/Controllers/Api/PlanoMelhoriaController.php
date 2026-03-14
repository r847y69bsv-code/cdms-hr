<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlanoMelhoria;
use App\Models\Avaliacao;
use App\Models\Trabalhador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PlanoMelhoriaController extends Controller
{
    /**
     * Listar planos de melhoria
     */
    public function index(Request $request): JsonResponse
    {
        $query = PlanoMelhoria::with(['avaliacao.trabalhador', 'avaliacao.ciclo']);

        // Filtros
        if ($request->has('avaliacao_id')) {
            $query->where('avaliacao_id', $request->avaliacao_id);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        // Ordenação
        $query->orderBy('prazo', 'asc');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $planos = $query->paginate($perPage);

        return response()->json($planos);
    }

    /**
     * Criar novo plano de melhoria
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avaliacao_id' => 'required|exists:avaliacoes,id',
            'area_melhoria' => 'required|string|max:255',
            'objectivo' => 'required|string|max:1000',
            'accoes' => 'nullable|string|max:2000',
            'recursos_necessarios' => 'nullable|string|max:1000',
            'prazo' => 'nullable|date|after:today',
        ]);

        $avaliacao = Avaliacao::find($validated['avaliacao_id']);

        // Verificar se é o avaliador
        if ($avaliacao->avaliador_id !== auth()->id()) {
            return response()->json([
                'message' => 'Apenas o avaliador pode criar planos de melhoria.'
            ], 403);
        }

        $validated['estado'] = PlanoMelhoria::ESTADO_PLANEADO;
        $validated['progresso'] = 0;

        $plano = PlanoMelhoria::create($validated);

        return response()->json([
            'message' => 'Plano de melhoria criado com sucesso.',
            'data' => $plano->load('avaliacao.trabalhador')
        ], 201);
    }

    /**
     * Mostrar um plano específico
     */
    public function show(PlanoMelhoria $planoMelhoria): JsonResponse
    {
        return response()->json([
            'data' => $planoMelhoria->load(['avaliacao.trabalhador', 'avaliacao.ciclo'])
        ]);
    }

    /**
     * Actualizar plano de melhoria
     */
    public function update(Request $request, PlanoMelhoria $planoMelhoria): JsonResponse
    {
        $avaliacao = $planoMelhoria->avaliacao;

        // Verificar permissão (avaliador ou trabalhador para actualizar progresso)
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $isAvaliador = $avaliacao->avaliador_id === auth()->id();
        $isTrabalhador = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;

        if (!$isAvaliador && !$isTrabalhador) {
            return response()->json([
                'message' => 'Não tem permissão para editar este plano.'
            ], 403);
        }

        $rules = [];

        // Avaliador pode editar tudo
        if ($isAvaliador) {
            $rules = [
                'area_melhoria' => 'sometimes|string|max:255',
                'objectivo' => 'sometimes|string|max:1000',
                'accoes' => 'nullable|string|max:2000',
                'recursos_necessarios' => 'nullable|string|max:1000',
                'prazo' => 'nullable|date',
                'estado' => 'sometimes|string|in:planeado,em_curso,concluido,cancelado',
                'progresso' => 'sometimes|integer|min:0|max:100',
                'notas_acompanhamento' => 'nullable|string|max:2000',
            ];
        }

        // Trabalhador só pode actualizar progresso e notas
        if ($isTrabalhador && !$isAvaliador) {
            $rules = [
                'progresso' => 'sometimes|integer|min:0|max:100',
                'notas_acompanhamento' => 'nullable|string|max:2000',
            ];
        }

        $validated = $request->validate($rules);

        // Auto-actualizar estado baseado no progresso
        if (isset($validated['progresso'])) {
            if ($validated['progresso'] === 0 && !isset($validated['estado'])) {
                $validated['estado'] = PlanoMelhoria::ESTADO_PLANEADO;
            } elseif ($validated['progresso'] > 0 && $validated['progresso'] < 100 && !isset($validated['estado'])) {
                $validated['estado'] = PlanoMelhoria::ESTADO_EM_CURSO;
            } elseif ($validated['progresso'] === 100 && !isset($validated['estado'])) {
                $validated['estado'] = PlanoMelhoria::ESTADO_CONCLUIDO;
            }
        }

        $planoMelhoria->update($validated);

        return response()->json([
            'message' => 'Plano de melhoria actualizado com sucesso.',
            'data' => $planoMelhoria->fresh()->load('avaliacao.trabalhador')
        ]);
    }

    /**
     * Eliminar plano de melhoria
     */
    public function destroy(PlanoMelhoria $planoMelhoria): JsonResponse
    {
        $avaliacao = $planoMelhoria->avaliacao;

        // Apenas o avaliador pode eliminar
        if ($avaliacao->avaliador_id !== auth()->id()) {
            return response()->json([
                'message' => 'Apenas o avaliador pode eliminar planos de melhoria.'
            ], 403);
        }

        $planoMelhoria->delete();

        return response()->json([
            'message' => 'Plano de melhoria eliminado com sucesso.'
        ]);
    }

    /**
     * Meus planos de melhoria (como trabalhador)
     */
    public function meusPlanos(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'data' => []
            ]);
        }

        $planos = PlanoMelhoria::whereHas('avaliacao', function ($q) use ($trabalhador) {
            $q->where('trabalhador_id', $trabalhador->id);
        })
        ->with(['avaliacao.ciclo'])
        ->orderBy('prazo', 'asc')
        ->get();

        return response()->json([
            'data' => $planos
        ]);
    }

    /**
     * Planos criados para a minha equipa (como avaliador)
     */
    public function planosEquipa(): JsonResponse
    {
        $planos = PlanoMelhoria::whereHas('avaliacao', function ($q) {
            $q->where('avaliador_id', auth()->id());
        })
        ->with(['avaliacao.trabalhador', 'avaliacao.ciclo'])
        ->orderBy('prazo', 'asc')
        ->get();

        return response()->json([
            'data' => $planos
        ]);
    }

    /**
     * Planos por avaliação
     */
    public function porAvaliacao(Avaliacao $avaliacao): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $isAvaliador = $avaliacao->avaliador_id === auth()->id();
        $isTrabalhador = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;

        if (!$isAvaliador && !$isTrabalhador) {
            return response()->json([
                'message' => 'Não tem permissão para ver estes planos.'
            ], 403);
        }

        $planos = $avaliacao->planosMelhoria()
            ->orderBy('prazo', 'asc')
            ->get();

        return response()->json([
            'data' => $planos
        ]);
    }

    /**
     * Planos com prazo a vencer (próximos 30 dias)
     */
    public function aVencer(): JsonResponse
    {
        $planos = PlanoMelhoria::whereHas('avaliacao', function ($q) {
            $q->where('avaliador_id', auth()->id());
        })
        ->whereIn('estado', [PlanoMelhoria::ESTADO_PLANEADO, PlanoMelhoria::ESTADO_EM_CURSO])
        ->where('prazo', '<=', now()->addDays(30))
        ->where('prazo', '>=', now())
        ->with(['avaliacao.trabalhador'])
        ->orderBy('prazo', 'asc')
        ->get();

        return response()->json([
            'data' => $planos
        ]);
    }
}
