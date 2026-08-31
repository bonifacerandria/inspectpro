<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->string('type_signataire', 20); // inspecteur|client
            $table->string('nom', 150);
            $table->string('chemin_fichier', 255);
            $table->timestamp('signe_le')->default(now());
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signatures');
    }
};
