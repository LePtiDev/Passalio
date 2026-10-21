# 0003 — Hors ligne d'abord

- Date : 2026-10-21
- Statut : accepté

## Contexte
Les techniciens travaillent souvent sans réseau (caves, combles, campagne).

## Décision
Les écrans terrain lisent et écrivent dans IndexedDB (Dexie). Les modifications passent par une outbox synchronisée (`/sync/push`, `/sync/pull`). Identifiants UUIDv7 générés côté client. Conflits : dernier `updated_at` gagne, sauf attestations signées, jamais écrasées. PDF généré sur le téléphone.

## Conséquences
Plus de complexité côté client, tests de synchronisation indispensables. Toute table synchronisée a `updated_at`, `deleted_at` et un index `(organization_id, updated_at)`.
