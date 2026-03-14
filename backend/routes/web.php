<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'CDMS-HR',
        'version' => '1.0.0',
        'description' => 'Módulo de Avaliação de Desempenho - Cornelder de Moçambique'
    ]);
});
