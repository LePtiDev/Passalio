---
name: fix-bug
description: Corriger un bug de Passalio en écrivant d'abord le test qui le reproduit, puis le correctif.
---

1. Comprendre le bug et l'exigence qu'il enfreint (`docs/ARCHITECTURE.md`, `docs/SECURITY.md`, ADR, maquette validée). Si l'exigence n'est écrite nulle part, la faire confirmer par Quentin.
2. Écrire le test qui reproduit le bug, au niveau le plus bas qui le montre (règle, use case, route, composant, parcours). Ne modifier aucun test existant.
3. Lancer le test et vérifier qu'il échoue pour la bonne raison. Copier la sortie de l'échec.
4. Commit `test: reproduce <bug>` avec seulement ce test.
5. Corriger le code, sans toucher au test.
6. Lancer le test, puis `pnpm check` (et `pnpm test:e2e` si l'application a changé).
7. Commit `fix: <bug>`.
8. Dans la PR : le bug, l'exigence, la sortie de l'échec avant correctif, le test qui passe après.
9. Si le bug révèle qu'une exigence a changé et qu'un test existant doit changer : demander l'accord de Quentin et ajouter `Test-Change-Approved: <lien>` au commit.
