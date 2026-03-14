<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\AvaliacaoService;
use App\Services\WorkflowService;
use App\Services\NotificacaoService;
use App\Services\ImportacaoService;
use App\Services\RelatorioService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registar AvaliacaoService como singleton
        $this->app->singleton(AvaliacaoService::class, function ($app) {
            return new AvaliacaoService();
        });

        // Registar NotificacaoService como singleton
        $this->app->singleton(NotificacaoService::class, function ($app) {
            return new NotificacaoService();
        });

        // Registar WorkflowService com dependências
        $this->app->singleton(WorkflowService::class, function ($app) {
            return new WorkflowService(
                $app->make(AvaliacaoService::class),
                $app->make(NotificacaoService::class)
            );
        });

        // Registar ImportacaoService como singleton
        $this->app->singleton(ImportacaoService::class, function ($app) {
            return new ImportacaoService();
        });

        // Registar RelatorioService com dependências
        $this->app->singleton(RelatorioService::class, function ($app) {
            return new RelatorioService(
                $app->make(AvaliacaoService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
