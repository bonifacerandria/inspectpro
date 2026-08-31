<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipement_id')->constrained('equipements');
            $table->foreignId('inspecteur_id')->constrained('users');
            $table->date('date_inspection')->default(now());
            $table->string('statut', 20)->default('en_cours'); // en_cours|terminee|validee|archivee
            $table->integer('nb_points_controles')->default(0);
            $table->integer('nb_conformes')->default(0);
            $table->integer('nb_observations')->default(0);
            $table->integer('nb_non_conformes')->default(0);
            $table->integer('nb_defauts_majeurs')->default(0);
            $table->integer('nb_dangers_immediats')->default(0);
            $table->string('avis_propose', 50)->nullable();
            $table->text('conclusion')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->timestamps();
        });

        \Illuminate\Support\Facades\DB::statement("
            ALTER TABLE inspections ADD CONSTRAINT chk_statut_inspection
            CHECK (statut IN ('en_cours','terminee','validee','archivee'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};
