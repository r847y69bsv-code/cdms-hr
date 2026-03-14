<?php

namespace App\Services;

use App\Models\Avaliacao;
use App\Models\User;
use App\Models\Trabalhador;
use Illuminate\Support\Facades\Auth;

class WorkflowService
{
    /**
     * Definição da máquina de estados
     * Formato: estado_actual => [estados_permitidos => [roles_permitidos]]
     */
    const TRANSICOES = [
        Avaliacao::ESTADO_RASCUNHO => [
            Avaliacao::ESTADO_AUTO_SUBMETIDA => ['trabalhador', 'avaliador', 'chefe-departamento', 'admin'],
        ],
        Avaliacao::ESTADO_AUTO_SUBMETIDA => [
            Avaliacao::ESTADO_AVAL_RASCUNHO => ['avaliador', 'chefe-departamento', 'admin'],
        ],
        Avaliacao::ESTADO_AVAL_RASCUNHO => [
            Avaliacao::ESTADO_AVAL_SUBMETIDA => ['avaliador', 'chefe-departamento', 'admin'],
            Avaliacao::ESTADO_AUTO_SUBMETIDA => ['avaliador', 'chefe-departamento', 'admin'], // Devolver ao trabalhador
        ],
        Avaliacao::ESTADO_AVAL_SUBMETIDA => [
            Avaliacao::ESTADO_REV_DEPARTAMENTO => ['chefe-departamento', 'admin'],
            Avaliacao::ESTADO_AVAL_RASCUNHO => ['chefe-departamento', 'admin'], // Devolver ao avaliador
        ],
        Avaliacao::ESTADO_REV_DEPARTAMENTO => [
            Avaliacao::ESTADO_REV_RH => ['gestor-rh', 'admin'],
            Avaliacao::ESTADO_AVAL_SUBMETIDA => ['chefe-departamento', 'admin'], // Devolver
        ],
        Avaliacao::ESTADO_REV_RH => [
            Avaliacao::ESTADO_APROVADA => ['gestor-rh', 'admin'],
            Avaliacao::ESTADO_REV_DEPARTAMENTO => ['gestor-rh', 'admin'], // Devolver
        ],
        Avaliacao::ESTADO_APROVADA => [
            Avaliacao::ESTADO_FEEDBACK_FEITO => ['avaliador', 'chefe-departamento', 'admin'],
            Avaliacao::ESTADO_CONTESTADA => ['trabalhador', 'avaliador', 'chefe-departamento', 'admin'],
        ],
        Avaliacao::ESTADO_FEEDBACK_FEITO => [
            Avaliacao::ESTADO_CONTESTADA => ['trabalhador', 'avaliador', 'chefe-departamento', 'admin'],
        ],
        Avaliacao::ESTADO_CONTESTADA => [
            Avaliacao::ESTADO_REV_RH => ['gestor-rh', 'admin'], // Aceitar contestação
            Avaliacao::ESTADO_FEEDBACK_FEITO => ['gestor-rh', 'admin'], // Rejeitar contestação
        ],
    ];

    /**
     * Nomes amigáveis dos estados
     */
    const NOMES_ESTADOS = [
        Avaliacao::ESTADO_RASCUNHO => 'Rascunho',
        Avaliacao::ESTADO_AUTO_SUBMETIDA => 'Autoavaliação Submetida',
        Avaliacao::ESTADO_AVAL_RASCUNHO => 'Em Avaliação',
        Avaliacao::ESTADO_AVAL_SUBMETIDA => 'Avaliação Submetida',
        Avaliacao::ESTADO_REV_DEPARTAMENTO => 'Revisão Departamental',
        Avaliacao::ESTADO_REV_RH => 'Revisão RH',
        Avaliacao::ESTADO_APROVADA => 'Aprovada',
        Avaliacao::ESTADO_FEEDBACK_FEITO => 'Feedback Concluído',
        Avaliacao::ESTADO_CONTESTADA => 'Contestada',
    ];

    /**
     * Cores dos estados para UI
     */
    const CORES_ESTADOS = [
        Avaliacao::ESTADO_RASCUNHO => '#6b7280', // Cinzento
        Avaliacao::ESTADO_AUTO_SUBMETIDA => '#3b82f6', // Azul
        Avaliacao::ESTADO_AVAL_RASCUNHO => '#f97316', // Laranja
        Avaliacao::ESTADO_AVAL_SUBMETIDA => '#8b5cf6', // Roxo
        Avaliacao::ESTADO_REV_DEPARTAMENTO => '#ec4899', // Rosa
        Avaliacao::ESTADO_REV_RH => '#14b8a6', // Teal
        Avaliacao::ESTADO_APROVADA => '#22c55e', // Verde
        Avaliacao::ESTADO_FEEDBACK_FEITO => '#10b981', // Esmeralda
        Avaliacao::ESTADO_CONTESTADA => '#ef4444', // Vermelho
    ];

    protected AvaliacaoService $avaliacaoService;
    protected NotificacaoService $notificacaoService;

    public function __construct(AvaliacaoService $avaliacaoService, NotificacaoService $notificacaoService)
    {
        $this->avaliacaoService = $avaliacaoService;
        $this->notificacaoService = $notificacaoService;
    }

    /**
     * Verificar se uma transição é válida
     */
    public function podeTransitar(Avaliacao $avaliacao, string $novoEstado, ?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return false;
        }

        $estadoActual = $avaliacao->estado;

        // Verificar se a transição existe
        if (!isset(self::TRANSICOES[$estadoActual][$novoEstado])) {
            return false;
        }

        // Verificar se o utilizador tem role permitido
        $rolesPermitidos = self::TRANSICOES[$estadoActual][$novoEstado];

        return $user->hasAnyRole($rolesPermitidos);
    }

    /**
     * Obter transições disponíveis para o utilizador actual
     */
    public function transicoesDisponiveis(Avaliacao $avaliacao, ?User $user = null): array
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return [];
        }

        $estadoActual = $avaliacao->estado;
        $transicoes = [];

        if (!isset(self::TRANSICOES[$estadoActual])) {
            return [];
        }

        foreach (self::TRANSICOES[$estadoActual] as $novoEstado => $rolesPermitidos) {
            if ($user->hasAnyRole($rolesPermitidos)) {
                $transicoes[] = [
                    'estado' => $novoEstado,
                    'nome' => self::NOMES_ESTADOS[$novoEstado] ?? $novoEstado,
                    'cor' => self::CORES_ESTADOS[$novoEstado] ?? '#6b7280',
                    'accao' => $this->obterAccao($estadoActual, $novoEstado),
                ];
            }
        }

        return $transicoes;
    }

    /**
     * Executar transição de estado
     */
    public function transitar(Avaliacao $avaliacao, string $novoEstado, ?User $user = null, ?string $observacao = null): array
    {
        $user = $user ?? Auth::user();

        if (!$this->podeTransitar($avaliacao, $novoEstado, $user)) {
            return [
                'sucesso' => false,
                'mensagem' => 'Não tem permissão para realizar esta transição.',
            ];
        }

        $estadoAnterior = $avaliacao->estado;

        // Executar acções antes da transição
        $resultado = $this->executarAccoesPreTransicao($avaliacao, $novoEstado);
        if (!$resultado['sucesso']) {
            return $resultado;
        }

        // Actualizar estado
        $dadosActualizacao = ['estado' => $novoEstado];

        // Actualizar timestamps conforme o estado
        $dadosActualizacao = array_merge($dadosActualizacao, $this->obterTimestamps($novoEstado));

        // Actualizar revisores conforme o estado
        $dadosActualizacao = array_merge($dadosActualizacao, $this->obterRevisores($novoEstado, $user));

        // Adicionar observação se fornecida
        if ($observacao) {
            $campoObservacao = $this->obterCampoObservacao($novoEstado);
            if ($campoObservacao) {
                $dadosActualizacao[$campoObservacao] = $observacao;
            }
        }

        $avaliacao->update($dadosActualizacao);

        // Executar acções após a transição
        $this->executarAccoesPosTransicao($avaliacao, $estadoAnterior, $novoEstado);

        return [
            'sucesso' => true,
            'mensagem' => 'Estado alterado para: ' . (self::NOMES_ESTADOS[$novoEstado] ?? $novoEstado),
            'estado_anterior' => $estadoAnterior,
            'estado_actual' => $novoEstado,
        ];
    }

    /**
     * Executar acções antes da transição
     */
    protected function executarAccoesPreTransicao(Avaliacao $avaliacao, string $novoEstado): array
    {
        switch ($novoEstado) {
            case Avaliacao::ESTADO_AUTO_SUBMETIDA:
                // Validar que a autoavaliação está completa
                $validacao = $this->avaliacaoService->validarAutoavaliacaoCompleta($avaliacao);
                if (!$validacao['valido']) {
                    return [
                        'sucesso' => false,
                        'mensagem' => 'Autoavaliação incompleta.',
                        'erros' => $validacao['erros'],
                    ];
                }
                // Calcular pontuação
                $this->avaliacaoService->calcularPontuacaoAuto($avaliacao);
                break;

            case Avaliacao::ESTADO_AVAL_SUBMETIDA:
                // Validar que a avaliação está completa
                $validacao = $this->avaliacaoService->validarAvaliacaoCompleta($avaliacao);
                if (!$validacao['valido']) {
                    return [
                        'sucesso' => false,
                        'mensagem' => 'Avaliação incompleta.',
                        'erros' => $validacao['erros'],
                    ];
                }
                // Calcular pontuações
                $this->avaliacaoService->calcularPontuacaoAvaliador($avaliacao);
                $this->avaliacaoService->calcularPontuacaoFinal($avaliacao);
                break;
        }

        return ['sucesso' => true];
    }

    /**
     * Executar acções após a transição
     */
    protected function executarAccoesPosTransicao(Avaliacao $avaliacao, string $estadoAnterior, string $novoEstado): void
    {
        // Enviar notificações
        $this->notificacaoService->notificarTransicaoEstado($avaliacao, $estadoAnterior, $novoEstado);
    }

    /**
     * Obter timestamps a actualizar conforme o estado
     */
    protected function obterTimestamps(string $estado): array
    {
        return match ($estado) {
            Avaliacao::ESTADO_AUTO_SUBMETIDA => ['data_submissao_auto' => now()],
            Avaliacao::ESTADO_AVAL_SUBMETIDA => ['data_submissao_avaliador' => now()],
            Avaliacao::ESTADO_REV_DEPARTAMENTO => ['data_revisao_departamental' => now()],
            Avaliacao::ESTADO_APROVADA => ['data_revisao_rh' => now()],
            Avaliacao::ESTADO_FEEDBACK_FEITO => ['data_feedback' => now()],
            default => [],
        };
    }

    /**
     * Obter revisores a actualizar conforme o estado
     */
    protected function obterRevisores(string $estado, User $user): array
    {
        return match ($estado) {
            Avaliacao::ESTADO_REV_DEPARTAMENTO => ['revisor_departamental_id' => $user->id],
            Avaliacao::ESTADO_APROVADA, Avaliacao::ESTADO_REV_RH => ['revisor_rh_id' => $user->id],
            default => [],
        };
    }

    /**
     * Obter campo de observação conforme o estado
     */
    protected function obterCampoObservacao(string $estado): ?string
    {
        return match ($estado) {
            Avaliacao::ESTADO_AVAL_SUBMETIDA => 'observacoes_avaliador',
            Avaliacao::ESTADO_REV_DEPARTAMENTO, Avaliacao::ESTADO_AVAL_RASCUNHO => 'observacoes_revisor',
            Avaliacao::ESTADO_APROVADA, Avaliacao::ESTADO_REV_RH => 'observacoes_rh',
            default => null,
        };
    }

    /**
     * Obter acção amigável para a transição
     */
    protected function obterAccao(string $estadoActual, string $novoEstado): string
    {
        $accoes = [
            Avaliacao::ESTADO_RASCUNHO . '->' . Avaliacao::ESTADO_AUTO_SUBMETIDA => 'Submeter Autoavaliação',
            Avaliacao::ESTADO_AUTO_SUBMETIDA . '->' . Avaliacao::ESTADO_AVAL_RASCUNHO => 'Iniciar Avaliação',
            Avaliacao::ESTADO_AVAL_RASCUNHO . '->' . Avaliacao::ESTADO_AVAL_SUBMETIDA => 'Submeter Avaliação',
            Avaliacao::ESTADO_AVAL_RASCUNHO . '->' . Avaliacao::ESTADO_AUTO_SUBMETIDA => 'Devolver ao Trabalhador',
            Avaliacao::ESTADO_AVAL_SUBMETIDA . '->' . Avaliacao::ESTADO_REV_DEPARTAMENTO => 'Aprovar (Departamento)',
            Avaliacao::ESTADO_AVAL_SUBMETIDA . '->' . Avaliacao::ESTADO_AVAL_RASCUNHO => 'Devolver ao Avaliador',
            Avaliacao::ESTADO_REV_DEPARTAMENTO . '->' . Avaliacao::ESTADO_REV_RH => 'Enviar para RH',
            Avaliacao::ESTADO_REV_DEPARTAMENTO . '->' . Avaliacao::ESTADO_AVAL_SUBMETIDA => 'Devolver',
            Avaliacao::ESTADO_REV_RH . '->' . Avaliacao::ESTADO_APROVADA => 'Aprovar (Final)',
            Avaliacao::ESTADO_REV_RH . '->' . Avaliacao::ESTADO_REV_DEPARTAMENTO => 'Devolver ao Departamento',
            Avaliacao::ESTADO_APROVADA . '->' . Avaliacao::ESTADO_FEEDBACK_FEITO => 'Registar Feedback',
            Avaliacao::ESTADO_APROVADA . '->' . Avaliacao::ESTADO_CONTESTADA => 'Contestar',
            Avaliacao::ESTADO_FEEDBACK_FEITO . '->' . Avaliacao::ESTADO_CONTESTADA => 'Contestar',
            Avaliacao::ESTADO_CONTESTADA . '->' . Avaliacao::ESTADO_REV_RH => 'Aceitar Contestação',
            Avaliacao::ESTADO_CONTESTADA . '->' . Avaliacao::ESTADO_FEEDBACK_FEITO => 'Rejeitar Contestação',
        ];

        $chave = $estadoActual . '->' . $novoEstado;

        return $accoes[$chave] ?? 'Alterar Estado';
    }

    /**
     * Obter nome amigável do estado
     */
    public function obterNomeEstado(string $estado): string
    {
        return self::NOMES_ESTADOS[$estado] ?? $estado;
    }

    /**
     * Obter cor do estado
     */
    public function obterCorEstado(string $estado): string
    {
        return self::CORES_ESTADOS[$estado] ?? '#6b7280';
    }

    /**
     * Obter histórico de estados (baseado no activity log)
     */
    public function obterHistoricoEstados(Avaliacao $avaliacao): array
    {
        $actividades = $avaliacao->activities()
            ->where('description', 'updated')
            ->get()
            ->filter(function ($actividade) {
                $changes = $actividade->changes();
                return isset($changes['attributes']['estado']);
            })
            ->map(function ($actividade) {
                $changes = $actividade->changes();
                return [
                    'data' => $actividade->created_at,
                    'estado_anterior' => $changes['old']['estado'] ?? null,
                    'estado_novo' => $changes['attributes']['estado'] ?? null,
                    'utilizador' => $actividade->causer?->name,
                ];
            })
            ->values();

        return $actividades->toArray();
    }

    /**
     * Verificar se a avaliação está num estado editável
     */
    public function estaEditavel(Avaliacao $avaliacao, ?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return false;
        }

        $trabalhador = Trabalhador::where('user_id', $user->id)->first();
        $isOwner = $trabalhador && $avaliacao->trabalhador_id === $trabalhador->id;
        $isAvaliador = $avaliacao->avaliador_id === $user->id;

        // Trabalhador pode editar em RASCUNHO
        if ($isOwner && $avaliacao->estado === Avaliacao::ESTADO_RASCUNHO) {
            return true;
        }

        // Avaliador pode editar em AVAL_RASCUNHO
        if ($isAvaliador && $avaliacao->estado === Avaliacao::ESTADO_AVAL_RASCUNHO) {
            return true;
        }

        return false;
    }

    /**
     * Obter próximo responsável pela avaliação
     */
    public function obterProximoResponsavel(Avaliacao $avaliacao): ?array
    {
        $estado = $avaliacao->estado;

        return match ($estado) {
            Avaliacao::ESTADO_RASCUNHO => [
                'tipo' => 'trabalhador',
                'user' => $avaliacao->trabalhador->user,
                'accao' => 'Completar e submeter autoavaliação',
            ],
            Avaliacao::ESTADO_AUTO_SUBMETIDA => [
                'tipo' => 'avaliador',
                'user' => $avaliacao->avaliador,
                'accao' => 'Avaliar subordinado',
            ],
            Avaliacao::ESTADO_AVAL_RASCUNHO => [
                'tipo' => 'avaliador',
                'user' => $avaliacao->avaliador,
                'accao' => 'Completar e submeter avaliação',
            ],
            Avaliacao::ESTADO_AVAL_SUBMETIDA => [
                'tipo' => 'chefe_departamento',
                'user' => null, // Determinar pelo departamento
                'accao' => 'Rever e aprovar avaliação',
            ],
            Avaliacao::ESTADO_REV_DEPARTAMENTO => [
                'tipo' => 'rh',
                'user' => null, // Qualquer gestor RH
                'accao' => 'Rever e aprovar avaliação',
            ],
            Avaliacao::ESTADO_REV_RH => [
                'tipo' => 'rh',
                'user' => $avaliacao->revisorRH,
                'accao' => 'Aprovar avaliação final',
            ],
            Avaliacao::ESTADO_APROVADA => [
                'tipo' => 'avaliador',
                'user' => $avaliacao->avaliador,
                'accao' => 'Dar feedback ao trabalhador',
            ],
            default => null,
        };
    }
}
