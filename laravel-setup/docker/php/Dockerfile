FROM php:8.3-fpm

# Dépendances système + extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    git curl unzip libpq-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pgsql gd zip \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Garde-fou : évite une erreur composer cryptique si install.sh n'a pas
# encore été exécuté (cf. laravel-setup/install.sh — ce Dockerfile suppose
# une vraie installation Laravel fusionnée, pas seulement l'overlay applicatif).
RUN test -f composer.json || (echo "ERREUR : composer.json absent. Lance d'abord 'bash install.sh' à la racine du projet (voir SETUP.md)." && exit 1)

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
