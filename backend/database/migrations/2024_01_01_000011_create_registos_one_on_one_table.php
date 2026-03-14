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
        Schema::create('registos_one_on_one', function (Blueprint $table) {
            $table->id();
            $table->foreignId('avaliacao_id')->constrained('avaliacoes')->cascadeOnDelete();
            $table->timestamp('data_reuniao');
            $table->integer('duracao_minutos')->nullable();
            $table->text('topicos_discutidos')->nullable();
            $table->text('accoes_acordadas')->nullable();
            $table->text('notas_privadas')->nullable();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('data_reuniao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registos_one_on_one');
    }
};
