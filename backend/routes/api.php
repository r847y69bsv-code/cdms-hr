<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LdapUserController;
use App\Http\Controllers\Api\CicloAvaliacaoController;
use App\Http\Controllers\Api\TrabalhadorController;
use App\Http\Controllers\Api\IndicadorController;
use App\Http\Controllers\Api\MatrizPesosController;
use App\Http\Controllers\Api\AvaliacaoController;
use App\Http\Controllers\Api\ItemAvaliacaoController;
use App\Http\Controllers\Api\ContestacaoController;
use App\Http\Controllers\Api\OneOnOneController;
use App\Http\Controllers\Api\PlanoMelhoriaController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RelatorioController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolesController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Middleware\CheckIfUserIsActive;
use App\Http\Middleware\CheckPasswordExpiry;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - CDMS-HR
|--------------------------------------------------------------------------
*/

// Rota de login não autenticada
Route::get('/login', function () {
    return response()->json([
        'message' => 'Por favor faça login',
        'error' => 'Não autenticado'
    ], 401);
})->name('login');

// Rotas públicas de autenticação
Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

// LDAP
Route::prefix('v1')->group(function () {
    Route::get('ldapusers', [LdapUserController::class, 'index']);
    Route::post('ldaplogin', [LdapUserController::class, 'ldapLogin']);
});

// Rotas protegidas
Route::middleware(['auth:sanctum', CheckIfUserIsActive::class])->group(function () {

    // =========================================================================
    // AUTENTICAÇÃO
    // =========================================================================
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('updatepassword', [AuthController::class, 'updatePassword']);
    Route::get('me', [AuthController::class, 'me']);

    // =========================================================================
    // DASHBOARDS
    // =========================================================================
    Route::prefix('dashboard')->group(function () {
        Route::get('trabalhador', [DashboardController::class, 'trabalhador'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('avaliador', [DashboardController::class, 'avaliador'])
            ->middleware('permission:acesso painel-avaliador');
        Route::get('departamento', [DashboardController::class, 'departamento'])
            ->middleware('permission:acesso revisao-departamental');
        Route::get('rh', [DashboardController::class, 'rh'])
            ->middleware('permission:acesso modulo-rh');
        Route::get('admin', [DashboardController::class, 'admin'])
            ->middleware('permission:acesso administracao');
    });

    // =========================================================================
    // CICLOS DE AVALIAÇÃO
    // =========================================================================
    Route::prefix('ciclos')->middleware('permission:acesso modulo-rh')->group(function () {
        Route::get('/', [CicloAvaliacaoController::class, 'index']);
        Route::post('/', [CicloAvaliacaoController::class, 'store'])
            ->middleware('permission:criar ciclo');
        Route::get('activo', [CicloAvaliacaoController::class, 'cicloActivo']);
        Route::get('{ciclo}', [CicloAvaliacaoController::class, 'show']);
        Route::put('{ciclo}', [CicloAvaliacaoController::class, 'update'])
            ->middleware('permission:editar ciclo');
        Route::delete('{ciclo}', [CicloAvaliacaoController::class, 'destroy'])
            ->middleware('permission:gerir ciclos');
        Route::post('{ciclo}/estado', [CicloAvaliacaoController::class, 'alterarEstado'])
            ->middleware('permission:activar ciclo');
    });

    // Rota pública para ciclo activo (para trabalhadores)
    Route::get('ciclo-activo', [CicloAvaliacaoController::class, 'cicloActivo'])
        ->middleware('permission:acesso modulo-avaliacao');

    // =========================================================================
    // TRABALHADORES
    // =========================================================================
    Route::prefix('trabalhadores')->group(function () {
        Route::get('meu-perfil', [TrabalhadorController::class, 'meuPerfil'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('departamentos', [TrabalhadorController::class, 'departamentos'])
            ->middleware('permission:acesso modulo-rh');

        Route::middleware('permission:acesso modulo-rh')->group(function () {
            Route::get('/', [TrabalhadorController::class, 'index']);
            Route::post('/', [TrabalhadorController::class, 'store'])
                ->middleware('permission:importar trabalhadores');
            Route::get('{trabalhador}', [TrabalhadorController::class, 'show']);
            Route::put('{trabalhador}', [TrabalhadorController::class, 'update'])
                ->middleware('permission:importar trabalhadores');
            Route::delete('{trabalhador}', [TrabalhadorController::class, 'destroy'])
                ->middleware('permission:importar trabalhadores');
            Route::get('{trabalhador}/subordinados', [TrabalhadorController::class, 'subordinados']);
            Route::post('{trabalhador}/associar-user', [TrabalhadorController::class, 'associarUser'])
                ->middleware('permission:importar trabalhadores');
        });
    });

    // =========================================================================
    // INDICADORES
    // =========================================================================
    Route::prefix('indicadores')->group(function () {
        Route::get('/', [IndicadorController::class, 'index'])
            ->middleware('permission:acesso modulo-avaliacao');

        Route::middleware('permission:gerir configuracoes-rh')->group(function () {
            Route::post('/', [IndicadorController::class, 'store']);
            Route::get('{indicador}', [IndicadorController::class, 'show']);
            Route::put('{indicador}', [IndicadorController::class, 'update']);
            Route::delete('{indicador}', [IndicadorController::class, 'destroy']);
            Route::post('reordenar', [IndicadorController::class, 'reordenar']);
        });
    });

    // =========================================================================
    // MATRIZ DE PESOS
    // =========================================================================
    Route::prefix('matriz-pesos')->group(function () {
        Route::get('/', [MatrizPesosController::class, 'index'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('categorias', [MatrizPesosController::class, 'categorias'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('categoria/{categoria}', [MatrizPesosController::class, 'porCategoria'])
            ->middleware('permission:acesso modulo-avaliacao');

        Route::middleware('permission:gerir configuracoes-rh')->group(function () {
            Route::put('{matrizPeso}', [MatrizPesosController::class, 'update']);
            Route::put('categoria/{categoria}', [MatrizPesosController::class, 'actualizarCategoria']);
        });
    });

    // =========================================================================
    // AVALIAÇÕES
    // =========================================================================
    Route::prefix('avaliacoes')->group(function () {
        // Rotas do trabalhador
        Route::get('minhas', [AvaliacaoController::class, 'minhasAvaliacoes'])
            ->middleware('permission:ver avaliacoes proprias');

        Route::middleware('permission:criar autoavaliacao')->group(function () {
            Route::post('/', [AvaliacaoController::class, 'store']);
            Route::post('{avaliacao}/submeter-auto', [AvaliacaoController::class, 'submeterAutoavaliacao']);
        });

        // Rotas do avaliador
        Route::get('pendentes', [AvaliacaoController::class, 'pendentes'])
            ->middleware('permission:acesso painel-avaliador');
        Route::get('equipa', [AvaliacaoController::class, 'equipa'])
            ->middleware('permission:ver avaliacoes equipa');

        Route::middleware('permission:criar avaliacao')->group(function () {
            Route::post('{avaliacao}/iniciar', [AvaliacaoController::class, 'iniciarAvaliacao']);
            Route::post('{avaliacao}/submeter', [AvaliacaoController::class, 'submeterAvaliacao']);
        });

        // Rotas de revisão departamental
        Route::get('departamento/pendentes', [AvaliacaoController::class, 'departamentoPendentes'])
            ->middleware('permission:acesso revisao-departamental');
        Route::get('departamento', [AvaliacaoController::class, 'departamento'])
            ->middleware('permission:acesso revisao-departamental');

        Route::middleware('permission:aprovar avaliacao-departamento')->group(function () {
            Route::post('{avaliacao}/aprovar-departamento', [AvaliacaoController::class, 'aprovarDepartamento']);
            Route::post('{avaliacao}/devolver', [AvaliacaoController::class, 'devolver']);
        });

        // Rotas de revisão RH
        Route::get('rh/pendentes', [AvaliacaoController::class, 'rhPendentes'])
            ->middleware('permission:acesso modulo-rh');

        Route::middleware('permission:aprovar avaliacao-rh')->group(function () {
            Route::post('{avaliacao}/aprovar-rh', [AvaliacaoController::class, 'aprovarRH']);
            Route::post('{avaliacao}/devolver-rh', [AvaliacaoController::class, 'devolverRH']);
        });

        // CRUD geral
        Route::get('/', [AvaliacaoController::class, 'index'])
            ->middleware('permission:ver todas-avaliacoes');
        Route::get('{avaliacao}', [AvaliacaoController::class, 'show'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::put('{avaliacao}', [AvaliacaoController::class, 'update'])
            ->middleware('permission:acesso modulo-avaliacao');
    });

    // =========================================================================
    // ITENS DE AVALIAÇÃO
    // =========================================================================
    Route::prefix('avaliacoes/{avaliacao}/itens')->middleware('permission:acesso modulo-avaliacao')->group(function () {
        Route::get('/', [ItemAvaliacaoController::class, 'index']);
        Route::put('batch', [ItemAvaliacaoController::class, 'updateBatch']);
    });

    Route::prefix('itens-avaliacao')->middleware('permission:acesso modulo-avaliacao')->group(function () {
        Route::get('{item}', [ItemAvaliacaoController::class, 'show']);
        Route::put('{item}', [ItemAvaliacaoController::class, 'update']);
    });

    // =========================================================================
    // CONTESTAÇÕES
    // =========================================================================
    Route::prefix('contestacoes')->group(function () {
        Route::get('minhas', [ContestacaoController::class, 'minhasContestacoes'])
            ->middleware('permission:contestar avaliacao');
        Route::post('/', [ContestacaoController::class, 'store'])
            ->middleware('permission:contestar avaliacao');

        Route::middleware('permission:aprovar avaliacao-rh')->group(function () {
            Route::get('/', [ContestacaoController::class, 'index']);
            Route::get('pendentes', [ContestacaoController::class, 'pendentes']);
            Route::get('{contestacao}', [ContestacaoController::class, 'show']);
            Route::post('{contestacao}/responder', [ContestacaoController::class, 'responder']);
            Route::post('{contestacao}/em-analise', [ContestacaoController::class, 'emAnalise']);
        });
    });

    // =========================================================================
    // ONE-ON-ONE
    // =========================================================================
    Route::prefix('one-on-one')->group(function () {
        Route::get('meus-registos', [OneOnOneController::class, 'meusRegistos'])
            ->middleware('permission:registar one-on-one');
        Route::get('minhas-avaliacoes', [OneOnOneController::class, 'registosDasMinhasAvaliacoes'])
            ->middleware('permission:acesso modulo-avaliacao');

        Route::middleware('permission:registar one-on-one')->group(function () {
            Route::get('/', [OneOnOneController::class, 'index']);
            Route::post('/', [OneOnOneController::class, 'store']);
            Route::get('{oneOnOne}', [OneOnOneController::class, 'show']);
            Route::put('{oneOnOne}', [OneOnOneController::class, 'update']);
            Route::delete('{oneOnOne}', [OneOnOneController::class, 'destroy']);
        });

        Route::get('avaliacao/{avaliacao}', [OneOnOneController::class, 'porAvaliacao'])
            ->middleware('permission:acesso modulo-avaliacao');
    });

    // =========================================================================
    // PLANOS DE MELHORIA
    // =========================================================================
    Route::prefix('planos-melhoria')->group(function () {
        Route::get('meus', [PlanoMelhoriaController::class, 'meusPlanos'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('equipa', [PlanoMelhoriaController::class, 'planosEquipa'])
            ->middleware('permission:criar plano-melhoria');
        Route::get('a-vencer', [PlanoMelhoriaController::class, 'aVencer'])
            ->middleware('permission:criar plano-melhoria');

        Route::middleware('permission:criar plano-melhoria')->group(function () {
            Route::get('/', [PlanoMelhoriaController::class, 'index']);
            Route::post('/', [PlanoMelhoriaController::class, 'store']);
            Route::delete('{planoMelhoria}', [PlanoMelhoriaController::class, 'destroy']);
        });

        Route::get('{planoMelhoria}', [PlanoMelhoriaController::class, 'show'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::put('{planoMelhoria}', [PlanoMelhoriaController::class, 'update'])
            ->middleware('permission:acesso modulo-avaliacao');
        Route::get('avaliacao/{avaliacao}', [PlanoMelhoriaController::class, 'porAvaliacao'])
            ->middleware('permission:acesso modulo-avaliacao');
    });

    // =========================================================================
    // RELATÓRIOS
    // =========================================================================
    Route::prefix('relatorios')->middleware('permission:gerar relatorios')->group(function () {
        Route::get('ciclo/{ciclo}', [RelatorioController::class, 'ciclo']);
        Route::get('departamento', [RelatorioController::class, 'departamento']);
        Route::get('trabalhador/{trabalhador}', [RelatorioController::class, 'trabalhador']);
        Route::get('comparativo-departamentos', [RelatorioController::class, 'comparativoDepartamentos']);
        Route::get('exportar', [RelatorioController::class, 'exportar'])
            ->middleware('permission:exportar dados');
    });

    // =========================================================================
    // ADMINISTRAÇÃO - UTILIZADORES
    // =========================================================================
    Route::prefix('users')->middleware('permission:gerir utilizadores')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store'])
            ->middleware('permission:criar utilizador');
        Route::get('sem-trabalhador', [UserController::class, 'semTrabalhador']);
        Route::get('estatisticas', [UserController::class, 'estatisticas']);
        Route::get('{user}', [UserController::class, 'show']);
        Route::put('{user}', [UserController::class, 'update'])
            ->middleware('permission:editar utilizador');
        Route::delete('{user}', [UserController::class, 'destroy'])
            ->middleware('permission:desactivar utilizador');
        Route::post('{user}/activar', [UserController::class, 'activar'])
            ->middleware('permission:desactivar utilizador');
        Route::post('{user}/reset-password', [UserController::class, 'resetPassword'])
            ->middleware('permission:editar utilizador');
        Route::put('{user}/roles', [UserController::class, 'updateRoles'])
            ->middleware('permission:gerir roles');
    });

    // =========================================================================
    // ADMINISTRAÇÃO - PAPÉIS (ROLES)
    // =========================================================================
    Route::prefix('roles')->middleware('permission:gerir roles')->group(function () {
        Route::get('/', [RolesController::class, 'index']);
        Route::post('/', [RolesController::class, 'store']);
        Route::get('{role}', [RolesController::class, 'show']);
        Route::put('{role}', [RolesController::class, 'update']);
        Route::delete('{role}', [RolesController::class, 'destroy']);
        Route::put('{role}/permissions', [RolesController::class, 'updatePermissions']);
        Route::post('{role}/assign-users', [RolesController::class, 'assignToUsers']);
        Route::post('{role}/remove-users', [RolesController::class, 'removeFromUsers']);
    });

    // =========================================================================
    // ADMINISTRAÇÃO - PERMISSÕES
    // =========================================================================
    Route::prefix('permissions')->middleware('permission:gerir permissoes')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::get('matriz', [PermissionController::class, 'matriz']);
        Route::get('{permission}', [PermissionController::class, 'show']);
        Route::put('{permission}', [PermissionController::class, 'update']);
        Route::delete('{permission}', [PermissionController::class, 'destroy']);
        Route::post('{permission}/assign-roles', [PermissionController::class, 'assignToRoles']);
        Route::post('{permission}/remove-roles', [PermissionController::class, 'removeFromRoles']);
    });

});
