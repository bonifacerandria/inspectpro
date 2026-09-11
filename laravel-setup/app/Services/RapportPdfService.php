<?php

namespace App\Services;

use App\Models\Inspection;
use App\Models\Rapport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

/**
 * Assemble les données de l'inspection au format attendu par la vue
 * resources/views/rapports/inspection.blade.php et génère le PDF final.
 */
class RapportPdfService
{
    public function genererPour(Inspection $inspection): Rapport
    {
        $inspection->load([
            'equipement.site.client',
            'equipement.typeEquipement.famille',
            'inspecteur',
            'reponses.pointControle.section',
            'anomalies',
            'essais',
            'documents',
            'photos',
        ]);

        $observations = $inspection->anomalies->values()->map(fn ($anomalie, $i) => [
            'numero' => $i + 1,
            'texte' => $anomalie->constat,
            'action' => $anomalie->action_recommandee,
        ]);

        $numeroObservationParReponse = [];
        foreach ($inspection->anomalies as $i => $anomalie) {
            if ($anomalie->reponse_controle_id) {
                $numeroObservationParReponse[$anomalie->reponse_controle_id] = $i + 1;
            }
        }

        $numeroRapport = $this->genererNumero($inspection);

        $pdf = Pdf::loadView('rapports.inspection', [
            'inspection' => $inspection,
            'sections' => $this->grouperParSection($inspection, $numeroObservationParReponse),
            'rapport_numero' => $numeroRapport,
            'observations' => $observations,
            'photo_generale_base64' => $this->photoGeneraleEnBase64($inspection),
            'registre_vise' => $this->registreVise($inspection),
            // Titre d'en-tête propre à la famille de l'équipement (géré
            // depuis "Paramètres > Gestion des familles") -> jamais codé en
            // dur, s'applique automatiquement à toute nouvelle famille.
            'titre_entete' => $inspection->equipement->typeEquipement->famille->titre_rapport
                ?: $inspection->equipement->typeEquipement->famille->libelle
                ?: 'ÉQUIPEMENTS DE LEVAGE',
        ])->setPaper('a4');

        $chemin = "rapports/inspection-{$inspection->id}-{$numeroRapport}.pdf";
        Storage::disk('public')->put($chemin, $pdf->output());

        return Rapport::updateOrCreate(
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

    private function grouperParSection(Inspection $inspection, array $numeroObservationParReponse): array
    {
        $labelsStatut = [
            'C' => 'Conforme', 'O' => 'Observation', 'NC' => 'Non conforme',
            'DM' => 'Défaut majeur', 'DI' => 'Danger immédiat', 'NA' => 'Non applicable',
        ];

        $groupes = [];

        foreach ($inspection->reponses as $reponse) {
            $section = $reponse->pointControle->section;
            $cle = $section?->code ?? 'GENERAL';

            $groupes[$cle] ??= [
                'libelle' => $section?->libelle ?? 'Général',
                'ordre' => $section?->ordre ?? 999,
                'reponses' => [],
            ];

            $constat = $reponse->commentaire
                ?: ($labelsStatut[$reponse->statut] ?? $reponse->valeur_choix ?? $reponse->valeur_texte ?? (string) $reponse->valeur_nombre ?: '—');

            if (isset($numeroObservationParReponse[$reponse->id])) {
                $constat .= " (voir observation n°{$numeroObservationParReponse[$reponse->id]})";
            }

            $groupes[$cle]['reponses'][] = [
                'libelle' => $reponse->pointControle->libelle,
                'constat' => $constat,
            ];
        }

        usort($groupes, fn ($a, $b) => $a['ordre'] <=> $b['ordre']);

        return $groupes;
    }

    private function photoGeneraleEnBase64(Inspection $inspection): ?string
    {
        $photo = $inspection->photos->first(
            fn ($p) => $p->photographiable_type === 'photo_obligatoire'
                && str_contains(mb_strtolower($p->libelle ?? ''), 'générale')
        );

        if (! $photo || ! Storage::disk('public')->exists($photo->chemin_fichier)) {
            return null;
        }

        $contenu = Storage::disk('public')->get($photo->chemin_fichier);
        $mime = Storage::disk('public')->mimeType($photo->chemin_fichier) ?: 'image/jpeg';

        return 'data:' . $mime . ';base64,' . base64_encode($contenu);
    }

    private function registreVise(Inspection $inspection): ?bool
    {
        $document = $inspection->documents->first(
            fn ($d) => str_contains(mb_strtolower($d->libelle ?? ''), 'registre')
        );

        return $document?->present;
    }
}
