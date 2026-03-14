<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MatrizPesos;
use App\Models\Indicador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MatrizPesosController extends Controller
{
    /**
     * Listar toda a matriz de pesos
     */
    public function index(Request $request): JsonResponse
    {
        $query = MatrizPesos::with('indicador');

        if ($request->has('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        $matriz = $query->get();

        // Agrupar por categoria para facilitar visualização
        $agrupado = $matriz->groupBy('categoria')->map(function ($items, $categoria) {
            return [
                'categoria' => $categoria,
                'descricao' => $items->first()->descricao_categoria,
                'pesos' => $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'indicador_id' => $item->indicador_id,
                        'indicador_nome' => $item->indicador->nome,
                        'indicador_codigo' => $item->indicador->codigo,
                        'peso' => $item->peso,
                    ];
                })->values(),
                'total' => $items->sum('peso'),
            ];
        })->values();

        return response()->json([
            'data' => $agrupado
        ]);
    }

    /**
     * Obter pesos para uma categoria específica
     */
    public function porCategoria(string $categoria): JsonResponse
    {
        $pesos = MatrizPesos::with('indicador')
            ->where('categoria', $categoria)
            ->get();

        if ($pesos->isEmpty()) {
            return response()->json([
                'message' => 'Categoria não encontrada.',
                'data' => []
            ], 404);
        }

        return response()->json([
            'data' => [
                'categoria' => $categoria,
                'descricao' => $pesos->first()->descricao_categoria,
                'pesos' => $pesos->map(function ($item) {
                    return [
                        'indicador_id' => $item->indicador_id,
                        'indicador_nome' => $item->indicador->nome,
                        'indicador_codigo' => $item->indicador->codigo,
                        'peso' => $item->peso,
                    ];
                }),
                'total' => $pesos->sum('peso'),
            ]
        ]);
    }

    /**
     * Actualizar peso específico
     */
    public function update(Request $request, MatrizPesos $matrizPeso): JsonResponse
    {
        $validated = $request->validate([
            'peso' => 'required|numeric|min:0|max:100',
        ]);

        $matrizPeso->update($validated);

        return response()->json([
            'message' => 'Peso actualizado com sucesso.',
            'data' => $matrizPeso->fresh()->load('indicador')
        ]);
    }

    /**
     * Actualizar todos os pesos de uma categoria
     */
    public function actualizarCategoria(Request $request, string $categoria): JsonResponse
    {
        $validated = $request->validate([
            'pesos' => 'required|array',
            'pesos.*.indicador_id' => 'required|exists:indicadores,id',
            'pesos.*.peso' => 'required|numeric|min:0|max:100',
        ]);

        // Verificar que os pesos somam 100%
        $total = collect($validated['pesos'])->sum('peso');
        if (abs($total - 100) > 0.01) {
            return response()->json([
                'message' => 'Os pesos devem somar exactamente 100%. Total actual: ' . $total . '%'
            ], 422);
        }

        foreach ($validated['pesos'] as $peso) {
            MatrizPesos::updateOrCreate(
                [
                    'categoria' => $categoria,
                    'indicador_id' => $peso['indicador_id'],
                ],
                [
                    'peso' => $peso['peso'],
                ]
            );
        }

        return response()->json([
            'message' => 'Pesos da categoria actualizados com sucesso.',
            'data' => MatrizPesos::with('indicador')
                ->where('categoria', $categoria)
                ->get()
        ]);
    }

    /**
     * Listar categorias disponíveis
     */
    public function categorias(): JsonResponse
    {
        $categorias = [
            ['codigo' => 'nao_lider', 'nome' => 'Trabalhador sem funções de liderança'],
            ['codigo' => 'supervisor', 'nome' => 'Supervisor de equipa'],
            ['codigo' => 'chefe_seccao', 'nome' => 'Chefe de Secção'],
            ['codigo' => 'chefe_departamento', 'nome' => 'Chefe de Departamento'],
            ['codigo' => 'director', 'nome' => 'Director'],
            ['codigo' => 'director_geral', 'nome' => 'Director Geral'],
        ];

        return response()->json([
            'data' => $categorias
        ]);
    }
}
