#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------
# À exécuter UNE SEULE FOIS sur le VM.
#
# Toutes les commandes composer tournent dans une image Docker LOCALE
# (docker/composer/Dockerfile) construite avec EXACTEMENT le même PHP
# (8.3) que le Dockerfile de production (docker/php/Dockerfile). C'est
# important : composer résout les versions des paquets en fonction du PHP
# qui l'exécute — utiliser l'image officielle "composer:2" telle quelle
# verrouillerait des paquets nécessitant PHP 8.4+ (elle embarque désormais
# PHP 8.4), ce qui casserait ensuite le "composer install" en prod (PHP 8.3).
# ---------------------------------------------------------------

OVERLAY_DIR="laravel-setup"
TMP_DIR="laravel-tmp-$$"
COMPOSER_IMAGE="inspectpro-composer-php83"

if [ ! -d "$OVERLAY_DIR" ]; then
  echo "Erreur : dossier '$OVERLAY_DIR' introuvable. Lance ce script depuis /var/www/inspectpro (ou équivalent)."
  exit 1
fi

echo "==> 0/5 Construction de l'image composer (PHP 8.3, alignée sur la prod) ..."
docker build -t "$COMPOSER_IMAGE" -f "$OVERLAY_DIR/docker/composer/Dockerfile" "$OVERLAY_DIR/docker/composer"

composer_docker() {
  # $1 = dossier dans lequel exécuter composer (chemin absolu)
  local workdir="$1"; shift
  docker run --rm -u "$(id -u):$(id -g)" -v "${workdir}:/app" -w /app \
    -e HOME=/tmp -e COMPOSER_HOME=/tmp/composer \
    --entrypoint sh "$COMPOSER_IMAGE" -c "
      git config --global --add safe.directory /app 2>/dev/null
      mkdir -p /tmp/composer
      composer config -g policy.advisories.block false 2>/dev/null || true
      composer $*
    "
}

echo "==> 1/5 Création d'une installation Laravel neuve dans $TMP_DIR (PHP 8.3) ..."
mkdir -p "$TMP_DIR"
composer_docker "$(pwd)" create-project laravel/laravel:^11.0 "$TMP_DIR" --no-interaction --prefer-dist --no-audit

echo "==> 2/5 Fusion du code applicatif ..."
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
# On a déjà fusionné manuellement AppServicePr  ovider.php à ce stade (voir
# étape précédente) -> on le préserve en l'écrasant PAR-DESSUS la version
# par défaut générée par create-project.
if [ -f "$OVERLAY_DIR/app/Providers/AppServiceProvider.php" ]; then
  cp "$OVERLAY_DIR/app/Providers/AppServiceProvider.php" "$TMP_DIR/app/Providers/AppServiceProvider.php"
fi

echo "==> 3/5 Ajout de Sanctum et dompdf à composer.json (PHP 8.3) ..."
composer_docker "$(pwd)/$TMP_DIR" require laravel/sanctum --no-interaction --no-audit
composer_docker "$(pwd)/$TMP_DIR" require barryvdh/laravel-dompdf --no-interaction --no-audit

echo "==> 4/5 Vérification finale : composer install à blanc (doit réussir, PHP 8.3) ..."
composer_docker "$(pwd)/$TMP_DIR" install --no-interaction --dry-run

echo "==> 5/5 Remplacement de $OVERLAY_DIR par la version fusionnée ..."
BACKUP_DIR="${OVERLAY_DIR}-overlay-backup-$(date +%s)"
mv "$OVERLAY_DIR" "$BACKUP_DIR"
mv "$TMP_DIR" "$OVERLAY_DIR"

cat <<MSG

Terminé avec succès.

Prochaine étape :
   docker compose -f docker-compose.prod.yml up -d --build

Puis, une fois les conteneurs démarrés :
   docker compose -f docker-compose.prod.yml exec app php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider" --no-interaction
   docker compose -f docker-compose.prod.yml exec app php artisan key:generate
   docker compose -f docker-compose.prod.yml exec app php artisan migrate --seed --force
   docker compose -f docker-compose.prod.yml exec app php artisan storage:link
   docker compose -f docker-compose.prod.yml exec app php artisan config:cache
   docker compose -f docker-compose.prod.yml exec app php artisan route:cache

Le dossier $BACKUP_DIR peut être supprimé une fois que
tu as vérifié que tout a bien été repris (notamment que
AppServiceProvider.php contient bien les 5 lignes ::observe(...)).
MSG
