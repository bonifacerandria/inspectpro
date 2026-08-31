<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->nullable()->constrained('inspections')->cascadeOnDelete();
            $table->string('photographiable_type', 30); // anomalie|equipement|document|photo_obligatoire|signature
            $table->unsignedBigInteger('photographiable_id');
            $table->string('libelle', 150)->nullable();
            $table->string('numero', 20)->nullable();
            $table->string('chemin_fichier', 255);
            $table->timestamp('prise_le')->default(now());
            $table->timestamp('created_at')->default(now());

            $table->index(['photographiable_type', 'photographiable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
