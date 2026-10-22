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
7. Textes dans `fr.ts`.
8. Vérifier sur une largeur de 360 px, zones tactiles de 48 px.
9. Test Playwright si c'est un parcours critique.
10. Avant de fusionner : captures mobile et ordinateur de chaque état, comparées à la maquette et montrées à Quentin.
