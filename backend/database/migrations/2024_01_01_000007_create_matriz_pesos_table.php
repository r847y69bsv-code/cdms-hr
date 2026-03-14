<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('matriz_pesos', function (Blueprint $table) {
            $table->id();
            $table->string('categoria');
            $table->foreignId('indicador_id')->constrained('indicadores')->cascadeOnDelete();
            $table->decimal('peso', 5, 2);
            $table->string('descricao_categoria')->nullable();
            $table->timestamps();

            $table->unique(['categoria', 'indicador_id']);
            $table->index('categoria');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriz_pesos');
    }
};
