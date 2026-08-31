<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Points de contrôle du MVP.
 *
 * IMPORTANT :
 * - Élingue textile, Manille et Pont roulant reprennent EXACTEMENT les points
 *   listés dans le CDC (sections 8, 9 et 11).
 * - Élingue chaîne et Crochet ne sont pas détaillés dans le CDC (seulement
 *   cités dans l'arborescence des familles). Les points ci-dessous sont donc
 *   une PROPOSITION basée sur les pratiques usuelles de contrôle de ce type
 *   d'accessoires — à faire valider par un inspecteur métier avant mise en
 *   production, et modifiable ensuite sans redéploiement (table points_controle).
 */
class PointControleSeeder extends Seeder
{
    public function run(): void
    {
        $types = DB::table('types_equipement')->pluck('id', 'code');
        $sections = DB::table('sections_controle')
            ->get()
            ->keyBy(fn ($s) => $s->type_equipement_id . '_' . $s->code);

        $now = now();
        $rows = [];

        // ---------------------------------------------------------------
        // ÉLINGUE TEXTILE — CDC section 8 (10 points, échelle C/O/NC/DM/DI)
        // ---------------------------------------------------------------
        $sectionId = $sections[$types['ELINGUE_TEXTILE'] . '_CONTROLE_VISUEL']->id;
        $points = [
            'Marquage lisible', 'État général', 'Coupures', 'Déchirures', 'Abrasion',
            'Brûlures', 'Déformation', 'Coutures', 'Boucles', 'Protection des angles',
        ];
        foreach ($points as $i => $libelle) {
            $rows[] = $this->pointEchelle($types['ELINGUE_TEXTILE'], $sectionId, 'PC1' . str_pad($i + 1, 2, '0', STR_PAD_LEFT), $libelle, $i + 1, $now);
        }

        // ---------------------------------------------------------------
        // ÉLINGUE CHAÎNE — proposition (à valider), analogue à l'élingue textile
        // ---------------------------------------------------------------
        $sectionId = $sections[$types['ELINGUE_CHAINE'] . '_CONTROLE_VISUEL']->id;
        $points = [
            'Marquage CMU lisible', 'État général', 'Allongement des maillons',
            'Usure des maillons', 'Déformation', 'Fissures / entailles', 'Corrosion',
            'État des crochets terminaux', 'État des cosses / manilles d\'about',
        ];
        foreach ($points as $i => $libelle) {
            $rows[] = $this->pointEchelle($types['ELINGUE_CHAINE'], $sectionId, 'PC2' . str_pad($i + 1, 2, '0', STR_PAD_LEFT), $libelle, $i + 1, $now);
        }

        // ---------------------------------------------------------------
        // MANILLE — CDC section 9 (deux groupes de points)
        // ---------------------------------------------------------------
        $sectionId = $sections[$types['MANILLE'] . '_IDENTIFICATION_MARQUAGE']->id;
        $points = ['Marquage CMU', 'Identification', 'Corps de manille'];
        foreach ($points as $i => $libelle) {
            $rows[] = $this->pointEchelle($types['MANILLE'], $sectionId, 'PC3' . str_pad($i + 1, 2, '0', STR_PAD_LEFT), $libelle, $i + 1, $now);
        }

        $sectionId = $sections[$types['MANILLE'] . '_AXE_ACCESSOIRES']->id;
        $points = [
            'Axe', 'Filetage', 'Goupille', 'Déformation', 'Fissure', 'Usure',
            'Corrosion', 'État des accessoires', "Compatibilité avec l'utilisation",
        ];
        foreach ($points as $i => $libelle) {
            $rows[] = $this->pointEchelle($types['MANILLE'], $sectionId, 'PC3' . str_pad($i + 4, 2, '0', STR_PAD_LEFT), $libelle, $i + 4, $now);
        }

        // ---------------------------------------------------------------
        // CROCHET — proposition (à valider)
        // ---------------------------------------------------------------
        $sectionId = $sections[$types['CROCHET'] . '_CONTROLE_VISUEL']->id;
        $rows[] = $this->pointEchelle($types['CROCHET'], $sectionId, 'PC401', 'Marquage CMU', 1, $now);
        $rows[] = $this->pointMesure($types['CROCHET'], $sectionId, 'PC402', 'Ouverture du bec', 2, 'mm', $now);
        foreach ([
            'Déformation / torsion' => 3, 'Fissures' => 4, 'Usure de la gorge' => 5,
            'Linguet de sécurité' => 6, 'Rotation libre (émerillon)' => 7,
            'Corrosion' => 8, 'Filetage / écrou de blocage' => 9,
        ] as $libelle => $ordre) {
            $rows[] = $this->pointEchelle($types['CROCHET'], $sectionId, 'PC4' . str_pad($ordre, 2, '0', STR_PAD_LEFT), $libelle, $ordre, $now);
        }

        // ---------------------------------------------------------------
        // PONT ROULANT — CDC section 11 (5 sections)
        // ---------------------------------------------------------------
        $groupes = [
            'STRUCTURE'   => ['Poutre', 'Sommiers', 'Soudures', 'Corrosion'],
            'TRANSLATION' => ['Roues', 'Rails', 'Motoréducteurs', 'Freins'],
            'LEVAGE'      => ['Palan', 'Câble', 'Crochet', 'Poulies', 'Tambour'],
            'ELECTRICITE' => ['Coffret', 'Câbles', 'Mise à la terre', 'Commandes'],
            'SECURITE'    => ["Arrêt d'urgence", 'Limiteur de charge', 'Fin de course', 'Avertisseur', 'Dispositifs de sécurité'],
        ];
        $prefixes = ['STRUCTURE' => 'PC5', 'TRANSLATION' => 'PC6', 'LEVAGE' => 'PC7', 'ELECTRICITE' => 'PC8', 'SECURITE' => 'PC9'];

        foreach ($groupes as $code => $points) {
            $sectionId = $sections[$types['PONT_ROULANT'] . '_' . $code]->id;
            foreach ($points as $i => $libelle) {
                $rows[] = $this->pointEchelle(
                    $types['PONT_ROULANT'], $sectionId,
                    $prefixes[$code] . str_pad($i + 1, 2, '0', STR_PAD_LEFT),
                    $libelle, $i + 1, $now
                );
            }
        }

        DB::table('points_controle')->insert($rows);
    }

    private function pointEchelle($typeId, $sectionId, $code, $libelle, $ordre, $now): array
    {
        return [
            'type_equipement_id' => $typeId,
            'section_id' => $sectionId,
            'code' => $code,
            'libelle' => $libelle,
            'type_reponse' => 'conforme_echelle',
            'obligatoire' => true,
            'ordre' => $ordre,
            'actif' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function pointMesure($typeId, $sectionId, $code, $libelle, $ordre, $unite, $now): array
    {
        return [
            'type_equipement_id' => $typeId,
            'section_id' => $sectionId,
            'code' => $code,
            'libelle' => $libelle,
            'type_reponse' => 'mesure',
            'unite_mesure' => $unite,
            'obligatoire' => true,
            'ordre' => $ordre,
            'actif' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
}
