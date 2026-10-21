# Ramoneur

Logiciel pour artisans d'entretien obligatoire (ramoneurs d'abord). Les règles du projet sont dans `CLAUDE.md`, l'architecture dans `docs/ARCHITECTURE.md`.

## Prérequis

- Node.js 24 (voir `.nvmrc`)
- pnpm 10 (`corepack enable`)

## Démarrer

```sh
pnpm install
pnpm dev
```

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
