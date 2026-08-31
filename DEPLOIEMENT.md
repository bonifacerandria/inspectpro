# Déploiement en production — VM Azure `PROD-AZ-VM`, domaine mid-rg.bmoinet.net

## Contexte : ce VM héberge déjà plusieurs applications

```
Ports hôte déjà occupés (cf. docker ps) :
  3000  taskflow-api        8080  moodle-app
  3001  taskflow-grafana    8090  taskflow-cadvisor
  3100  taskflow-loki       9000  epay-php
  5432  taskflow-db         9090  taskflow-prometheus
  3306  moodle-db*          9093  taskflow-alertmanager
                             9100  taskflow-node-exporter
                             9187  taskflow-postgres-exporter
(* moodle-db/moodle-redis n'exposent pas de port hôte, sans objet ici)
```

→ InspectPro utilise le **port 8081** (libre) pour son backend, et un
**nom de projet Docker dédié `inspectpro`** pour que ses volumes/réseaux
ne se mélangent jamais avec `taskflow_*` ou `moodle_*`.

## Architecture

```
Internet (443/80)
      │   
      ▼
┌───────────────────────┐   nginx NATIF du VM (/etc/nginx/sites-available)
│   nginx (sur le VM)    │   - un bloc server DE PLUS parmi ceux déjà en place
│                        │   - sert le build React depuis /var/www/inspectpro/web
└──────────┬─────────────┘   - proxy_pass /api et /storage vers Docker
           │ 127.0.0.1:8081 uniquement (jamais exposé publiquement)
           ▼
   ┌──────────────────┐      ┌─────┐      ┌────┐
   │ inspectpro-       │ ───▶ │ app │ ───▶ │ db │   projet docker "inspectpro"
   │ backend-nginx     │      │(PHP)│      │(PG)│   isolé des autres (taskflow,
   └──────────────────┘      └─────┘      └────┘   moodle, epay)
```

## 1. Vérifications avant de commencer

```bash
# Confirmer que 8081 est bien libre (aucune ligne ne doit apparaître)
sudo ss -tlnp | grep 8081

# Confirmer le DNS
dig +short mid-rg.bmoinet.net
```

**NSG Azure** : 80/443 déjà ouverts pour ce VM (les autres apps y sont
déjà accessibles). Rien à changer côté réseau Azure. Le port 8081 ne doit
**pas** être ajouté au NSG — il n'écoute que sur `127.0.0.1` de toute façon.

## 2. Arborescence

```bash
sudo mkdir -p /var/www/inspectpro/web
cd /var/www/inspectpro
```

Copier :
- `laravel-setup.zip` → `/var/www/inspectpro/laravel-setup/`
- `web-app.zip` → `/var/www/inspectpro/web-app/`
- `deploiement.zip` (ce livrable) → `docker-compose.prod.yml` +
  `nginx-host/inspectpro` à récupérer depuis ce zip

```
/var/www/inspectpro/
├── laravel-setup/
├── web-app/
├── web/                       <- build React (étape 4)
├── docker-compose.prod.yml
├── .env                        <- à créer depuis .env.example
└── backend.env                 <- à créer depuis backend.env.example
```

## 3. Certificat pour mid-rg.bmoinet.net

`bmoinet.net` suggère un domaine interne BMOI — le certificat vient très
probablement de l'autorité de certification interne de la banque plutôt que
de Let's Encrypt (moins probable qu'un domaine public soit joignable par
Let's Encrypt/HTTP-01 s'il est en réseau interne). Récupère les deux
fichiers PEM déjà émis (souvent fournis par l'équipe infra/SSI de la BMOI) :

```bash
sudo mkdir -p /etc/ssl/certs/mid-rg.bmoinet.net /etc/ssl/private/mid-rg.bmoinet.net
sudo cp /chemin/fourni/fullchain.pem /etc/ssl/certs/mid-rg.bmoinet.net/
sudo cp /chemin/fourni/privkey.pem   /etc/ssl/private/mid-rg.bmoinet.net/
sudo chmod 600 /etc/ssl/private/mid-rg.bmoinet.net/privkey.pem
```

Si au contraire c'est bien géré par certbot sur ce VM, adapte plutôt les
deux lignes `ssl_certificate*` dans `nginx-host/inspectpro` pour pointer
vers `/etc/letsencrypt/live/mid-rg.bmoinet.net/`.

## 4. Builder et déployer le frontend

```bash
cd /var/www/inspectpro/web-app
cp .env.example .env
# éditer .env : VITE_API_URL=/api   (chemin relatif, même domaine que l'API)

npm install
npm run build

sudo cp -r dist/* /var/www/inspectpro/web/
sudo chown -R www-data:www-data /var/www/inspectpro/web
```

## 5. Configurer et activer le site nginx

```bash
sudo cp nginx-host/inspectpro /etc/nginx/sites-available/inspectpro
sudo nano /etc/nginx/sites-available/inspectpro
# -> vérifier server_name mid-rg.bmoinet.net (déjà correct dans le fichier fourni)
# -> vérifier/adapter les chemins ssl_certificate / ssl_certificate_key

sudo ln -s /etc/nginx/sites-available/inspectpro /etc/nginx/sites-enabled/
# ⚠️ NE PAS toucher aux autres fichiers dans sites-enabled/ (taskflow,
# moodle, epay y sont probablement déjà référencés) — on ajoute seulement.

sudo nginx -t                     # vérifie qu'aucun conflit avec les sites existants
sudo systemctl reload nginx
```

## 6. Configurer et démarrer le backend Docker

```bash
cd /var/www/inspectpro
cp .env.example .env
cp backend.env.example backend.env
```

Éditer les deux fichiers :
- **`.env`** : `POSTGRES_PASSWORD` (mot de passe fort, différent de celui
  de `taskflow-db`)
- **`backend.env`** : `DB_PASSWORD` (**identique** à `POSTGRES_PASSWORD`
  dans `.env`), config mail si besoin

```bash
chmod 600 .env backend.env
docker compose -f docker-compose.prod.yml up -d --build

# Vérifier qu'aucun nom ne rentre en collision avec l'existant
docker ps --format '{{.Names}}' | grep inspectpro

docker compose -f docker-compose.prod.yml exec app php artisan key:generate
docker compose -f docker-compose.prod.yml exec app php artisan migrate --seed --force
docker compose -f docker-compose.prod.yml exec app php artisan storage:link
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
docker compose -f docker-compose.prod.yml exec app php artisan route:cache
```

## 7. Vérification

```bash
docker compose -f docker-compose.prod.yml ps        # 3 conteneurs "Up" : inspectpro-app, inspectpro-backend-nginx, inspectpro-db
curl -I http://127.0.0.1:8081/api/login              # 405 en GET = normal (route en POST), confirme le routage
sudo systemctl status nginx

# S'assurer que les autres apps tournent toujours normalement
docker ps   # taskflow-*, moodle-*, epay-php doivent être inchangés
```

Puis dans un navigateur : `https://mid-rg.bmoinet.net` doit afficher
l'écran de login InspectPro.

## 8. Renouvellement du certificat

- **Certificat interne BMOI** : suivre la procédure de renouvellement de
  l'équipe infra, puis remplacer les fichiers dans
  `/etc/ssl/certs/mid-rg.bmoinet.net/` et
  `/etc/ssl/private/mid-rg.bmoinet.net/`, puis `sudo systemctl reload nginx`.
- **Certbot** (si applicable) : le renouvellement auto déjà en place sur
  le VM continue de fonctionner sans changement.

## 9. Mises à jour de l'application

```bash
# Frontend
cd /var/www/inspectpro/web-app && git pull
npm install && npm run build
sudo cp -r dist/* /var/www/inspectpro/web/

# Backend
cd /var/www/inspectpro/laravel-setup && git pull
cd /var/www/inspectpro
docker compose -f docker-compose.prod.yml up -d --build app backend-webserver
docker compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker compose -f docker-compose.prod.yml exec app php artisan config:cache
```

## 10. Sauvegardes

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U inspectpro_user inspectpro | gzip > /opt/backups/inspectpro-db-$(date +%F).sql.gz

docker run --rm -v inspectpro_storage_data:/data -v /opt/backups:/backup \
  alpine tar czf /backup/inspectpro-storage-$(date +%F).tar.gz -C /data .
```

(Nom du volume `inspectpro_storage_data` grâce au `name: inspectpro` défini
dans `docker-compose.prod.yml` — vérifiable avec `docker volume ls | grep inspectpro`.)

## 11. Démarrage automatique au reboot

Déjà garanti pour Docker et nginx sur ce VM (les autres apps tournent déjà
après reboot). Les conteneurs InspectPro ont `restart: unless-stopped` —
rien de plus à configurer.
