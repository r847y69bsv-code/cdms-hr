<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ItemAvaliacao extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'itens_avaliacao';

    protected $fillable = [
        'avaliacao_id',
        'indicador_id',
        'pontuacao_auto',
        'justificacao_auto',
        'pontuacao_avaliador',
        'justificacao_avaliador',
        'pontuacao_final',
        'peso_aplicado',
        'pontuacao_ponderada',
    ];

    protected function casts(): array
    {
        return [
            'pontuacao_auto' => 'integer',
            'pontuacao_avaliador' => 'integer',
            'pontuacao_final' => 'integer',
            'peso_aplicado' => 'decimal:2',
            'pontuacao_ponderada' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Escala de pontuação (1-5)
     */
    const PONTUACAO_MIN = 1;
    const PONTUACAO_MAX = 5;

    /**
     * Relação: Avaliação
     */
    public function avaliacao()
    {
        return $this->belongsTo(Avaliacao::class);
    }

    /**
     * Relação: Indicador
     */
    public function indicador()
    {
        return $this->belongsTo(Indicador::class);
    }
}
