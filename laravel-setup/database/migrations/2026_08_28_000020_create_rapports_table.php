<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rapports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->unique()->constrained('inspections')->cascadeOnDelete();
            $table->string('numero_rapport', 50)->unique();
            $table->string('chemin_fichier_pdf', 255);
            $table->timestamp('genere_le')->default(now());
            $table->timestamp('envoye_le')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rapports');
    }
};
