<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FamilleEquipement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * CRUD complet des familles d'équipement. Le CDC en prévoyait 3 fixes
 * (Accessoires/Mobiles/Fixes), mais rien n'empêche d'en ajouter d'autres à
 * l'usage (ex: "Levage électrique", "Engins de chantier"...) — une fois
 * créée, une famille apparaît automatiquement dans le menu déroulant de
 * création d'un type d'équipement (GET /familles-equipement, déjà
 * consommé par le frontend) et dans l'en-tête des rapports PDF via son
 * titre_rapport.
 */
class FamilleEquipementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(FamilleEquipement::orderBy('ordre')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $this->verifierAdmin($request);

        $famille = FamilleEquipement::create($this->valider($request));

        return response()->json($famille, 201);
    }

    public function update(Request $request, FamilleEquipement $familleEquipement): JsonResponse
    {
        $this->verifierAdmin($request);

        $familleEquipement->update($this->valider($request, $familleEquipement->id));

        return response()->json($familleEquipement);
    }

    public function destroy(Request $request, FamilleEquipement $familleEquipement): JsonResponse
    {
        $this->verifierAdmin($request);

        if ($familleEquipement->typesEquipement()->exists()) {
            return response()->json([
                'message' => "Impossible de supprimer une famille utilisée par des types d'équipement existants.",
            ], 422);
        }

        $familleEquipement->delete();

        return response()->json(null, 204);
    }

    private function verifierAdmin(Request $request): void
    {
        abort_unless($request->user()->estAdmin(), 403, 'Réservé aux administrateurs.');
    }

    private function valider(Request $request, ?int $ignorerId = null): array
    {
        return $request->validate([
            'code' => 'required|string|max:30|unique:familles_equipement,code' . ($ignorerId ? ",{$ignorerId}" : ''),
            'libelle' => 'required|string|max:100',
            // Affiché dans l'en-tête du rapport PDF pour cette famille -
            // si laissé vide, le PDF retombe sur "ÉQUIPEMENTS DE LEVAGE".
            'titre_rapport' => 'nullable|string|max:150',
            'ordre' => 'integer',
        ]);
    }
}
