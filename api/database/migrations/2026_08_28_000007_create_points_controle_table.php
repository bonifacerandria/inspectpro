<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('points_controle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_equipement_id')->constrained('types_equipement')->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained('sections_controle')->nullOnDelete();
            $table->string('code', 20);          // PC001, PC101...
            $table->string('libelle', 200);
            $table->string('type_reponse', 30);  // oui_non | conforme_echelle | texte | nombre | photo | choix_multiple | mesure
            $table->jsonb('options')->nullable();
            $table->string('unite_mesure', 20)->nullable();
            $table->decimal('valeur_nominale', 10, 2)->nullable();
            $table->decimal('tolerance_pourcent', 5, 2)->nullable();
            $table->boolean('obligatoire')->default(true);
            $table->integer('ordre')->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->unique(['type_equipement_id', 'code']);
        });

        // CHECK constraint (Laravel n'a pas de helper natif -> SQL brut)
        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE points_controle ADD CONSTRAINT chk_type_reponse
            CHECK (type_reponse IN ('oui_non','conforme_echelle','texte','nombre','photo','choix_multiple','mesure'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('points_controle');
    }
};
