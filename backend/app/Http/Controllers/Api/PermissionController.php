<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    /**
     * Listar todas as permissões
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get()
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'created_at' => $permission->created_at,
                ];
            });

        // Agrupar por módulo (baseado no prefixo do nome)
        $agrupadas = $permissions->groupBy(function ($permission) {
            $name = $permission['name'];

            if (str_contains($name, 'modulo-avaliacao') || str_contains($name, 'autoavaliacao') || str_contains($name, 'avaliacoes proprias')) {
                return 'Módulo de Avaliação - Trabalhador';
            }
            if (str_contains($name, 'painel-avaliador') || str_contains($name, 'equipa') || str_contains($name, 'one-on-one') || str_contains($name, 'plano-melhoria')) {
                return 'Módulo de Avaliação - Avaliador';
            }
            if (str_contains($name, 'revisao-departamental') || str_contains($name, 'departamento')) {
                return 'Revisão Departamental';
            }
            if (str_contains($name, 'modulo-rh') || str_contains($name, 'ciclo') || str_contains($name, 'todas-avaliacoes') || str_contains($name, 'relatorios') || str_contains($name, 'rh')) {
                return 'Módulo RH';
            }
            if (str_contains($name, 'administracao') || str_contains($name, 'utilizador') || str_contains($name, 'roles') || str_contains($name, 'permissoes') || str_contains($name, 'logs') || str_contains($name, 'sistema')) {
                return 'Administração';
            }
            if (str_contains($name, 'importar')) {
                return 'Importação';
            }

            return 'Outras';
        });

        return response()->json([
            'data' => $permissions,
            'agrupadas' => $agrupadas,
        ]);
    }

    /**
     * Criar nova permissão
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:125|unique:permissions,name',
        ]);

        $permission = Permission::create([
            'name' => $validated['name'],
            'guard_name' => 'sanctum',
        ]);

        return response()->json([
            'message' => 'Permissão criada com sucesso.',
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
            ]
        ], 201);
    }

    /**
     * Mostrar uma permissão específica
     */
    public function show(Permission $permission): JsonResponse
    {
        $roles = $permission->roles()->pluck('name');

        return response()->json([
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'roles' => $roles,
            ]
        ]);
    }

    /**
     * Actualizar permissão
     */
    public function update(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:125|unique:permissions,name,' . $permission->id,
        ]);

        $permission->update(['name' => $validated['name']]);

        // Limpar cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissão actualizada com sucesso.',
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
            ]
        ]);
    }

    /**
     * Eliminar permissão
     */
    public function destroy(Permission $permission): JsonResponse
    {
        // Verificar se está atribuída a algum papel
        if ($permission->roles()->exists()) {
            return response()->json([
                'message' => 'Não é possível eliminar uma permissão atribuída a papéis. Remova-a dos papéis primeiro.'
            ], 422);
        }

        $permission->delete();

        // Limpar cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissão eliminada com sucesso.'
        ]);
    }

    /**
     * Atribuir permissão a papéis
     */
    public function assignToRoles(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        foreach ($validated['roles'] as $roleName) {
            $role = Role::findByName($roleName, 'sanctum');
            $role->givePermissionTo($permission);
        }

        // Limpar cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissão atribuída aos papéis com sucesso.',
            'data' => [
                'permission' => $permission->name,
                'roles' => $validated['roles'],
            ]
        ]);
    }

    /**
     * Remover permissão de papéis
     */
    public function removeFromRoles(Request $request, Permission $permission): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name',
        ]);

        foreach ($validated['roles'] as $roleName) {
            $role = Role::findByName($roleName, 'sanctum');
            $role->revokePermissionTo($permission);
        }

        // Limpar cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'message' => 'Permissão removida dos papéis com sucesso.',
            'data' => [
                'permission' => $permission->name,
                'roles' => $validated['roles'],
            ]
        ]);
    }

    /**
     * Matriz de permissões vs papéis
     */
    public function matriz(): JsonResponse
    {
        $permissions = Permission::where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get();

        $roles = Role::where('guard_name', 'sanctum')
            ->with('permissions')
            ->get();

        $matriz = [];

        foreach ($permissions as $permission) {
            $row = [
                'permission' => $permission->name,
            ];

            foreach ($roles as $role) {
                $row[$role->name] = $role->permissions->contains('id', $permission->id);
            }

            $matriz[] = $row;
        }

        return response()->json([
            'data' => [
                'roles' => $roles->pluck('name'),
                'matriz' => $matriz,
            ]
        ]);
    }
}
