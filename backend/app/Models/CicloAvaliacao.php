<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class CicloAvaliacao extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'ciclos_avaliacao';

    protected $fillable = [
        'ano',
        'nome',
        'descricao',
        'data_inicio_autoavaliacao',
        'data_fim_autoavaliacao',
        'data_inicio_avaliacao',
        'data_fim_avaliacao',
        'data_inicio_revisao',
        'data_fim_revisao',
        'estado',
        'criado_por',
    ];

    protected function casts(): array
    {
        return [
            'data_inicio_autoavaliacao' => 'date',
            'data_fim_autoavaliacao' => 'date',
            'data_inicio_avaliacao' => 'date',
            'data_fim_avaliacao' => 'date',
            'data_inicio_revisao' => 'date',
            'data_fim_revisao' => 'date',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Estados possíveis do ciclo
     */
    const ESTADO_PLANEADO = 'planeado';
    const ESTADO_AUTOAVALIACAO = 'autoavaliacao';
    const ESTADO_AVALIACAO = 'avaliacao';
    const ESTADO_REVISAO = 'revisao';
    const ESTADO_CONCLUIDO = 'concluido';

    /**
     * Relação: Avaliações deste ciclo
     */
    public function avaliacoes()
    {
        return $this->hasMany(Avaliacao::class, 'ciclo_id');
    }

    /**
     * Relação: Utilizador que criou o ciclo
     */
    public function criador()
    {
        return $this->belongsTo(User::class, 'criado_por');
    }
}
