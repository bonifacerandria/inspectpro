<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Authentification par email/mot de passe, renvoie un token Sanctum
     * "personal access token" (pas de mode SPA/cookie : web ET mobile
     * consomment l'API de la même façon, avec un Bearer token).
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ["Identifiants incorrects."],
            ]);
        }

        if (! $user->actif) {
            throw ValidationException::withMessages([
                'email' => ["Ce compte a été désactivé."],
            ]);
        }

        // Un seul token actif par appareil : on nomme le token d'après le
        // user-agent pour pouvoir les distinguer/révoquer individuellement
        // depuis un futur écran "sessions actives".
        $token = $user->createToken($request->userAgent() ?? 'token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nom' => $user->nom,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /** POST /api/logout — révoque uniquement le token utilisé pour cette requête. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    /** GET /api/me — utile au démarrage de l'app pour restaurer la session. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'nom' => $user->nom,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }
}
