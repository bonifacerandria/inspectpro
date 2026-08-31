<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SiteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sites = Site::with('client')
            ->when($request->query('client_id'), fn ($q, $id) => $q->where('client_id', $id))
            ->orderBy('nom')
            ->get();

        return response()->json($sites);
    }

    public function store(Request $request): JsonResponse
    {
        $site = Site::create($this->valider($request));

        return response()->json($site->load('client'), 201);
    }

    public function show(Site $site): JsonResponse
    {
        return response()->json($site->load('client', 'equipements'));
    }

    public function update(Request $request, Site $site): JsonResponse
    {
        $site->update($this->valider($request));

        return response()->json($site->load('client'));
    }

    public function destroy(Site $site): JsonResponse
    {
        if ($site->equipements()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un site qui a des équipements rattachés.',
            ], 422);
        }

        $site->delete();

        return response()->json(null, 204);
    }

    private function valider(Request $request): array
    {
        return $request->validate([
            'client_id' => 'required|exists:clients,id',
            'nom' => 'required|string|max:200',
            'adresse' => 'nullable|string|max:255',
        ]);
    }
}
