<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EquipementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $equipements = Equipement::with(['site.client', 'typeEquipement.famille', 'derniereInspection'])
            ->when($request->query('site_id'), fn ($q, $id) => $q->where('site_id', $id))
            ->when($request->query('type_equipement_id'), fn ($q, $id) => $q->where('type_equipement_id', $id))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($equipements);
    }

    public function store(Request $request): JsonResponse
    {
        $equipement = Equipement::create($this->valider($request));

        return response()->json($equipement->load('site.client', 'typeEquipement'), 201);
    }

    public function show(Equipement $equipement): JsonResponse
    {
        return response()->json(
            $equipement->load('site.client', 'typeEquipement.famille', 'inspections.inspecteur')
        );
    }

    public function update(Request $request, Equipement $equipement): JsonResponse
    {
        $equipement->update($this->valider($request));

        return response()->json($equipement->load('site.client', 'typeEquipement'));
    }

    public function destroy(Equipement $equipement): JsonResponse
    {
        if ($equipement->inspections()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un équipement ayant des inspections. Archivez-le plutôt.',
            ], 422);
        }

        $equipement->delete();

        return response()->json(null, 204);
    }

    private function valider(Request $request): array
    {
        return $request->validate([
            'site_id' => 'required|exists:sites,id',
            'type_equipement_id' => 'required|exists:types_equipement,id',
            'marque' => 'nullable|string|max:100',
            'modele' => 'nullable|string|max:100',
            'numero_serie' => 'nullable|string|max:100',
            'numero_equipement' => 'nullable|string|max:100',
            'annee_fabrication' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'cmu_tonnes' => 'nullable|numeric|min:0',
            'constructeur' => 'nullable|string|max:150',
            'localisation' => 'nullable|string|max:200',
            // champs variables selon le type (portée, immatriculation...),
            // cf. TypeEquipement::champs_identification qui indique au
            // frontend quels champs afficher pour ce type précis.
            'champs_supplementaires' => 'nullable|array',
        ]);
    }
}
