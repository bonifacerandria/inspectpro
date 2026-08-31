<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointControle;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PointControleController extends Controller
{
    private const TYPES_REPONSE = [
        'oui_non', 'conforme_echelle', 'texte', 'nombre', 'photo', 'choix_multiple', 'mesure',
    ];

    public function index(Request $request): JsonResponse
    {
        $points = PointControle::query()
            ->when($request->query('type_equipement_id'), fn ($q, $id) => $q->where('type_equipement_id', $id))
            ->when($request->query('section_id'), fn ($q, $id) => $q->where('section_id', $id))
            ->orderBy('ordre')
            ->get();

        return response()->json($points);
    }

    public function store(Request $request): JsonResponse
    {
        // L'invalidation du cache du formulaire se fait automatiquement via
        // InvalideFormulaireCacheObserver, branché sur ce modèle.
        $point = PointControle::create($this->valider($request));

        return response()->json($point, 201);
    }

    public function show(PointControle $pointControle): JsonResponse
    {
        return response()->json($pointControle);
    }

    public function update(Request $request, PointControle $pointControle): JsonResponse
    {
        $pointControle->update($this->valider($request, $pointControle->id));

        return response()->json($pointControle);
    }

    public function destroy(PointControle $pointControle): JsonResponse
    {
        if ($pointControle->reponses()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un point de contrôle déjà utilisé dans des inspections. Désactivez-le plutôt.',
            ], 422);
        }

        $pointControle->delete();

        return response()->json(null, 204);
    }

    private function valider(Request $request, ?int $ignorerId = null): array
    {
        $donnees = $request->validate([
            'type_equipement_id' => 'required|exists:types_equipement,id',
            'section_id' => 'nullable|exists:sections_controle,id',
            'code' => 'required|string|max:20',
            'libelle' => 'required|string|max:200',
            'type_reponse' => 'required|in:' . implode(',', self::TYPES_REPONSE),
            'options' => 'nullable|array',                    // requis en pratique si choix_multiple
            'unite_mesure' => 'nullable|string|max:20',
            'valeur_nominale' => 'nullable|numeric',
            'tolerance_pourcent' => 'nullable|numeric',
            'obligatoire' => 'boolean',
            'ordre' => 'integer',
            'actif' => 'boolean',
        ]);

        // Cohérence métier : les champs "options" et "mesure" n'ont de sens
        // que pour leur type_reponse correspondant — on les nettoie plutôt
        // que de faire confiance à ce que le client a pu laisser traîner.
        if ($donnees['type_reponse'] !== 'choix_multiple') {
            $donnees['options'] = null;
        }
        if ($donnees['type_reponse'] !== 'mesure') {
            $donnees['unite_mesure'] = null;
            $donnees['valeur_nominale'] = null;
            $donnees['tolerance_pourcent'] = null;
        }

        return $donnees;
    }
}
