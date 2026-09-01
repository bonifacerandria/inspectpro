# Image utilisée UNIQUEMENT par install.sh pour exécuter composer avec le
# MÊME PHP (8.3) que celui du Dockerfile de production
# (docker/php/Dockerfile). Sans ça, l'image officielle "composer:2"
# embarque son propre PHP (8.4+), ce qui génère un composer.lock verrouillé
# sur des versions incompatibles avec le PHP 8.3 réellement utilisé en prod.
FROM php:8.3-cli

RUN apt-get update && apt-get install -y git unzip libzip-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# On ne copie que le binaire composer (indépendant de la version de PHP
# de l'image source) — il s'exécutera avec le PHP 8.3 de CETTE image.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
ENTRYPOINT ["composer"]
