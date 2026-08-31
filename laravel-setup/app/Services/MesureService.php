<?php

namespace App\Services;

use App\Models\PointControle;

/**
 * Évalue une mesure par rapport à la valeur nominale et à la tolérance
 * définies sur le point de contrôle (cf. CDC section 15 : "Diamètre mesuré
 * / Réduction / Résultat"). Le résultat (C ou NC) est ensuite reporté sur
 * reponses_controle.statut pour réutiliser telle quelle la logique
 * d'anomalie automatique (voir ReponseControleController).
 */
class MesureService
{
    public function evaluer(PointControle $point, float $valeurMesuree): array
    {
        $nominale = $point->valeur_nominale !== null ? (float) $point->valeur_nominale : null;
        $tolerance = $point->tolerance_pourcent !== null ? (float) $point->tolerance_pourcent : null;

        $ecartPourcent = null;
        $resultat = 'NA'; // pas de valeur de référence -> pas d'évaluation automatique possible

        if ($nominale !== null && $nominale != 0) {
            $ecartPourcent = round(abs($valeurMesuree - $nominale) / $nominale * 100, 2);

            $resultat = ($tolerance !== null && $ecartPourcent > $tolerance) ? 'NC' : 'C';
        }

        return [
            'valeur_nominale' => $nominale,
            'valeur_mesuree' => $valeurMesuree,
            'unite' => $point->unite_mesure,
            'ecart_pourcent' => $ecartPourcent,
            'resultat' => $resultat,
        ];
    }
}
