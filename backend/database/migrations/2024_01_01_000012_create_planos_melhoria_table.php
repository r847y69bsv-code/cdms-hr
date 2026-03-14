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
        Schema::create('planos_melhoria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('avaliacoes')->cascadeOnDelete();
            $table->string('area_melhoria');
            $table->text('objectivo');
            $table->text('accoes')->nullable();
            $table->text('recursos_necessarios')->nullable();
            $table->date('prazo')->nullable();
            $table->string('estado')->default('planeado');
            $table->integer('progresso')->default(0);
            $table->text('notas_acompanhamento')->nullable();
            $table->timestamps();

            $table->index('estado');
            $table->index('prazo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planos_melhoria');
    }
};
