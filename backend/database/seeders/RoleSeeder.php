<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Papel: Trabalhador (base)
        $trabalhador = Role::firstOrCreate([
            'name' => 'trabalhador',
            'guard_name' => 'sanctum',
        ]);
        $trabalhador->syncPermissions([
            'acesso modulo-avaliacao',
            'criar autoavaliacao',
            'editar autoavaliacao',
            'submeter autoavaliacao',
            'ver avaliacoes proprias',
            'contestar avaliacao',
        ]);

        // Papel: Avaliador (supervisor/chefe de secção)
        $avaliador = Role::firstOrCreate([
            'name' => 'avaliador',
            'guard_name' => 'sanctum',
        ]);
        $avaliador->syncPermissions([
            // Herda permissões de trabalhador
            'acesso modulo-avaliacao',
            'criar autoavaliacao',
            'editar autoavaliacao',
            'submeter autoavaliacao',
            'ver avaliacoes proprias',
            'contestar avaliacao',
            // Permissões de avaliador
            'acesso painel-avaliador',
            'ver avaliacoes equipa',
            'criar avaliacao',
            'editar avaliacao',
            'submeter avaliacao',
            'registar one-on-one',
            'criar plano-melhoria',
        ]);

        // Papel: Chefe de Departamento
        $chefeDepartamento = Role::firstOrCreate([
            'name' => 'chefe-departamento',
            'guard_name' => 'sanctum',
        ]);
        $chefeDepartamento->syncPermissions([
            // Herda permissões de avaliador
            'acesso modulo-avaliacao',
            'criar autoavaliacao',
            'editar autoavaliacao',
            'submeter autoavaliacao',
            'ver avaliacoes proprias',
            'contestar avaliacao',
            'acesso painel-avaliador',
            'ver avaliacoes equipa',
            'criar avaliacao',
            'editar avaliacao',
            'submeter avaliacao',
            'registar one-on-one',
            'criar plano-melhoria',
            // Permissões de revisão departamental
            'acesso revisao-departamental',
            'aprovar avaliacao-departamento',
            'rejeitar avaliacao-departamento',
            'ver resumo-departamento',
        ]);

        // Papel: Gestor RH
        $gestorRH = Role::firstOrCreate([
            'name' => 'gestor-rh',
            'guard_name' => 'sanctum',
        ]);
        $gestorRH->syncPermissions([
            // Acesso básico
            'acesso modulo-avaliacao',
            'ver avaliacoes proprias',
            // Módulo RH completo
            'acesso modulo-rh',
            'gerir ciclos',
            'criar ciclo',
            'editar ciclo',
            'activar ciclo',
            'ver todas-avaliacoes',
            'aprovar avaliacao-rh',
            'rejeitar avaliacao-rh',
            'gerar relatorios',
            'exportar dados',
            'gerir configuracoes-rh',
            'importar trabalhadores',
            'importar avaliacoes',
        ]);

        // Papel: Administrador (acesso total)
        $admin = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum',
        ]);
        // Admin tem todas as permissões
        $admin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        $this->command->info('Papéis criados: trabalhador, avaliador, chefe-departamento, gestor-rh, admin');
    }
}
