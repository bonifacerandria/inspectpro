<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhotoObligatoireSeeder extends Seeder
{
    public function run(): void
    {
        $types = DB::table('types_equipement')->pluck('id', 'code');
        $rows = [];

        // Générique pour les accessoires (élingue textile/chaîne, manille, crochet)
        foreach (['ELINGUE_TEXTILE', 'ELINGUE_CHAINE', 'MANILLE', 'CROCHET'] as $code) {
            $rows[] = ['type_equipement_id' => $types[$code], 'libelle' => 'Photo générale', 'ordre' => 1];
            $rows[] = ['type_equipement_id' => $types[$code], 'libelle' => 'Marquage / plaque', 'ordre' => 2];
            $rows[] = ['type_equipement_id' => $types[$code], 'libelle' => 'Anomalies constatées', 'ordre' => 3];
        }

        // Pont roulant — liste exacte du CDC (section 14)
        foreach ([
            'Photo générale', 'Plaque constructeur', 'Crochet', 'Câble', 'Palan', 'Structure', 'Anomalies',
        ] as $i => $libelle) {
            $rows[] = ['type_equipement_id' => $types['PONT_ROULANT'], 'libelle' => $libelle, 'ordre' => $i + 1];
        }

        DB::table('photos_obligatoires')->insert($rows);
    }
}
