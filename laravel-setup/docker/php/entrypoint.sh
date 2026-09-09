#!/bin/sh
set -e

# Recrée systématiquement le lien storage au démarrage — indispensable
# car install.sh régénère public/ depuis zéro à chaque exécution (nouvelle
# installation Laravel fusionnée), ce qui fait disparaître ce lien alors
# que les fichiers uploadés, eux, persistent dans le volume storage_data.
# Idempotent : ne fait rien si le lien existe déjà et est valide.
if [ ! -L /var/www/html/public/storage ] || [ ! -e /var/www/html/public/storage ]; then
    echo "[entrypoint] Lien public/storage manquant ou cassé -> recréation..."
    php artisan storage:link --force || true
fi

exec "$@"
