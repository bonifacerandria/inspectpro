# Déploiement en production — VM Azure Ubuntu, nginx hôte + docker pour le backend

## Architecture

```
Internet (443/80)
      │
      ▼
┌───────────────────────┐   nginx NATIF du VM (/etc/nginx/sites-available)
│   nginx (sur le VM)    │   - termine le SSL avec ton certificat existant
│                        │   - sert le build React (fichiers statiques sur disque)
└──────────┬─────────────┘   - proxy_pass /api et /storage vers Docker
           │ 127.0.0.1:8080 uniquement (jamais exposé publiquement)
           ▼
   ┌──────────────────┐      ┌─────┐      ┌────┐
   │ backend-webserver │ ───▶ │ app │ ───▶ │ db │   <- tout ça dans Docker,
   │      (nginx)      │      │(PHP)│      │(PG)│      réseau interne uniquement
   └──────────────────┘      └─────┘      └────┘
```

Seul le nginx natif du VM écoute sur 0.0.0.0:80/443. Le backend Docker
n'expose son port que sur `127.0.0.1:8080` — injoignable depuis Internet,
seul le nginx hôte peut l'atteindre. Postgres n'est exposé nulle part, même
pas sur localhost.

## 1. Prérequis sur le VM

```bash
# Docker + plugin compose
curl -fsSL https://get.docker.com | sh
sudo apt install -y docker-compose-plugin

# nginx natif + Node (pour builder le frontend)
sudo apt install -y nginx nodejs npm
```

**DNS** : le domaine doit déjà pointer (enregistrement A) vers l'IP publique
du VM. Vérifie avec `dig +short votre-domaine.mg`.

**Azure NSG** : ports 80 et 443 ouverts en entrée sur le NSG du VM. Le port
8080 (backend) ne doit **pas** être ouvert dans le NSG — de toute façon il
n'écoute que sur `127.0.0.1`, donc même une règle NSG ouverte ne le rendrait
pas accessible depuis l'extérieur, mais autant ne pas l'ouvrir par principe.

## 2. Arborescence sur le VM

```bash
sudo mkdir -p /opt/inspection-levage
sudo mkdir -p /var/www/inspection-levage/web
cd /opt/inspection-levage
```

Copier :
- `laravel-setup.zip` → `/opt/inspection-levage/laravel-setup/`
- `web-app.zip` → `/opt/inspection-levage/web-app/`
- `deploiement.zip` (ce livrable) → `docker-compose.prod.yml` et
  `nginx-host/inspection-levage` à récupérer depuis ce zip

```
/opt/inspection-levage/
├── laravel-setup/
├── web-app/
├── docker-compose.prod.yml
├── .env                       <- à créer depuis .env.example
└── backend.env                <- à créer depuis backend.env.example

/var/www/inspection-levage/web/   <- build React (étape 4)
```

## 3. Installer le certificat existant

Peu importe l'origine du certificat (certbot, autorité payante, certificat
interne de la banque), il te faut deux fichiers PEM accessibles au nginx du
VM. Par exemple :

```bash
sudo mkdir -p /etc/ssl/certs/votre-domaine.mg /etc/ssl/private/votre-domaine.mg
sudo cp /chemin/vers/fullchain.pem /etc/ssl/certs/votre-domaine.mg/
sudo cp /chemin/vers/privkey.pem   /etc/ssl/private/votre-domaine.mg/
sudo chmod 600 /etc/ssl/private/votre-domaine.mg/privkey.pem
```

Si le certificat vient de **certbot** déjà installé sur ce VM, les fichiers
existent déjà sous `/etc/letsencrypt/live/votre-domaine.mg/` — dans ce cas,
pointe directement `ssl_certificate`/`ssl_certificate_key` vers ce dossier
dans la config nginx (étape 5) plutôt que de copier les fichiers.

## 4. Builder et déployer le frontend

Le build React est buildé une fois (pas dans un conteneur) et ses fichiers
statiques sont copiés là où le nginx hôte va les servir :

```bash
cd /opt/inspection-levage/web-app
cp .env.example .env
# éditer .env : VITE_API_URL=/api   (chemin relatif, même domaine que l'API)

npm install
npm run build

sudo cp -r dist/* /var/www/inspection-levage/web/
sudo chown -R www-data:www-data /var/www/inspection-levage/web
```

À chaque mise à jour du frontend, il suffira de refaire `npm run build` et
`cp` — pas besoin de rebuild un conteneur.

## 5. Configurer et activer le site nginx

```bash
sudo cp nginx-host/inspection-levage /etc/nginx/sites-available/inspection-levage
sudo nano /etc/nginx/sites-available/inspection-levage
# -> remplacer "votre-domaine.mg" par ton vrai domaine
# -> vérifier/adapter les chemins ssl_certificate / ssl_certificate_key

sudo ln -s /etc/nginx/sites-available/inspection-levage /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # évite un conflit avec le site par défaut

sudo nginx -t                     # vérifie la syntaxe avant de recharger
sudo systemctl reload nginx
```

## 6. Configurer et démarrer le backend Docker

```bash
cd /opt/inspection-levage
cp .env.example .env
cp backend.env.example backend.env
```

Éditer les deux fichiers :
- **`.env`** : `POSTGRES_PASSWORD` (mot de passe fort)
- **`backend.env`** : `APP_URL=https://votre-domaine.mg`, `DB_PASSWORD`
  (**identique** à `POSTGRES_PASSWORD` dans `.env`), `FRONTEND_URL`, config mail

```bash
chmod 600 .env backend.env
docker compose -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.prod.yml exec app php artisan key:generate
docker compose -f docker-compose.prod.yml exec app php artisan migrate --seed --force
docker compose -f docker-compose.prod.yml exec app php artisan storage:link
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
```

## 7. Vérification

```bash
docker compose -f docker-compose.prod.yml ps        # 3 conteneurs "Up"
curl -I http://127.0.0.1:8080/api/login              # doit répondre (405 en GET = normal, route en POST)
sudo systemctl status nginx
```

Puis dans un navigateur : `https://votre-domaine.mg` doit afficher l'écran
de login.

## 8. Renouvellement du certificat

- **Certbot** : le renouvellement auto (cron/systemd timer déjà en place)
  continue de fonctionner puisque nginx lit directement les fichiers dans
  `/etc/letsencrypt/live/...`. Il recharge nginx automatiquement après
  renouvellement (comportement par défaut de certbot avec le plugin nginx).
- **Certificat tiers/manuel** : remplacer les fichiers dans
  `/etc/ssl/certs/votre-domaine.mg/` et `/etc/ssl/private/votre-domaine.mg/`
  puis `sudo systemctl reload nginx`.

## 9. Mises à jour de l'application

```bash
# Frontend
cd /opt/inspection-levage/web-app && git pull
npm install && npm run build
sudo cp -r dist/* /var/www/inspection-levage/web/

# Backend
cd /opt/inspection-levage/laravel-setup && git pull
cd /opt/inspection-levage
docker compose -f docker-compose.prod.yml up -d --build app backend-webserver
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
```

## 10. Sauvegardes

```bash
# Dump quotidien de la base (à mettre en cron)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U inspection_user inspection_levage | gzip > /opt/backups/db-$(date +%F).sql.gz

# Photos/documents uploadés (volume storage_data)
docker run --rm -v inspection-levage_storage_data:/data -v /opt/backups:/backup \
  alpine tar czf /backup/storage-$(date +%F).tar.gz -C /data .
```

## 11. Démarrage automatique au reboot

```bash
sudo systemctl enable docker
sudo systemctl enable nginx
```

Les conteneurs ont `restart: unless-stopped` — ils redémarrent seuls avec
le démon Docker après un reboot du VM.
