<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SectionControleSeeder extends Seeder
{
    public function run(): void
    {
        $types = DB::table('types_equipement')->pluck('id', 'code');

        $sections = [
            // Élingue textile, élingue chaîne, crochet : une seule section "contrôle visuel"
            ['type_equipement_id' => $types['ELINGUE_TEXTILE'], 'code' => 'CONTROLE_VISUEL', 'libelle' => 'Contrôle visuel', 'ordre' => 1],
            ['type_equipement_id' => $types['ELINGUE_CHAINE'],  'code' => 'CONTROLE_VISUEL', 'libelle' => 'Contrôle visuel', 'ordre' => 1],
            ['type_equipement_id' => $types['CROCHET'],         'code' => 'CONTROLE_VISUEL', 'libelle' => 'Contrôle visuel', 'ordre' => 1],

            // Manille : identification/marquage puis axe et accessoires
            ['type_equipement_id' => $types['MANILLE'], 'code' => 'IDENTIFICATION_MARQUAGE', 'libelle' => 'Identification et marquage', 'ordre' => 1],
            ['type_equipement_id' => $types['MANILLE'], 'code' => 'AXE_ACCESSOIRES',          'libelle' => 'Axe et accessoires',         'ordre' => 2],

            // Pont roulant : 5 sections (cf. CDC section 11)
            ['type_equipement_id' => $types['PONT_ROULANT'], 'code' => 'STRUCTURE',    'libelle' => 'Structure',    'ordre' => 1],
            ['type_equipement_id' => $types['PONT_ROULANT'], 'code' => 'TRANSLATION',  'libelle' => 'Translation',  'ordre' => 2],
            ['type_equipement_id' => $types['PONT_ROULANT'], 'code' => 'LEVAGE',       'libelle' => 'Levage',       'ordre' => 3],
            ['type_equipement_id' => $types['PONT_ROULANT'], 'code' => 'ELECTRICITE',  'libelle' => 'Électricité',  'ordre' => 4],
            ['type_equipement_id' => $types['PONT_ROULANT'], 'code' => 'SECURITE',     'libelle' => 'Sécurité',     'ordre' => 5],
        ];

        DB::table('sections_controle')->insert($sections);
    }
}
