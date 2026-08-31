<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('essais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')->constrained('inspections')->cascadeOnDelete();
            $table->foreignId('essai_requis_id')->nullable()->constrained('essais_requis')->nullOnDelete();
            $table->string('libelle', 150);
            $table->decimal('charge_essai_kg', 10, 2)->nullable();
            $table->string('resultat', 5)->nullable(); // C|O|NC|DM|DI|NA
            $table->text('commentaire')->nullable();
            $table->timestamp('created_at')->default(now());
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('essais');
    }
};
