<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Módulo de Avaliação - Trabalhador
            'acesso modulo-avaliacao',
            'criar autoavaliacao',
            'editar autoavaliacao',
            'submeter autoavaliacao',
            'ver avaliacoes proprias',
            'contestar avaliacao',

            // Módulo de Avaliação - Avaliador
            'acesso painel-avaliador',
            'ver avaliacoes equipa',
            'criar avaliacao',
            'editar avaliacao',
            'submeter avaliacao',
            'registar one-on-one',
            'criar plano-melhoria',

            // Módulo de Revisão Departamental
            'acesso revisao-departamental',
            'aprovar avaliacao-departamento',
            'rejeitar avaliacao-departamento',
            'ver resumo-departamento',

            // Módulo RH
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

            // Administração
            'acesso administracao',
            'gerir utilizadores',
            'criar utilizador',
            'editar utilizador',
            'desactivar utilizador',
            'gerir roles',
            'gerir permissoes',
            'ver logs-auditoria',
            'gerir configuracoes-sistema',

            // Importação
            'importar trabalhadores',
            'importar avaliacoes',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum',
            ]);
        }

        $this->command->info('Permissões criadas: ' . count($permissions));
    }
}
