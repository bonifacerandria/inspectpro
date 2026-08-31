<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('types_equipement', function (Blueprint $table) {
            $table->id();
            $table->foreignId('famille_id')->constrained('familles_equipement');
            $table->string('code', 50)->unique();    // ELINGUE_TEXTILE, PONT_ROULANT...
            $table->string('libelle', 150);
            $table->string('icone', 100)->nullable();
            $table->boolean('actif')->default(true);
            $table->jsonb('champs_identification')->default('{}');
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('types_equipement');
    }
};
