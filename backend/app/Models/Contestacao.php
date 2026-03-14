<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Contestacao extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'contestacoes';

    protected $fillable = [
        'avaliacao_id',
        'motivo',
        'descricao',
        'estado',
        'resposta',
        'respondido_por',
        'data_resposta',
    ];

    protected function casts(): array
    {
        return [
            'data_resposta' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Estados da contestação
     */
    const ESTADO_PENDENTE = 'pendente';
    const ESTADO_EM_ANALISE = 'em_analise';
    const ESTADO_ACEITE = 'aceite';
    const ESTADO_REJEITADA = 'rejeitada';

    /**
     * Relação: Avaliação contestada
     */
    public function avaliacao()
    {
        return $this->belongsTo(Avaliacao::class);
    }

    /**
     * Relação: Utilizador que respondeu
     */
    public function respondidoPor()
    {
        return $this->belongsTo(User::class, 'respondido_por');
    }
}
