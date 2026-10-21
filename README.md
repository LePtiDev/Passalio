# Passalio

Passalio, logiciel pour artisans d'entretien obligatoire (ramoneurs d'abord). Les règles du projet sont dans `CLAUDE.md`, l'architecture dans `docs/ARCHITECTURE.md`.

## Prérequis

- Node.js 24 (voir `.nvmrc`)
- pnpm 10 (`corepack enable`)

## Démarrer

```sh
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars
pnpm db:migrate:local
pnpm dev
```

Remplacer `BETTER_AUTH_SECRET` dans `apps/api/.dev.vars` par une valeur aléatoire (`openssl rand -base64 32`). En local, les liens de connexion s'affichent dans le terminal de l'API.

- Site vitrine (Astro) : `apps/web`
- Application (React, PWA) : `apps/app`
- API (Hono sur Cloudflare Workers) : `apps/api`, route de santé `GET /health`

## Commandes

| Commande                | Rôle                                                           |
| ----------------------- | -------------------------------------------------------------- |
| `pnpm check`            | Format, lint, types et tests : doit passer avant chaque commit |
| `pnpm fmt`              | Formate tout le dépôt avec Oxfmt                               |
| `pnpm lint`             | Oxlint avec règles type-aware                                  |
| `pnpm typecheck`        | `tsc` et `astro check` dans chaque paquet                      |
| `pnpm test`             | Vitest dans chaque paquet                                      |
| `pnpm build`            | Construit le site et l'application                             |
| `pnpm db:generate`      | Génère une migration Drizzle depuis `packages/db/src/schema`   |
| `pnpm db:migrate:local` | Applique les migrations sur la base D1 locale                  |

## Sessions cloud Claude Code

Le hook `.claude/hooks/session-start.sh` prépare chaque session cloud : il installe Node.js 24 dans `/opt/node24`, active pnpm avec corepack et lance `pnpm install`. Il ne fait rien sur un poste local.

L'environnement cloud doit fournir `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID`, et autoriser l'accès réseau à `nodejs.org`, `registry.npmjs.org` et `api.cloudflare.com`. Ensuite `pnpm check`, `pnpm dev` et `pnpm release:staging` fonctionnent dans la session. La production se déploie uniquement sur demande explicite.
