<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La migration par défaut de Laravel crée une colonne "name" ;
        // notre modèle User et le schéma utilisent "nom" (français) -> on
        // la renomme via SQL brut pour éviter la dépendance à doctrine/dbal
        // qu'exige Schema::renameColumn() sur certaines versions de Laravel.
        DB::statement('ALTER TABLE users RENAME COLUMN name TO nom');

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('inspecteur')->after('email'); // admin | inspecteur
            $table->string('telephone', 30)->nullable()->after('role');
            $table->boolean('actif')->default(true)->after('telephone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'telephone', 'actif']);
        });

        DB::statement('ALTER TABLE users RENAME COLUMN nom TO name');
    }
};
