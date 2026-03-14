<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class MatrizPesos extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'matriz_pesos';

    protected $fillable = [
        'categoria',
        'indicador_id',
        'peso',
        'descricao_categoria',
    ];

    protected function casts(): array
    {
        return [
            'peso' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Categorias de trabalhadores
     */
    const CAT_NAO_LIDER = 'nao_lider';
    const CAT_SUPERVISOR = 'supervisor';
    const CAT_CHEFE_SECCAO = 'chefe_seccao';
    const CAT_CHEFE_DEPARTAMENTO = 'chefe_departamento';
    const CAT_DIRECTOR = 'director';
    const CAT_DIRECTOR_GERAL = 'director_geral';

    /**
     * Relação: Indicador associado
     */
    public function indicador()
    {
        return $this->belongsTo(Indicador::class);
    }
}
