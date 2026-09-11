<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permet à chaque famille de définir le libellé affiché dans l'en-tête du
 * rapport PDF (ex: "ÉQUIPEMENTS DE LEVAGE MOBILES" pour la famille
 * "Mobiles", "ACCESSOIRES DE LEVAGE" pour "Accessoires"...) plutôt que
 * d'avoir ce titre codé en dur dans le template — gérable depuis l'écran
 * "Gestion des familles" et pris en compte automatiquement pour toute
 * nouvelle famille créée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('familles_equipement', function (Blueprint $table) {
            $table->string('titre_rapport', 150)->nullable()->after('libelle');
        });

        // Valeurs de départ cohérentes pour les 3 familles déjà seedées.
        \Illuminate\Support\Facades\DB::table('familles_equipement')->where('code', 'ACCESSOIRES')->update(['titre_rapport' => 'ACCESSOIRES DE LEVAGE']);
        \Illuminate\Support\Facades\DB::table('familles_equipement')->where('code', 'MOBILES')->update(['titre_rapport' => 'ÉQUIPEMENTS DE LEVAGE MOBILES']);
        \Illuminate\Support\Facades\DB::table('familles_equipement')->where('code', 'FIXES')->update(['titre_rapport' => 'ÉQUIPEMENTS DE LEVAGE FIXES']);
    }

    public function down(): void
    {
        Schema::table('familles_equipement', function (Blueprint $table) {
            $table->dropColumn('titre_rapport');
        });
    }
};
