<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * inspections.avis_propose était limité à varchar(50), trop court pour les
 * libellés générés par SyntheseService::proposerAvis() (jusqu'à ~72
 * caractères, ex: "ÉQUIPEMENT MAINTENU EN SERVICE SOUS RÉSERVE DE LA LEVÉE
 * DES OBSERVATIONS"). Cela provoquait un 500 (String data, right truncated)
 * à chaque fois qu'un avis long devait être enregistré — donc à la création
 * d'une inspection, au chargement (l'écran recalcule via /synthese), et
 * l'avis restait figé sur la seule valeur assez courte pour avoir pu être
 * sauvegardée ("SANS RÉSERVE").
 *
 * Passage en TEXT plutôt qu'un varchar plus large : aucune limite à
 * anticiper si le libellé évolue encore.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE inspections ALTER COLUMN avis_propose TYPE TEXT');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE inspections ALTER COLUMN avis_propose TYPE VARCHAR(50)');
    }
};
