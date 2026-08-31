<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anomalie;
use App\Models\Inspection;
use App\Models\Mesure;
use App\Models\ReponseControle;
use App\Services\MesureService;
use App\Services\NumerotationAnomalieService;
use App\Services\SyntheseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReponseControleController extends Controller
{
    /** Statuts qui déclenchent automatiquement une anomalie, et leur gravité par défaut. */
    private const GRAVITE_PAR_STATUT = [
        'O' => 'observation',
        'NC' => 'anomalie',
        'DM' => 'defaut_majeur',
        'DI' => 'danger_immediat',
    ];

    public function __construct(
        private NumerotationAnomalieService $numerotationService,
        private SyntheseService $syntheseService,
        private MesureService $mesureService,
    ) {
    }

    /**
     * POST /inspections/{inspection}/reponses
     * Enregistre (ou met à jour) la réponse à UN point de contrôle. Appelé
     * à chaque saisie de l'inspecteur — web et mobile envoient exactement
     * le même payload puisqu'ils partagent le même contrat d'API.
     */
    public function store(Request $request, Inspection $inspection): JsonResponse
    {
        if (! $inspection->estModifiable()) {
            return response()->json(['message' => 'Cette inspection est déjà validée, elle ne peut plus être modifiée.'], 422);
        }

        $donnees = $request->validate([
            'point_controle_id' => 'required|exists:points_controle,id',
            'statut' => 'nullable|in:C,O,NC,DM,DI,NA',
            'valeur_texte' => 'nullable|string',
            'valeur_nombre' => 'nullable|numeric',
            'valeur_choix' => 'nullable|string|max:150',
            'commentaire' => 'nullable|string',
        ]);

        $reponse = ReponseControle::updateOrCreate(
            [
                'inspection_id' => $inspection->id,
                'point_controle_id' => $donnees['point_controle_id'],
            ],
            $donnees
        );
        $reponse->load('pointControle');

        $mesure = null;
        if ($reponse->pointControle->type_reponse === 'mesure' && $reponse->valeur_nombre !== null) {
            $mesure = $this->enregistrerMesure($reponse);
        }

        $anomalie = $this->gererAnomalie($inspection, $reponse);

        $this->syntheseService->recalculer($inspection);

        return response()->json([
            'reponse' => $reponse->fresh(),
            'mesure' => $mesure,
            'anomalie' => $anomalie,
        ]);
    }

    /**
     * Calcule l'écart et le résultat (C/NC) via MesureService, sauvegarde la
     * ligne dans `mesures`, et reporte ce résultat sur reponses_controle.statut
     * pour que gererAnomalie() traite une mesure hors tolérance exactement
     * comme n'importe quel autre point non conforme.
     */
    private function enregistrerMesure(ReponseControle $reponse): Mesure
    {
        $evaluation = $this->mesureService->evaluer($reponse->pointControle, (float) $reponse->valeur_nombre);

        $mesure = Mesure::updateOrCreate(
            ['reponse_controle_id' => $reponse->id],
            $evaluation
        );

        if ($evaluation['resultat'] !== 'NA') {
            $reponse->statut = $evaluation['resultat'];
            $reponse->save();
        }

        return $mesure;
    }

    /**
     * Crée l'anomalie si le statut la déclenche et qu'aucune n'existe encore
     * pour cette réponse ; la met à jour (gravité) si le statut a changé ;
     * la supprime si l'inspecteur repasse la réponse à un statut conforme.
     */
    private function gererAnomalie(Inspection $inspection, ReponseControle $reponse): ?Anomalie
    {
        $anomalieExistante = $reponse->anomalie;
        $graviteAttendue = self::GRAVITE_PAR_STATUT[$reponse->statut] ?? null;

        if (! $graviteAttendue) {
            $anomalieExistante?->delete();
            return null;
        }

        if ($anomalieExistante) {
            $anomalieExistante->update(['gravite' => $graviteAttendue]);
            return $anomalieExistante;
        }

        return Anomalie::create([
            'inspection_id' => $inspection->id,
            'reponse_controle_id' => $reponse->id,
            'numero' => $this->numerotationService->prochainNumero($inspection),
            'constat' => $reponse->commentaire ?: $reponse->pointControle->libelle,
            'gravite' => $graviteAttendue,
            'statut' => 'ouverte',
        ]);
    }
}
