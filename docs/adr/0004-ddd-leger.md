# 0004 — DDD léger par contextes métier

- Date : 2026-10-21
- Statut : accepté

## Contexte

Le produit va s'étendre à plusieurs métiers et doit rester lisible pour un développeur seul assisté par IA.

## Décision

Découpage par contextes (`identity`, `customers`, `scheduling`, `compliance`, `engagement`, `billing`, `backoffice`), chacun avec `domain`, `application`, `infrastructure`, `http`. Événements de domaine en mémoire. Pas d'event sourcing, pas de CQRS, pas de bus de messages.

## Conséquences

Règles métier testables sans base ni HTTP. Un peu plus de fichiers qu'une organisation plate, limité par la règle « pas de sous-dossier sans trois fichiers ».
