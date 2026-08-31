<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    private const TYPES_AUTORISES = [
        'anomalie', 'equipement', 'document', 'photo_obligatoire', 'signature', 'reponse_controle',
    ];

    /**
     * POST /photos (multipart/form-data)
     * Upload générique réutilisé par tous les contextes photo de l'app :
     * anomalies, photos obligatoires, points de contrôle de type "photo",
     * documents scannés. Le couple (photographiable_type, photographiable_id)
     * indique où la photo se rattache.
     */
    public function store(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'inspection_id' => 'nullable|exists:inspections,id',
            'photographiable_type' => 'required|in:' . implode(',', self::TYPES_AUTORISES),
            'photographiable_id' => 'required|integer',
            'libelle' => 'nullable|string|max:150',
            'photo' => 'required|file|image|max:10240', // 10 Mo max
        ]);

        $inspectionId = $donnees['inspection_id'] ?? null;
        $dossier = $inspectionId ? "photos/inspections/{$inspectionId}" : 'photos/divers';

        $chemin = $request->file('photo')->store($dossier, 'public');

        $numero = 'Photo ' . (
            Photo::where('inspection_id', $inspectionId)->count() + 1
        );

        $photo = Photo::create([
            'inspection_id' => $inspectionId,
            'photographiable_type' => $donnees['photographiable_type'],
            'photographiable_id' => $donnees['photographiable_id'],
            'libelle' => $donnees['libelle'] ?? null,
            'numero' => $numero,
            'chemin_fichier' => $chemin,
            'prise_le' => now(),
            'created_at' => now(),
        ]);

        return response()->json([
            ...$photo->toArray(),
            'url' => Storage::disk('public')->url($chemin),
        ], 201);
    }

    /** GET /photos?photographiable_type=...&photographiable_id=... */
    public function index(Request $request): JsonResponse
    {
        $photos = Photo::query()
            ->when($request->query('inspection_id'), fn ($q, $id) => $q->where('inspection_id', $id))
            ->when($request->query('photographiable_type'), fn ($q, $t) => $q->where('photographiable_type', $t))
            ->when($request->query('photographiable_id'), fn ($q, $id) => $q->where('photographiable_id', $id))
            ->get()
            ->map(fn ($p) => [...$p->toArray(), 'url' => Storage::disk('public')->url($p->chemin_fichier)]);

        return response()->json($photos);
    }

    public function destroy(Photo $photo): JsonResponse
    {
        Storage::disk('public')->delete($photo->chemin_fichier);
        $photo->delete();

        return response()->json(null, 204);
    }
}
