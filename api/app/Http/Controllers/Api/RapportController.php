<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Models\Rapport;
use App\Services\RapportPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class RapportController extends Controller
{
    public function __construct(private RapportPdfService $rapportPdfService)
    {
    }

    /**
     * POST /inspections/{inspection}/rapport
     * Génère (ou régénère) le PDF final. Réservé aux inspections validées :
     * tant que l'inspection est modifiable, le rapport n'a pas de sens
     * puisque le contenu peut encore changer.
     */
    public function generer(Inspection $inspection): JsonResponse
    {
        if ($inspection->statut === 'en_cours') {
            return response()->json([
                'message' => "L'inspection doit être validée avant de générer le rapport.",
            ], 422);
        }

        $rapport = $this->rapportPdfService->genererPour($inspection);

        return response()->json([
            ...$rapport->toArray(),
            'url_telechargement' => route('rapports.telecharger', $rapport),
        ], 201);
    }

    /** GET /rapports/{rapport}/telecharger */
    public function telecharger(Rapport $rapport)
    {
        return Storage::disk('public')->download(
            $rapport->chemin_fichier_pdf,
            "rapport-{$rapport->numero_rapport}.pdf"
        );
    }
}
