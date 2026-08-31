<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Ordre important : respecte les dépendances (famille -> type -> section -> point).
     */
    public function run(): void
    {
        $this->call([
            FamilleEquipementSeeder::class,
            TypeEquipementSeeder::class,
            SectionControleSeeder::class,
            PointControleSeeder::class,
            PhotoObligatoireSeeder::class,
            DocumentRequisSeeder::class,
            EssaiRequisSeeder::class,
        ]);

        // Compte admin par défaut (à changer en production)
        \App\Models\User::create([
            'nom' => 'Administrateur',
            'email' => 'admin@inspection-levage.local',
            'password' => bcrypt('change_me'),
            'role' => 'admin',
        ]);
    }
}
