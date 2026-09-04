<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

/**
 * Gestion des comptes (admin uniquement — cf. vérification estAdmin() dans
 * chaque méthode ; pas de Policy dédiée pour rester cohérent avec le style
 * simple déjà utilisé sur le reste de l'API).
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->verifierAdmin($request);

        return response()->json(
            User::orderBy('nom')->get(['id', 'nom', 'email', 'role', 'telephone', 'actif', 'created_at'])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->verifierAdmin($request);

        $donnees = $this->valider($request, motDePasseRequis: true);

        $user = User::create([
            ...$donnees,
            'password' => Hash::make($donnees['password']),
        ]);

        return response()->json($user->only(['id', 'nom', 'email', 'role', 'telephone', 'actif']), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->verifierAdmin($request);

        $donnees = $this->valider($request, motDePasseRequis: false, idIgnore: $user->id);

        if (! empty($donnees['password'])) {
            $donnees['password'] = Hash::make($donnees['password']);
        } else {
            unset($donnees['password']);
        }

        $user->update($donnees);

        return response()->json($user->only(['id', 'nom', 'email', 'role', 'telephone', 'actif']));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->verifierAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Impossible de supprimer son propre compte.'], 422);
        }

        if ($user->inspections()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer un inspecteur ayant déjà réalisé des inspections. Désactive plutôt son compte.',
            ], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    private function verifierAdmin(Request $request): void
    {
        abort_unless($request->user()->estAdmin(), 403, 'Réservé aux administrateurs.');
    }

    private function valider(Request $request, bool $motDePasseRequis, ?int $idIgnore = null): array
    {
        return $request->validate([
            'nom' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email' . ($idIgnore ? ",{$idIgnore}" : ''),
            'password' => ($motDePasseRequis ? 'required' : 'nullable') . '|string|min:8',
            'role' => 'required|in:admin,inspecteur',
            'telephone' => 'nullable|string|max:30',
            'actif' => 'boolean',
        ]);
    }
}
