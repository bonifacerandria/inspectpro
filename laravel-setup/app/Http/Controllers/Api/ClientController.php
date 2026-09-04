<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $recherche = $request->query('recherche');
        $parPage = min((int) $request->query('per_page', 20), 500);

        $clients = Client::withCount('sites')
            ->when($recherche, fn ($q) => $q->where('nom', 'ilike', "%{$recherche}%"))
            ->orderBy('nom')
            ->paginate($parPage);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $donnees = $this->valider($request);

        $client = Client::create($donnees);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json($client->load('sites'));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $donnees = $this->valider($request);

        $client->update($donnees);

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        // La suppression cascade sur les sites (et donc équipements/inspections
        // via les FK ON DELETE CASCADE) — on bloque volontairement si des
        // sites existent déjà, pour éviter une perte de données accidentelle.
        if ($client->sites()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un client qui a des sites rattachés.',
            ], 422);
        }

        $client->delete();

        return response()->json(null, 204);
    }

    private function valider(Request $request): array
    {
        return $request->validate([
            'nom' => 'required|string|max:200',
            'adresse' => 'nullable|string|max:255',
            'contact' => 'nullable|string|max:150',
            'telephone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:150',
            'reference_client' => 'nullable|string|max:100',
        ]);
    }
}
