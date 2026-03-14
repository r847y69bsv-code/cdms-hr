<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistoOneOnOne;
use App\Models\Avaliacao;
use App\Models\Trabalhador;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OneOnOneController extends Controller
{
    /**
     * Listar registos one-on-one
     */
    public function index(Request $request): JsonResponse
    {
        $query = RegistoOneOnOne::with(['avaliacao.trabalhador', 'avaliacao.ciclo', 'criadoPor']);

        // Filtrar por avaliação
        if ($request->has('avaliacao_id')) {
            $query->where('avaliacao_id', $request->avaliacao_id);
        }

        // Filtrar registos criados pelo utilizador actual (como avaliador)
        if ($request->boolean('meus_registos')) {
            $query->where('criado_por', auth()->id());
        }

        // Ordenação
        $query->orderBy('data_reuniao', 'desc');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $registos = $query->paginate($perPage);

        return response()->json($registos);
    }

    /**
     * Criar novo registo one-on-one
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avaliacao_id' => 'required|exists:avaliacoes,id',
            'data_reuniao' => 'required|date',
            'duracao_minutos' => 'nullable|integer|min:5|max:480',
            'topicos_discutidos' => 'nullable|string|max:2000',
            'accoes_acordadas' => 'nullable|string|max:2000',
            'notas_privadas' => 'nullable|string|max:2000',
        ]);

        $avaliacao = Avaliacao::find($validated['avaliacao_id']);

        // Verificar se é o avaliador
        if ($avaliacao->avaliador_id !== auth()->id()) {
            return response()->json([
                'message' => 'Apenas o avaliador pode registar reuniões one-on-one.'
            ], 403);
        }

        $validated['criado_por'] = auth()->id();

        $registo = RegistoOneOnOne::create($validated);

        return response()->json([
            'message' => 'Registo one-on-one criado com sucesso.',
            'data' => $registo->load(['avaliacao.trabalhador'])
        ], 201);
    }

    /**
     * Mostrar um registo específico
     */
    public function show(RegistoOneOnOne $oneOnOne): JsonResponse
    {
        // Verificar permissão (avaliador ou trabalhador da avaliação)
        $avaliacao = $oneOnOne->avaliacao;
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        $isAvaliador = $avaliacao->avaliador_id === auth()->id();
        $isTrabalhador = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;

        if (!$isAvaliador && !$isTrabalhador) {
            return response()->json([
                'message' => 'Não tem permissão para ver este registo.'
            ], 403);
        }

        // Se for o trabalhador, ocultar notas privadas
        $registo = $oneOnOne->load(['avaliacao.trabalhador', 'avaliacao.ciclo', 'criadoPor']);

        if ($isTrabalhador && !$isAvaliador) {
            $registo->notas_privadas = null;
        }

        return response()->json([
            'data' => $registo
        ]);
    }

    /**
     * Actualizar registo one-on-one
     */
    public function update(Request $request, RegistoOneOnOne $oneOnOne): JsonResponse
    {
        // Apenas o criador pode editar
        if ($oneOnOne->criado_por !== auth()->id()) {
            return response()->json([
                'message' => 'Apenas o criador pode editar este registo.'
            ], 403);
        }

        $validated = $request->validate([
            'data_reuniao' => 'sometimes|date',
            'duracao_minutos' => 'nullable|integer|min:5|max:480',
            'topicos_discutidos' => 'nullable|string|max:2000',
            'accoes_acordadas' => 'nullable|string|max:2000',
            'notas_privadas' => 'nullable|string|max:2000',
        ]);

        $oneOnOne->update($validated);

        return response()->json([
            'message' => 'Registo actualizado com sucesso.',
            'data' => $oneOnOne->fresh()->load('avaliacao.trabalhador')
        ]);
    }

    /**
     * Eliminar registo one-on-one
     */
    public function destroy(RegistoOneOnOne $oneOnOne): JsonResponse
    {
        // Apenas o criador pode eliminar
        if ($oneOnOne->criado_por !== auth()->id()) {
            return response()->json([
                'message' => 'Apenas o criador pode eliminar este registo.'
            ], 403);
        }

        $oneOnOne->delete();

        return response()->json([
            'message' => 'Registo eliminado com sucesso.'
        ]);
    }

    /**
     * Meus registos one-on-one (como avaliador)
     */
    public function meusRegistos(Request $request): JsonResponse
    {
        $registos = RegistoOneOnOne::where('criado_por', auth()->id())
            ->with(['avaliacao.trabalhador', 'avaliacao.ciclo'])
            ->orderBy('data_reuniao', 'desc')
            ->get();

        return response()->json([
            'data' => $registos
        ]);
    }

    /**
     * Registos das minhas avaliações (como trabalhador)
     */
    public function registosDasMinhasAvaliacoes(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'data' => []
            ]);
        }

        $registos = RegistoOneOnOne::whereHas('avaliacao', function ($q) use ($trabalhador) {
            $q->where('trabalhador_id', $trabalhador->id);
        })
        ->with(['avaliacao.ciclo', 'criadoPor'])
        ->orderBy('data_reuniao', 'desc')
        ->get()
        ->map(function ($registo) {
            // Ocultar notas privadas para o trabalhador
            $registo->notas_privadas = null;
            return $registo;
        });

        return response()->json([
            'data' => $registos
        ]);
    }

    /**
     * Registos por avaliação
     */
    public function porAvaliacao(Avaliacao $avaliacao): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $isAvaliador = $avaliacao->avaliador_id === auth()->id();
        $isTrabalhador = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;

        if (!$isAvaliador && !$isTrabalhador) {
            return response()->json([
                'message' => 'Não tem permissão para ver estes registos.'
            ], 403);
        }

        $registos = $avaliacao->registosOneOnOne()
            ->with('criadoPor')
            ->orderBy('data_reuniao', 'desc')
            ->get();

        // Ocultar notas privadas se for o trabalhador
        if ($isTrabalhador && !$isAvaliador) {
            $registos = $registos->map(function ($registo) {
                $registo->notas_privadas = null;
                return $registo;
            });
        }

        return response()->json([
            'data' => $registos
        ]);
    }
}
