<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rapport {{ $rapport_numero }}</title>
    <style>
        @page { margin: 22mm 18mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10.5px; color: #111; line-height: 1.45; }
        table { width: 100%; border-collapse: collapse; }
        .page-break { page-break-before: always; }

        .entete { width: 100%; border: 1.5px solid #000; margin-bottom: 14px; table-layout: fixed; }
        .entete td { border: none; padding: 8px 10px; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; }
        .entete .case-logo { width: 15%; border-right: 1.5px solid #000; text-align: center; font-size: 9px; color: #999; }
        .entete .case-titre { width: 50%; border-right: 1.5px solid #000; font-size: 15px; font-weight: bold; text-align: center; }
        .entete .case-meta { width: 35%; font-size: 9.5px; line-height: 1.6; }
        .entete .case-meta div { white-space: normal; }
        .sous-titre-page { text-align: center; font-weight: bold; font-size: 10.5px; margin: 4px 0 14px; }

        .blocs-adresses { width: 100%; margin-bottom: 18px; }
        .blocs-adresses td { vertical-align: top; font-size: 10px; font-style: italic; font-weight: bold; text-align: center; width: 50%; line-height: 1.5; }
        p { margin: 0 0 10px; }
        .encadre-photo {
            width: 260px; height: 190px; border: 1.5px solid #000; margin: 14px auto;
            display: table; text-align: center;
        }
        .encadre-photo-cellule { display: table-cell; vertical-align: middle; text-align: center; }
        .encadre-photo img { max-width: 250px; max-height: 180px; }
        .encadre-photo .placeholder { color: #999; font-size: 11px; }
        .case-registre { margin: 16px 0; }
        .case-registre .case { display: inline-block; width: 11px; height: 11px; border: 1px solid #000; text-align: center; line-height: 10px; font-size: 9px; margin-right: 4px; }
        .zone-signature { width: 100%; margin-top: 26px; }
        .zone-signature td { width: 50%; vertical-align: top; font-size: 10px; }
        .zone-signature .titre-signature { font-weight: bold; text-decoration: underline; margin-bottom: 30px; display: block; }

        .grille-identif { width: 100%; margin-bottom: 12px; border: 1px solid #000; }
        .grille-identif td { border: 1px solid #000; padding: 5px 8px; font-size: 10px; }
        .grille-identif .label { font-weight: bold; width: 25%; background: #f2f2f2; }
        .titre-section { font-weight: bold; font-size: 11px; margin: 16px 0 6px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .resultat-box {
            border: 2px solid #000; padding: 10px; text-align: center; font-weight: bold; font-size: 12px;
            margin: 10px 0; background: #f7f7f7;
        }
        .resultat-box.inapte { background: #fdecec; }
        .observations ol { margin: 0; padding-left: 18px; }
        .observations li { margin-bottom: 6px; }
        .observations .action { font-style: italic; color: #444; font-size: 9.5px; }

        .table-controle { margin-bottom: 14px; }
        .table-controle th, .table-controle td { border: 1px solid #000; padding: 4px 8px; font-size: 9.5px; text-align: left; }
        .table-controle th { background: #eee; font-weight: bold; }
        .table-controle .col-point { width: 45%; }

        .pied-page { position: fixed; bottom: -16mm; left: 0; right: 0; text-align: center; font-size: 8.5px; color: #666; border-top: 0.5px solid #ccc; padding-top: 4px; }
        .pied-page .num-rapport { float: left; }
        .pied-page .num-page { float: right; }
    </style>
</head>
<body>

{{-- =================== PAGE 1 : LETTRE D'ACCOMPAGNEMENT =================== --}}
<table class="entete">
    <tr>
        <td class="case-logo">LOGO</td>
        <td class="case-titre">ÉQUIPEMENTS DE LEVAGE</td>
        <td class="case-meta">
            <div><strong>Rapport N° :</strong> {{ $rapport_numero }}</div>
            <div><strong>Date :</strong> {{ \Carbon\Carbon::parse($inspection->date_inspection)->format('d/m/Y') }}</div>
        </td>
    </tr>
</table>

<table class="blocs-adresses">
    <tr>
        <td>
            InspectPro<br>
            Banque Malgache de l'Océan Indien<br>
            Antananarivo — Madagascar
        </td>
        <td>
            {{ $inspection->equipement->site->client->nom }}<br>
            @if($inspection->equipement->site->client->adresse)
                {{ $inspection->equipement->site->client->adresse }}<br>
            @endif
            {{ $inspection->equipement->site->nom }}
        </td>
    </tr>
</table>

<p>Messieurs,</p>
<p>Nous vous prions de bien vouloir trouver ci-joint le compte-rendu de vérification concernant :</p>
<p>Vérification générale périodique de l'équipement suivant :</p>
<p>Appareil de levage : <strong>{{ $inspection->equipement->typeEquipement->libelle }}</strong></p>

<div class="encadre-photo">
    <div class="encadre-photo-cellule">
        @if($photo_generale_base64)
            <img src="{{ $photo_generale_base64 }}">
        @else
            <span class="placeholder">Photo générale non fournie</span>
        @endif
    </div>
</div>

<p>Un compte rendu verbal a été fait au responsable de site.</p>
<p>Vous en souhaitant bonne réception,</p>
<p>Nous vous prions d'agréer, Messieurs, l'expression de notre considération distinguée.</p>

<div class="case-registre">
    Le Registre de sécurité a été visé :
    <span class="case">{{ $registre_vise === true ? 'X' : '' }}</span> OUI
    &nbsp;&nbsp;
    <span class="case">{{ $registre_vise === false || $registre_vise === null ? 'X' : '' }}</span> NON
</div>

<table class="zone-signature">
    <tr>
        <td>
            <span class="titre-signature">Adresse de l'installation visitée</span>
            {{ $inspection->equipement->localisation ?? $inspection->equipement->site->nom }}
        </td>
        <td>
            <span class="titre-signature">Inspecteur levage</span>
            {{ $inspection->inspecteur->nom }}
        </td>
    </tr>
</table>

{{-- =================== PAGE 2 : IDENTIFICATION / RÉSULTATS / CONCLUSION =================== --}}
<div class="page-break"></div>

<table class="entete">
    <tr>
        <td class="case-logo">LOGO</td>
        <td class="case-titre">ÉQUIPEMENTS DE LEVAGE</td>
        <td class="case-meta">
            <div><strong>Rapport N° :</strong> {{ $rapport_numero }}</div>
            <div><strong>Date :</strong> {{ \Carbon\Carbon::parse($inspection->date_inspection)->format('d/m/Y') }}</div>
        </td>
    </tr>
</table>
<div class="sous-titre-page">RAPPORT DE VÉRIFICATION — {{ mb_strtoupper($inspection->equipement->typeEquipement->libelle) }}</div>

<table class="grille-identif">
    <tr>
        <td class="label">Date de vérification</td><td>{{ \Carbon\Carbon::parse($inspection->date_inspection)->format('d/m/Y') }}</td>
        <td class="label">N° rapport</td><td>{{ $rapport_numero }}</td>
    </tr>
    <tr>
        <td class="label">Vérificateur</td><td>{{ $inspection->inspecteur->nom }}</td>
        <td class="label">Client</td><td>{{ $inspection->equipement->site->client->nom }}</td>
    </tr>
</table>

<div class="titre-section">Appareil examiné</div>
<table class="grille-identif">
    <tr>
        <td class="label">Désignation</td><td>{{ $inspection->equipement->typeEquipement->libelle }}</td>
        <td class="label">Constructeur</td><td>{{ $inspection->equipement->constructeur ?? '—' }}</td>
    </tr>
    <tr>
        <td class="label">Marque</td><td>{{ $inspection->equipement->marque ?? '—' }}</td>
        <td class="label">Modèle</td><td>{{ $inspection->equipement->modele ?? '—' }}</td>
    </tr>
    <tr>
        <td class="label">N° d'identification</td><td>{{ $inspection->equipement->numero_serie ?? '—' }}</td>
        <td class="label">N° équipement</td><td>{{ $inspection->equipement->numero_equipement ?? '—' }}</td>
    </tr>
    <tr>
        <td class="label">Année</td><td>{{ $inspection->equipement->annee_fabrication ?? '—' }}</td>
        <td class="label">CMU</td><td>{{ $inspection->equipement->cmu_tonnes ? $inspection->equipement->cmu_tonnes . ' t' : '—' }}</td>
    </tr>
</table>

<div class="titre-section">Contenu et conditions de la vérification</div>
<p>Examen de l'état de conservation avec essais de fonctionnement réalisés. La mission ne comprend pas l'examen
de l'état de conformité aux règles de conception, ni les mesures d'organisation et les règles générales de
prévention.</p>

<div class="titre-section">Résultat de la vérification</div>
<div class="resultat-box {{ $inspection->nb_dangers_immediats > 0 || $inspection->nb_defauts_majeurs > 0 ? 'inapte' : '' }}">
    {{ $inspection->nb_dangers_immediats > 0 || $inspection->nb_defauts_majeurs > 0 ? "INAPTE AU SERVICE EN L'ÉTAT" : 'APTE AU SERVICE' }}
</div>

<div class="titre-section">Conclusion</div>
<p>{{ $inspection->conclusion ?? $inspection->avis_propose }}</p>

<div class="titre-section">Observations</div>
<div class="observations">
    @if($observations->isEmpty())
        <p>Néant.</p>
    @else
        <ol>
            @foreach($observations as $obs)
                <li>
                    {{ $obs['texte'] }}
                    @if($obs['action'])
                        <div class="action">Action recommandée : {{ $obs['action'] }}</div>
                    @endif
                </li>
            @endforeach
        </ol>
    @endif
</div>

{{-- =================== PAGE 3+ : DÉTAIL DES POINTS DE CONTRÔLE =================== --}}
<div class="page-break"></div>

<table class="entete">
    <tr>
        <td class="case-logo">LOGO</td>
        <td class="case-titre">ÉQUIPEMENTS DE LEVAGE</td>
        <td class="case-meta">
            <div><strong>Rapport N° :</strong> {{ $rapport_numero }}</div>
            <div><strong>Date :</strong> {{ \Carbon\Carbon::parse($inspection->date_inspection)->format('d/m/Y') }}</div>
        </td>
    </tr>
</table>
<div class="sous-titre-page">DÉTAIL DES POINTS DE CONTRÔLE</div>

@foreach($sections as $section)
    <table class="table-controle">
        <thead>
            <tr><th colspan="2">{{ mb_strtoupper($section['libelle']) }}</th></tr>
            <tr><th class="col-point">Point de contrôle</th><th>Constat</th></tr>
        </thead>
        <tbody>
            @foreach($section['reponses'] as $r)
                <tr>
                    <td>{{ $r['libelle'] }}</td>
                    <td>{{ $r['constat'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endforeach

@if($inspection->essais->isNotEmpty())
    <div class="titre-section">Essais réalisés</div>
    <table class="table-controle">
        <thead><tr><th>Essai</th><th>Charge d'essai</th><th>Résultat</th></tr></thead>
        <tbody>
            @foreach($inspection->essais as $essai)
                <tr>
                    <td>{{ $essai->libelle }}</td>
                    <td>{{ $essai->charge_essai_kg ? $essai->charge_essai_kg . ' kg' : '—' }}</td>
                    <td>{{ $essai->resultat ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif

<div class="pied-page">
    <span class="num-rapport">Rapport n° {{ $rapport_numero }}</span>
    <span class="num-page">InspectPro — Rapport de vérification équipement de levage</span>
</div>

</body>
</html>
