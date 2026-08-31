<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sections_controle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_equipement_id')->constrained('types_equipement')->cascadeOnDelete();
            $table->string('code', 50);      // STRUCTURE, HYDRAULIQUE, LEVAGE...
            $table->string('libelle', 150);
            $table->integer('ordre')->default(0);
            $table->unique(['type_equipement_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sections_controle');
    }
};
