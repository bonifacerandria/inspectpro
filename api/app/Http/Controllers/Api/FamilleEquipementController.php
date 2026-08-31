<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FamilleEquipement;
use Illuminate\Http\JsonResponse;

class FamilleEquipementController extends Controller
{
    /** Liste en lecture seule — les 3 familles sont fixées par le CDC, pas de CRUD nécessaire. */
    public function index(): JsonResponse
    {
        return response()->json(FamilleEquipement::orderBy('ordre')->get());
    }
}
