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
        Schema::create('avaliacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ciclo_id')->constrained('ciclos_avaliacao')->cascadeOnDelete();
            $table->foreignId('trabalhador_id')->constrained('trabalhadores')->cascadeOnDelete();
            $table->foreignId('avaliador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('revisor_departamental_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('revisor_rh_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('estado')->default('rascunho');
            $table->decimal('pontuacao_auto', 5, 2)->nullable();
            $table->decimal('pontuacao_avaliador', 5, 2)->nullable();
            $table->decimal('pontuacao_final', 5, 2)->nullable();
            $table->string('classificacao_final')->nullable();
            $table->timestamp('data_submissao_auto')->nullable();
            $table->timestamp('data_submissao_avaliador')->nullable();
            $table->timestamp('data_revisao_departamental')->nullable();
            $table->timestamp('data_revisao_rh')->nullable();
            $table->timestamp('data_feedback')->nullable();
            $table->text('observacoes_trabalhador')->nullable();
            $table->text('observacoes_avaliador')->nullable();
            $table->text('observacoes_revisor')->nullable();
            $table->text('observacoes_rh')->nullable();
            $table->timestamps();

            $table->unique(['ciclo_id', 'trabalhador_id']);
            $table->index('estado');
            $table->index('classificacao_final');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('avaliacoes');
    }
};
