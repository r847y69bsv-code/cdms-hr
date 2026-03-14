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
        Schema::create('contestacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('avaliacoes')->cascadeOnDelete();
            $table->string('motivo');
            $table->text('descricao');
            $table->string('estado')->default('pendente');
            $table->text('resposta')->nullable();
            $table->foreignId('respondido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('data_resposta')->nullable();
            $table->timestamps();

            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contestacoes');
    }
};
