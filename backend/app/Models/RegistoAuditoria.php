<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RegistoAuditoria extends Model
{
    use HasFactory;

    protected $table = 'registos_auditoria';

    protected $fillable = [
        'user_id',
        'accao',
        'entidade',
        'entidade_id',
        'dados_anteriores',
        'dados_novos',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'dados_anteriores' => 'array',
            'dados_novos' => 'array',
        ];
    }

    /**
     * Relação: Utilizador que realizou a acção
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
