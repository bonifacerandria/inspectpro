<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rapport d'inspection {{ $rapport_numero }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 13px; margin: 18px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
        .sous-titre { color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; font-size: 10px; }
        th { background: #f5f5f5; }
        .grille-infos { width: 100%; margin-bottom: 4px; }
        .grille-infos td { border: none; padding: 2px 6px 2px 0; }
        .label { color: #666; width: 160px; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; color: #fff; font-size: 9px; font-weight: bold; }
        .badge-C { background: #2e7d32; } .badge-O { background: #f39c12; } .badge-NC { background: #e67e22; }
        .badge-DM { background: #c0392b; } .badge-DI { background: #7b0000; } .badge-NA { background: #999; }
        .synthese { display: table; width: 100%; margin-bottom: 10px; }
        .synthese-item { display: table-cell; text-align: center; padding: 8px; border: 1px solid #eee; }
        .synthese-chiffre { font-size: 16px; font-weight: bold; }
        .avis { font-weight: bold; font-size: 12px; margin: 10px 0; padding: 8px; background: #f5f5f5; }
        .anomalie { border: 1px solid #ddd; padding: 6px; margin-bottom: 6px; }
        .anomalie-titre { font-weight: bold; }
        .signatures { display: table; width: 100%; margin-top: 30px; }
        .signature-bloc { display: table-cell; width: 50%; padding: 10px; }
        .signature-ligne { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    {{-- 1. Informations générales --}}
    <h1>Rapport d'inspection — {{ $inspection->equipement->typeEquipement->libelle }}</h1>
    <p class="sous-titre">
        N° rapport {{ $rapport_numero }} · Généré le {{ now()->format('d/m/Y') }}
    </p>

    <table class="grille-infos">
        <tr><td class="label">Client</td><td>{{ $inspection->equipement->site->client->nom }}</td></tr>
        <tr><td class="label">Site</td><td>{{ $inspection->equipement->site->nom }}</td></tr>
        <tr><td class="label">Inspecteur</td><td>{{ $inspection->inspecteur->nom }}</td></tr>
        <tr><td class="label">Date d'inspection</td><td>{{ \Carbon\Carbon::parse($inspection->date_inspection)->format('d/m/Y') }}</td></tr>
    </table>

    {{-- 2 & 3. Identification et caractéristiques techniques --}}
    <h2>Identification de l'équipement</h2>
    <table class="grille-infos">
        <tr><td class="label">Type</td><td>{{ $inspection->equipement->typeEquipement->libelle }}</td></tr>
        <tr><td class="label">Marque / Modèle</td><td>{{ $inspection->equipement->marque }} {{ $inspection->equipement->modele }}</td></tr>
        <tr><td class="label">N° de série</td><td>{{ $inspection->equipement->numero_serie ?? '—' }}</td></tr>
        <tr><td class="label">N° équipement</td><td>{{ $inspection->equipement->numero_equipement ?? '—' }}</td></tr>
        <tr><td class="label">Année de fabrication</td><td>{{ $inspection->equipement->annee_fabrication ?? '—' }}</td></tr>
        <tr><td class="label">CMU</td><td>{{ $inspection->equipement->cmu_tonnes ?? '—' }} tonnes</td></tr>
        <tr><td class="label">Constructeur</td><td>{{ $inspection->equipement->constructeur ?? '—' }}</td></tr>
        <tr><td class="label">Localisation</td><td>{{ $inspection->equipement->localisation ?? '—' }}</td></tr>
    </table>

    {{-- 4. Documents examinés --}}
    @if($inspection->documents->isNotEmpty())
        <h2>Documents examinés</h2>
        <table>
            <thead><tr><th>Document</th><th>Présent</th><th>Commentaire</th></tr></thead>
            <tbody>
                @foreach($inspection->documents as $document)
                    <tr>
                        <td>{{ $document->libelle }}</td>
                        <td>{{ $document->present ? 'Oui' : 'Non' }}</td>
                        <td>{{ $document->commentaire ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- 5. Points de contrôle, groupés par section --}}
    <h2>Points de contrôle</h2>
    @foreach($sections as $section)
        <p style="font-weight: bold; margin: 8px 0 2px;">{{ $section['libelle'] }}</p>
        <table>
            <thead><tr><th>Point de contrôle</th><th>Résultat</th><th>Commentaire</th></tr></thead>
            <tbody>
                @foreach($section['reponses'] as $r)
                    <tr>
                        <td>{{ $r['libelle'] }}</td>
                        <td>
                            @if($r['statut'])
                                <span class="badge badge-{{ $r['statut'] }}">{{ $r['statut'] }}</span>
                            @else
                                {{ $r['valeur_affichee'] ?? '—' }}
                            @endif
                        </td>
                        <td>{{ $r['commentaire'] ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endforeach

    {{-- 6. Essais réalisés --}}
    @if($inspection->essais->isNotEmpty())
        <h2>Essais réalisés</h2>
        <table>
            <thead><tr><th>Essai</th><th>Charge d'essai</th><th>Résultat</th><th>Commentaire</th></tr></thead>
            <tbody>
                @foreach($inspection->essais as $essai)
                    <tr>
                        <td>{{ $essai->libelle }}</td>
                        <td>{{ $essai->charge_essai_kg ? $essai->charge_essai_kg . ' kg' : '—' }}</td>
                        <td>{{ $essai->resultat ?? '—' }}</td>
                        <td>{{ $essai->commentaire ?? '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- 7. Anomalies constatées --}}
    @if($inspection->anomalies->isNotEmpty())
        <h2>Anomalies constatées</h2>
        @foreach($inspection->anomalies as $anomalie)
            <div class="anomalie">
                <div class="anomalie-titre">
                    {{ $anomalie->numero }} — {{ ucfirst(str_replace('_', ' ', $anomalie->gravite)) }}
                </div>
                <div>{{ $anomalie->constat }}</div>
                @if($anomalie->action_recommandee)
                    <div><strong>Action recommandée :</strong> {{ $anomalie->action_recommandee }}</div>
                @endif
                @if($anomalie->responsable)
                    <div><strong>Responsable :</strong> {{ $anomalie->responsable }}
                        @if($anomalie->delai) — <strong>Délai :</strong> {{ \Carbon\Carbon::parse($anomalie->delai)->format('d/m/Y') }} @endif
                    </div>
                @endif
                @if($anomalie->photos->isNotEmpty())
                    <div>Photos : {{ $anomalie->photos->pluck('numero')->implode(', ') }}</div>
                @endif
            </div>
        @endforeach
    @endif

    <div class="page-break"></div>

    {{-- 9. Synthèse --}}
    <h2>Synthèse</h2>
    <div class="synthese">
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_points_controles }}</div>Contrôlés</div>
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_conformes }}</div>Conformes</div>
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_observations }}</div>Observations</div>
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_non_conformes }}</div>Non-conformes</div>
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_defauts_majeurs }}</div>Défauts majeurs</div>
        <div class="synthese-item"><div class="synthese-chiffre">{{ $inspection->nb_dangers_immediats }}</div>Danger immédiat</div>
    </div>

    {{-- 10. Conclusion --}}
    <h2>Conclusion</h2>
    <div class="avis">{{ $inspection->conclusion ?? $inspection->avis_propose }}</div>

    {{-- 11. Signatures --}}
    <div class="signatures">
        <div class="signature-bloc">
            <div>Inspecteur</div>
            <div class="signature-ligne">{{ $inspection->inspecteur->nom }}</div>
        </div>
        <div class="signature-bloc">
            <div>Client / Responsable</div>
            <div class="signature-ligne">&nbsp;</div>
        </div>
    </div>
</body>
</html>
