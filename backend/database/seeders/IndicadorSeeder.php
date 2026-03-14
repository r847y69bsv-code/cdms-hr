<?php

namespace Database\Seeders;

use App\Models\Indicador;
use Illuminate\Database\Seeder;

class IndicadorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Indicadores de avaliação conforme Ordem de Serviço N.º 13 de 2025
     */
    public function run(): void
    {
        $indicadores = [
            [
                'codigo' => 'qualidade',
                'nome' => 'Qualidade do Trabalho',
                'descricao' => 'Avalia a precisão, rigor e excelência no cumprimento das tarefas atribuídas. Considera a atenção aos detalhes, a conformidade com os padrões estabelecidos e a ausência de erros.',
                'ordem' => 1,
                'activo' => true,
            ],
            [
                'codigo' => 'produtividade',
                'nome' => 'Produtividade',
                'descricao' => 'Mede o volume de trabalho realizado dentro dos prazos estabelecidos. Avalia a capacidade de gerir múltiplas tarefas, cumprir metas e optimizar o uso do tempo.',
                'ordem' => 2,
                'activo' => true,
            ],
            [
                'codigo' => 'responsabilidade',
                'nome' => 'Responsabilidade e Compromisso',
                'descricao' => 'Avalia o grau de comprometimento com as funções, a iniciativa demonstrada, a capacidade de assumir responsabilidades e a proactividade na resolução de problemas.',
                'ordem' => 3,
                'activo' => true,
            ],
            [
                'codigo' => 'assiduidade',
                'nome' => 'Assiduidade e Pontualidade',
                'descricao' => 'Considera a regularidade da presença no trabalho, o cumprimento dos horários estabelecidos e a gestão adequada de ausências justificadas.',
                'ordem' => 4,
                'activo' => true,
            ],
            [
                'codigo' => 'conhecimentos',
                'nome' => 'Conhecimentos Técnicos',
                'descricao' => 'Avalia o domínio das competências técnicas necessárias para a função, a actualização contínua de conhecimentos e a capacidade de aplicar conhecimentos na prática.',
                'ordem' => 5,
                'activo' => true,
            ],
            [
                'codigo' => 'relacionamento',
                'nome' => 'Relacionamento Interpessoal',
                'descricao' => 'Mede a capacidade de trabalhar em equipa, comunicar eficazmente, colaborar com colegas e manter relações profissionais positivas.',
                'ordem' => 6,
                'activo' => true,
            ],
        ];

        foreach ($indicadores as $indicador) {
            Indicador::firstOrCreate(
                ['codigo' => $indicador['codigo']],
                $indicador
            );
        }

        $this->command->info('Indicadores criados: ' . count($indicadores));
    }
}
