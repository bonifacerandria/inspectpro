<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anomalie;
use App\Models\Client;
use App\Models\Equipement;
use App\Models\Inspection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatistiqueController extends Controller
{
    /**
     * GET /statistiques
     * Chiffres clés pour le tableau de bord et l'écran Statistiques.
     */
    public function index(): JsonResponse
    {
        $inspectionsParStatut = Inspection::query()
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $repartitionAvis = Inspection::query()
            ->whereNotNull('avis_propose')
            ->select('avis_propose', DB::raw('count(*) as total'))
            ->groupBy('avis_propose')
            ->pluck('total', 'avis_propose');

        $anomaliesParGravite = Anomalie::query()
            ->select('gravite', DB::raw('count(*) as total'))
            ->groupBy('gravite')
            ->pluck('total', 'gravite');

        $inspectionsParMois = Inspection::query()
            ->selectRaw("to_char(date_inspection, 'YYYY-MM') as mois, count(*) as total")
            ->where('date_inspection', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        return response()->json([
            'nb_clients' => Client::count(),
            'nb_equipements' => Equipement::count(),
            'nb_inspections_total' => Inspection::count(),
            'nb_inspections_en_cours' => $inspectionsParStatut->get('en_cours', 0),
            'nb_inspections_validees' => $inspectionsParStatut->get('validee', 0),
            'nb_anomalies_ouvertes' => Anomalie::where('statut', 'ouverte')->count(),
            'nb_dangers_immediats_ouverts' => Anomalie::where('statut', 'ouverte')->where('gravite', 'danger_immediat')->count(),
            'inspections_par_statut' => $inspectionsParStatut,
            'repartition_avis' => $repartitionAvis,
            'anomalies_par_gravite' => $anomaliesParGravite,
            'inspections_par_mois' => $inspectionsParMois,
        ]);
    }
}
