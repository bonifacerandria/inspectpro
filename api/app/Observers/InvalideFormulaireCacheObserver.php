<?php

namespace App\Observers;

use App\Services\FormulaireInspectionService;

/**
 * Un seul Observer générique, branché sur PointControle, SectionControle,
 * PhotoObligatoire, DocumentRequis et EssaiRequis (voir AppServiceProvider).
 * Toute création/modification/suppression sur le référentiel invalide le
 * cache du formulaire correspondant, pour que web et mobile voient tout de
 * suite le changement au prochain appel de l'API.
 */
class InvalideFormulaireCacheObserver
{
    public function saved($model): void
    {
        $this->invalider($model);
    }

    public function deleted($model): void
    {
        $this->invalider($model);
    }

    private function invalider($model): void
    {
        $typeEquipementId = $model->type_equipement_id ?? null;

        if ($typeEquipementId) {
            FormulaireInspectionService::invalider($typeEquipementId);
        }
    }
}
