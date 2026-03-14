<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use LdapRecord\Laravel\Auth\LdapAuthenticatable;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail, LdapAuthenticatable
{
    use HasFactory, Notifiable, HasApiTokens, LogsActivity, HasRoles, AuthenticatesWithLdap;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'ldap_guid',
        'is_active',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $guard_name = 'sanctum';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*']);
    }

    /**
     * Relação: O utilizador pode ter um trabalhador associado
     */
    public function trabalhador()
    {
        return $this->hasOne(Trabalhador::class);
    }

    /**
     * Avaliações onde o utilizador é o avaliador
     */
    public function avaliacoesComoAvaliador()
    {
        return $this->hasMany(Avaliacao::class, 'avaliador_id');
    }

    /**
     * Avaliações onde o utilizador é o revisor departamental
     */
    public function avaliacoesComoRevisorDepartamental()
    {
        return $this->hasMany(Avaliacao::class, 'revisor_departamental_id');
    }

    /**
     * Avaliações onde o utilizador é o revisor RH
     */
    public function avaliacoesComoRevisorRH()
    {
        return $this->hasMany(Avaliacao::class, 'revisor_rh_id');
    }
}
