> ⚠️ **IMPORTANT** : ce dossier ne contient que le code applicatif construit
> phase après phase (Controllers, Models, Services, migrations, seeders,
> routes, vue du rapport). Ce n'est PAS une installation Laravel complète —
> il manque `composer.json`, `artisan`, `vendor/`, `public/`, etc.
>
> **Avant tout `docker compose up --build`**, exécute :
> ```bash
> cd /var/www/inspectpro   # ou l'équivalent chez toi
> bash laravel-setup/install.sh
> ```
> Ce script crée une vraie installation Laravel et y fusionne notre code.
> Sans cette étape, `composer install` échoue avec "composer.json absent".

# Phase 1.2 — Setup du projet Laravel (API)

## 1. Créer le projet

Sur ton VM Azure Ubuntu (ou en local si tu préfères développer avant de pousser sur le VM) :

```bash
composer create-project laravel/laravel inspection-levage-api
cd inspection-levage-api
```

## 2. Configurer PostgreSQL

Installer le driver PHP PostgreSQL si besoin (`php-pgsql`), puis dans `.env` :

```env
DB_CONNECTION=pgsql
DB_HOST=db          # nom du service docker-compose (voir plus bas)
DB_PORT=5432
DB_DATABASE=inspection_levage
DB_USERNAME=inspection_user
DB_PASSWORD=change_me
```

Le fichier `.env.example` fourni dans ce livrable contient déjà toutes les variables nécessaires (DB, Sanctum, storage, mail pour l'envoi de rapport...).

## 3. Installer Laravel Sanctum (auth API par token)

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

Dans `app/Models/User.php`, ajouter le trait :

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    ...
}
```

Dans `bootstrap/app.php` (Laravel 11) ou `app/Http/Kernel.php` (Laravel 10), s'assurer que le middleware `api` utilise bien `auth:sanctum` pour les routes protégées (voir `routes/api.php` fourni).

> Comme l'app mobile (React Native) et l'app web (React) sont des clients séparés qui consomment l'API, on utilise **Sanctum en mode "token API personnel"** (pas le mode SPA cookie) : chaque login renvoie un token Bearer stocké côté client.

## 4. Organisation des dossiers (architecture API)

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── AuthController.php
│   │       ├── ClientController.php
│   │       ├── SiteController.php
│   │       ├── EquipementController.php
│   │       ├── TypeEquipementController.php      (admin: gestion des types)
│   │       ├── PointControleController.php       (admin: gestion des contrôles)
│   │       ├── InspectionController.php
│   │       ├── ReponseControleController.php
│   │       ├── AnomalieController.php
│   │       ├── PhotoController.php
│   │       ├── RapportController.php
│   │       └── StatistiqueController.php
│   ├── Requests/
│   │   ├── StoreInspectionRequest.php
│   │   ├── StoreReponseControleRequest.php
│   │   └── ...  (un FormRequest par action de création/mise à jour = validation centralisée)
│   └── Resources/
│       ├── EquipementResource.php
│       ├── TypeEquipementResource.php      (inclut points_controle imbriqués)
│       ├── InspectionResource.php
│       └── ...  (API Resources = format de sortie JSON stable et versionnable)
├── Models/
│   ├── Client.php, Site.php, Equipement.php
│   ├── FamilleEquipement.php, TypeEquipement.php
│   ├── SectionControle.php, PointControle.php
│   ├── Inspection.php, ReponseControle.php
│   ├── Anomalie.php, Photo.php, Mesure.php, Essai.php, Document.php
│   ├── Signature.php, Rapport.php
├── Services/
│   ├── FormulaireInspectionService.php   (assemble dynamiquement le formulaire
│   │                                       à partir d'un type_equipement_id :
│   │                                       sections + points_controle + photos
│   │                                       obligatoires + documents + essais requis)
│   ├── SyntheseService.php               (calcule les compteurs C/O/NC/DM/DI
│   │                                       et propose un avis automatique)
│   ├── NumerotationAnomalieService.php   (génère A-001, A-002... par inspection)
│   └── RapportPdfService.php             (génère le PDF final, Phase 1.7)
└── Policies/
    └── InspectionPolicy.php  (un inspecteur ne modifie que ses propres inspections)

routes/
└── api.php

database/
├── migrations/   (une migration par table du schéma.sql)
└── seeders/
    ├── FamilleEquipementSeeder.php
    ├── TypeEquipementSeeder.php
    └── PointControleSeeder.php   (le seed MVP : 5 types d'équipement)
```

**Pourquoi une couche `Services/` séparée des contrôleurs ?**
Le CDC insiste sur le fait que la logique (formulaire dynamique, synthèse automatique, numérotation des anomalies) doit rester indépendante de l'interface. En la mettant dans des Services plutôt que dans les contrôleurs, le même code sera réutilisable tel quel si un jour tu exposes une v2 de l'API ou un autre canal (ex. rapport généré en tâche planifiée).

## 5. Dockerisation

Voir les fichiers fournis :
- `docker/php/Dockerfile` — image PHP-FPM avec extensions (pdo_pgsql, gd pour les photos, zip)
- `docker/nginx/default.conf` — reverse proxy vers php-fpm
- `docker-compose.yml` — services `app` (Laravel), `webserver` (nginx), `db` (postgres), volumes persistants

```bash
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
```

## 6. Checklist de fin de Phase 1.2

- [ ] `composer create-project` exécuté, projet versionné dans un repo Git
- [ ] `.env` configuré (copié depuis `.env.example`, valeurs réelles renseignées)
- [ ] Sanctum installé et testé (`POST /api/login` renvoie un token)
- [ ] Arborescence `Api/`, `Services/`, `Resources/` créée (dossiers vides avec `.gitkeep` si pas encore de code)
- [ ] `docker compose up -d` fonctionne, l'app répond sur le port choisi
- [ ] Connexion à PostgreSQL confirmée (`php artisan migrate` sans erreur, même sans les vraies migrations métier pour l'instant)

## Prochaine étape (Phase 1.3)

Écrire les migrations Laravel correspondant à `schema.sql` (Phase 1.1) + les seeders du MVP (5 types d'équipements avec leurs points de contrôle réels).

## Compléments — Phase 1.8 (photos + mesures + rapport PDF)

### Dépendances à installer

```bash
composer require barryvdh/laravel-dompdf
php artisan storage:link   # rend storage/app/public accessible via /storage
```

### Nouveautés

- **Mesures** : `MesureService` évalue automatiquement une mesure par rapport
  à `valeur_nominale`/`tolerance_pourcent` du point de contrôle, et reporte
  le résultat (C/NC) sur `reponses_controle.statut` — donc la logique
  d'anomalie déjà en place s'applique sans code supplémentaire.
- **Photos** : `PhotoController` gère l'upload (multipart, 10 Mo max,
  stocké sur le disque `public`). Le type `photographiable_type` a été
  étendu (migration `2026_08_31_000021`) pour inclure `reponse_controle`,
  nécessaire aux points de contrôle de type "photo".
- **Photos obligatoires** : `InspectionController::valider()` bloque la
  validation si une photo obligatoire manque (avec possibilité de
  contournement explicite via `ignorer_photos_manquantes: true`).
- **Rapport PDF** : `RapportPdfService` + vue Blade
  `resources/views/rapports/inspection.blade.php`, structurée selon le
  CDC section 20. Génération réservée aux inspections déjà validées.
