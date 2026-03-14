<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Trabalhador extends Model
{
    use HasFactory, LogsActivity;

    protected $table = 'trabalhadores';

    protected $fillable = [
        'user_id',
        'numero_funcionario',
        'nome_completo',
        'departamento',
        'cargo',
        'categoria',
        'data_admissao',
        'superior_directo_id',
        'is_lider',
        'nivel_lideranca',
    ];

    protected function casts(): array
    {
        return [
            'data_admissao' => 'date',
            'is_lider' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Níveis de liderança disponíveis
     */
    const NIVEL_NAO_LIDER = 'nao_lider';
    const NIVEL_SUPERVISOR = 'supervisor';
    const NIVEL_CHEFE_SECCAO = 'chefe_seccao';
    const NIVEL_CHEFE_DEPARTAMENTO = 'chefe_departamento';
    const NIVEL_DIRECTOR = 'director';
    const NIVEL_DIRECTOR_GERAL = 'director_geral';

    /**
     * Relação: Utilizador associado
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relação: Superior directo (outro trabalhador)
     */
    public function superiorDirecto()
    {
        return $this->belongsTo(Trabalhador::class, 'superior_directo_id');
    }

    /**
     * Relação: Subordinados directos
     */
    public function subordinados()
    {
        return $this->hasMany(Trabalhador::class, 'superior_directo_id');
    }

    /**
     * Relação: Avaliações deste trabalhador
     */
    public function avaliacoes()
    {
        return $this->hasMany(Avaliacao::class);
    }

    /**
     * Relação: Matriz de pesos aplicável
     */
    public function matrizPesos()
    {
        return $this->hasOne(MatrizPesos::class, 'categoria', 'categoria');
    }
}
