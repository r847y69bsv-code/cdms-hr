<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemAvaliacao;
use App\Models\Avaliacao;
use App\Models\Trabalhador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ItemAvaliacaoController extends Controller
{
    /**
     * Listar itens de uma avaliação
     */
    public function index(Request $request, Avaliacao $avaliacao): JsonResponse
    {
        $itens = $avaliacao->itens()
            ->with('indicador')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $itens
        ]);
    }

    /**
     * Mostrar um item específico
     */
    public function show(ItemAvaliacao $item): JsonResponse
    {
        return response()->json([
            'data' => $item->load(['avaliacao', 'indicador'])
        ]);
    }

    /**
     * Actualizar item (pontuação e justificação)
     */
    public function update(Request $request, ItemAvaliacao $item): JsonResponse
    {
        $avaliacao = $item->avaliacao;

        // Verificar permissão
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $isOwner = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;
        $isAvaliador = $avaliacao->avaliador_id === auth()->id();

        if (!$isOwner && !$isAvaliador) {
            return response()->json([
                'message' => 'Não tem permissão para editar este item.'
            ], 403);
        }

        $validated = $request->validate([
            'pontuacao_auto' => 'nullable|integer|min:1|max:5',
            'justificacao_auto' => 'nullable|string|max:1000',
            'pontuacao_avaliador' => 'nullable|integer|min:1|max:5',
            'justificacao_avaliador' => 'nullable|string|max:1000',
        ]);

        $updateData = [];

        // Trabalhador só pode editar pontuação_auto em estado RASCUNHO
        if ($isOwner && $avaliacao->estado === Avaliacao::ESTADO_RASCUNHO) {
            if (isset($validated['pontuacao_auto'])) {
                $updateData['pontuacao_auto'] = $validated['pontuacao_auto'];
            }
            if (isset($validated['justificacao_auto'])) {
                $updateData['justificacao_auto'] = $validated['justificacao_auto'];
            }
        }

        // Avaliador só pode editar pontuação_avaliador em estado AVAL_RASCUNHO
        if ($isAvaliador && $avaliacao->estado === Avaliacao::ESTADO_AVAL_RASCUNHO) {
            if (isset($validated['pontuacao_avaliador'])) {
                $updateData['pontuacao_avaliador'] = $validated['pontuacao_avaliador'];
            }
            if (isset($validated['justificacao_avaliador'])) {
                $updateData['justificacao_avaliador'] = $validated['justificacao_avaliador'];
            }
        }

        if (empty($updateData)) {
            return response()->json([
                'message' => 'Não é possível editar este item no estado actual da avaliação.'
            ], 422);
        }

        $item->update($updateData);

        return response()->json([
            'message' => 'Item actualizado com sucesso.',
            'data' => $item->fresh()->load('indicador')
        ]);
    }

    /**
     * Actualizar múltiplos itens de uma vez
     */
    public function updateBatch(Request $request, Avaliacao $avaliacao): JsonResponse
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

        $validated = $request->validate([
            'itens' => 'required|array',
            'itens.*.id' => 'required|exists:itens_avaliacao,id',
            'itens.*.pontuacao_auto' => 'nullable|integer|min:1|max:5',
            'itens.*.justificacao_auto' => 'nullable|string|max:1000',
            'itens.*.pontuacao_avaliador' => 'nullable|integer|min:1|max:5',
            'itens.*.justificacao_avaliador' => 'nullable|string|max:1000',
        ]);

        $actualizados = 0;

        foreach ($validated['itens'] as $itemData) {
            $item = ItemAvaliacao::find($itemData['id']);

            // Verificar que o item pertence a esta avaliação
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
                $actualizados++;
            }
        }

        return response()->json([
            'message' => "{$actualizados} itens actualizados com sucesso.",
            'data' => $avaliacao->itens()->with('indicador')->get()
        ]);
    }
}
