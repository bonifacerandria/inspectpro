<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mesures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reponse_controle_id')->constrained('reponses_controle')->cascadeOnDelete();
            $table->decimal('valeur_nominale', 10, 3)->nullable();
            $table->decimal('valeur_mesuree', 10, 3);
            $table->string('unite', 20)->nullable();
            $table->decimal('ecart_pourcent', 6, 2)->nullable();
            $table->string('resultat', 5)->nullable(); // C|O|NC|DM|DI
            $table->timestamp('created_at')->default(now());
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mesures');
    }
};
