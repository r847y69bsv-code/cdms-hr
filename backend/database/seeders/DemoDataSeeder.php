<?php

namespace Database\Seeders;

use App\Models\CicloAvaliacao;
use App\Models\Avaliacao;
use App\Models\ItemAvaliacao;
use App\Models\Trabalhador;
use App\Models\Indicador;
use App\Models\MatrizPesos;
use App\Models\RegistoOneOnOne;
use App\Models\PlanoMelhoria;
use App\Models\Contestacao;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Criar ciclo de avaliação activo
        $ciclo = CicloAvaliacao::create([
            'ano' => 2025,
            'nome' => 'Avaliação Anual 2025',
            'descricao' => 'Ciclo de avaliação de desempenho anual conforme Ordem de Serviço N.º 13 de 2025',
            'data_inicio_autoavaliacao' => Carbon::now()->subDays(30),
            'data_fim_autoavaliacao' => Carbon::now()->addDays(15),
            'data_inicio_avaliacao' => Carbon::now()->addDays(16),
            'data_fim_avaliacao' => Carbon::now()->addDays(45),
            'data_inicio_revisao' => Carbon::now()->addDays(46),
            'data_fim_revisao' => Carbon::now()->addDays(60),
            'estado' => 'autoavaliacao',
            'criado_por' => 1,
        ]);

        $this->command->info("Ciclo criado: {$ciclo->nome} (Estado: {$ciclo->estado})");

        // Buscar trabalhadores e indicadores
        $trabalhadores = Trabalhador::all();
        $indicadores = Indicador::where('activo', true)->orderBy('ordem')->get();

        $contadorAutoSubmetidas = 0;
        $contadorAvalSubmetidas = 0;
        $contadorRevDepartamento = 0;
        $indice = 0;

        foreach ($trabalhadores as $trabalhador) {
            // Obter pesos para a categoria do trabalhador
            $pesos = MatrizPesos::where('categoria', $trabalhador->categoria)
                ->pluck('peso', 'indicador_id');

            // Definir estado baseado na posição do trabalhador
            $estadoInicial = 'rascunho';
            $dataSubmissaoAuto = null;
            $dataSubmissaoAvaliador = null;
            $dataRevisaoDepartamental = null;
            $revisorDepartamentalId = null;

            // Trabalhadores que reportam ao supervisor
            if ($trabalhador->superior_directo_id && !$trabalhador->is_lider) {
                // Alternar entre diferentes estados para ter dados de teste completos
                $estadoIndex = $indice % 3;

                if ($estadoIndex === 0) {
                    // Para o avaliador testar
                    $estadoInicial = 'auto_submetida';
                    $dataSubmissaoAuto = Carbon::now()->subDays(rand(1, 5));
                    $contadorAutoSubmetidas++;
                } elseif ($estadoIndex === 1) {
                    // Para o chefe de departamento testar
                    $estadoInicial = 'aval_submetida';
                    $dataSubmissaoAuto = Carbon::now()->subDays(rand(6, 10));
                    $dataSubmissaoAvaliador = Carbon::now()->subDays(rand(1, 3));
                    $contadorAvalSubmetidas++;
                } else {
                    // Para o RH testar
                    $estadoInicial = 'rev_departamento';
                    $dataSubmissaoAuto = Carbon::now()->subDays(rand(10, 15));
                    $dataSubmissaoAvaliador = Carbon::now()->subDays(rand(5, 8));
                    $dataRevisaoDepartamental = Carbon::now()->subDays(rand(1, 3));
                    $revisorDepartamentalId = 3; // Chefe departamento
                    $contadorRevDepartamento++;
                }
                $indice++;
            }

            // Criar avaliação
            $avaliacao = Avaliacao::create([
                'ciclo_id' => $ciclo->id,
                'trabalhador_id' => $trabalhador->id,
                'avaliador_id' => $trabalhador->superiorDirecto?->user_id,
                'estado' => $estadoInicial,
                'data_submissao_auto' => $dataSubmissaoAuto,
                'data_submissao_avaliador' => $dataSubmissaoAvaliador,
                'data_revisao_departamental' => $dataRevisaoDepartamental,
                'revisor_departamental_id' => $revisorDepartamentalId,
                'observacoes_revisor' => $revisorDepartamentalId ? 'Avaliação revista pelo departamento.' : null,
            ]);

            // Criar itens de avaliação
            foreach ($indicadores as $indicador) {
                $peso = $pesos[$indicador->id] ?? 0;

                // Gerar pontuação aleatória para demonstração
                $pontuacaoAuto = rand(3, 5);
                $pontAvaliador = in_array($estadoInicial, ['aval_submetida', 'rev_departamento']) ? rand(3, 5) : null;

                ItemAvaliacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'indicador_id' => $indicador->id,
                    'peso_aplicado' => $peso,
                    'pontuacao_auto' => $pontuacaoAuto,
                    'justificacao_auto' => $this->gerarJustificacao($indicador->codigo, $pontuacaoAuto),
                    'pontuacao_avaliador' => $pontAvaliador,
                    'justificacao_avaliador' => $pontAvaliador ? 'Concordo com a avaliação do colaborador.' : null,
                ]);
            }

            // Calcular pontuações
            $this->calcularPontuacaoAuto($avaliacao);

            if (in_array($estadoInicial, ['aval_submetida', 'rev_departamento'])) {
                $this->calcularPontuacaoAvaliador($avaliacao);
            }

            $this->command->info("  Avaliação criada para: {$trabalhador->nome_completo} [{$estadoInicial}]");
        }

        $this->command->info("  >> {$contadorAutoSubmetidas} avaliações aguardam avaliação do supervisor");
        $this->command->info("  >> {$contadorAvalSubmetidas} avaliações aguardam revisão departamental");
        $this->command->info("  >> {$contadorRevDepartamento} avaliações aguardam aprovação RH");

        // Criar avaliações com estados diferentes para demonstração
        $this->criarAvaliacoesVariadas($ciclo, $indicadores);

        $this->command->info('');
        $this->command->info('Dados de demonstração criados com sucesso!');
    }

    private function gerarJustificacao(string $codigo, int $pontuacao): string
    {
        $justificacoes = [
            'qualidade' => [
                5 => 'Trabalho sempre entregue com excelente qualidade e sem necessidade de revisões.',
                4 => 'Trabalho de boa qualidade com poucas correcções necessárias.',
                3 => 'Qualidade aceitável, cumpre os requisitos mínimos.',
            ],
            'produtividade' => [
                5 => 'Supera consistentemente as metas estabelecidas.',
                4 => 'Cumpre todas as metas dentro dos prazos.',
                3 => 'Atinge a maioria das metas definidas.',
            ],
            'responsabilidade' => [
                5 => 'Demonstra excelente compromisso e iniciativa em todas as tarefas.',
                4 => 'Assume responsabilidades de forma proactiva.',
                3 => 'Cumpre as responsabilidades atribuídas.',
            ],
            'assiduidade' => [
                5 => 'Presença exemplar, sem faltas injustificadas.',
                4 => 'Muito pontual e assíduo.',
                3 => 'Assiduidade e pontualidade aceitáveis.',
            ],
            'conhecimentos' => [
                5 => 'Domínio técnico excepcional e actualização constante.',
                4 => 'Bons conhecimentos técnicos para a função.',
                3 => 'Conhecimentos adequados para executar as tarefas.',
            ],
            'relacionamento' => [
                5 => 'Excelente capacidade de trabalho em equipa e comunicação.',
                4 => 'Bom relacionamento com colegas e superiores.',
                3 => 'Relacionamento profissional adequado.',
            ],
        ];

        return $justificacoes[$codigo][$pontuacao] ?? 'Desempenho dentro das expectativas.';
    }

    private function calcularPontuacaoAuto(Avaliacao $avaliacao): void
    {
        $itens = $avaliacao->itens;
        $totalPonderado = 0;
        $totalPeso = 0;

        foreach ($itens as $item) {
            if ($item->pontuacao_auto && $item->peso_aplicado) {
                $totalPonderado += ($item->pontuacao_auto * $item->peso_aplicado);
                $totalPeso += $item->peso_aplicado;
            }
        }

        if ($totalPeso > 0) {
            // Média ponderada: soma(pontuacao * peso) / soma(pesos)
            $pontuacao = round($totalPonderado / $totalPeso, 2);
            $avaliacao->update(['pontuacao_auto' => $pontuacao]);
        }
    }

    private function calcularPontuacaoAvaliador(Avaliacao $avaliacao): void
    {
        $itens = $avaliacao->itens;
        $totalPonderado = 0;
        $totalPeso = 0;

        foreach ($itens as $item) {
            if ($item->pontuacao_avaliador && $item->peso_aplicado) {
                $totalPonderado += ($item->pontuacao_avaliador * $item->peso_aplicado);
                $totalPeso += $item->peso_aplicado;
            }
        }

        if ($totalPeso > 0) {
            $pontuacao = round($totalPonderado / $totalPeso, 2);

            // Determinar classificação
            $classificacao = match (true) {
                $pontuacao >= 4.5 => 'Excelente',
                $pontuacao >= 3.5 => 'Muito Bom',
                $pontuacao >= 2.5 => 'Bom',
                $pontuacao >= 1.5 => 'Regular',
                default => 'Insuficiente',
            };

            $avaliacao->update([
                'pontuacao_avaliador' => $pontuacao,
                'pontuacao_final' => $pontuacao,
                'classificacao_final' => $classificacao,
            ]);
        }
    }

    private function criarAvaliacoesVariadas(CicloAvaliacao $ciclo, $indicadores): void
    {
        // Criar ciclo anterior com avaliações completas
        $cicloAnterior = CicloAvaliacao::create([
            'ano' => 2024,
            'nome' => 'Avaliação Anual 2024',
            'descricao' => 'Ciclo de avaliação de desempenho de 2024 (concluído)',
            'data_inicio_autoavaliacao' => Carbon::create(2024, 1, 15),
            'data_fim_autoavaliacao' => Carbon::create(2024, 2, 15),
            'data_inicio_avaliacao' => Carbon::create(2024, 2, 16),
            'data_fim_avaliacao' => Carbon::create(2024, 3, 15),
            'data_inicio_revisao' => Carbon::create(2024, 3, 16),
            'data_fim_revisao' => Carbon::create(2024, 4, 15),
            'estado' => 'concluido',
            'criado_por' => 1,
        ]);

        $this->command->info("Ciclo anterior criado: {$cicloAnterior->nome}");

        // Criar avaliações completas para o ciclo anterior
        $trabalhadores = Trabalhador::all();
        $estados = ['aprovada', 'feedback_feito'];
        $classificacoes = ['Excelente', 'Muito Bom', 'Bom', 'Regular'];

        foreach ($trabalhadores as $index => $trabalhador) {
            $pesos = MatrizPesos::where('categoria', $trabalhador->categoria)
                ->pluck('peso', 'indicador_id');

            $estado = $estados[$index % count($estados)];
            $classificacao = $classificacoes[$index % count($classificacoes)];
            $pontuacao = match($classificacao) {
                'Excelente' => round(rand(45, 50) / 10, 2),
                'Muito Bom' => round(rand(35, 44) / 10, 2),
                'Bom' => round(rand(25, 34) / 10, 2),
                'Regular' => round(rand(15, 24) / 10, 2),
                default => round(rand(10, 14) / 10, 2),
            };

            $avaliacao = Avaliacao::create([
                'ciclo_id' => $cicloAnterior->id,
                'trabalhador_id' => $trabalhador->id,
                'avaliador_id' => $trabalhador->superiorDirecto?->user_id,
                'revisor_departamental_id' => 3, // Chefe departamento
                'revisor_rh_id' => 2, // RH
                'estado' => $estado,
                'pontuacao_auto' => $pontuacao - 0.2,
                'pontuacao_avaliador' => $pontuacao,
                'pontuacao_final' => $pontuacao,
                'classificacao_final' => $classificacao,
                'data_submissao_auto' => Carbon::create(2024, 2, 10),
                'data_submissao_avaliador' => Carbon::create(2024, 3, 5),
                'data_revisao_departamental' => Carbon::create(2024, 3, 20),
                'data_revisao_rh' => Carbon::create(2024, 4, 5),
                'data_feedback' => $estado === 'feedback_feito' ? Carbon::create(2024, 4, 10) : null,
                'observacoes_trabalhador' => 'Considero ter tido um bom desempenho durante o período de avaliação.',
                'observacoes_avaliador' => 'O trabalhador demonstrou empenho e dedicação nas suas funções.',
            ]);

            // Criar itens com pontuações
            foreach ($indicadores as $indicador) {
                $peso = $pesos[$indicador->id] ?? 0;
                $pontAuto = rand(3, 5);
                $pontAval = rand(3, 5);

                ItemAvaliacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'indicador_id' => $indicador->id,
                    'peso_aplicado' => $peso,
                    'pontuacao_auto' => $pontAuto,
                    'justificacao_auto' => $this->gerarJustificacao($indicador->codigo, $pontAuto),
                    'pontuacao_avaliador' => $pontAval,
                    'justificacao_avaliador' => 'Concordo com a autoavaliação do colaborador.',
                    'pontuacao_final' => $pontAval,
                    'pontuacao_ponderada' => round($pontAval * $peso / 100, 2),
                ]);
            }

            // Criar registo one-on-one
            if ($trabalhador->superiorDirecto) {
                RegistoOneOnOne::create([
                    'avaliacao_id' => $avaliacao->id,
                    'data_reuniao' => Carbon::create(2024, 4, 8),
                    'duracao_minutos' => 45,
                    'topicos_discutidos' => "- Revisão do desempenho no período\n- Objectivos para o próximo ano\n- Necessidades de formação",
                    'accoes_acordadas' => "- Participar em formação de Excel avançado\n- Assumir mais responsabilidades no projecto X",
                    'notas_privadas' => 'Colaborador mostrou-se receptivo ao feedback.',
                    'criado_por' => $trabalhador->superiorDirecto->user_id,
                ]);
            }

            // Criar plano de melhoria
            PlanoMelhoria::create([
                'avaliacao_id' => $avaliacao->id,
                'area_melhoria' => 'Conhecimentos Técnicos',
                'objectivo' => 'Melhorar competências em ferramentas de análise de dados',
                'accoes' => "1. Completar curso de Excel Avançado\n2. Participar em workshop de Power BI\n3. Aplicar conhecimentos em projectos reais",
                'recursos_necessarios' => 'Inscrição em curso online, tempo para estudo',
                'prazo' => Carbon::now()->addMonths(3),
                'estado' => 'em_progresso',
                'progresso' => 60,
                'notas_acompanhamento' => 'Já completou 2 módulos do curso de Excel.',
            ]);

            // Criar contestações de teste (apenas para alguns trabalhadores)
            if ($index === 0 && $estado === 'aprovada') {
                // Contestação pendente
                Contestacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'motivo' => 'Discordância com pontuação de Produtividade',
                    'descricao' => 'Considero que a minha pontuação no indicador de Produtividade deveria ser superior, tendo em conta os resultados alcançados no último trimestre onde superei as metas em 15%.',
                    'estado' => Contestacao::ESTADO_PENDENTE,
                ]);
                $this->command->info("  >> Contestação pendente criada para: {$trabalhador->nome_completo}");
            } elseif ($index === 1 && $estado === 'feedback_feito') {
                // Contestação em análise
                Contestacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'motivo' => 'Desacordo com classificação final',
                    'descricao' => 'A classificação de "Bom" não reflecte o meu desempenho real. Apresentei melhorias significativas em todas as áreas avaliadas e cumpri todos os objectivos estabelecidos.',
                    'estado' => Contestacao::ESTADO_EM_ANALISE,
                ]);
                $this->command->info("  >> Contestação em análise criada para: {$trabalhador->nome_completo}");
            } elseif ($index === 2) {
                // Contestação já respondida (rejeitada)
                Contestacao::create([
                    'avaliacao_id' => $avaliacao->id,
                    'motivo' => 'Pontuação de Assiduidade incorrecta',
                    'descricao' => 'Não concordo com a pontuação atribuída no critério de Assiduidade. Apenas tive duas faltas justificadas durante todo o período de avaliação.',
                    'estado' => Contestacao::ESTADO_REJEITADA,
                    'resposta' => 'Após análise detalhada dos registos de assiduidade, verificamos que a pontuação atribuída está correcta e em conformidade com os critérios estabelecidos. As faltas justificadas são contabilizadas de acordo com o regulamento interno.',
                    'respondido_por' => 2,
                    'data_resposta' => Carbon::create(2024, 4, 20),
                ]);
                $this->command->info("  >> Contestação rejeitada criada para: {$trabalhador->nome_completo}");
            }
        }
    }
}
