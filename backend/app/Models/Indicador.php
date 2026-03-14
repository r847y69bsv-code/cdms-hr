<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Indicador extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'indicadores';

    protected $fillable = [
        'codigo',
        'nome',
        'descricao',
        'ordem',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Códigos dos indicadores conforme Ordem de Serviço
     */
    const IND_QUALIDADE = 'qualidade';
    const IND_PRODUTIVIDADE = 'produtividade';
    const IND_RESPONSABILIDADE = 'responsabilidade';
    const IND_ASSIDUIDADE = 'assiduidade';
    const IND_CONHECIMENTOS = 'conhecimentos';
    const IND_RELACIONAMENTO = 'relacionamento';

    /**
     * Relação: Itens de avaliação usando este indicador
     */
    public function itensAvaliacao()
    {
        return $this->hasMany(ItemAvaliacao::class);
    }

    /**
     * Relação: Pesos por categoria
     */
    public function pesos()
    {
        return $this->hasMany(MatrizPesos::class);
    }
}
