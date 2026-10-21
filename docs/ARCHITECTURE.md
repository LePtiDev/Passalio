# Architecture

SaaS pour artisans d'entretien obligatoire (ramoneurs d'abord) : attestations remplies et signées sur place, PDF envoyé au client, relances automatiques. 29,99 €/mois ou 299,90 €/an, utilisateurs illimités, tous métiers.

## 1. Stack

| Couche                           | Choix                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| Monorepo                         | pnpm workspaces + Turborepo                                 |
| Site vitrine                     | Astro (statique)                                            |
| Application                      | React 19 + Vite (SPA, PWA), TanStack Router, TanStack Query |
| UI                               | Tailwind CSS + shadcn/ui                                    |
| Formulaires                      | react-hook-form + zod                                       |
| Hors ligne                       | vite-plugin-pwa + Dexie (IndexedDB) + outbox                |
| Signature / PDF                  | signature_pad, pdf-lib                                      |
| API                              | Hono sur Cloudflare Workers                                 |
| Données                          | Cloudflare D1 + Drizzle ORM, R2 (UE) pour les fichiers      |
| Asynchrone                       | Cron Triggers, Cloudflare Queues                            |
| Auth et rôles                    | Better Auth (plugins organization et admin)                 |
| Paiement                         | Stripe Billing                                              |
| Emails                           | Resend + React Email                                        |
| SMS (option, plus tard)          | Octopush ou SMSFactor                                       |
| Itinéraire                       | OpenRouteService                                            |
| IA                               | API Claude (modèle léger) ou Workers AI                     |
| Erreurs et traces                | Sentry (navigateur + `@sentry/cloudflare`)                  |
| Analytics produit, feature flags | PostHog (hébergement UE)                                    |
| Lint / format                    | Oxlint / Oxfmt                                              |
| Hooks git                        | Lefthook                                                    |
| Tests                            | Vitest, Playwright                                          |

## 2. Glossaire métier

| Terme        | Code           | Définition                                                       |
| ------------ | -------------- | ---------------------------------------------------------------- |
| Entreprise   | `Organization` | Le client payant (l'artisan et son équipe)                       |
| Membre       | `Member`       | Utilisateur rattaché à une entreprise avec un rôle               |
| Client       | `Customer`     | Particulier ou entreprise chez qui l'artisan intervient          |
| Lieu         | `Site`         | Adresse d'intervention d'un client                               |
| Équipement   | `Equipment`    | Appareil ou conduit entretenu                                    |
| Métier       | `Trade`        | Configuration d'une activité (ramonage, PAC…)                    |
| Intervention | `Intervention` | Passage planifié ou réalisé                                      |
| Tournée      | `Route`        | Suite ordonnée des interventions d'un technicien sur une journée |
| Attestation  | `Document`     | Document réglementaire signé, immuable                           |
| Échéance     | `DueDate`      | Date du prochain entretien obligatoire                           |
| Relance      | `Reminder`     | Message envoyé au client à l'approche de l'échéance              |

## 3. Contextes métier (DDD léger)

| Contexte     | Responsabilité                                                   |
| ------------ | ---------------------------------------------------------------- |
| `identity`   | Comptes, entreprises, membres, rôles, permissions, impersonation |
| `customers`  | Clients, lieux, équipements, historique                          |
| `scheduling` | Interventions, tournées, confirmation J-1, suivi d'arrivée       |
| `compliance` | Attestations, signature, PDF, numérotation, versions             |
| `engagement` | Échéances, relances, envois email/SMS                            |
| `billing`    | Abonnement Stripe, état du compte                                |
| `backoffice` | Outils internes : support, impersonation, métriques              |

Communication entre contextes : appel via l'`index.ts` public, ou événement de domaine en mémoire (`DocumentSigned` → `engagement` programme la relance). Pas d'event sourcing, pas de CQRS, pas de bus externe.

Ce qui est partagé par tous (shared kernel, `packages/shared`) : identifiants, `Result`, erreurs, `Permission`, `TraceContext`, schémas zod communs.

## 4. Organisation du code

```
apps/
├── web/                      # Astro
│   └── src/{pages,content,components,layouts}
├── app/                      # SPA React
│   └── src/
│       ├── routes/           # Fichiers de routes fins
│       ├── contexts/         # Miroir des contextes métier
│       │   ├── customers/{components,hooks,store.ts,fr.ts,index.ts}
│       │   ├── scheduling/
│       │   ├── compliance/
│       │   └── ...
│       ├── lib/{db,sync,api-client,observability,permissions}
│       └── components/       # shadcn/ui + composants génériques
└── api/                      # Hono sur Workers
    └── src/
        ├── index.ts          # fetch, scheduled, queue
        ├── contexts/
        │   └── customers/
        │       ├── domain/           # Entités, value objects, règles pures, interfaces de repository
        │       ├── application/      # Use cases (un fichier par cas)
        │       ├── infrastructure/   # Repositories D1, adaptateurs externes
        │       ├── http/             # Routes Hono + schémas de requête
        │       └── index.ts
        ├── platform/         # Middleware (trace, auth, org, erreurs, rate limit), logger, providers
        └── jobs/             # Crons et consommateurs de queue
packages/
├── db/                       # Schéma Drizzle, migrations
├── shared/                   # Shared kernel
├── trades/                   # Un dossier par métier
├── pdf/                      # Rendu des attestations
└── emails/                   # Modèles React Email
docs/
├── ARCHITECTURE.md
├── SECURITY.md
└── adr/
```

Règle : `domain/` n'importe rien d'autre que `packages/shared`. Les use cases dépendent d'interfaces, l'infrastructure les implémente.

## 5. Rôles et permissions

### Rôles dans une entreprise

| Permission                        | Propriétaire | Administrateur | Secrétariat | Technicien  |
| --------------------------------- | ------------ | -------------- | ----------- | ----------- |
| Abonnement, suppression du compte | ✓            |                |             |             |
| Membres et rôles                  | ✓            | ✓              |             |             |
| Paramètres entreprise             | ✓            | ✓              |             |             |
| Clients, lieux, équipements       | ✓            | ✓              | ✓           | ✓           |
| Planning de toute l'équipe        | ✓            | ✓              | ✓           | lecture     |
| Ses interventions                 | ✓            | ✓              | ✓           | ✓           |
| Remplir et signer une attestation | ✓            | ✓              |             | ✓           |
| Voir toutes les attestations      | ✓            | ✓              | ✓           | les siennes |
| Relances et modèles de messages   | ✓            | ✓              | ✓           |             |
| Export des données                | ✓            | ✓              |             |             |

### Rôles plateforme (équipe interne)

- `superadmin` : tout le backoffice.
- `support` : lecture des comptes et impersonation en lecture seule.

Les permissions sont des chaînes (`customers:write`, `documents:sign`…) définies dans `packages/shared`. Les rôles sont des listes de permissions. Les vérifications sont faites dans les use cases (`assertCan`), l'interface masque seulement ce qui est interdit.

## 6. Impersonation (« voir comme l'utilisateur »)

- Réservée à `superadmin` et `support`, via le plugin admin de Better Auth.
- Motif obligatoire, durée limitée à 30 minutes.
- **Lecture seule imposée côté serveur** : un middleware refuse toute méthode d'écriture quand la session est une impersonation. Signature d'attestation toujours interdite.
- Bandeau rouge permanent dans l'application avec bouton « Quitter ».
- Chaque début et fin d'impersonation est enregistré dans `audit_logs` et visible par le propriétaire du compte.
- Mentionné dans les CGU et la politique de confidentialité.

## 7. Observabilité

- Le navigateur démarre une trace (Sentry) et envoie `sentry-trace` et `baggage` à l'API. L'API continue la même trace avec `@sentry/cloudflare`.
- Le middleware d'entrée expose le `trace_id` dans le contexte Hono, l'ajoute à chaque log et le renvoie dans l'en-tête `x-trace-id`.
- Les messages de queue transportent le `trace_id`. Chaque cron démarre une nouvelle trace.
- PostHog reçoit le `trace_id` en propriété des événements importants. L'utilisateur est identifié par son id, jamais par son email.
- En cas d'erreur, l'interface affiche les 8 premiers caractères du `trace_id` : le support retrouve la trace complète dans Sentry, PostHog et les logs Workers.
- PostHog : session replay avec masquage de tous les champs de saisie, feature flags pour activer progressivement les nouveautés.

## 8. Données : modèle, index, coûts

Voir `docs/SECURITY.md` pour la protection et les sauvegardes.

D1 facture les lignes lues et écrites. Un index bien placé baisse la facture, un index inutile l'augmente à chaque écriture.

| Table           | Index                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `customers`     | `(organization_id, updated_at)`, `(organization_id, search_name)`                                                 |
| `sites`         | `(organization_id, customer_id)`, `(organization_id, updated_at)`                                                 |
| `equipments`    | `(organization_id, site_id)`, `(organization_id, next_due_date)`, `(organization_id, updated_at)`                 |
| `interventions` | `(organization_id, technician_id, scheduled_date)`, `(organization_id, updated_at)`                               |
| `documents`     | `(organization_id, equipment_id, signed_at)`, `(organization_id, number)` unique, `(organization_id, updated_at)` |
| `reminders`     | `(status, due_at)` pour le cron, `(organization_id, equipment_id)`                                                |
| `notifications` | `(organization_id, created_at)`                                                                                   |
| `audit_logs`    | `(organization_id, created_at)`                                                                                   |
| `members`       | `(user_id)`, `(organization_id, user_id)` unique                                                                  |

Règles :

- Toute table synchronisée a un index `(organization_id, updated_at)` : c'est la requête de synchronisation, la plus fréquente.
- `search_name` : nom normalisé (minuscules, sans accents) pour une recherche par préfixe qui utilise l'index.
- Le contenu d'une attestation est stocké en JSON dans `documents.data`. Les fichiers vont dans R2, jamais dans D1.
- Pagination par curseur (`updated_at`, `id`). Pas de `COUNT(*)` sur les grosses tables : compteurs dénormalisés si besoin.
- Vérifier chaque nouvelle requête avec `EXPLAIN QUERY PLAN`.
- Suppression logique (`deleted_at`) pour la synchronisation, purge définitive par un job mensuel.
- Une seule base D1 multi-entreprises au départ. Si une base approche ses limites, découper par groupes d'entreprises (ADR à écrire à ce moment-là).

## 9. Environnements et déploiement

- Environnements : `local` (wrangler dev + D1 local), `staging`, `production`. Chacun a sa base D1, son bucket R2, ses clés Stripe/Resend/Sentry/PostHog.
- Pas de pipeline CI pour l'instant. Déploiement depuis le poste :
  - `pnpm release:staging` : `pnpm check` → migrations D1 staging → déploiement → upload des sourcemaps Sentry.
  - `pnpm release:prod` : même chose avec confirmation manuelle, et uniquement depuis `main` propre.
- Lefthook : `oxfmt` et `oxlint` sur les fichiers modifiés au commit, `typecheck` et tests au push.
- Données de démonstration : `pnpm db:seed:local` (données fictives uniquement).

## 10. Roadmap

**V1** : identity (comptes, rôles), customers, scheduling simple, compliance (ramonage + entretien appareil, signature, PDF), engagement (relances email), billing, hors ligne, import CSV, export, observabilité, backoffice minimal avec impersonation.

**V1.1** : confirmation J-1, suivi d'arrivée sans GPS, IA (plaque signalétique, carnet papier, dictée), QR code équipement.

**V2** : devis et factures, facture électronique (via plateforme agréée), option SMS, prise de rendez-vous en ligne, nouveaux métiers.
