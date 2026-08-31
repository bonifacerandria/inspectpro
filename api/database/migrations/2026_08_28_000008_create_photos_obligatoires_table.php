<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos_obligatoires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('type_equipement_id')->constrained('types_equipement')->cascadeOnDelete();
            $table->string('libelle', 150);
            $table->integer('ordre')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos_obligatoires');
    }
};
