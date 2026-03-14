<?php

namespace Database\Seeders;

use App\Models\Indicador;
use App\Models\MatrizPesos;
use Illuminate\Database\Seeder;

class MatrizPesosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Matriz de pesos conforme Ordem de Serviço N.º 13 de 2025
     * Os pesos variam conforme o nível de liderança do trabalhador
     */
    public function run(): void
    {
        // Buscar indicadores
        $indicadores = Indicador::pluck('id', 'codigo');

        if ($indicadores->isEmpty()) {
            $this->command->error('Indicadores não encontrados. Execute IndicadorSeeder primeiro.');
            return;
        }

        // Definição das categorias com descrições
        $categorias = [
            'nao_lider' => 'Trabalhador sem funções de liderança',
            'supervisor' => 'Supervisor de equipa',
            'chefe_seccao' => 'Chefe de Secção',
            'chefe_departamento' => 'Chefe de Departamento',
            'director' => 'Director',
            'director_geral' => 'Director Geral',
        ];

        // Matriz de pesos (percentagens que somam 100% por categoria)
        // Formato: [qualidade, produtividade, responsabilidade, assiduidade, conhecimentos, relacionamento]
        $pesos = [
            'nao_lider' => [
                'qualidade' => 20.00,
                'produtividade' => 20.00,
                'responsabilidade' => 15.00,
                'assiduidade' => 20.00,
                'conhecimentos' => 15.00,
                'relacionamento' => 10.00,
            ],
            'supervisor' => [
                'qualidade' => 18.00,
                'produtividade' => 18.00,
                'responsabilidade' => 18.00,
                'assiduidade' => 15.00,
                'conhecimentos' => 16.00,
                'relacionamento' => 15.00,
            ],
            'chefe_seccao' => [
                'qualidade' => 17.00,
                'produtividade' => 17.00,
                'responsabilidade' => 20.00,
                'assiduidade' => 12.00,
                'conhecimentos' => 17.00,
                'relacionamento' => 17.00,
            ],
            'chefe_departamento' => [
                'qualidade' => 15.00,
                'produtividade' => 15.00,
                'responsabilidade' => 22.00,
                'assiduidade' => 10.00,
                'conhecimentos' => 18.00,
                'relacionamento' => 20.00,
            ],
            'director' => [
                'qualidade' => 15.00,
                'produtividade' => 15.00,
                'responsabilidade' => 25.00,
                'assiduidade' => 8.00,
                'conhecimentos' => 17.00,
                'relacionamento' => 20.00,
            ],
            'director_geral' => [
                'qualidade' => 15.00,
                'produtividade' => 12.00,
                'responsabilidade' => 28.00,
                'assiduidade' => 5.00,
                'conhecimentos' => 15.00,
                'relacionamento' => 25.00,
            ],
        ];

        $count = 0;

        foreach ($pesos as $categoria => $indicadoresPesos) {
            foreach ($indicadoresPesos as $codigoIndicador => $peso) {
                MatrizPesos::firstOrCreate(
                    [
                        'categoria' => $categoria,
                        'indicador_id' => $indicadores[$codigoIndicador],
                    ],
                    [
                        'peso' => $peso,
                        'descricao_categoria' => $categorias[$categoria],
                    ]
                );
                $count++;
            }
        }

        $this->command->info("Matriz de pesos criada: {$count} registos (6 categorias x 6 indicadores)");
    }
}
