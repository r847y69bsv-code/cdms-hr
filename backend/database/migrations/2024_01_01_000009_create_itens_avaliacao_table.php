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
        Schema::create('itens_avaliacao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('avaliacoes')->cascadeOnDelete();
            $table->foreignId('indicador_id')->constrained('indicadores')->cascadeOnDelete();
            $table->integer('pontuacao_auto')->nullable();
            $table->text('justificacao_auto')->nullable();
            $table->integer('pontuacao_avaliador')->nullable();
            $table->text('justificacao_avaliador')->nullable();
            $table->integer('pontuacao_final')->nullable();
            $table->decimal('peso_aplicado', 5, 2)->nullable();
            $table->decimal('pontuacao_ponderada', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['avaliacao_id', 'indicador_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itens_avaliacao');
    }
};
