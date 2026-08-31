<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anomalies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('reponse_controle_id')->nullable()->constrained('reponses_controle')->nullOnDelete();
            $table->string('numero', 20);   // A-001, A-002...
            $table->text('constat');
            $table->string('gravite', 20);  // observation|anomalie|defaut_majeur|danger_immediat
            $table->text('action_recommandee')->nullable();
            $table->string('responsable', 150)->nullable();
            $table->date('delai')->nullable();
            $table->string('statut', 20)->default('ouverte'); // ouverte|levee
            $table->timestamps();
            $table->unique(['inspection_id', 'numero']);
        });

        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE anomalies ADD CONSTRAINT chk_gravite
            CHECK (gravite IN ('observation','anomalie','defaut_majeur','danger_immediat'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('anomalies');
    }
};
