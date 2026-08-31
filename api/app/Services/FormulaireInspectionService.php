<?php

namespace App\Services;

use App\Models\TypeEquipement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Assemble le formulaire d'inspection complet d'un type d'équipement :
 * sections + points de contrôle + photos/documents/essais requis.
 *
 * C'est le SEUL endroit du backend qui connaît la structure d'un formulaire.
 * Le web (React) et le mobile (React Native) consomment tous les deux la
 * sortie de ce service via GET /types-equipement/{type}/formulaire et
 * construisent leur UI dynamiquement à partir de "type_reponse" — aucun des
 * deux clients ne doit jamais coder en dur "si pont roulant alors...".
 *
 * Résultat mis en cache car le formulaire ne change que lorsqu'un admin
 * modifie le référentiel (rare) — voir Observers/InvalideFormulaireCache
 * pour l'invalidation automatique.
 */
class FormulaireInspectionService
{
    private const CACHE_TTL_SECONDES = 3600;

    public function construire(TypeEquipement|int $typeEquipement): array
    {
        $typeId = $typeEquipement instanceof TypeEquipement ? $typeEquipement->id : $typeEquipement;

        return Cache::remember(
            $this->cleCache($typeId),
            self::CACHE_TTL_SECONDES,
            fn () => $this->assembler($typeId)
        );
    }

    public static function invalider(int $typeEquipementId): void
    {
        Cache::forget((new self())->cleCache($typeEquipementId));
    }

    private function cleCache(int $typeEquipementId): string
    {
        return "formulaire_inspection:type:{$typeEquipementId}";
    }

    private function assembler(int $typeId): array
    {
        $type = TypeEquipement::with([
            'famille',
            'sections.pointsControle' => fn ($q) => $q->where('actif', true)->orderBy('ordre'),
            'photosObligatoires',
            'documentsRequis',
            'essaisRequis',
        ])->findOrFail($typeId);

        // Points de contrôle rattachés directement au type (pas de section) :
        // regroupés sous une section virtuelle "Général" pour garder une
        // structure homogène côté client.
        $pointsSansSection = $type->pointsControle()->whereNull('section_id')->get();

        $sections = $type->sections->map(fn ($section) => [
            'id' => $section->id,
            'code' => $section->code,
            'libelle' => $section->libelle,
            'ordre' => $section->ordre,
            'points_controle' => $section->pointsControle
                ->map(fn ($p) => $this->formaterPoint($p))
                ->values(),
        ]);

        if ($pointsSansSection->isNotEmpty()) {
            $sections->push([
                'id' => null,
                'code' => 'GENERAL',
                'libelle' => 'Général',
                'ordre' => 999,
                'points_controle' => $pointsSansSection
                    ->map(fn ($p) => $this->formaterPoint($p))
                    ->values(),
            ]);
        }

        $sections = $sections->sortBy('ordre')->values();

        return [
            'type_equipement' => [
                'id' => $type->id,
                'code' => $type->code,
                'libelle' => $type->libelle,
                'famille' => [
                    'id' => $type->famille->id,
                    'code' => $type->famille->code,
                    'libelle' => $type->famille->libelle,
                ],
                'champs_identification' => $type->champs_identification ?? [],
            ],
            'sections' => $sections,
            'photos_obligatoires' => $type->photosObligatoires->map(fn ($p) => [
                'id' => $p->id,
                'libelle' => $p->libelle,
                'ordre' => $p->ordre,
            ])->values(),
            'documents_requis' => $type->documentsRequis->map(fn ($d) => [
                'id' => $d->id,
                'libelle' => $d->libelle,
                'obligatoire' => $d->obligatoire,
                'ordre' => $d->ordre,
            ])->values(),
            'essais_requis' => $type->essaisRequis->map(fn ($e) => [
                'id' => $e->id,
                'libelle' => $e->libelle,
                'necessite_charge' => $e->necessite_charge,
                'ordre' => $e->ordre,
            ])->values(),
            'nb_points_controles' => $this->compterPoints($sections),
        ];
    }

    private function formaterPoint($point): array
    {
        return [
            'id' => $point->id,
            'code' => $point->code,
            'libelle' => $point->libelle,
            // Le client (web/mobile) choisit son widget de saisie selon cette valeur :
            // oui_non | conforme_echelle | texte | nombre | photo | choix_multiple | mesure
            'type_reponse' => $point->type_reponse,
            'options' => $point->options,               // si choix_multiple
            'unite_mesure' => $point->unite_mesure,      // si mesure
            'valeur_nominale' => $point->valeur_nominale,
            'tolerance_pourcent' => $point->tolerance_pourcent,
            'obligatoire' => $point->obligatoire,
            'ordre' => $point->ordre,
        ];
    }

    private function compterPoints(Collection $sections): int
    {
        return $sections->sum(fn ($s) => count($s['points_controle']));
    }
}
