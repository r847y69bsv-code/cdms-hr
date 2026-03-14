<?php

namespace App\Services;

use App\Models\Avaliacao;
use App\Models\User;
use App\Models\Contestacao;
use App\Models\PlanoMelhoria;
use App\Models\CicloAvaliacao;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class NotificacaoService
{
    /**
     * Tipos de notificação
     */
    const TIPO_AVALIACAO_INICIADA = 'avaliacao_iniciada';
    const TIPO_AUTOAVALIACAO_SUBMETIDA = 'autoavaliacao_submetida';
    const TIPO_AVALIACAO_SUBMETIDA = 'avaliacao_submetida';
    const TIPO_AVALIACAO_DEVOLVIDA = 'avaliacao_devolvida';
    const TIPO_AVALIACAO_APROVADA = 'avaliacao_aprovada';
    const TIPO_FEEDBACK_PENDENTE = 'feedback_pendente';
    const TIPO_CONTESTACAO_CRIADA = 'contestacao_criada';
    const TIPO_CONTESTACAO_RESPONDIDA = 'contestacao_respondida';
    const TIPO_CICLO_INICIADO = 'ciclo_iniciado';
    const TIPO_PRAZO_PROXIMO = 'prazo_proximo';
    const TIPO_PLANO_MELHORIA_CRIADO = 'plano_melhoria_criado';
    const TIPO_PLANO_MELHORIA_VENCER = 'plano_melhoria_vencer';

    /**
     * Notificar transição de estado de avaliação
     */
    public function notificarTransicaoEstado(Avaliacao $avaliacao, string $estadoAnterior, string $novoEstado): void
    {
        $avaliacao->load(['trabalhador.user', 'avaliador', 'revisorDepartamental', 'revisorRH']);

        switch ($novoEstado) {
            case Avaliacao::ESTADO_AUTO_SUBMETIDA:
                // Notificar avaliador que tem uma autoavaliação para avaliar
                if ($avaliacao->avaliador) {
                    $this->criarNotificacao(
                        $avaliacao->avaliador,
                        self::TIPO_AUTOAVALIACAO_SUBMETIDA,
                        'Nova autoavaliação para avaliar',
                        "{$avaliacao->trabalhador->nome_completo} submeteu a sua autoavaliação.",
                        ['avaliacao_id' => $avaliacao->id]
                    );
                }
                break;

            case Avaliacao::ESTADO_AVAL_RASCUNHO:
                // Notificar trabalhador que a sua avaliação está a ser processada
                if ($avaliacao->trabalhador->user) {
                    $this->criarNotificacao(
                        $avaliacao->trabalhador->user,
                        self::TIPO_AVALIACAO_INICIADA,
                        'Avaliação iniciada',
                        'O seu avaliador começou a processar a sua avaliação.',
                        ['avaliacao_id' => $avaliacao->id]
                    );
                }
                break;

            case Avaliacao::ESTADO_AUTO_SUBMETIDA:
                // Devolvido ao trabalhador
                if ($estadoAnterior === Avaliacao::ESTADO_AVAL_RASCUNHO && $avaliacao->trabalhador->user) {
                    $this->criarNotificacao(
                        $avaliacao->trabalhador->user,
                        self::TIPO_AVALIACAO_DEVOLVIDA,
                        'Autoavaliação devolvida',
                        'A sua autoavaliação foi devolvida para revisão. Verifique as observações.',
                        ['avaliacao_id' => $avaliacao->id]
                    );
                }
                break;

            case Avaliacao::ESTADO_AVAL_SUBMETIDA:
                // Notificar para revisão departamental
                $this->notificarChefeDepartamento($avaliacao);
                break;

            case Avaliacao::ESTADO_REV_RH:
                // Notificar RH
                $this->notificarGestoresRH($avaliacao);
                break;

            case Avaliacao::ESTADO_APROVADA:
                // Notificar trabalhador e avaliador
                $this->notificarAprovacao($avaliacao);
                break;

            case Avaliacao::ESTADO_FEEDBACK_FEITO:
                // Notificar trabalhador
                if ($avaliacao->trabalhador->user) {
                    $this->criarNotificacao(
                        $avaliacao->trabalhador->user,
                        self::TIPO_FEEDBACK_PENDENTE,
                        'Feedback de avaliação disponível',
                        'O seu avaliador registou o feedback da sua avaliação.',
                        ['avaliacao_id' => $avaliacao->id]
                    );
                }
                break;
        }
    }

    /**
     * Notificar criação de contestação
     */
    public function notificarContestacaoCriada(Contestacao $contestacao): void
    {
        // Notificar gestores RH
        $gestoresRH = User::role('gestor-rh')->get();

        foreach ($gestoresRH as $gestor) {
            $this->criarNotificacao(
                $gestor,
                self::TIPO_CONTESTACAO_CRIADA,
                'Nova contestação de avaliação',
                "O trabalhador {$contestacao->avaliacao->trabalhador->nome_completo} contestou a sua avaliação.",
                [
                    'contestacao_id' => $contestacao->id,
                    'avaliacao_id' => $contestacao->avaliacao_id,
                ]
            );
        }
    }

    /**
     * Notificar resposta a contestação
     */
    public function notificarContestacaoRespondida(Contestacao $contestacao): void
    {
        $trabalhador = $contestacao->avaliacao->trabalhador;

        if ($trabalhador->user) {
            $estado = $contestacao->estado === Contestacao::ESTADO_ACEITE ? 'aceite' : 'rejeitada';

            $this->criarNotificacao(
                $trabalhador->user,
                self::TIPO_CONTESTACAO_RESPONDIDA,
                "Contestação {$estado}",
                "A sua contestação foi {$estado}. Verifique a resposta.",
                [
                    'contestacao_id' => $contestacao->id,
                    'avaliacao_id' => $contestacao->avaliacao_id,
                ]
            );
        }
    }

    /**
     * Notificar início de ciclo
     */
    public function notificarInicioCiclo(CicloAvaliacao $ciclo): void
    {
        // Notificar todos os utilizadores activos com trabalhador associado
        $users = User::where('is_active', true)
            ->whereHas('trabalhador')
            ->get();

        foreach ($users as $user) {
            $this->criarNotificacao(
                $user,
                self::TIPO_CICLO_INICIADO,
                'Novo ciclo de avaliação iniciado',
                "O ciclo de avaliação '{$ciclo->nome}' foi iniciado. Pode começar a sua autoavaliação.",
                ['ciclo_id' => $ciclo->id]
            );
        }
    }

    /**
     * Notificar prazo próximo
     */
    public function notificarPrazoProximo(CicloAvaliacao $ciclo, string $tipo, int $diasRestantes): void
    {
        $mensagens = [
            'autoavaliacao' => "Faltam {$diasRestantes} dias para o fim do período de autoavaliação.",
            'avaliacao' => "Faltam {$diasRestantes} dias para o fim do período de avaliação.",
            'revisao' => "Faltam {$diasRestantes} dias para o fim do período de revisão.",
        ];

        $users = User::where('is_active', true)
            ->whereHas('trabalhador')
            ->get();

        foreach ($users as $user) {
            $this->criarNotificacao(
                $user,
                self::TIPO_PRAZO_PROXIMO,
                'Prazo a aproximar-se',
                $mensagens[$tipo] ?? "Faltam {$diasRestantes} dias.",
                ['ciclo_id' => $ciclo->id, 'tipo' => $tipo]
            );
        }
    }

    /**
     * Notificar criação de plano de melhoria
     */
    public function notificarPlanoMelhoriaCriado(PlanoMelhoria $plano): void
    {
        $trabalhador = $plano->avaliacao->trabalhador;

        if ($trabalhador->user) {
            $this->criarNotificacao(
                $trabalhador->user,
                self::TIPO_PLANO_MELHORIA_CRIADO,
                'Novo plano de melhoria',
                "Foi criado um plano de melhoria para si: {$plano->area_melhoria}",
                [
                    'plano_id' => $plano->id,
                    'avaliacao_id' => $plano->avaliacao_id,
                ]
            );
        }
    }

    /**
     * Notificar plano de melhoria a vencer
     */
    public function notificarPlanoMelhoriaVencer(PlanoMelhoria $plano, int $diasRestantes): void
    {
        $trabalhador = $plano->avaliacao->trabalhador;
        $avaliador = $plano->avaliacao->avaliador;

        $mensagem = "O plano de melhoria '{$plano->area_melhoria}' vence em {$diasRestantes} dias.";

        if ($trabalhador->user) {
            $this->criarNotificacao(
                $trabalhador->user,
                self::TIPO_PLANO_MELHORIA_VENCER,
                'Prazo de plano de melhoria',
                $mensagem,
                ['plano_id' => $plano->id]
            );
        }

        if ($avaliador) {
            $this->criarNotificacao(
                $avaliador,
                self::TIPO_PLANO_MELHORIA_VENCER,
                'Prazo de plano de melhoria',
                $mensagem . " (Trabalhador: {$trabalhador->nome_completo})",
                ['plano_id' => $plano->id]
            );
        }
    }

    /**
     * Notificar chefe de departamento
     */
    protected function notificarChefeDepartamento(Avaliacao $avaliacao): void
    {
        $departamento = $avaliacao->trabalhador->departamento;

        // Encontrar chefe de departamento
        $chefes = User::role('chefe-departamento')
            ->whereHas('trabalhador', function ($q) use ($departamento) {
                $q->where('departamento', $departamento);
            })
            ->get();

        foreach ($chefes as $chefe) {
            $this->criarNotificacao(
                $chefe,
                self::TIPO_AVALIACAO_SUBMETIDA,
                'Avaliação pendente de revisão',
                "A avaliação de {$avaliacao->trabalhador->nome_completo} está pendente de revisão departamental.",
                ['avaliacao_id' => $avaliacao->id]
            );
        }
    }

    /**
     * Notificar gestores RH
     */
    protected function notificarGestoresRH(Avaliacao $avaliacao): void
    {
        $gestoresRH = User::role('gestor-rh')->get();

        foreach ($gestoresRH as $gestor) {
            $this->criarNotificacao(
                $gestor,
                self::TIPO_AVALIACAO_SUBMETIDA,
                'Avaliação pendente de aprovação RH',
                "A avaliação de {$avaliacao->trabalhador->nome_completo} está pendente de aprovação.",
                ['avaliacao_id' => $avaliacao->id]
            );
        }
    }

    /**
     * Notificar aprovação de avaliação
     */
    protected function notificarAprovacao(Avaliacao $avaliacao): void
    {
        // Notificar trabalhador
        if ($avaliacao->trabalhador->user) {
            $this->criarNotificacao(
                $avaliacao->trabalhador->user,
                self::TIPO_AVALIACAO_APROVADA,
                'Avaliação aprovada',
                "A sua avaliação foi aprovada com classificação: {$avaliacao->classificacao_final}",
                ['avaliacao_id' => $avaliacao->id]
            );
        }

        // Notificar avaliador
        if ($avaliacao->avaliador) {
            $this->criarNotificacao(
                $avaliacao->avaliador,
                self::TIPO_FEEDBACK_PENDENTE,
                'Feedback pendente',
                "A avaliação de {$avaliacao->trabalhador->nome_completo} foi aprovada. Por favor, agende o feedback.",
                ['avaliacao_id' => $avaliacao->id]
            );
        }
    }

    /**
     * Criar notificação no sistema
     */
    protected function criarNotificacao(User $user, string $tipo, string $titulo, string $mensagem, array $dados = []): void
    {
        try {
            $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\\Notifications\\' . ucfirst($tipo),
                'data' => [
                    'tipo' => $tipo,
                    'titulo' => $titulo,
                    'mensagem' => $mensagem,
                    'dados' => $dados,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao criar notificação: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'tipo' => $tipo,
            ]);
        }
    }

    /**
     * Marcar notificação como lida
     */
    public function marcarComoLida(User $user, string $notificacaoId): bool
    {
        $notificacao = $user->notifications()->find($notificacaoId);

        if ($notificacao) {
            $notificacao->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Marcar todas as notificações como lidas
     */
    public function marcarTodasComoLidas(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }

    /**
     * Obter notificações não lidas
     */
    public function obterNaoLidas(User $user, int $limite = 10): array
    {
        return $user->unreadNotifications()
            ->take($limite)
            ->get()
            ->map(function ($notificacao) {
                return [
                    'id' => $notificacao->id,
                    'tipo' => $notificacao->data['tipo'] ?? 'geral',
                    'titulo' => $notificacao->data['titulo'] ?? '',
                    'mensagem' => $notificacao->data['mensagem'] ?? '',
                    'dados' => $notificacao->data['dados'] ?? [],
                    'criada_em' => $notificacao->created_at,
                ];
            })
            ->toArray();
    }

    /**
     * Obter contagem de notificações não lidas
     */
    public function contarNaoLidas(User $user): int
    {
        return $user->unreadNotifications()->count();
    }
}
