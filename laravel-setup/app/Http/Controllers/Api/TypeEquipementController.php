<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeEquipement;
use App\Services\FormulaireInspectionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TypeEquipementController extends Controller
{
    public function __construct(private FormulaireInspectionService $formulaireService)
    {
    }

    /** Liste des types d'équipement, groupés par famille (pour l'écran de sélection). */
    public function index(): JsonResponse
    {
        $types = TypeEquipement::with('famille')
            ->orderBy('ordre')
            ->get()
            ->groupBy(fn ($t) => $t->famille->code ?? 'AUTRE');

        return response()->json($types);
    }

    public function store(Request $request): JsonResponse
    {
        $type = TypeEquipement::create($this->valider($request));

        return response()->json($type->load('famille'), 201);
    }

    public function show(TypeEquipement $typeEquipement): JsonResponse
    {
        return response()->json($typeEquipement->load('famille'));
    }

    public function update(Request $request, TypeEquipement $typeEquipement): JsonResponse
    {
        $typeEquipement->update($this->valider($request, $typeEquipement->id));

        FormulaireInspectionService::invalider($typeEquipement->id);

        return response()->json($typeEquipement->load('famille'));
    }

    public function destroy(TypeEquipement $typeEquipement): JsonResponse
    {
        if ($typeEquipement->equipements()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un type utilisé par des équipements existants. Désactivez-le plutôt.',
            ], 422);
        }

        $typeEquipement->delete();
        FormulaireInspectionService::invalider($typeEquipement->id);

        return response()->json(null, 204);
    }

    /**
     * GET /types-equipement/{type}/formulaire
     * Endpoint central consommé par le web ET le mobile pour construire
     * dynamiquement l'écran d'inspection (sections, points de contrôle,
     * photos/documents/essais requis).
     */
    public function formulaireComplet(TypeEquipement $typeEquipement): JsonResponse
    {
        return response()->json(
            $this->formulaireService->construire($typeEquipement)
        );
    }

    private function valider(Request $request, ?int $ignorerId = null): array
    {
        return $request->validate([
            'famille_id' => 'required|exists:familles_equipement,id',
            'code' => 'required|string|max:50|unique:types_equipement,code' . ($ignorerId ? ",{$ignorerId}" : ''),
            'libelle' => 'required|string|max:150',
            'icone' => 'nullable|string|max:100',
            'actif' => 'boolean',
            'champs_identification' => 'nullable|array',
            'ordre' => 'integer',
        ]);
    }
}
