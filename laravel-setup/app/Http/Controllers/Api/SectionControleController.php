<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SectionControle;
use App\Services\FormulaireInspectionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SectionControleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sections = SectionControle::query()
            ->when($request->query('type_equipement_id'), fn ($q, $id) => $q->where('type_equipement_id', $id))
            ->orderBy('ordre')
            ->get();

        return response()->json($sections);
    }

    public function store(Request $request): JsonResponse
    {
        $section = SectionControle::create($this->valider($request));

        return response()->json($section, 201);
    }

    public function update(Request $request, SectionControle $sectionControle): JsonResponse
    {
        $sectionControle->update($this->valider($request, $sectionControle->id));

        return response()->json($sectionControle);
    }

    public function destroy(SectionControle $sectionControle): JsonResponse
    {
        if ($sectionControle->pointsControle()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une section qui contient des points de contrôle.',
            ], 422);
        }

        $typeId = $sectionControle->type_equipement_id;
        $sectionControle->delete();
        FormulaireInspectionService::invalider($typeId);

        return response()->json(null, 204);
    }

    private function valider(Request $request, ?int $ignorerId = null): array
    {
        return $request->validate([
            'type_equipement_id' => 'required|exists:types_equipement,id',
            'code' => 'required|string|max:50',
            'libelle' => 'required|string|max:150',
            'ordre' => 'integer',
        ]);
    }
}
