<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CicloAvaliacao;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CicloAvaliacaoController extends Controller
{
    /**
     * Listar todos os ciclos de avaliação
     */
    public function index(Request $request): JsonResponse
    {
        $query = CicloAvaliacao::with('criador');

        // Filtros
        if ($request->has('ano')) {
            $query->where('ano', $request->ano);
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        // Ordenação
        $query->orderBy('ano', 'desc')->orderBy('created_at', 'desc');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $ciclos = $query->paginate($perPage);

        return response()->json($ciclos);
    }

    /**
     * Criar novo ciclo de avaliação
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ano' => 'required|integer|min:2020|max:2100',
            'nome' => 'required|string|max:255',
            'descricao' => 'nullable|string',
            'data_inicio_autoavaliacao' => 'required|date',
            'data_fim_autoavaliacao' => 'required|date|after:data_inicio_autoavaliacao',
            'data_inicio_avaliacao' => 'required|date|after:data_fim_autoavaliacao',
            'data_fim_avaliacao' => 'required|date|after:data_inicio_avaliacao',
            'data_inicio_revisao' => 'required|date|after:data_fim_avaliacao',
            'data_fim_revisao' => 'required|date|after:data_inicio_revisao',
        ]);

        $validated['criado_por'] = auth()->id();
        $validated['estado'] = CicloAvaliacao::ESTADO_PLANEADO;

        $ciclo = CicloAvaliacao::create($validated);

        return response()->json([
            'message' => 'Ciclo de avaliação criado com sucesso.',
            'data' => $ciclo->load('criador')
        ], 201);
    }

    /**
     * Mostrar um ciclo específico
     */
    public function show(CicloAvaliacao $ciclo): JsonResponse
    {
        return response()->json([
            'data' => $ciclo->load(['criador', 'avaliacoes'])
        ]);
    }

    /**
     * Actualizar ciclo de avaliação
     */
    public function update(Request $request, CicloAvaliacao $ciclo): JsonResponse
    {
        // Não permitir edição de ciclos concluídos
        if ($ciclo->estado === CicloAvaliacao::ESTADO_CONCLUIDO) {
            return response()->json([
                'message' => 'Não é possível editar um ciclo concluído.'
            ], 422);
        }

        $validated = $request->validate([
            'ano' => 'sometimes|integer|min:2020|max:2100',
            'nome' => 'sometimes|string|max:255',
            'descricao' => 'nullable|string',
            'data_inicio_autoavaliacao' => 'sometimes|date',
            'data_fim_autoavaliacao' => 'sometimes|date',
            'data_inicio_avaliacao' => 'sometimes|date',
            'data_fim_avaliacao' => 'sometimes|date',
            'data_inicio_revisao' => 'sometimes|date',
            'data_fim_revisao' => 'sometimes|date',
        ]);

        $ciclo->update($validated);

        return response()->json([
            'message' => 'Ciclo de avaliação actualizado com sucesso.',
            'data' => $ciclo->fresh()->load('criador')
        ]);
    }

    /**
     * Eliminar ciclo de avaliação
     */
    public function destroy(CicloAvaliacao $ciclo): JsonResponse
    {
        // Verificar se tem avaliações associadas
        if ($ciclo->avaliacoes()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar um ciclo com avaliações associadas.'
            ], 422);
        }

        $ciclo->delete();

        return response()->json([
            'message' => 'Ciclo de avaliação eliminado com sucesso.'
        ]);
    }

    /**
     * Alterar estado do ciclo
     */
    public function alterarEstado(Request $request, CicloAvaliacao $ciclo): JsonResponse
    {
        $validated = $request->validate([
            'estado' => 'required|string|in:planeado,autoavaliacao,avaliacao,revisao,concluido'
        ]);

        $estadosValidos = [
            CicloAvaliacao::ESTADO_PLANEADO => [CicloAvaliacao::ESTADO_AUTOAVALIACAO],
            CicloAvaliacao::ESTADO_AUTOAVALIACAO => [CicloAvaliacao::ESTADO_AVALIACAO],
            CicloAvaliacao::ESTADO_AVALIACAO => [CicloAvaliacao::ESTADO_REVISAO],
            CicloAvaliacao::ESTADO_REVISAO => [CicloAvaliacao::ESTADO_CONCLUIDO],
            CicloAvaliacao::ESTADO_CONCLUIDO => [],
        ];

        if (!in_array($validated['estado'], $estadosValidos[$ciclo->estado] ?? [])) {
            return response()->json([
                'message' => 'Transição de estado inválida.'
            ], 422);
        }

        $ciclo->update(['estado' => $validated['estado']]);

        return response()->json([
            'message' => 'Estado do ciclo alterado com sucesso.',
            'data' => $ciclo->fresh()
        ]);
    }

    /**
     * Obter ciclo activo (em período de autoavaliação, avaliação ou revisão)
     */
    public function cicloActivo(): JsonResponse
    {
        $ciclo = CicloAvaliacao::whereIn('estado', [
            CicloAvaliacao::ESTADO_AUTOAVALIACAO,
            CicloAvaliacao::ESTADO_AVALIACAO,
            CicloAvaliacao::ESTADO_REVISAO,
        ])->first();

        if (!$ciclo) {
            return response()->json([
                'message' => 'Não existe nenhum ciclo activo.',
                'data' => null
            ]);
        }

        return response()->json([
            'data' => $ciclo
        ]);
    }
}
