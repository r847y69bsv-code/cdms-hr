<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class RegistoOneOnOne extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'registos_one_on_one';

    protected $fillable = [
        'avaliacao_id',
        'data_reuniao',
        'duracao_minutos',
        'topicos_discutidos',
        'accoes_acordadas',
        'notas_privadas',
        'criado_por',
    ];

    protected function casts(): array
    {
        return [
            'data_reuniao' => 'datetime',
            'duracao_minutos' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Relação: Avaliação associada
     */
    public function avaliacao()
    {
        return $this->belongsTo(Avaliacao::class);
    }

    /**
     * Relação: Utilizador que criou o registo
     */
    public function criadoPor()
    {
        return $this->belongsTo(User::class, 'criado_por');
    }
}
