# CLAUDE.md — Règles du projet

Avant toute tâche, lire `docs/ARCHITECTURE.md`. Pour tout ce qui touche aux données, aux rôles ou à la sécurité, lire aussi `docs/SECURITY.md`. Les décisions structurantes sont dans `docs/adr/`.

## Langue
- Répondre toujours en français.
- Interface, erreurs affichées, emails, PDF : français, vouvoiement, phrases courtes, via les fichiers de traduction (`fr.ts`), jamais en dur.
- Code, noms de fichiers, commits : anglais.

## Commentaires
- Aucun commentaire dans le code. Le code doit se comprendre par ses noms, ses types et son découpage.
- Si une explication semble nécessaire, renommer ou découper. Si c'est une décision d'architecture, écrire un ADR.
- Seule exception : les directives d'outils (`// oxlint-disable-next-line <règle>`), à éviter. Pas de TODO dans le code : ouvrir une tâche à la place.

## TypeScript
- Strict partout. Interdit : `any`, `@ts-ignore`, `as` pour forcer un type.
- Types dérivés de zod (`z.infer`) ou de Drizzle, jamais réécrits à la main.
- Pas d'`export default` sauf si un outil l'exige.
- Erreurs métier retournées avec un type `Result`, exceptions réservées aux cas imprévus.

## Nommage
- Fichiers : `kebab-case`. Composants : `PascalCase`. Hooks : `useXxx`. Variables et fonctions : `camelCase`. Constantes : `UPPER_SNAKE_CASE`.
- Tables et colonnes : `snake_case`, tables au pluriel.
- Booléens : `isXxx`, `hasXxx`, `canXxx`.
- Le vocabulaire du code suit le langage métier défini dans `docs/ARCHITECTURE.md` (glossaire).

## Découpage
- Organisation par contexte métier (DDD léger), décrite dans `docs/ARCHITECTURE.md`.
- Un contexte contient `domain/`, `application/`, `infrastructure/`, `http/`. Ne pas créer de sous-dossier tant qu'il n'y a pas au moins trois fichiers à y mettre.
- Un fichier fait une chose. Au-delà d'environ 200 lignes, le découper.
- Un contexte n'importe un autre contexte que via son `index.ts` public.
- Pas d'abstraction « au cas où » : on factorise à la troisième répétition, pas avant.

## Interface
- Toujours vérifier si un composant shadcn/ui existe avant d'en créer un. L'ajouter avec `pnpm dlx shadcn@latest add <composant>`.
- Tout chargement affiche un skeleton (`Skeleton` de shadcn/ui) qui reproduit la forme du contenu final. Jamais de spinner seul sur un écran.
- Chaque liste a un état vide utile (message + action principale).
- Chaque action a un retour visible : chargement, succès (toast), erreur avec le code `trace_id` court.
- Mobile d'abord : zones tactiles de 48 px minimum, texte de base 16 px, utilisable d'une main.
- Hors ligne : les écrans terrain lisent et écrivent dans Dexie, l'utilisateur voit ce qui reste à synchroniser.

## Données
- Toute requête filtre par `organization_id` via les repositories. Jamais de requête brute dans un use case ou une route.
- Toute nouvelle requête fréquente doit être couverte par un index (voir `docs/SECURITY.md` et la skill `new-migration`).
- Sélectionner les colonnes utiles, paginer par curseur, jamais de `SELECT *` sur une table qui grossit.
- Une attestation signée ne se modifie jamais.

## Sécurité
- Chaque use case vérifie la permission avec `assertCan(actor, "permission")`, pas seulement la route.
- Pendant une impersonation, toute écriture est refusée côté serveur.
- Aucun secret dans le code ni dans le dépôt. Aucune donnée personnelle dans les logs, Sentry ou PostHog.

## Observabilité
- Chaque requête, job de file et cron porte un `trace_id`. Le propager à Sentry, PostHog, aux logs et aux messages de queue.
- Logs uniquement via le logger structuré (`logger.info({ event, ... })`), jamais `console.log` direct.

## Outils
- Lint : Oxlint. Format : Oxfmt. Types : `tsc --noEmit`. Tests : Vitest, Playwright.
- Ne jamais désactiver une règle de lint pour faire passer du code.

## Façon de travailler
- Avant de coder : plan court (fichiers, tables, index, permissions, tests), puis attendre ma validation.
- Utiliser les skills de `.claude/skills/` quand elles s'appliquent.
- Tests écrits avec le code. Tout bug corrigé reçoit un test qui le reproduit.
- Ne jamais lancer de déploiement sans que je le demande explicitement.

## Définition de « terminé »
- `pnpm check` passe (format, lint, types, tests).
- Fonctionne hors ligne si c'est un écran terrain.
- Skeletons, état vide et erreurs gérés.
- Permissions vérifiées et testées.
- Index ajoutés si nouvelles requêtes.
- `docs/` mis à jour si la structure, les données ou une décision ont changé.

## Commandes
- `pnpm dev` · `pnpm check` · `pnpm fmt` · `pnpm lint` · `pnpm typecheck` · `pnpm test`
- `pnpm db:generate` · `pnpm db:migrate:local`
- Déploiement (uniquement sur demande) : `pnpm release:staging` · `pnpm release:prod`
