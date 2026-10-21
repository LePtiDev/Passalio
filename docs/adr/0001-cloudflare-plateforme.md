# 0001 — Cloudflare comme plateforme unique

- Date : 2026-10-21
- Statut : accepté

## Contexte
Développeur seul, budget minimal, besoin d'hébergement, base, fichiers, tâches planifiées et files d'attente.

## Décision
Workers (API), D1 (base), R2 (fichiers, juridiction UE), Cron Triggers, Queues, hébergement statique pour le site et la SPA.

## Conséquences
Coût quasi nul au départ, un seul fournisseur à sécuriser. Dépendance à Cloudflare et aux limites de D1 (taille de base, SQLite). Compensé par des sauvegardes externes (ADR 0008).
