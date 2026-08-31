<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('document_requis_id')->nullable()->constrained('documents_requis')->nullOnDelete();
            $table->string('libelle', 150);
            $table->boolean('present')->default(false);
            $table->string('chemin_fichier', 255)->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamp('created_at')->default(now());
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
