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
        Schema::create('ciclos_avaliacao', function (Blueprint $table) {
            $table->id();
            $table->integer('ano');
            $table->string('nome');
            $table->text('descricao')->nullable();
            $table->date('data_inicio_autoavaliacao');
            $table->date('data_fim_autoavaliacao');
            $table->date('data_inicio_avaliacao');
            $table->date('data_fim_avaliacao');
            $table->date('data_inicio_revisao');
            $table->date('data_fim_revisao');
            $table->string('estado')->default('planeado');
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('ano');
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ciclos_avaliacao');
    }
};
