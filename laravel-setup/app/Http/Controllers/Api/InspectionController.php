<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use App\Services\SyntheseService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InspectionController extends Controller
{
    public function __construct(private SyntheseService $syntheseService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $inspections = Inspection::with(['equipement.site.client', 'equipement.typeEquipement', 'inspecteur'])
            ->when($request->query('statut'), fn ($q, $s) => $q->where('statut', $s))
            ->when($request->query('equipement_id'), fn ($q, $id) => $q->where('equipement_id', $id))
            // Un inspecteur ne voit que ses propres inspections, un admin voit tout.
            ->when(
                ! $request->user()->estAdmin(),
                fn ($q) => $q->where('inspecteur_id', $request->user()->id)
            )
            ->orderByDesc('date_inspection')
            ->paginate(20);

        return response()->json($inspections);
    }

    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'equipement_id' => 'required|exists:equipements,id',
            'date_inspection' => 'nullable|date',
        ]);

        $inspection = Inspection::create([
            'equipement_id' => $donnees['equipement_id'],
            'inspecteur_id' => $request->user()->id,
            'date_inspection' => $donnees['date_inspection'] ?? now(),
            'statut' => 'en_cours',
        ]);

        return response()->json(
            $inspection->load('equipement.site.client', 'equipement.typeEquipement'),
            201
        );
    }

    public function show(Inspection $inspection): JsonResponse
    {
        return response()->json($inspection->load([
            'equipement.site.client',
            'equipement.typeEquipement.famille',
            'inspecteur',
            'reponses.pointControle',
            'anomalies.photos',
            'photos',
            'essais',
            'documents',
            'signatures',
        ]));
    }

    /** Recalcule et renvoie la synthèse courante (utile pour rafraîchir l'UI sans tout recharger). */
    public function synthese(Inspection $inspection): JsonResponse
    {
        $this->syntheseService->recalculer($inspection);

        return response()->json([
            'nb_points_controles' => $inspection->nb_points_controles,
            'nb_conformes' => $inspection->nb_conformes,
            'nb_observations' => $inspection->nb_observations,
            'nb_non_conformes' => $inspection->nb_non_conformes,
            'nb_defauts_majeurs' => $inspection->nb_defauts_majeurs,
            'nb_dangers_immediats' => $inspection->nb_dangers_immediats,
            'avis_propose' => $inspection->avis_propose,
        ]);
    }

    /**
     * POST /inspections/{inspection}/valider
     * L'inspecteur peut modifier la conclusion proposée avant de valider
     * (cf. CDC section 18 : "l'inspecteur garde toujours la possibilité de
     * modifier ou valider la conclusion proposée").
     */
    public function valider(Request $request, Inspection $inspection): JsonResponse
    {
        if (! $inspection->estModifiable()) {
            return response()->json(['message' => 'Cette inspection a déjà été validée.'], 422);
        }

        $donnees = $request->validate([
            'conclusion' => 'nullable|string',
            // Permet à l'inspecteur de forcer la validation malgré des
            // photos obligatoires manquantes (cf. CDC section 14 : "peut
            // bloquer" -> on laisse un contournement explicite plutôt qu'un
            // blocage absolu, au cas où une photo est impossible à prendre).
            'ignorer_photos_manquantes' => 'boolean',
        ]);

        if (empty($donnees['ignorer_photos_manquantes'])) {
            $manquantes = $this->photosObligatoiresManquantes($inspection);
            if ($manquantes->isNotEmpty()) {
                return response()->json([
                    'message' => 'Photo(s) obligatoire(s) manquante(s) : ' . $manquantes->implode(', '),
                    'photos_manquantes' => $manquantes,
                ], 422);
            }
        }

        $this->syntheseService->recalculer($inspection);

        $inspection->update([
            'statut' => 'validee',
            'conclusion' => $donnees['conclusion'] ?? $inspection->avis_propose,
            'date_validation' => now(),
        ]);

        return response()->json($inspection);
    }

    private function photosObligatoiresManquantes(Inspection $inspection): \Illuminate\Support\Collection
    {
        $requises = $inspection->equipement->typeEquipement->photosObligatoires;
        $presentesIds = $inspection->photos()
            ->where('photographiable_type', 'photo_obligatoire')
            ->pluck('photographiable_id');

        return $requises
            ->whereNotIn('id', $presentesIds)
            ->pluck('libelle')
            ->values();
    }
}
