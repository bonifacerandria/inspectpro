<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    ClientController,
    SiteController,
    EquipementController,
    FamilleEquipementController,
    TypeEquipementController,
    SectionControleController,
    PointControleController,
    InspectionController,
    ReponseControleController,
    AnomalieController,
    PhotoController,
    RapportController,
    StatistiqueController,
};

/*
|--------------------------------------------------------------------------
| Routes publiques
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Routes protégées (Sanctum)
|--------------------------------------------------------------------------
| Consommées à la fois par l'app web (React) et l'app mobile (React Native).
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // --- Référentiel client / site / équipement ---
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('sites', SiteController::class);
    Route::apiResource('equipements', EquipementController::class);
    Route::post('/equipements/{equipement}/ocr-plaque', [EquipementController::class, 'lireOcrPlaque']);

    // --- Configuration du moteur d'inspection (admin) ---
    Route::get('/familles-equipement', [FamilleEquipementController::class, 'index']);
    Route::apiResource('types-equipement', TypeEquipementController::class);
    Route::get('/types-equipement/{type}/formulaire', [TypeEquipementController::class, 'formulaireComplet']);
    // ^ endpoint clé : renvoie sections + points_controle + photos/documents/essais requis
    //   pour un type d'équipement donné -> c'est ce que web ET mobile consomment
    //   pour construire dynamiquement l'écran d'inspection.
    Route::apiResource('sections-controle', SectionControleController::class)->except(['show']);
    Route::apiResource('points-controle', PointControleController::class);

    // --- Inspections ---
    Route::apiResource('inspections', InspectionController::class);
    Route::post('/inspections/{inspection}/reponses', [ReponseControleController::class, 'store']);
    Route::post('/inspections/{inspection}/valider', [InspectionController::class, 'valider']);
    Route::get('/inspections/{inspection}/synthese', [InspectionController::class, 'synthese']);

    // --- Anomalies & photos ---
    Route::apiResource('anomalies', AnomalieController::class);
    Route::get('/photos', [PhotoController::class, 'index']);
    Route::post('/photos', [PhotoController::class, 'store']); // upload multipart
    Route::delete('/photos/{photo}', [PhotoController::class, 'destroy']);

    // --- Rapport PDF ---
    Route::post('/inspections/{inspection}/rapport', [RapportController::class, 'generer']);
    Route::get('/rapports/{rapport}/telecharger', [RapportController::class, 'telecharger'])->name('rapports.telecharger');

    // --- Statistiques (dashboard admin) ---
    Route::get('/statistiques', [StatistiqueController::class, 'index']);
});
