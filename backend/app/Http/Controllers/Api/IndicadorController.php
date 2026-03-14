<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Indicador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class IndicadorController extends Controller
{
    /**
     * Listar todos os indicadores
     */
    public function index(Request $request): JsonResponse
    {
        $query = Indicador::query();

        // Filtrar apenas activos por defeito
        if (!$request->has('incluir_inactivos') || !$request->boolean('incluir_inactivos')) {
            $query->where('activo', true);
        }

        $indicadores = $query->orderBy('ordem')->get();

        return response()->json([
            'data' => $indicadores
        ]);
    }

    /**
     * Criar novo indicador
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:indicadores,codigo',
            'nome' => 'required|string|max:255',
            'descricao' => 'nullable|string',
            'ordem' => 'integer|min:0',
            'activo' => 'boolean',
        ]);

        $indicador = Indicador::create($validated);

        return response()->json([
            'message' => 'Indicador criado com sucesso.',
            'data' => $indicador
        ], 201);
    }

    /**
     * Mostrar um indicador específico
     */
    public function show(Indicador $indicador): JsonResponse
    {
        return response()->json([
            'data' => $indicador->load('pesos')
        ]);
    }

    /**
     * Actualizar indicador
     */
    public function update(Request $request, Indicador $indicador): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => 'sometimes|string|max:50|unique:indicadores,codigo,' . $indicador->id,
            'nome' => 'sometimes|string|max:255',
            'descricao' => 'nullable|string',
            'ordem' => 'integer|min:0',
            'activo' => 'boolean',
        ]);

        $indicador->update($validated);

        return response()->json([
            'message' => 'Indicador actualizado com sucesso.',
            'data' => $indicador->fresh()
        ]);
    }

    /**
     * Eliminar indicador
     */
    public function destroy(Indicador $indicador): JsonResponse
    {
        // Verificar se tem itens de avaliação associados
        if ($indicador->itensAvaliacao()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar um indicador com avaliações associadas. Desactive-o em vez disso.'
            ], 422);
        }

        // Eliminar pesos associados
        $indicador->pesos()->delete();
        $indicador->delete();

        return response()->json([
            'message' => 'Indicador eliminado com sucesso.'
        ]);
    }

    /**
     * Reordenar indicadores
     */
    public function reordenar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ordem' => 'required|array',
            'ordem.*.id' => 'required|exists:indicadores,id',
            'ordem.*.ordem' => 'required|integer|min:0',
        ]);

        foreach ($validated['ordem'] as $item) {
            Indicador::where('id', $item['id'])->update(['ordem' => $item['ordem']]);
        }

        return response()->json([
            'message' => 'Ordem dos indicadores actualizada com sucesso.',
            'data' => Indicador::orderBy('ordem')->get()
        ]);
    }
}
