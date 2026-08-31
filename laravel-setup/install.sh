#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------
# À exécuter UNE SEULE FOIS, sur une machine avec accès Internet à
# Packagist (le VM Azure, ou en local puis on transfère le résultat).
#
# Ce script :
#  1. Crée une vraie installation Laravel neuve dans un dossier temporaire
#  2. Copie par-dessus tout le code applicatif qu'on a construit (Controllers,
#     Models, Services, Observers, migrations, seeders, routes/api.php, vue
#     du rapport PDF, config docker)
#  3. Installe Sanctum et dompdf
#  4. Remplace laravel-setup/ par le résultat fusionné (l'original est
#     sauvegardé dans laravel-setup-overlay-backup/ par précaution)
#
# Lancer depuis le dossier QUI CONTIENT laravel-setup/ :
#   cd /var/www/inspectpro && bash laravel-setup/install.sh
# ---------------------------------------------------------------

OVERLAY_DIR="laravel-setup"
TMP_DIR="laravel-tmp-$$"

if [ ! -d "$OVERLAY_DIR" ]; then
  echo "Erreur : dossier '$OVERLAY_DIR' introuvable. Lance ce script depuis /var/www/inspectpro (ou équivalent)."
  exit 1
fi

echo "==> 1/5 Création d'une installation Laravel neuve dans $TMP_DIR ..."
composer create-project laravel/laravel:^11.0 "$TMP_DIR" --no-interaction

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

echo "==> 3/5 Installation de Sanctum ..."
(cd "$TMP_DIR" && composer require laravel/sanctum --no-interaction)
(cd "$TMP_DIR" && php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction)

echo "==> 4/5 Installation de dompdf (génération du rapport PDF) ..."
(cd "$TMP_DIR" && composer require barryvdh/laravel-dompdf --no-interaction)

echo "==> 5/5 Remplacement de $OVERLAY_DIR par la version fusionnée ..."
mv "$OVERLAY_DIR" "${OVERLAY_DIR}-overlay-backup"
mv "$TMP_DIR" "$OVERLAY_DIR"

cat <<MSG

Terminé. Étapes manuelles restantes (ne peuvent pas être automatisées) :

1. Ajouter le trait Sanctum si ce n'est pas déjà fait (déjà présent dans
   $OVERLAY_DIR/app/Models/User.php copié à l'étape 2, à vérifier) :
   class User extends Authenticatable { use HasApiTokens, HasFactory, Notifiable; }

2. Brancher l'Observer d'invalidation de cache dans
   $OVERLAY_DIR/app/Providers/AppServiceProvider.php (méthode boot()) :
   voir le contenu de app/Providers/AppServiceProvider.snippet.php
   (${OVERLAY_DIR}-overlay-backup/app/Providers/AppServiceProvider.snippet.php)

3. Copier .env.example vers .env et renseigner les valeurs (DB, APP_URL...)

4. Le dossier ${OVERLAY_DIR}-overlay-backup/ peut être supprimé une fois
   que tu as vérifié que tout a bien été repris.

Tu peux maintenant relancer :
   docker compose -f docker-compose.prod.yml up -d --build
MSG
