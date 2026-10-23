# 0014 — Synchronisation par modification, dernier envoi gagne

- Date : 2026-10-23
- Statut : accepté

## Contexte

L'ADR 0003 prévoit que le dernier `updated_at` gagne en cas de conflit. Mais l'horloge d'un téléphone n'est pas fiable, et comparer des lignes entières ferait perdre une modification faite sur un autre champ.

## Décision

Le téléphone n'envoie pas des lignes mais des modifications (`create_customer`, `update_site`, `add_equipment`…), avec seulement les champs changés. Le serveur les applique dans l'ordre de réception, avec les mêmes use cases et les mêmes permissions que l'API, et pose lui-même `updated_at`. Deux personnes qui changent des champs différents gardent toutes les deux leur modification. Sur un même champ, le dernier envoi gagne.

Une modification déjà appliquée (même identifiant de création) est acceptée sans rien refaire. Une modification refusée est retirée de la file, notée dans `rejections`, la création locale est effacée et le téléphone recharge tout depuis le serveur.

Au chargement, une ligne qui a encore une modification en attente sur le téléphone n'est pas écrasée.

## Conséquences

Pas de comparaison d'horloges. Chaque nouvelle table synchronisée ajoute ses types de modification dans `packages/shared` et leur application côté serveur. Les attestations signées restent hors de ce mécanisme : elles ne se modifient jamais.
