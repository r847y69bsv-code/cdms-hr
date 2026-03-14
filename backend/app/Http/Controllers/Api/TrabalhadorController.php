<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trabalhador;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TrabalhadorController extends Controller
{
    /**
     * Listar todos os trabalhadores
     */
    public function index(Request $request): JsonResponse
    {
        $query = Trabalhador::with(['user', 'superiorDirecto']);

        // Filtros
        if ($request->has('departamento')) {
            $query->where('departamento', $request->departamento);
        }

        if ($request->has('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        if ($request->has('is_lider')) {
            $query->where('is_lider', $request->boolean('is_lider'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nome_completo', 'like', "%{$search}%")
                  ->orWhere('numero_funcionario', 'like', "%{$search}%")
                  ->orWhere('cargo', 'like', "%{$search}%");
            });
        }

        // Ordenação
        $query->orderBy('nome_completo');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $trabalhadores = $query->paginate($perPage);

        return response()->json($trabalhadores);
    }

    /**
     * Criar novo trabalhador
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id|unique:trabalhadores,user_id',
            'numero_funcionario' => 'required|string|max:50|unique:trabalhadores,numero_funcionario',
            'nome_completo' => 'required|string|max:255',
            'departamento' => 'required|string|max:100',
            'cargo' => 'required|string|max:100',
            'categoria' => 'required|string|in:nao_lider,supervisor,chefe_seccao,chefe_departamento,director,director_geral',
            'data_admissao' => 'nullable|date',
            'superior_directo_id' => 'nullable|exists:trabalhadores,id',
            'is_lider' => 'boolean',
            'nivel_lideranca' => 'required|string|in:nao_lider,supervisor,chefe_seccao,chefe_departamento,director,director_geral',
        ]);

        $trabalhador = Trabalhador::create($validated);

        return response()->json([
            'message' => 'Trabalhador criado com sucesso.',
            'data' => $trabalhador->load(['user', 'superiorDirecto'])
        ], 201);
    }

    /**
     * Mostrar um trabalhador específico
     */
    public function show(Trabalhador $trabalhador): JsonResponse
    {
        return response()->json([
            'data' => $trabalhador->load(['user', 'superiorDirecto', 'subordinados', 'avaliacoes'])
        ]);
    }

    /**
     * Actualizar trabalhador
     */
    public function update(Request $request, Trabalhador $trabalhador): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id|unique:trabalhadores,user_id,' . $trabalhador->id,
            'numero_funcionario' => 'sometimes|string|max:50|unique:trabalhadores,numero_funcionario,' . $trabalhador->id,
            'nome_completo' => 'sometimes|string|max:255',
            'departamento' => 'sometimes|string|max:100',
            'cargo' => 'sometimes|string|max:100',
            'categoria' => 'sometimes|string|in:nao_lider,supervisor,chefe_seccao,chefe_departamento,director,director_geral',
            'data_admissao' => 'nullable|date',
            'superior_directo_id' => 'nullable|exists:trabalhadores,id',
            'is_lider' => 'boolean',
            'nivel_lideranca' => 'sometimes|string|in:nao_lider,supervisor,chefe_seccao,chefe_departamento,director,director_geral',
        ]);

        // Verificar que não está a definir-se como seu próprio superior
        if (isset($validated['superior_directo_id']) && $validated['superior_directo_id'] == $trabalhador->id) {
            return response()->json([
                'message' => 'Um trabalhador não pode ser seu próprio superior.'
            ], 422);
        }

        $trabalhador->update($validated);

        return response()->json([
            'message' => 'Trabalhador actualizado com sucesso.',
            'data' => $trabalhador->fresh()->load(['user', 'superiorDirecto'])
        ]);
    }

    /**
     * Eliminar trabalhador
     */
    public function destroy(Trabalhador $trabalhador): JsonResponse
    {
        // Verificar se tem avaliações associadas
        if ($trabalhador->avaliacoes()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar um trabalhador com avaliações associadas.'
            ], 422);
        }

        // Verificar se tem subordinados
        if ($trabalhador->subordinados()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar um trabalhador com subordinados. Reatribua os subordinados primeiro.'
            ], 422);
        }

        $trabalhador->delete();

        return response()->json([
            'message' => 'Trabalhador eliminado com sucesso.'
        ]);
    }

    /**
     * Obter subordinados de um trabalhador
     */
    public function subordinados(Trabalhador $trabalhador): JsonResponse
    {
        return response()->json([
            'data' => $trabalhador->subordinados()->with('user')->get()
        ]);
    }

    /**
     * Obter departamentos únicos
     */
    public function departamentos(): JsonResponse
    {
        $departamentos = Trabalhador::distinct()
            ->pluck('departamento')
            ->sort()
            ->values();

        return response()->json([
            'data' => $departamentos
        ]);
    }

    /**
     * Obter trabalhador do utilizador autenticado
     */
    public function meuPerfil(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())
            ->with(['superiorDirecto', 'subordinados'])
            ->first();

        if (!$trabalhador) {
            return response()->json([
                'message' => 'Perfil de trabalhador não encontrado.',
                'data' => null
            ], 404);
        }

        return response()->json([
            'data' => $trabalhador
        ]);
    }

    /**
     * Associar utilizador a trabalhador
     */
    public function associarUser(Request $request, Trabalhador $trabalhador): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:trabalhadores,user_id,' . $trabalhador->id,
        ]);

        $trabalhador->update(['user_id' => $validated['user_id']]);

        return response()->json([
            'message' => 'Utilizador associado com sucesso.',
            'data' => $trabalhador->fresh()->load('user')
        ]);
    }
}
