<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\Rapport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

/**
 * Assemble les données de l'inspection au format attendu par la vue
 * resources/views/rapports/inspection.blade.php et génère le PDF final
 * (cf. CDC section 20 : structure du rapport en 11 parties).
 *
 * Nécessite le package barryvdh/laravel-dompdf :
 *   composer require barryvdh/laravel-dompdf
 */
class RapportPdfService
{
    public function genererPour(Inspection $inspection): Rapport
    {
        $inspection->load([
            'equipement.site.client',
            'equipement.typeEquipement',
            'inspecteur',
            'reponses.pointControle.section',
            'anomalies.photos',
            'essais',
            'documents',
        ]);

        $numeroRapport = $this->genererNumero($inspection);

        $pdf = Pdf::loadView('rapports.inspection', [
            'inspection' => $inspection,
            'sections' => $this->grouperParSection($inspection),
            'rapport_numero' => $numeroRapport,
        ])->setPaper('a4');

        $chemin = "rapports/inspection-{$inspection->id}-{$numeroRapport}.pdf";
        Storage::disk('public')->put($chemin, $pdf->output());

        return \App\Models\Rapport::updateOrCreate(
            ['inspection_id' => $inspection->id],
            [
                'numero_rapport' => $numeroRapport,
                'chemin_fichier_pdf' => $chemin,
                'genere_le' => now(),
            ]
        );
    }

    private function genererNumero(Inspection $inspection): string
    {
        return sprintf(
            'RAP-%s-%04d',
            \Carbon\Carbon::parse($inspection->date_inspection)->format('Ymd'),
            $inspection->id
        );
    }

    /**
     * Regroupe les réponses par section (dans l'ordre du formulaire) pour
     * que le PDF reproduise la même structure que l'écran d'inspection.
     */
    private function grouperParSection(Inspection $inspection): array
    {
        $groupes = [];

        foreach ($inspection->reponses as $reponse) {
            $section = $reponse->pointControle->section;
            $cle = $section?->code ?? 'GENERAL';

            $groupes[$cle] ??= [
                'libelle' => $section?->libelle ?? 'Général',
                'ordre' => $section?->ordre ?? 999,
                'reponses' => [],
            ];

            $groupes[$cle]['reponses'][] = [
                'libelle' => $reponse->pointControle->libelle,
                'statut' => in_array($reponse->statut, ['C', 'O', 'NC', 'DM', 'DI', 'NA'], true) ? $reponse->statut : null,
                'valeur_affichee' => $reponse->valeur_choix ?? $reponse->valeur_texte ?? $reponse->valeur_nombre,
                'commentaire' => $reponse->commentaire,
            ];
        }

        usort($groupes, fn ($a, $b) => $a['ordre'] <=> $b['ordre']);

        return $groupes;
    }
}
