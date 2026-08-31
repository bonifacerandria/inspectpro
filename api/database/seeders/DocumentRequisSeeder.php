<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DocumentRequisSeeder extends Seeder
{
    public function run(): void
    {
        $types = DB::table('types_equipement')->pluck('id');

        // Liste commune à tous les équipements — CDC section 17
        $documents = [
            'Notice constructeur',
            'Déclaration CE',
            'Certificat de conformité',
            'Registre de sécurité',
            'Rapport précédent',
            'Certificat/rapport de vérification',
            'Carnet de maintenance',
            "Document d'identification",
        ];

        $rows = [];
        foreach ($types as $typeId) {
            foreach ($documents as $i => $libelle) {
                $rows[] = [
                    'type_equipement_id' => $typeId,
                    'libelle' => $libelle,
                    'obligatoire' => false,
                    'ordre' => $i + 1,
                ];
            }
        }

        DB::table('documents_requis')->insert($rows);
    }
}
