<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Anomalie;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnomalieController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $anomalies = Anomalie::with('photos')
            ->when($request->query('inspection_id'), fn ($q, $id) => $q->where('inspection_id', $id))
            ->when($request->query('statut'), fn ($q, $s) => $q->where('statut', $s))
            ->orderBy('numero')
            ->get();

        return response()->json($anomalies);
    }

    public function show(Anomalie $anomalie): JsonResponse
    {
        return response()->json($anomalie->load('photos', 'inspection'));
    }

    /**
     * L'anomalie elle-même est créée automatiquement par
     * ReponseControleController — cet endpoint sert uniquement à compléter
     * les champs que l'inspecteur renseigne après coup (action recommandée,
     * responsable, délai) ou à la marquer comme levée.
     */
    public function update(Request $request, Anomalie $anomalie): JsonResponse
    {
        $donnees = $request->validate([
            'constat' => 'sometimes|string',
            'action_recommandee' => 'nullable|string',
            'responsable' => 'nullable|string|max:150',
            'delai' => 'nullable|date',
            'statut' => 'sometimes|in:ouverte,levee',
        ]);

        $anomalie->update($donnees);

        return response()->json($anomalie);
    }

    public function destroy(Anomalie $anomalie): JsonResponse
    {
        $anomalie->delete();

        return response()->json(null, 204);
    }
}
