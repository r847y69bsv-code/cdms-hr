<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Trabalhador;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar utilizador Administrador
        $admin = User::firstOrCreate(
            ['email' => 'admin@cornelder.co.mz'],
            [
                'name' => 'Administrador do Sistema',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Criar utilizador Gestor RH
        $gestorRH = User::firstOrCreate(
            ['email' => 'rh@cornelder.co.mz'],
            [
                'name' => 'Gestor de Recursos Humanos',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $gestorRH->assignRole('gestor-rh');

        // Criar utilizador Chefe de Departamento (exemplo)
        $chefeDept = User::firstOrCreate(
            ['email' => 'chefe.operacoes@cornelder.co.mz'],
            [
                'name' => 'João Silva',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $chefeDept->assignRole('chefe-departamento');

        // Criar trabalhador para o chefe de departamento
        $trabalhadorChefe = Trabalhador::firstOrCreate(
            ['numero_funcionario' => 'COR001'],
            [
                'user_id' => $chefeDept->id,
                'nome_completo' => 'João Silva',
                'departamento' => 'Operações',
                'cargo' => 'Chefe de Departamento de Operações',
                'categoria' => 'chefe_departamento',
                'data_admissao' => '2015-03-15',
                'is_lider' => true,
                'nivel_lideranca' => 'chefe_departamento',
            ]
        );

        // Criar utilizador Avaliador (supervisor)
        $supervisor = User::firstOrCreate(
            ['email' => 'supervisor.logistica@cornelder.co.mz'],
            [
                'name' => 'Maria Santos',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $supervisor->assignRole('avaliador');

        // Criar trabalhador para o supervisor
        $trabalhadorSupervisor = Trabalhador::firstOrCreate(
            ['numero_funcionario' => 'COR002'],
            [
                'user_id' => $supervisor->id,
                'nome_completo' => 'Maria Santos',
                'departamento' => 'Operações',
                'cargo' => 'Supervisora de Logística',
                'categoria' => 'supervisor',
                'data_admissao' => '2018-06-01',
                'is_lider' => true,
                'nivel_lideranca' => 'supervisor',
                'superior_directo_id' => $trabalhadorChefe->id,
            ]
        );

        // Criar utilizador Trabalhador comum
        $trabalhadorUser = User::firstOrCreate(
            ['email' => 'operador@cornelder.co.mz'],
            [
                'name' => 'António Machel',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $trabalhadorUser->assignRole('trabalhador');

        // Criar trabalhador para o trabalhador comum
        Trabalhador::firstOrCreate(
            ['numero_funcionario' => 'COR003'],
            [
                'user_id' => $trabalhadorUser->id,
                'nome_completo' => 'António Machel',
                'departamento' => 'Operações',
                'cargo' => 'Operador de Equipamentos',
                'categoria' => 'nao_lider',
                'data_admissao' => '2020-01-10',
                'is_lider' => false,
                'nivel_lideranca' => 'nao_lider',
                'superior_directo_id' => $trabalhadorSupervisor->id,
            ]
        );

        // Criar mais um trabalhador para ter uma equipa
        $trabalhadorUser2 = User::firstOrCreate(
            ['email' => 'tecnico@cornelder.co.mz'],
            [
                'name' => 'Fátima Mondlane',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $trabalhadorUser2->assignRole('trabalhador');

        Trabalhador::firstOrCreate(
            ['numero_funcionario' => 'COR004'],
            [
                'user_id' => $trabalhadorUser2->id,
                'nome_completo' => 'Fátima Mondlane',
                'departamento' => 'Operações',
                'cargo' => 'Técnica de Manutenção',
                'categoria' => 'nao_lider',
                'data_admissao' => '2021-04-20',
                'is_lider' => false,
                'nivel_lideranca' => 'nao_lider',
                'superior_directo_id' => $trabalhadorSupervisor->id,
            ]
        );

        // Criar mais trabalhadores para ter dados de teste completos
        $trabalhadorUser3 = User::firstOrCreate(
            ['email' => 'motorista@cornelder.co.mz'],
            [
                'name' => 'Carlos Nhantumbo',
                'password' => Hash::make('password'),
                'is_active' => true,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]
        );
        $trabalhadorUser3->assignRole('trabalhador');

        Trabalhador::firstOrCreate(
            ['numero_funcionario' => 'COR005'],
            [
                'user_id' => $trabalhadorUser3->id,
                'nome_completo' => 'Carlos Nhantumbo',
                'departamento' => 'Operações',
                'cargo' => 'Motorista',
                'categoria' => 'nao_lider',
                'data_admissao' => '2019-08-15',
                'is_lider' => false,
                'nivel_lideranca' => 'nao_lider',
                'superior_directo_id' => $trabalhadorSupervisor->id,
            ]
        );

        $this->command->info('Utilizadores de teste criados:');
        $this->command->table(
            ['Email', 'Papel', 'Password'],
            [
                ['admin@cornelder.co.mz', 'admin', 'password'],
                ['rh@cornelder.co.mz', 'gestor-rh', 'password'],
                ['chefe.operacoes@cornelder.co.mz', 'chefe-departamento', 'password'],
                ['supervisor.logistica@cornelder.co.mz', 'avaliador', 'password'],
                ['operador@cornelder.co.mz', 'trabalhador', 'password'],
                ['tecnico@cornelder.co.mz', 'trabalhador', 'password'],
                ['motorista@cornelder.co.mz', 'trabalhador', 'password'],
            ]
        );
    }
}
