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
        Schema::create('trabalhadores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('numero_funcionario')->unique();
            $table->string('nome_completo');
            $table->string('departamento');
            $table->string('cargo');
            $table->string('categoria');
            $table->date('data_admissao')->nullable();
            $table->unsignedBigInteger('superior_directo_id')->nullable();
            $table->boolean('is_lider')->default(false);
            $table->string('nivel_lideranca')->default('nao_lider');
            $table->timestamps();

            $table->foreign('superior_directo_id')
                ->references('id')
                ->on('trabalhadores')
                ->nullOnDelete();

            $table->index('numero_funcionario');
            $table->index('departamento');
            $table->index('categoria');
            $table->index('nivel_lideranca');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trabalhadores');
    }
};
