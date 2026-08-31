<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FamilleEquipementSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('familles_equipement')->insert([
            ['code' => 'ACCESSOIRES', 'libelle' => 'Accessoires de levage', 'ordre' => 1],
            ['code' => 'MOBILES',     'libelle' => 'Équipements mobiles',   'ordre' => 2],
            ['code' => 'FIXES',       'libelle' => 'Équipements fixes',     'ordre' => 3],
        ]);
    }
}
