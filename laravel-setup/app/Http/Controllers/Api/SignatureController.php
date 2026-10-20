<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SignatureController extends Controller
{
    /** GET /inspections/{inspection}/signatures */
    public function index(Inspection $inspection): JsonResponse
    {
        return response()->json(
            $inspection->signatures->map(fn ($s) => [
                ...$s->toArray(),
                'url' => Storage::disk('public')->url($s->chemin_fichier),
            ])
        );
    }

    /**
     * POST /inspections/{inspection}/signatures (multipart)
     * Une seule signature par type (inspecteur / client) et par inspection :
     * une nouvelle remplace l'ancienne.
     */
    public function store(Request $request, Inspection $inspection): JsonResponse
    {
        if (! $inspection->peutEtreValidee()) {
            return response()->json(['message' => 'Cette inspection ne peut plus être signée.'], 422);
        }

        $donnees = $request->validate([
            'type_signataire' => 'required|in:inspecteur,client',
            'nom' => 'required|string|max:150',
            'signature' => 'required|file|image|max:2048',
        ]);

        $fichier = $request->file('signature');
        if (! $fichier->isValid()) {
            return response()->json(['message' => "L'upload de la signature a échoué. Réessaie."], 422);
        }

        $chemin = $fichier->store("signatures/inspections/{$inspection->id}", 'public');

        $existante = $inspection->signatures()->where('type_signataire', $donnees['type_signataire'])->first();
        if ($existante) {
            Storage::disk('public')->delete($existante->chemin_fichier);
            $existante->update(['nom' => $donnees['nom'], 'chemin_fichier' => $chemin, 'signe_le' => now()]);
            $signature = $existante;
        } else {
            $signature = $inspection->signatures()->create([
                'type_signataire' => $donnees['type_signataire'],
                'nom' => $donnees['nom'],
                'chemin_fichier' => $chemin,
                'signe_le' => now(),
            ]);
        }

        return response()->json([
            ...$signature->toArray(),
            'url' => Storage::disk('public')->url($chemin),
        ], 201);
    }
}
