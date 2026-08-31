<?php

namespace App\Services;

use App\Models\Inspection;

/**
 * Calcule la synthèse d'une inspection (compteurs C/O/NC/DM/DI, cf. CDC
 * section 12) et propose automatiquement un avis (section 18). L'inspecteur
 * garde toujours la main pour modifier la conclusion proposée — ce service
 * ne fait que la PROPOSER.
 */
class SyntheseService
{
    public function recalculer(Inspection $inspection): Inspection
    {
        $compteurs = $inspection->reponses()
            ->selectRaw('statut, count(*) as total')
            ->whereNotNull('statut')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $inspection->nb_points_controles = $inspection->reponses()->count();
        $inspection->nb_conformes = $compteurs->get('C', 0);
        $inspection->nb_observations = $compteurs->get('O', 0);
        $inspection->nb_non_conformes = $compteurs->get('NC', 0);
        $inspection->nb_defauts_majeurs = $compteurs->get('DM', 0);
        $inspection->nb_dangers_immediats = $compteurs->get('DI', 0);
        $inspection->avis_propose = $this->proposerAvis($inspection);

        $inspection->save();

        return $inspection;
    }

    /**
     * Règle de décision (CDC section 18) :
     * - un seul danger immédiat ou défaut majeur -> équipement non autorisé
     * - des non-conformités/observations sans DM/DI -> maintenu sous réserve
     * - rien à signaler -> maintenu en service sans réserve
     */
    private function proposerAvis(Inspection $inspection): string
    {
        if ($inspection->nb_dangers_immediats > 0 || $inspection->nb_defauts_majeurs > 0) {
            return 'ÉQUIPEMENT NON AUTORISÉ À ÊTRE UTILISÉ EN L\'ÉTAT';
        }

        if ($inspection->nb_non_conformes > 0 || $inspection->nb_observations > 0) {
            return 'ÉQUIPEMENT MAINTENU EN SERVICE SOUS RÉSERVE DE LA LEVÉE DES OBSERVATIONS';
        }

        return 'ÉQUIPEMENT MAINTENU EN SERVICE SANS RÉSERVE';
    }
}
