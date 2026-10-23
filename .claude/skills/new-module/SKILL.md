---
name: new-module
description: Créer un nouveau contexte métier ou un nouveau use case côté API en respectant le DDD léger du projet.
---

1. Vérifier dans `docs/ARCHITECTURE.md` si le besoin appartient à un contexte existant. Préférer l'existant.
2. Proposer le plan : entités et règles (`domain/`), use cases (`application/`), repository (`infrastructure/`), routes (`http/`), permissions, index, tests.
3. Attendre validation.
4. Écrire d'abord le domaine et ses tests (règles pures, sans base).
5. Puis le use case avec `assertCan` et ses tests (repository en mémoire).
6. Puis le repository D1 filtré par `organization_id`, et la migration via la skill `new-migration`.
7. Puis la route Hono : validation zod, appel du use case, rien d'autre.
8. Ajouter les tests de la route : 401, 400, 403 par rôle, isolation entre entreprises, impersonation, succès conforme au schéma zod. Utiliser l'agent `test-writer`, puis faire relire par l'agent `test-reviewer`.
9. Ajouter les lignes dans `docs/TESTING.md`.
10. Exporter uniquement le nécessaire dans `index.ts`.
11. Lancer `pnpm check`.
