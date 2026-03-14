<?php

namespace App\Services;

use App\Models\Avaliacao;
use App\Models\ItemAvaliacao;
use App\Models\Indicador;
use App\Models\MatrizPesos;
use App\Models\Trabalhador;
use App\Models\CicloAvaliacao;
use Illuminate\Support\Facades\DB;

class AvaliacaoService
{
    /**
     * Classificações e seus intervalos de pontuação
     */
    const CLASSIFICACOES = [
        ['min' => 4.5, 'max' => 5.0, 'classificacao' => 'Excelente', 'cor' => '#22c55e'],
        ['min' => 3.5, 'max' => 4.49, 'classificacao' => 'Muito Bom', 'cor' => '#3b82f6'],
        ['min' => 2.5, 'max' => 3.49, 'classificacao' => 'Bom', 'cor' => '#eab308'],
        ['min' => 1.5, 'max' => 2.49, 'classificacao' => 'Regular', 'cor' => '#f97316'],
        ['min' => 1.0, 'max' => 1.49, 'classificacao' => 'Insuficiente', 'cor' => '#ef4444'],
    ];

    /**
     * Criar uma nova avaliação para um trabalhador
     */
    public function criarAvaliacao(int $cicloId, int $trabalhadorId): Avaliacao
    {
        $trabalhador = Trabalhador::findOrFail($trabalhadorId);
        $ciclo = CicloAvaliacao::findOrFail($cicloId);

        // Verificar se já existe avaliação
        $avaliacaoExistente = Avaliacao::where('ciclo_id', $cicloId)
            ->where('trabalhador_id', $trabalhadorId)
            ->first();

        if ($avaliacaoExistente) {
            throw new \Exception('Já existe uma avaliação para este trabalhador neste ciclo.');
        }

        return DB::transaction(function () use ($cicloId, $trabalhador) {
            // Criar avaliação
            $avaliacao = Avaliacao::create([
                'ciclo_id' => $cicloId,
                'trabalhador_id' => $trabalhador->id,
                'avaliador_id' => $trabalhador->superiorDirecto?->user_id,
                'estado' => Avaliacao::ESTADO_RASCUNHO,
            ]);

            // Criar itens para cada indicador activo
            $this->criarItensAvaliacao($avaliacao, $trabalhador->categoria);

            return $avaliacao;
        });
    }

    /**
     * Criar itens de avaliação para cada indicador
     */
    public function criarItensAvaliacao(Avaliacao $avaliacao, string $categoria): void
    {
        $indicadores = Indicador::where('activo', true)
            ->orderBy('ordem')
            ->get();

        $pesos = MatrizPesos::where('categoria', $categoria)
            ->pluck('peso', 'indicador_id');

        foreach ($indicadores as $indicador) {
            ItemAvaliacao::create([
                'avaliacao_id' => $avaliacao->id,
                'indicador_id' => $indicador->id,
                'peso_aplicado' => $pesos[$indicador->id] ?? 0,
            ]);
        }
    }

    /**
     * Calcular pontuação da autoavaliação
     */
    public function calcularPontuacaoAuto(Avaliacao $avaliacao): float
    {
        $itens = $avaliacao->itens()->whereNotNull('pontuacao_auto')->get();

        if ($itens->isEmpty()) {
            return 0;
        }

        $somaPonderada = 0;
        $somaPesos = 0;

        foreach ($itens as $item) {
            if ($item->pontuacao_auto && $item->peso_aplicado > 0) {
                $somaPonderada += $item->pontuacao_auto * $item->peso_aplicado;
                $somaPesos += $item->peso_aplicado;
            }
        }

        if ($somaPesos == 0) {
            return 0;
        }

        // Calcular média ponderada (resultado já está na escala 1-5)
        $pontuacao = $somaPonderada / $somaPesos;

        // Actualizar avaliação
        $avaliacao->update(['pontuacao_auto' => round($pontuacao, 2)]);

        return round($pontuacao, 2);
    }

    /**
     * Calcular pontuação do avaliador
     */
    public function calcularPontuacaoAvaliador(Avaliacao $avaliacao): float
    {
        $itens = $avaliacao->itens()->whereNotNull('pontuacao_avaliador')->get();

        if ($itens->isEmpty()) {
            return 0;
        }

        $somaPonderada = 0;
        $somaPesos = 0;

        foreach ($itens as $item) {
            if ($item->pontuacao_avaliador && $item->peso_aplicado > 0) {
                // Actualizar pontuação ponderada no item
                $pontuacaoPonderada = ($item->pontuacao_avaliador * $item->peso_aplicado) / 100;
                $item->update([
                    'pontuacao_final' => $item->pontuacao_avaliador,
                    'pontuacao_ponderada' => round($pontuacaoPonderada, 2),
                ]);

                $somaPonderada += $item->pontuacao_avaliador * $item->peso_aplicado;
                $somaPesos += $item->peso_aplicado;
            }
        }

        if ($somaPesos == 0) {
            return 0;
        }

        $pontuacao = $somaPonderada / $somaPesos;

        // Actualizar avaliação
        $avaliacao->update(['pontuacao_avaliador' => round($pontuacao, 2)]);

        return round($pontuacao, 2);
    }

    /**
     * Calcular pontuação final e determinar classificação
     */
    public function calcularPontuacaoFinal(Avaliacao $avaliacao): array
    {
        // A pontuação final é a do avaliador (se existir) ou a autoavaliação
        $pontuacaoFinal = $avaliacao->pontuacao_avaliador ?? $avaliacao->pontuacao_auto;

        if (!$pontuacaoFinal) {
            return [
                'pontuacao' => null,
                'classificacao' => null,
            ];
        }

        $classificacao = $this->determinarClassificacao($pontuacaoFinal);

        $avaliacao->update([
            'pontuacao_final' => round($pontuacaoFinal, 2),
            'classificacao_final' => $classificacao,
        ]);

        return [
            'pontuacao' => round($pontuacaoFinal, 2),
            'classificacao' => $classificacao,
        ];
    }

    /**
     * Determinar classificação baseada na pontuação
     */
    public function determinarClassificacao(float $pontuacao): string
    {
        foreach (self::CLASSIFICACOES as $faixa) {
            if ($pontuacao >= $faixa['min'] && $pontuacao <= $faixa['max']) {
                return $faixa['classificacao'];
            }
        }

        return Avaliacao::CLASSIFICACAO_INSUFICIENTE;
    }

    /**
     * Obter cor da classificação
     */
    public function obterCorClassificacao(string $classificacao): string
    {
        foreach (self::CLASSIFICACOES as $faixa) {
            if ($faixa['classificacao'] === $classificacao) {
                return $faixa['cor'];
            }
        }

        return '#6b7280'; // Cinzento por defeito
    }

    /**
     * Recalcular todas as pontuações de uma avaliação
     */
    public function recalcularPontuacoes(Avaliacao $avaliacao): array
    {
        $pontuacaoAuto = $this->calcularPontuacaoAuto($avaliacao);
        $pontuacaoAvaliador = $this->calcularPontuacaoAvaliador($avaliacao);
        $resultado = $this->calcularPontuacaoFinal($avaliacao);

        return [
            'pontuacao_auto' => $pontuacaoAuto,
            'pontuacao_avaliador' => $pontuacaoAvaliador,
            'pontuacao_final' => $resultado['pontuacao'],
            'classificacao_final' => $resultado['classificacao'],
        ];
    }

    /**
     * Validar se a autoavaliação está completa
     */
    public function validarAutoavaliacaoCompleta(Avaliacao $avaliacao): array
    {
        $erros = [];
        $itens = $avaliacao->itens()->with('indicador')->get();

        foreach ($itens as $item) {
            if (!$item->pontuacao_auto) {
                $erros[] = "O indicador '{$item->indicador->nome}' não tem pontuação.";
            }
        }

        return [
            'valido' => empty($erros),
            'erros' => $erros,
        ];
    }

    /**
     * Validar se a avaliação do avaliador está completa
     */
    public function validarAvaliacaoCompleta(Avaliacao $avaliacao): array
    {
        $erros = [];
        $itens = $avaliacao->itens()->with('indicador')->get();

        foreach ($itens as $item) {
            if (!$item->pontuacao_avaliador) {
                $erros[] = "O indicador '{$item->indicador->nome}' não tem pontuação do avaliador.";
            }
        }

        return [
            'valido' => empty($erros),
            'erros' => $erros,
        ];
    }

    /**
     * Obter resumo da avaliação
     */
    public function obterResumo(Avaliacao $avaliacao): array
    {
        $avaliacao->load(['trabalhador', 'ciclo', 'itens.indicador']);

        $itensResumo = $avaliacao->itens->map(function ($item) {
            return [
                'indicador' => $item->indicador->nome,
                'codigo' => $item->indicador->codigo,
                'peso' => $item->peso_aplicado,
                'pontuacao_auto' => $item->pontuacao_auto,
                'pontuacao_avaliador' => $item->pontuacao_avaliador,
                'pontuacao_final' => $item->pontuacao_final,
                'pontuacao_ponderada' => $item->pontuacao_ponderada,
                'diferenca' => $item->pontuacao_avaliador && $item->pontuacao_auto
                    ? $item->pontuacao_avaliador - $item->pontuacao_auto
                    : null,
            ];
        });

        return [
            'avaliacao_id' => $avaliacao->id,
            'trabalhador' => $avaliacao->trabalhador->nome_completo,
            'ciclo' => $avaliacao->ciclo->nome,
            'estado' => $avaliacao->estado,
            'pontuacao_auto' => $avaliacao->pontuacao_auto,
            'pontuacao_avaliador' => $avaliacao->pontuacao_avaliador,
            'pontuacao_final' => $avaliacao->pontuacao_final,
            'classificacao_final' => $avaliacao->classificacao_final,
            'cor_classificacao' => $avaliacao->classificacao_final
                ? $this->obterCorClassificacao($avaliacao->classificacao_final)
                : null,
            'itens' => $itensResumo,
        ];
    }

    /**
     * Comparar autoavaliação com avaliação do avaliador
     */
    public function compararAvaliacoes(Avaliacao $avaliacao): array
    {
        $itens = $avaliacao->itens()
            ->with('indicador')
            ->whereNotNull('pontuacao_auto')
            ->whereNotNull('pontuacao_avaliador')
            ->get();

        $comparacoes = $itens->map(function ($item) {
            $diferenca = $item->pontuacao_avaliador - $item->pontuacao_auto;

            return [
                'indicador' => $item->indicador->nome,
                'pontuacao_auto' => $item->pontuacao_auto,
                'pontuacao_avaliador' => $item->pontuacao_avaliador,
                'diferenca' => $diferenca,
                'concordancia' => abs($diferenca) <= 1 ? 'Alta' : (abs($diferenca) <= 2 ? 'Média' : 'Baixa'),
            ];
        });

        $diferencaMedia = $itens->avg(function ($item) {
            return abs($item->pontuacao_avaliador - $item->pontuacao_auto);
        });

        return [
            'comparacoes' => $comparacoes,
            'diferenca_media' => round($diferencaMedia, 2),
            'diferenca_pontuacao_global' => round(
                ($avaliacao->pontuacao_avaliador ?? 0) - ($avaliacao->pontuacao_auto ?? 0),
                2
            ),
        ];
    }

    /**
     * Gerar estatísticas de um conjunto de avaliações
     */
    public function gerarEstatisticas(array $avaliacaoIds): array
    {
        $avaliacoes = Avaliacao::whereIn('id', $avaliacaoIds)
            ->whereNotNull('pontuacao_final')
            ->get();

        if ($avaliacoes->isEmpty()) {
            return [
                'total' => 0,
                'media' => null,
                'mediana' => null,
                'desvio_padrao' => null,
                'distribuicao' => [],
            ];
        }

        $pontuacoes = $avaliacoes->pluck('pontuacao_final')->sort()->values();

        // Calcular mediana
        $count = $pontuacoes->count();
        $mediana = $count % 2 === 0
            ? ($pontuacoes[$count / 2 - 1] + $pontuacoes[$count / 2]) / 2
            : $pontuacoes[floor($count / 2)];

        // Calcular desvio padrão
        $media = $pontuacoes->avg();
        $somaQuadrados = $pontuacoes->reduce(function ($carry, $item) use ($media) {
            return $carry + pow($item - $media, 2);
        }, 0);
        $desvioPadrao = sqrt($somaQuadrados / $count);

        // Distribuição por classificação
        $distribuicao = $avaliacoes->groupBy('classificacao_final')
            ->map->count();

        return [
            'total' => $count,
            'media' => round($media, 2),
            'mediana' => round($mediana, 2),
            'desvio_padrao' => round($desvioPadrao, 2),
            'minimo' => round($pontuacoes->min(), 2),
            'maximo' => round($pontuacoes->max(), 2),
            'distribuicao' => $distribuicao,
        ];
    }
}
