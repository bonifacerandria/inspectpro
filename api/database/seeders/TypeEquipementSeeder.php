<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeEquipementSeeder extends Seeder
{
    public function run(): void
    {
        $accessoires = DB::table('familles_equipement')->where('code', 'ACCESSOIRES')->value('id');
        $fixes       = DB::table('familles_equipement')->where('code', 'FIXES')->value('id');

        DB::table('types_equipement')->insert([
            [
                'famille_id' => $accessoires,
                'code' => 'ELINGUE_TEXTILE',
                'libelle' => 'Élingue textile / nylon',
                'champs_identification' => json_encode([
                    'type_elingue' => true,
                    'longueur_m' => true,
                    'fabricant' => true,
                    'date_fabrication' => true,
                    'marquage' => true,
                ]),
                'ordre' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'famille_id' => $accessoires,
                'code' => 'ELINGUE_CHAINE',
                'libelle' => 'Élingue chaîne',
                'champs_identification' => json_encode([
                    'nb_brins' => true,
                    'diametre_chaine_mm' => true,
                    'longueur_m' => true,
                    'fabricant' => true,
                    'date_fabrication' => true,
                ]),
                'ordre' => 2,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'famille_id' => $accessoires,
                'code' => 'MANILLE',
                'libelle' => 'Manille',
                'champs_identification' => json_encode([
                    'type_manille' => true, // droite / lyre
                    'diametre_axe_mm' => true,
                ]),
                'ordre' => 4,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'famille_id' => $accessoires,
                'code' => 'CROCHET',
                'libelle' => 'Crochet',
                'champs_identification' => json_encode([
                    'type_crochet' => true, // simple / double / à émerillon
                    'ouverture_bec_nominale_mm' => true,
                ]),
                'ordre' => 5,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'famille_id' => $fixes,
                'code' => 'PONT_ROULANT',
                'libelle' => 'Pont roulant',
                'champs_identification' => json_encode([
                    'portee_m' => true,
                    'hauteur_levage_m' => true,
                    'vitesse_levage' => true,
                ]),
                'ordre' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
        ]);
    }
}
