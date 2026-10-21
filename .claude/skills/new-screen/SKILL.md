---
name: new-screen
description: Créer un écran ou un composant dans la SPA React.
---

1. Identifier le contexte métier (`apps/app/src/contexts/<contexte>`).
2. Chercher le composant dans shadcn/ui avant tout développement maison. L'ajouter avec `pnpm dlx shadcn@latest add`.
3. Écran terrain : lecture et écriture via Dexie, indicateur de synchronisation.
4. Prévoir : skeleton à la forme du contenu, état vide avec action, erreur avec code `trace_id` court, toast de succès.
5. Masquer les actions non autorisées avec `useCan("permission")`.
6. Textes dans `fr.ts`.
7. Vérifier sur une largeur de 360 px, zones tactiles de 48 px.
8. Test Playwright si c'est un parcours critique.
