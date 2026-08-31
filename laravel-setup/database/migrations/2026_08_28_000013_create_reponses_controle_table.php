<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reponses_controle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('point_controle_id')->constrained('points_controle');
            $table->string('statut', 5)->nullable(); // C|O|NC|DM|DI|NA
            $table->text('valeur_texte')->nullable();
            $table->decimal('valeur_nombre', 12, 3)->nullable();
            $table->string('valeur_choix', 150)->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();
            $table->unique(['inspection_id', 'point_controle_id']);
        });

        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE reponses_controle ADD CONSTRAINT chk_statut_reponse
            CHECK (statut IN ('C','O','NC','DM','DI','NA'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('reponses_controle');
    }
};
