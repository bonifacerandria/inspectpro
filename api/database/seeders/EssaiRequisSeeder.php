<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EssaiRequisSeeder extends Seeder
{
    public function run(): void
    {
        $pontRoulantId = DB::table('types_equipement')->where('code', 'PONT_ROULANT')->value('id');

        // CDC sections 11 ("Essais") et 16 (tableau des essais fonctionnels)
        $essais = [
            ['libelle' => 'Essai à vide',            'necessite_charge' => false, 'ordre' => 1],
            ['libelle' => 'Essai montée/descente',   'necessite_charge' => false, 'ordre' => 2],
            ['libelle' => 'Essai translation',       'necessite_charge' => false, 'ordre' => 3],
            ['libelle' => "Essai arrêt d'urgence",   'necessite_charge' => false, 'ordre' => 4],
            ['libelle' => 'Essai limiteur de charge','necessite_charge' => true,  'ordre' => 5],
            ['libelle' => 'Essai fin de course',     'necessite_charge' => false, 'ordre' => 6],
            ['libelle' => 'Essai en charge',         'necessite_charge' => true,  'ordre' => 7],
        ];

        DB::table('essais_requis')->insert(array_map(
            fn ($e) => array_merge($e, ['type_equipement_id' => $pontRoulantId]),
            $essais
        ));
    }
}
