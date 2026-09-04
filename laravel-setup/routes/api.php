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
    UserController,
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

    // --- Utilisateurs (admin uniquement, vérifié dans le contrôleur) ---
    Route::apiResource('users', UserController::class)->except(['show']);

    // --- Configuration du moteur d'inspection (admin) ---
    Route::get('/familles-equipement', [FamilleEquipementController::class, 'index']);
    Route::apiResource('types-equipement', TypeEquipementController::class)
        ->parameters(['types-equipement' => 'typeEquipement']);
    // ⚠️ ->parameters(...) est indispensable ici : sans lui, Laravel déduit le nom
    // de variable liée depuis l'URL ("types-equipement" -> "types_equipement"),
    // qui ne correspond pas à $typeEquipement dans le contrôleur -> la liaison
    // implicite échoue SILENCIEUSEMENT (aucune erreur), $typeEquipement vaut
    // null, et l'erreur n'apparaît que plus loin (ex: TypeError sur un service
    // qui attend un int). Même piège pour toute ressource au nom composé.
    Route::get('/types-equipement/{typeEquipement}/formulaire', [TypeEquipementController::class, 'formulaireComplet']);
    // ^ endpoint clé : renvoie sections + points_controle + photos/documents/essais requis
    //   pour un type d'équipement donné -> c'est ce que web ET mobile consomment
    //   pour construire dynamiquement l'écran d'inspection.
    Route::apiResource('sections-controle', SectionControleController::class)
        ->except(['show'])
        ->parameters(['sections-controle' => 'sectionControle']);
    Route::apiResource('points-controle', PointControleController::class)
        ->parameters(['points-controle' => 'pointControle']);

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
    Route::get('/rapports', [RapportController::class, 'index']);
    Route::post('/inspections/{inspection}/rapport', [RapportController::class, 'generer']);
    Route::get('/rapports/{rapport}/telecharger', [RapportController::class, 'telecharger'])->name('rapports.telecharger');

    // --- Statistiques (dashboard admin) ---
    Route::get('/statistiques', [StatistiqueController::class, 'index']);
});
