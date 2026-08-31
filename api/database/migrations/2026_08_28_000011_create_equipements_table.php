<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->foreignId('type_equipement_id')->constrained('types_equipement');
            $table->string('marque', 100)->nullable();
            $table->string('modele', 100)->nullable();
            $table->string('numero_serie', 100)->nullable();
            $table->string('numero_equipement', 100)->nullable();
            $table->integer('annee_fabrication')->nullable();
            $table->decimal('cmu_tonnes', 10, 2)->nullable();
            $table->string('constructeur', 150)->nullable();
            $table->string('localisation', 200)->nullable();
            $table->jsonb('champs_supplementaires')->default('{}');
            $table->string('photo_plaque_url', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipements');
    }
};
