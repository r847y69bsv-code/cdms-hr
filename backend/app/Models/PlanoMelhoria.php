<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class PlanoMelhoria extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'planos_melhoria';

    protected $fillable = [
        'avaliacao_id',
        'area_melhoria',
        'objectivo',
        'accoes',
        'recursos_necessarios',
        'prazo',
        'estado',
        'progresso',
        'notas_acompanhamento',
    ];

    protected function casts(): array
    {
        return [
            'prazo' => 'date',
            'progresso' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Estados do plano de melhoria
     */
    const ESTADO_PLANEADO = 'planeado';
    const ESTADO_EM_CURSO = 'em_curso';
    const ESTADO_CONCLUIDO = 'concluido';
    const ESTADO_CANCELADO = 'cancelado';

    /**
     * Relação: Avaliação associada
     */
    public function avaliacao()
    {
        return $this->belongsTo(Avaliacao::class);
    }
}
