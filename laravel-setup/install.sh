#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------
# À exécuter UNE SEULE FOIS sur le VM.
#
# Toutes les commandes composer tournent DANS un conteneur Docker
# (image officielle composer:2, PHP 8.3) plutôt que sur le PHP de l'hôte —
# le VM peut avoir une version de PHP plus ancienne (ex: PHP 7.4 utilisé
# par d'autres apps déjà en place) et ce n'est pas grave, on ne s'en sert
# pas du tout ici.
#
# Ce script :
#  1. Crée une vraie installation Laravel neuve dans un dossier temporaire
#  2. Copie par-dessus tout le code applicatif construit précédemment
#     (Controllers, Models, Services, Observers, migrations, seeders,
#     routes/api.php, vue du rapport PDF, config docker)
#  3. Ajoute laravel/sanctum et barryvdh/laravel-dompdf à composer.json
#  4. Remplace laravel-setup/ par le résultat fusionné (l'original est
#     sauvegardé dans laravel-setup-overlay-backup/ par précaution)
#
# Lancer depuis le dossier QUI CONTIENT laravel-setup/ :
#   cd /var/www/inspectpro && bash laravel-setup/install.sh
# ---------------------------------------------------------------

OVERLAY_DIR="laravel-setup"
TMP_DIR="laravel-tmp-$$"
COMPOSER_IMAGE="composer:2"

composer_docker() {
  # $1 = dossier dans lequel exécuter composer (chemin absolu)
  local workdir="$1"; shift
  docker run --rm -u "$(id -u):$(id -g)" -v "${workdir}:/app" -w /app \
    -e HOME=/tmp \
    "$COMPOSER_IMAGE" sh -c "git config --global --add safe.directory /app 2>/dev/null; composer $*"
}

if [ ! -d "$OVERLAY_DIR" ]; then
  echo "Erreur : dossier '$OVERLAY_DIR' introuvable. Lance ce script depuis /var/www/inspectpro (ou équivalent)."
  exit 1
fi

echo "==> 1/4 Création d'une installation Laravel neuve dans $TMP_DIR (via Docker, PHP 8.3) ..."
mkdir -p "$TMP_DIR"
composer_docker "$(pwd)" create-project laravel/laravel:^11.0 "$TMP_DIR" --no-interaction --prefer-dist --no-audit

echo "==> 2/4 Fusion du code applicatif ..."
cp -r "$OVERLAY_DIR/app/Models/." "$TMP_DIR/app/Models/"
mkdir -p "$TMP_DIR/app/Http/Controllers/Api"
cp -r "$OVERLAY_DIR/app/Http/Controllers/Api/." "$TMP_DIR/app/Http/Controllers/Api/"
mkdir -p "$TMP_DIR/app/Services" "$TMP_DIR/app/Observers"
cp -r "$OVERLAY_DIR/app/Services/." "$TMP_DIR/app/Services/"
cp -r "$OVERLAY_DIR/app/Observers/." "$TMP_DIR/app/Observers/"
cp "$OVERLAY_DIR"/database/migrations/2026_*.php "$TMP_DIR/database/migrations/"
cp "$OVERLAY_DIR"/database/seeders/*.php "$TMP_DIR/database/seeders/"
cp "$OVERLAY_DIR/routes/api.php" "$TMP_DIR/routes/api.php"
mkdir -p "$TMP_DIR/resources/views/rapports"
cp -r "$OVERLAY_DIR/resources/views/rapports/." "$TMP_DIR/resources/views/rapports/"
cp -r "$OVERLAY_DIR/docker" "$TMP_DIR/"
cp "$OVERLAY_DIR/app/Providers/AppServiceProvider.snippet.php" "$TMP_DIR/app/Providers/" 2>/dev/null || true

echo "==> 3/4 Ajout de Sanctum et dompdf à composer.json (via Docker) ..."
composer_docker "$(pwd)/$TMP_DIR" require laravel/sanctum --no-interaction --no-audit
composer_docker "$(pwd)/$TMP_DIR" require barryvdh/laravel-dompdf --no-interaction --no-audit

echo "==> 4/4 Remplacement de $OVERLAY_DIR par la version fusionnée ..."
mv "$OVERLAY_DIR" "${OVERLAY_DIR}-overlay-backup"
mv "$TMP_DIR" "$OVERLAY_DIR"

cat <<MSG

Terminé. Étapes manuelles restantes :

1. Vérifier que $OVERLAY_DIR/app/Models/User.php utilise bien le trait
   Sanctum : "use Laravel\Sanctum\HasApiTokens;" + "use HasApiTokens, ..."
   (déjà présent dans le fichier qu'on a copié à l'étape 2, à confirmer).

2. Coller le contenu de
   ${OVERLAY_DIR}/app/Providers/AppServiceProvider.snippet.php
   dans le vrai $OVERLAY_DIR/app/Providers/AppServiceProvider.php
   (méthode boot()), puis supprimer le fichier .snippet.php.

3. Copier .env.example vers .env et renseigner les valeurs (fait
   normalement via backend.env au niveau du docker-compose, cf. DEPLOIEMENT.md).

Prochaine étape :
   docker compose -f docker-compose.prod.yml up -d --build

Puis, une fois les conteneurs démarrés (le CONTENEUR "app" a bien PHP 8.3,
peu importe la version sur l'hôte) :
   docker compose -f docker-compose.prod.yml exec app php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --no-interaction
   docker compose -f docker-compose.prod.yml exec app php artisan key:generate
   docker compose -f docker-compose.prod.yml exec app php artisan migrate --seed --force
   docker compose -f docker-compose.prod.yml exec app php artisan storage:link
MSG
