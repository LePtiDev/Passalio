---
name: new-screen
description: Créer un écran ou un composant dans la SPA React.
---

1. Faire une maquette de chaque état (vide, chargement, erreur, succès), mobile et ordinateur, dans un artifact Design. La montrer à Quentin et attendre sa validation avant d'écrire du code.
2. Identifier le contexte métier (`apps/app/src/contexts/<contexte>`).
3. Chercher le composant dans shadcn/ui avant tout développement maison. L'ajouter avec `pnpm dlx shadcn@latest add`.
4. Écran terrain : lecture et écriture via Dexie, indicateur de synchronisation.
5. Prévoir : skeleton à la forme du contenu, état vide avec action, erreur avec code `trace_id` court, toast de succès.
6. Masquer les actions non autorisées avec `useCan("permission")`.
7. Textes dans `fr.ts`. Champs obligatoires marqués d'un astérisque rouge après le libellé, aucune mention « facultatif ».
8. Vérifier sur une largeur de 360 px, zones tactiles de 48 px.
9. Tests : chaque état du composant (vide, chargement, erreur, succès), un test Playwright par parcours de l'écran (mobile et ordinateur), contrôle d'accessibilité, hors ligne pour un écran terrain. Agent `test-writer`, relecture par `test-reviewer`. Lignes ajoutées dans `docs/TESTING.md`.
10. Avant de fusionner : captures mobile et ordinateur de chaque état, comparées à la maquette et montrées à Quentin.
