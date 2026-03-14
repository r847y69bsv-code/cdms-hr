<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesController extends Controller
{
    /**
     * Listar todos os papéis
     */
    public function index(): JsonResponse
    {
        $roles = Role::where('guard_name', 'sanctum')
            ->withCount('users')
            ->with('permissions')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'users_count' => $role->users_count,
                    'permissions' => $role->permissions->pluck('name'),
                    'created_at' => $role->created_at,
                ];
            });

        return response()->json([
            'data' => $roles
        ]);
    }

    /**
     * Criar novo papel
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:125|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'sanctum',
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Papel criado com sucesso.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Mostrar um papel específico
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'users' => $role->users()->select(['id', 'name', 'email'])->get(),
            ]
        ]);
    }

    /**
     * Actualizar papel
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        // Não permitir editar papéis do sistema
        $rolesProtegidos = ['admin', 'trabalhador'];
        if (in_array($role->name, $rolesProtegidos) && $request->has('name')) {
            return response()->json([
                'message' => 'Não é possível renomear este papel do sistema.'
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:125|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        if (isset($validated['name'])) {
            $role->update(['name' => $validated['name']]);
        }

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Papel actualizado com sucesso.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ]);
    }

    /**
     * Eliminar papel
     */
    public function destroy(Role $role): JsonResponse
    {
        // Não permitir eliminar papéis do sistema
        $rolesProtegidos = ['admin', 'trabalhador', 'avaliador', 'chefe-departamento', 'gestor-rh'];
        if (in_array($role->name, $rolesProtegidos)) {
            return response()->json([
                'message' => 'Não é possível eliminar este papel do sistema.'
            ], 422);
        }

        // Verificar se tem utilizadores associados
        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar um papel com utilizadores associados.'
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Papel eliminado com sucesso.'
        ]);
    }

    /**
     * Actualizar permissões de um papel
     */
    public function updatePermissions(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions']);

        // Limpar cache de permissões
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissões actualizadas com sucesso.',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ]
        ]);
    }

    /**
     * Atribuir papel a utilizadores
     */
    public function assignToUsers(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $users = \App\Models\User::whereIn('id', $validated['user_ids'])->get();

        foreach ($users as $user) {
            $user->assignRole($role);
        }

        return response()->json([
            'message' => 'Papel atribuído aos utilizadores com sucesso.',
            'data' => [
                'role' => $role->name,
                'users_assigned' => $users->count(),
            ]
        ]);
    }

    /**
     * Remover papel de utilizadores
     */
    public function removeFromUsers(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $users = \App\Models\User::whereIn('id', $validated['user_ids'])->get();

        foreach ($users as $user) {
            $user->removeRole($role);
        }

        return response()->json([
            'message' => 'Papel removido dos utilizadores com sucesso.',
            'data' => [
                'role' => $role->name,
                'users_removed' => $users->count(),
            ]
        ]);
    }
}
