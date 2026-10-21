# 0010 — Déploiement depuis le poste, sans CI

- Date : 2026-10-21
- Statut : accepté

## Contexte

Éviter les coûts et la maintenance d'un pipeline au démarrage.

## Décision

Scripts `release:staging` et `release:prod` lancés à la main : vérifications complètes, migrations, déploiement, sourcemaps Sentry. Production uniquement depuis `main` propre, avec confirmation. Hooks Lefthook pour garder la qualité.

## Conséquences

Discipline nécessaire. Le jeton de déploiement local est un point sensible : droits minimaux, sans suppression (voir SECURITY.md). Passage à une CI à reconsidérer quand l'activité le justifie.
