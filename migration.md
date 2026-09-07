# Backup - migration eZ Publish vers intranet_bmoi

Date : 2026-09-02 21:41
Branche : `migration` (poussee sur origin, commit 651ed57c)

## Contenu

- `intranet_bmoi.dump` - dump PostgreSQL format custom (restaurable via `pg_restore`)
- `intranet_bmoi.sql` - meme dump en SQL texte brut (lisible/greppable)
- `uploads/` - copie complete de `apps/api/uploads` (9576 fichiers, 6,6 Go) - tous
  reextraits proprement (voir "Corrections" ci-dessous)

## Restauration

```bash
# Base de donnees (sur une base vide) :
createdb -h localhost -p 5432 -U bmoi intranet_bmoi_restore
pg_restore -h localhost -p 5432 -U bmoi -d intranet_bmoi_restore intranet_bmoi.dump

# Fichiers uploades :
cp -r uploads/* /chemin/vers/apps/api/uploads/
```

## Contenu de la base au moment du backup

- 21 departements (referentiel Qualite/Pilotage)
- 67 categories commerciales (arbre DBD/DCE) + 18 categories Article/Campagne/Petite annonce/Avis personnel
- 1046 documents Pilotage (`/admin/quality/pilotage`)
- 148 documents Qualite (`/admin/quality`)
- 59 contenus Vitrine commerciale (`/admin/commercial`)
- 216 documents Vitrine commerciale (`/admin/commercial/documents`)
- 89 galeries photo (`/admin/galeries`), 7478 images
- 858 contenus Article / Campagne / Petite annonce / Avis personnel
- 9576 medias / fichiers uploades au total
- 37 utilisateurs (1 superadmin + 36 auteurs migres)

## Corrections depuis le backup precedent (20260902_190331)

1. **Corruption binaire generalisee** : l'extraction initiale des blobs
   passait par le CLI `mysql` (texte), qui injectait un octet parasite a
   chaque frontiere de "chunk" pour les fichiers multi-morceaux dans
   `ezdbfile_data` - 9573 fichiers sur 9576 etaient affectes (images
   principalement, aplats de couleur visibles). Reextraits en binaire-safe
   via le driver `mysql2` (Node), en place, sans toucher aux relations DB.
2. **Bug Content-Disposition (500 au download)** : un nom de fichier avec
   accent/apostrophe typographique faisait planter l'endpoint de
   telechargement. Corrige dans le code (`content-disposition.ts`,
   encodage RFC 5987/6266), commit `651ed57c` pousse sur origin/migration.

## Note

Le dossier `docs/migration/annexes/` (TSV d'extraction intermediaires) a ete
supprime du disque en dehors de cette session - a regenerer a la demande si
besoin de retoucher un module (la source eZ Publish, conteneur
`bmoi_migration_mysql`, reste intacte).