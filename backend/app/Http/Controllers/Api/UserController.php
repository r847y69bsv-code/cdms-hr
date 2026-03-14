<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Listar todos os utilizadores
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'trabalhador']);

        // Filtros
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Ordenação
        $query->orderBy('name');

        // Paginação
        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        // Adicionar permissões a cada utilizador
        $users->getCollection()->transform(function ($user) {
            $user->permissions = $user->getAllPermissions()->pluck('name');
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Criar novo utilizador
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
            'password_changed_at' => now(),
        ]);

        // Atribuir roles
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        } else {
            $user->assignRole('trabalhador');
        }

        return response()->json([
            'message' => 'Utilizador criado com sucesso.',
            'data' => $user->load('roles')
        ], 201);
    }

    /**
     * Mostrar um utilizador específico
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['roles', 'trabalhador']);
        $user->permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * Actualizar utilizador
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
        ]);

        // Actualizar campos básicos
        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = strtolower($validated['email']);
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
            $user->password_changed_at = now();
        }

        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }

        $user->save();

        // Actualizar roles
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        return response()->json([
            'message' => 'Utilizador actualizado com sucesso.',
            'data' => $user->fresh()->load('roles')
        ]);
    }

    /**
     * Desactivar utilizador
     */
    public function destroy(User $user): JsonResponse
    {
        // Não permitir desactivar o próprio utilizador
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Não pode desactivar a sua própria conta.'
            ], 422);
        }

        $user->update(['is_active' => false]);

        // Revogar todos os tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Utilizador desactivado com sucesso.'
        ]);
    }

    /**
     * Activar utilizador
     */
    public function activar(User $user): JsonResponse
    {
        $user->update(['is_active' => true]);

        return response()->json([
            'message' => 'Utilizador activado com sucesso.',
            'data' => $user
        ]);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ]);

        // Revogar todos os tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password redefinida com sucesso.'
        ]);
    }

    /**
     * Actualizar roles do utilizador
     */
    public function updateRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'Papéis actualizados com sucesso.',
            'data' => $user->fresh()->load('roles')
        ]);
    }

    /**
     * Listar utilizadores sem trabalhador associado
     */
    public function semTrabalhador(): JsonResponse
    {
        $users = User::whereDoesntHave('trabalhador')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * Estatísticas de utilizadores
     */
    public function estatisticas(): JsonResponse
    {
        $total = User::count();
        $activos = User::where('is_active', true)->count();
        $inactivos = User::where('is_active', false)->count();

        $porRole = Role::withCount('users')->get()->map(function ($role) {
            return [
                'role' => $role->name,
                'total' => $role->users_count,
            ];
        });

        return response()->json([
            'data' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => $inactivos,
                'por_role' => $porRole,
            ]
        ]);
    }
}
