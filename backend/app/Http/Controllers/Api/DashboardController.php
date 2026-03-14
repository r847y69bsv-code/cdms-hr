<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Avaliacao;
use App\Models\CicloAvaliacao;
use App\Models\Trabalhador;
use App\Models\Contestacao;
use App\Models\PlanoMelhoria;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Dashboard do trabalhador
     */
    public function trabalhador(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();

        if (!$trabalhador) {
            return response()->json([
                'message' => 'Perfil de trabalhador não encontrado.',
                'data' => null
            ]);
        }

        // Ciclo activo
        $cicloActivo = CicloAvaliacao::whereIn('estado', [
            CicloAvaliacao::ESTADO_AUTOAVALIACAO,
            CicloAvaliacao::ESTADO_AVALIACAO,
            CicloAvaliacao::ESTADO_REVISAO,
        ])->first();

        // Avaliação actual
        $avaliacaoActual = null;
        if ($cicloActivo) {
            $avaliacaoActual = Avaliacao::where('ciclo_id', $cicloActivo->id)
                ->where('trabalhador_id', $trabalhador->id)
                ->with(['ciclo', 'itens.indicador'])
                ->first();
        }

        // Histórico de avaliações
        $historico = Avaliacao::where('trabalhador_id', $trabalhador->id)
            ->with('ciclo')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Planos de melhoria activos
        $planosMelhoria = PlanoMelhoria::whereHas('avaliacao', function ($q) use ($trabalhador) {
            $q->where('trabalhador_id', $trabalhador->id);
        })
        ->whereIn('estado', [PlanoMelhoria::ESTADO_PLANEADO, PlanoMelhoria::ESTADO_EM_CURSO])
        ->count();

        // Contestações pendentes
        $contestacoesPendentes = Contestacao::whereHas('avaliacao', function ($q) use ($trabalhador) {
            $q->where('trabalhador_id', $trabalhador->id);
        })
        ->whereIn('estado', [Contestacao::ESTADO_PENDENTE, Contestacao::ESTADO_EM_ANALISE])
        ->count();

        return response()->json([
            'data' => [
                'trabalhador' => $trabalhador,
                'ciclo_activo' => $cicloActivo,
                'avaliacao_actual' => $avaliacaoActual,
                'historico' => $historico,
                'planos_melhoria_activos' => $planosMelhoria,
                'contestacoes_pendentes' => $contestacoesPendentes,
            ]
        ]);
    }

    /**
     * Dashboard do avaliador
     */
    public function avaliador(): JsonResponse
    {
        // Ciclo activo
        $cicloActivo = CicloAvaliacao::whereIn('estado', [
            CicloAvaliacao::ESTADO_AUTOAVALIACAO,
            CicloAvaliacao::ESTADO_AVALIACAO,
            CicloAvaliacao::ESTADO_REVISAO,
        ])->first();

        // Avaliações pendentes
        $avaliacoesPendentes = Avaliacao::where('avaliador_id', auth()->id())
            ->whereIn('estado', [
                Avaliacao::ESTADO_AUTO_SUBMETIDA,
                Avaliacao::ESTADO_AVAL_RASCUNHO,
            ])
            ->count();

        // Total da equipa
        $totalEquipa = Avaliacao::where('avaliador_id', auth()->id())
            ->when($cicloActivo, function ($q) use ($cicloActivo) {
                $q->where('ciclo_id', $cicloActivo->id);
            })
            ->count();

        // Avaliações concluídas
        $avaliacoesConcluidas = Avaliacao::where('avaliador_id', auth()->id())
            ->when($cicloActivo, function ($q) use ($cicloActivo) {
                $q->where('ciclo_id', $cicloActivo->id);
            })
            ->whereNotIn('estado', [
                Avaliacao::ESTADO_RASCUNHO,
                Avaliacao::ESTADO_AUTO_SUBMETIDA,
                Avaliacao::ESTADO_AVAL_RASCUNHO,
            ])
            ->count();

        // Distribuição por classificação
        $distribuicaoClassificacao = Avaliacao::where('avaliador_id', auth()->id())
            ->whereNotNull('classificacao_final')
            ->select('classificacao_final', DB::raw('count(*) as total'))
            ->groupBy('classificacao_final')
            ->get()
            ->pluck('total', 'classificacao_final');

        // Planos de melhoria a vencer
        $planosAVencer = PlanoMelhoria::whereHas('avaliacao', function ($q) {
            $q->where('avaliador_id', auth()->id());
        })
        ->whereIn('estado', [PlanoMelhoria::ESTADO_PLANEADO, PlanoMelhoria::ESTADO_EM_CURSO])
        ->where('prazo', '<=', now()->addDays(30))
        ->where('prazo', '>=', now())
        ->count();

        return response()->json([
            'data' => [
                'ciclo_activo' => $cicloActivo,
                'avaliacoes_pendentes' => $avaliacoesPendentes,
                'total_equipa' => $totalEquipa,
                'avaliacoes_concluidas' => $avaliacoesConcluidas,
                'progresso' => $totalEquipa > 0 ? round(($avaliacoesConcluidas / $totalEquipa) * 100) : 0,
                'distribuicao_classificacao' => $distribuicaoClassificacao,
                'planos_a_vencer' => $planosAVencer,
            ]
        ]);
    }

    /**
     * Dashboard do chefe de departamento
     */
    public function departamento(): JsonResponse
    {
        $trabalhador = Trabalhador::where('user_id', auth()->id())->first();
        $departamento = $trabalhador?->departamento;

        if (!$departamento) {
            return response()->json([
                'message' => 'Departamento não encontrado.',
                'data' => null
            ]);
        }

        // Ciclo activo
        $cicloActivo = CicloAvaliacao::whereIn('estado', [
            CicloAvaliacao::ESTADO_AUTOAVALIACAO,
            CicloAvaliacao::ESTADO_AVALIACAO,
            CicloAvaliacao::ESTADO_REVISAO,
        ])->first();

        // Avaliações do departamento
        $avaliacoesDepartamento = Avaliacao::whereHas('trabalhador', function ($q) use ($departamento) {
            $q->where('departamento', $departamento);
        })
        ->when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        });

        $totalDepartamento = $avaliacoesDepartamento->count();

        // Por estado
        $porEstado = (clone $avaliacoesDepartamento)
            ->select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get()
            ->pluck('total', 'estado');

        // Pendentes de revisão departamental
        $pendentesRevisao = Avaliacao::whereHas('trabalhador', function ($q) use ($departamento) {
            $q->where('departamento', $departamento);
        })
        ->where('estado', Avaliacao::ESTADO_AVAL_SUBMETIDA)
        ->count();

        // Média de pontuações
        $mediaPontuacao = Avaliacao::whereHas('trabalhador', function ($q) use ($departamento) {
            $q->where('departamento', $departamento);
        })
        ->whereNotNull('pontuacao_final')
        ->avg('pontuacao_final');

        // Distribuição por classificação
        $distribuicaoClassificacao = Avaliacao::whereHas('trabalhador', function ($q) use ($departamento) {
            $q->where('departamento', $departamento);
        })
        ->whereNotNull('classificacao_final')
        ->select('classificacao_final', DB::raw('count(*) as total'))
        ->groupBy('classificacao_final')
        ->get()
        ->pluck('total', 'classificacao_final');

        return response()->json([
            'data' => [
                'departamento' => $departamento,
                'ciclo_activo' => $cicloActivo,
                'total_departamento' => $totalDepartamento,
                'por_estado' => $porEstado,
                'pendentes_revisao' => $pendentesRevisao,
                'media_pontuacao' => round($mediaPontuacao, 2),
                'distribuicao_classificacao' => $distribuicaoClassificacao,
            ]
        ]);
    }

    /**
     * Dashboard de RH
     */
    public function rh(): JsonResponse
    {
        // Ciclos
        $cicloActivo = CicloAvaliacao::whereIn('estado', [
            CicloAvaliacao::ESTADO_AUTOAVALIACAO,
            CicloAvaliacao::ESTADO_AVALIACAO,
            CicloAvaliacao::ESTADO_REVISAO,
        ])->first();

        // Totais gerais
        $totalTrabalhadores = Trabalhador::count();
        $totalAvaliacoes = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })->count();

        // Avaliações por estado
        $porEstado = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })
        ->select('estado', DB::raw('count(*) as total'))
        ->groupBy('estado')
        ->get()
        ->pluck('total', 'estado');

        // Pendentes de revisão RH
        $pendentesRH = Avaliacao::where('estado', Avaliacao::ESTADO_REV_RH)->count();

        // Contestações pendentes
        $contestacoesPendentes = Contestacao::whereIn('estado', [
            Contestacao::ESTADO_PENDENTE,
            Contestacao::ESTADO_EM_ANALISE,
        ])->count();

        // Média global
        $mediaGlobal = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })
        ->whereNotNull('pontuacao_final')
        ->avg('pontuacao_final');

        // Distribuição por classificação
        $distribuicaoClassificacao = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })
        ->whereNotNull('classificacao_final')
        ->select('classificacao_final', DB::raw('count(*) as total'))
        ->groupBy('classificacao_final')
        ->get()
        ->pluck('total', 'classificacao_final');

        // Por departamento
        $porDepartamento = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })
        ->join('trabalhadores', 'avaliacoes.trabalhador_id', '=', 'trabalhadores.id')
        ->select('trabalhadores.departamento', DB::raw('count(*) as total'), DB::raw('avg(pontuacao_final) as media'))
        ->groupBy('trabalhadores.departamento')
        ->get();

        // Progresso geral
        $concluidas = Avaliacao::when($cicloActivo, function ($q) use ($cicloActivo) {
            $q->where('ciclo_id', $cicloActivo->id);
        })
        ->whereIn('estado', [
            Avaliacao::ESTADO_APROVADA,
            Avaliacao::ESTADO_FEEDBACK_FEITO,
        ])->count();

        return response()->json([
            'data' => [
                'ciclo_activo' => $cicloActivo,
                'total_trabalhadores' => $totalTrabalhadores,
                'total_avaliacoes' => $totalAvaliacoes,
                'por_estado' => $porEstado,
                'pendentes_rh' => $pendentesRH,
                'contestacoes_pendentes' => $contestacoesPendentes,
                'media_global' => round($mediaGlobal, 2),
                'distribuicao_classificacao' => $distribuicaoClassificacao,
                'por_departamento' => $porDepartamento,
                'progresso' => $totalAvaliacoes > 0 ? round(($concluidas / $totalAvaliacoes) * 100) : 0,
            ]
        ]);
    }

    /**
     * Dashboard de administração
     */
    public function admin(): JsonResponse
    {
        // Utilizadores
        $totalUtilizadores = \App\Models\User::count();
        $utilizadoresActivos = \App\Models\User::where('is_active', true)->count();

        // Trabalhadores
        $totalTrabalhadores = Trabalhador::count();
        $trabalhadoresSemUser = Trabalhador::whereNull('user_id')->count();

        // Ciclos
        $totalCiclos = CicloAvaliacao::count();
        $cicloActivo = CicloAvaliacao::whereNotIn('estado', [
            CicloAvaliacao::ESTADO_PLANEADO,
            CicloAvaliacao::ESTADO_CONCLUIDO,
        ])->first();

        // Avaliações
        $totalAvaliacoes = Avaliacao::count();

        // Últimas actividades
        $ultimasActividades = \Spatie\Activitylog\Models\Activity::with('causer')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'data' => [
                'total_utilizadores' => $totalUtilizadores,
                'utilizadores_activos' => $utilizadoresActivos,
                'total_trabalhadores' => $totalTrabalhadores,
                'trabalhadores_sem_user' => $trabalhadoresSemUser,
                'total_ciclos' => $totalCiclos,
                'ciclo_activo' => $cicloActivo,
                'total_avaliacoes' => $totalAvaliacoes,
                'ultimas_actividades' => $ultimasActividades,
            ]
        ]);
    }
}
