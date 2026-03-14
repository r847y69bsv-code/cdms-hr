<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Avaliacao extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'avaliacoes';

    protected $fillable = [
        'ciclo_id',
        'trabalhador_id',
        'avaliador_id',
        'revisor_departamental_id',
        'revisor_rh_id',
        'estado',
        'pontuacao_auto',
        'pontuacao_avaliador',
        'pontuacao_final',
        'classificacao_final',
        'data_submissao_auto',
        'data_submissao_avaliador',
        'data_revisao_departamental',
        'data_revisao_rh',
        'data_feedback',
        'observacoes_trabalhador',
        'observacoes_avaliador',
        'observacoes_revisor',
        'observacoes_rh',
    ];

    protected function casts(): array
    {
        return [
            'pontuacao_auto' => 'decimal:2',
            'pontuacao_avaliador' => 'decimal:2',
            'pontuacao_final' => 'decimal:2',
            'data_submissao_auto' => 'datetime',
            'data_submissao_avaliador' => 'datetime',
            'data_revisao_departamental' => 'datetime',
            'data_revisao_rh' => 'datetime',
            'data_feedback' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Estados da avaliação (máquina de estados)
     */
    const ESTADO_RASCUNHO = 'rascunho';
    const ESTADO_AUTO_SUBMETIDA = 'auto_submetida';
    const ESTADO_AVAL_RASCUNHO = 'aval_rascunho';
    const ESTADO_AVAL_SUBMETIDA = 'aval_submetida';
    const ESTADO_REV_DEPARTAMENTO = 'rev_departamento';
    const ESTADO_REV_RH = 'rev_rh';
    const ESTADO_APROVADA = 'aprovada';
    const ESTADO_FEEDBACK_FEITO = 'feedback_feito';
    const ESTADO_CONTESTADA = 'contestada';

    /**
     * Classificações finais
     */
    const CLASSIFICACAO_EXCELENTE = 'Excelente';
    const CLASSIFICACAO_MUITO_BOM = 'Muito Bom';
    const CLASSIFICACAO_BOM = 'Bom';
    const CLASSIFICACAO_REGULAR = 'Regular';
    const CLASSIFICACAO_INSUFICIENTE = 'Insuficiente';

    /**
     * Relação: Ciclo de avaliação
     */
    public function ciclo()
    {
        return $this->belongsTo(CicloAvaliacao::class, 'ciclo_id');
    }

    /**
     * Relação: Trabalhador avaliado
     */
    public function trabalhador()
    {
        return $this->belongsTo(Trabalhador::class);
    }

    /**
     * Relação: Avaliador (superior directo)
     */
    public function avaliador()
    {
        return $this->belongsTo(User::class, 'avaliador_id');
    }

    /**
     * Relação: Revisor departamental
     */
    public function revisorDepartamental()
    {
        return $this->belongsTo(User::class, 'revisor_departamental_id');
    }

    /**
     * Relação: Revisor RH
     */
    public function revisorRH()
    {
        return $this->belongsTo(User::class, 'revisor_rh_id');
    }

    /**
     * Relação: Itens da avaliação
     */
    public function itens()
    {
        return $this->hasMany(ItemAvaliacao::class);
    }

    /**
     * Relação: Contestações
     */
    public function contestacoes()
    {
        return $this->hasMany(Contestacao::class);
    }

    /**
     * Relação: Registos One-on-One
     */
    public function registosOneOnOne()
    {
        return $this->hasMany(RegistoOneOnOne::class);
    }

    /**
     * Relação: Planos de melhoria
     */
    public function planosMelhoria()
    {
        return $this->hasMany(PlanoMelhoria::class);
    }
}
