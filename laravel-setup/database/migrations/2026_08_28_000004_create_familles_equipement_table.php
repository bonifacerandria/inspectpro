<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('familles_equipement', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();   // ACCESSOIRES | MOBILES | FIXES
            $table->string('libelle', 100);
            $table->integer('ordre')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('familles_equipement');
    }
};
