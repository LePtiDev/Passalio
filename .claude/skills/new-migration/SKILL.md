---
name: new-migration
description: Ajouter ou modifier une table D1, ses index et sa migration Drizzle en pensant performance et coût.
---

1. Lister les requêtes qui utiliseront la table (lecture, écriture, synchronisation, cron).
2. Colonnes obligatoires : `id` (UUIDv7), `organization_id` (si donnée métier), `created_at`, `updated_at`, `deleted_at` (si synchronisée).
3. Index : un par requête fréquente, en commençant par `organization_id`. Toujours `(organization_id, updated_at)` pour une table synchronisée. Pas d'index sans requête qui l'utilise.
4. Pas de fichier ni de gros texte dans D1 : R2 pour les fichiers, JSON compact pour les données d'attestation.
5. Générer la migration avec `pnpm db:generate`. Ne jamais modifier une migration déjà sur `main`.
6. Appliquer en local avec `pnpm db:migrate:local`.
7. Vérifier chaque requête avec `EXPLAIN QUERY PLAN` : aucune lecture complète de table sur une table qui grossit.
8. Mettre à jour le tableau des index dans `docs/ARCHITECTURE.md`.
