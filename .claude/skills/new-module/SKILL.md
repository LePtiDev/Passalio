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
8. Ajouter le test d'isolation entre entreprises pour chaque route.
9. Exporter uniquement le nécessaire dans `index.ts`.
10. Lancer `pnpm check`.
