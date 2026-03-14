<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contestacao;
use App\Models\Avaliacao;
use App\Models\Trabalhador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContestacaoController extends Controller
{
    /**
     * Listar contestações
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contestacao::with(['avaliacao.trabalhador', 'avaliacao.ciclo', 'respondidoPor']);

        // Filtros
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('avaliacao_id')) {
            $query->where('avaliacao_id', $request->avaliacao_id);
        }

        // Ordenação
        $query->orderBy('created_at', 'desc');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $contestacoes = $query->paginate($perPage);

        return response()->json($contestacoes);
    }

    /**
     * Criar nova contestação
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avaliacao_id' => 'required|exists:avaliacoes,id',
            'motivo' => 'required|string|max:255',
            'descricao' => 'required|string|max:2000',
        ]);

        $avaliacao = Avaliacao::find($validated['avaliacao_id']);

        // Verificar se o utilizador é o dono da avaliação
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        if (!$trabalhador || $avaliacao->trabalhador_id !== $trabalhador->id) {
            return response()->json([
                'message' => 'Não tem permissão para contestar esta avaliação.'
            ], 403);
        }

        // Verificar estado da avaliação
        $estadosContestaveis = [
            Avaliacao::ESTADO_APROVADA,
            Avaliacao::ESTADO_FEEDBACK_FEITO,
        ];

        if (!in_array($avaliacao->estado, $estadosContestaveis)) {
            return response()->json([
                'message' => 'Esta avaliação não pode ser contestada no estado actual.'
            ], 422);
        }

        // Verificar se já existe contestação pendente
        $contestacaoPendente = Contestacao::where('avaliacao_id', $avaliacao->id)
            ->whereIn('estado', [Contestacao::ESTADO_PENDENTE, Contestacao::ESTADO_EM_ANALISE])
            ->exists();

        if ($contestacaoPendente) {
            return response()->json([
                'message' => 'Já existe uma contestação pendente para esta avaliação.'
            ], 422);
        }

        $contestacao = Contestacao::create([
            'avaliacao_id' => $avaliacao->id,
            'motivo' => $validated['motivo'],
            'descricao' => $validated['descricao'],
            'estado' => Contestacao::ESTADO_PENDENTE,
        ]);

        // Actualizar estado da avaliação
        $avaliacao->update(['estado' => Avaliacao::ESTADO_CONTESTADA]);

        return response()->json([
            'message' => 'Contestação registada com sucesso.',
            'data' => $contestacao->load('avaliacao')
        ], 201);
    }

    /**
     * Mostrar uma contestação específica
     */
    public function show(Contestacao $contestacao): JsonResponse
    {
        return response()->json([
            'data' => $contestacao->load(['avaliacao.trabalhador', 'avaliacao.ciclo', 'respondidoPor'])
        ]);
    }

    /**
     * Responder a uma contestação
     */
    public function responder(Request $request, Contestacao $contestacao): JsonResponse
    {
        // Verificar permissão (apenas RH ou admin)
        if (!auth()->user()->hasAnyPermission(['aprovar avaliacao-rh', 'acesso administracao'])) {
            return response()->json([
                'message' => 'Não tem permissão para responder a contestações.'
            ], 403);
        }

        if (!in_array($contestacao->estado, [Contestacao::ESTADO_PENDENTE, Contestacao::ESTADO_EM_ANALISE])) {
            return response()->json([
                'message' => 'Esta contestação já foi respondida.'
            ], 422);
        }

        $validated = $request->validate([
            'estado' => 'required|string|in:aceite,rejeitada',
            'resposta' => 'required|string|max:2000',
        ]);

        $contestacao->update([
            'estado' => $validated['estado'],
            'resposta' => $validated['resposta'],
            'respondido_por' => auth()->id(),
            'data_resposta' => now(),
        ]);

        // Se aceite, reverter estado da avaliação para revisão
        if ($validated['estado'] === Contestacao::ESTADO_ACEITE) {
            $contestacao->avaliacao->update([
                'estado' => Avaliacao::ESTADO_REV_RH,
            ]);
        } else {
            // Se rejeitada, voltar ao estado anterior
            $contestacao->avaliacao->update([
                'estado' => Avaliacao::ESTADO_FEEDBACK_FEITO,
            ]);
        }

        return response()->json([
            'message' => 'Contestação respondida com sucesso.',
            'data' => $contestacao->fresh()->load('avaliacao')
        ]);
    }

    /**
     * Colocar contestação em análise
     */
    public function emAnalise(Contestacao $contestacao): JsonResponse
    {
        if ($contestacao->estado !== Contestacao::ESTADO_PENDENTE) {
            return response()->json([
                'message' => 'Esta contestação não está pendente.'
            ], 422);
        }

        $contestacao->update([
            'estado' => Contestacao::ESTADO_EM_ANALISE,
        ]);

        return response()->json([
            'message' => 'Contestação colocada em análise.',
            'data' => $contestacao->fresh()
        ]);
    }

    /**
     * Minhas contestações
     */
    public function minhasContestacoes(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'data' => []
            ]);
        }

        $contestacoes = Contestacao::whereHas('avaliacao', function ($q) use ($trabalhador) {
            $q->where('trabalhador_id', $trabalhador->id);
        })
        ->with(['avaliacao.ciclo', 'respondidoPor'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'data' => $contestacoes
        ]);
    }

    /**
     * Contestações pendentes (para RH)
     */
    public function pendentes(): JsonResponse
    {
        $contestacoes = Contestacao::whereIn('estado', [
            Contestacao::ESTADO_PENDENTE,
            Contestacao::ESTADO_EM_ANALISE,
        ])
        ->with(['avaliacao.trabalhador', 'avaliacao.ciclo'])
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'data' => $contestacoes
        ]);
    }
}
