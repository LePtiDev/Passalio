# Architecture

Passalio : SaaS pour artisans d'entretien obligatoire (ramoneurs d'abord) : attestations remplies et signées sur place, PDF envoyé au client, relances automatiques. 29,99 €/mois ou 299,90 €/an, utilisateurs illimités, tous métiers.

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
| Emails                           | Resend, gabarits HTML (ADR 0016)                            |
| SMS (option, plus tard)          | Octopush ou SMSFactor                                       |
| Itinéraire                       | OpenRouteService                                            |
| IA                               | AI SDK, modèle interchangeable par variable (ADR 0022)      |
| Erreurs et traces                | Sentry (navigateur + `@sentry/cloudflare`)                  |
| Analytics produit, feature flags | PostHog (hébergement UE)                                    |
| Lint / format                    | Oxlint / Oxfmt                                              |
| Hooks git                        | Lefthook                                                    |
| Tests                            | Vitest, Playwright                                          |

## 2. Glossaire métier

| Terme                 | Code               | Définition                                                                                   |
| --------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| Entreprise            | `Organization`     | Le client payant (l'artisan et son équipe)                                                   |
| Membre                | `Member`           | Utilisateur rattaché à une entreprise avec un rôle                                           |
| Client                | `Customer`         | Particulier ou entreprise chez qui l'artisan intervient                                      |
| Lieu                  | `Site`             | Adresse d'intervention d'un client                                                           |
| Équipement            | `Equipment`        | Appareil ou conduit entretenu                                                                |
| Métier                | `Trade`            | Configuration d'une activité (ramonage, PAC…)                                                |
| Intervention          | `Intervention`     | Passage planifié ou réalisé                                                                  |
| Tournée               | `Route`            | Suite ordonnée des interventions d'un technicien sur une journée                             |
| Attestation           | `Document`         | Document réglementaire signé, immuable                                                       |
| Échéance              | `DueDate`          | Date du prochain entretien obligatoire                                                       |
| Relance               | `Reminder`         | Message envoyé au client à l'approche de l'échéance                                          |
| Espace particulier    | `CustomerAccount`  | Compte Passalio d'un particulier, commun à tous ses prestataires (ADR 0013)                  |
| Lien client           | `CustomerLink`     | Lien consenti entre un espace particulier et une fiche client                                |
| Entreprise prospectée | `ProspectCompany`  | Ramoneur que l'équipe Passalio démarche (contexte `sales`)                                   |
| Contact               | `ProspectContact`  | Personne d'une entreprise prospectée                                                         |
| Étape                 | `ProspectStage`    | Où en est la prospection : à qualifier, qualifiée, intéressée, démo, cliente, pas intéressée |
| Appel                 | `ProspectCall`     | Appel passé à une entreprise prospectée : résultat, prochaine action, notes                  |
| Suivi                 | `ProspectFollowUp` | Dernier appel et qualification d'une entreprise prospectée                                   |
| Rappel                | `ProspectTask`     | Rappel ou démo prévu à une date pour une personne de l'équipe, avec sa notification          |

## 3. Contextes métier (DDD léger)

| Contexte        | Responsabilité                                                       |
| --------------- | -------------------------------------------------------------------- |
| `identity`      | Comptes, entreprises, membres, rôles, permissions, impersonation     |
| `customers`     | Clients, lieux, équipements, historique                              |
| `scheduling`    | Interventions, tournées, confirmation J-1, suivi d'arrivée           |
| `compliance`    | Attestations, signature, PDF, numérotation, versions                 |
| `engagement`    | Échéances, relances, envois email/SMS                                |
| `billing`       | Abonnement Stripe, état du compte                                    |
| `backoffice`    | Outils internes : support, impersonation, métriques                  |
| `sales`         | Prospection de Passalio : entreprises, contacts, étapes, historique  |
| `platform-team` | Équipe Passalio : membres, rôles plateforme, invitations             |
| `mcp`           | Serveur MCP admin : OAuth, consentement, outils pour Claude          |
| `sync`          | Routes `/sync/push` et `/sync/pull`, assemblent les autres contextes |

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
├── emails/                   # Gabarits d'e-mail HTML et texte (ADR 0016)
└── test-guard/               # pnpm test:guard : aucun test existant changé sans accord, aucun code sans test (ADR 0020, 0023)
docs/
├── ARCHITECTURE.md
├── SECURITY.md
├── regulatory/               # Mentions obligatoires par document et par métier
└── adr/
```

Règle : `domain/` n'importe rien d'autre que `packages/shared`. Les use cases dépendent d'interfaces, l'infrastructure les implémente.

## 5. Rôles et permissions

### Rôles dans une entreprise

| Permission                        | Propriétaire | Administrateur | Secrétariat | Technicien  |
| --------------------------------- | ------------ | -------------- | ----------- | ----------- |
| Abonnement, suppression du compte | ✓            |                |             |             |
| Membres et rôles                  | ✓            | ✓              |             |             |
| Paramètres entreprise             | ✓            | ✓              | lecture     | lecture     |
| Clients, lieux, équipements       | ✓            | ✓              | ✓           | ✓           |
| Archiver un client                | ✓            | ✓              | ✓           |             |
| Planning de toute l'équipe        | ✓            | ✓              | ✓           | lecture     |
| Ses interventions                 | ✓            | ✓              | ✓           | ✓           |
| Remplir et signer une attestation | ✓            | ✓              |             | ✓           |
| Voir toutes les attestations      | ✓            | ✓              | ✓           | les siennes |
| Relances et modèles de messages   | ✓            | ✓              | ✓           |             |
| Export des données                | ✓            | ✓              |             |             |

### Rôles plateforme (équipe interne)

- `superadmin` (Super admin) : tout le backoffice, y compris l'équipe Passalio (`team:manage`).
- `admin` (Admin) : tout le backoffice sauf l'équipe (ADR 0018, remplace `support`).
- `sales` (Commercial) : seulement la prospection, pas les comptes clients (ADR 0017).

Permissions plateforme dans `packages/shared/src/platform-permissions.ts`, vérifiées par `assertPlatformCan`. Routes sous `/api/admin`, protégées par `requirePlatformActor` (contexte `backoffice`). Le rôle se donne depuis la page « Équipe Passalio » par invitation (ADR 0018), ou en urgence avec `pnpm platform:grant --env <local|staging|production> --email <email> --role <superadmin|admin|sales>` et se retire avec `pnpm platform:revoke`. Double authentification obligatoire. Lecture des comptes clients : `GET /api/admin/overview`, `/accounts`, `/accounts/:id` (et `/members`, `/usage`, `/journal`), `/journal`, réponses décrites par les schémas zod de `packages/shared/src/backoffice-responses.ts`. L'utilisation se mesure en jours d'utilisation par personne (`activity_days`). Voir ADR 0015.

Écrans de l'espace admin (`apps/app/src/contexts/backoffice/`) : `/admin` (vue d'ensemble), `/admin/comptes?filtre=&recherche=`, `/admin/comptes/:accountId?onglet=personnel|utilisation|journal`, `/admin/journal`, `/admin/equipe` (super admin seulement : membres, invitations, changer un rôle, retirer). L'invitation s'accepte sur `/equipe-passalio/invitations/:id` après connexion ou création de compte avec la même adresse. Avant d'entrer, le garde de route appelle `/api/admin/me` : 404 renvoie à l'accueil, 403 à `/admin/securite` (activation de la double authentification : mot de passe, QR code, codes de secours), 401 à `/admin/code`. Une connexion par mot de passe d'un compte à double authentification passe par `/connexion/code`. Ce ne sont pas des écrans terrain : ils demandent le réseau.

Un seul propriétaire par entreprise. Il peut transférer ce rôle à un administrateur, qui devient propriétaire pendant que l'ancien devient administrateur. Personne ne peut inviter, nommer ou retirer un propriétaire. Une même personne peut être membre de plusieurs entreprises, avec un rôle par entreprise.

Les permissions sont des chaînes (`customers:write`, `documents:sign`…) définies dans `packages/shared`. Les rôles sont des listes de permissions. Les vérifications sont faites dans les use cases (`assertCan`), l'interface masque seulement ce qui est interdit.

Dans le code : rôles `owner`, `admin`, `secretary`, `technician` (`packages/shared/src/roles.ts`), permissions dans `packages/shared/src/permissions.ts`. Chaque permission est de type `read`, `write` ou `export` : pendant une impersonation, seules les permissions `read` passent. `assertCan` lève une `ForbiddenError`, que l'API transforme en réponse 403 avec le `trace_id`.

### Comptes et connexion (contexte `identity`)

- Connexion par email et mot de passe (12 caractères minimum, voir ADR 0012), mot de passe oublié par lien valable 1 heure. Le lien magique valable 15 minutes reste en option. Jetons stockés hachés. Session de 30 jours renouvelée chaque jour, adresse IP et navigateur gardés pour afficher les appareils connectés. Côté application, la session (et l'accès à l'espace admin) est vérifiée au premier chargement, puis gardée en mémoire : un changement de page n'attend pas le serveur. Elle est revérifiée en arrière-plan à la navigation si la dernière vérification date de plus d'une minute, et une session terminée renvoie à la connexion (`apps/app/src/lib/remembered-check.ts`). L'API vérifie toujours la session à chaque requête.
- Tables : `users`, `sessions`, `accounts`, `verifications` (Better Auth), `organizations`, `members`, `invitations` (plugin organization), `audit_logs`.
- Better Auth n'ouvre que la connexion, les sessions et le choix de l'entreprise active (voir ADR 0011). Le reste passe par les routes de l'API : `POST /api/organizations`, `GET /api/members`, `GET` et `POST /api/invitations` (invitations en attente, invitation), `POST /api/invitations/:invitationId/resend` (renvoi, validité repoussée de 7 jours), `DELETE /api/invitations/:invitationId` (annulation), `POST /api/invitations/:organizationId/:invitationId/accept`, `PATCH` et `DELETE /api/members/:memberId`, `POST /api/ownership-transfer`.
- Déploiement : un seul Worker par environnement sert l'application (fichiers statiques de `apps/app/dist`, repli sur `index.html`) et l'API (`/api/*` et `/health` passent d'abord par le Worker). Domaines : `app.staging.passalio.com` (Worker `passalio-api-staging`) et `app.passalio.com` (Worker `passalio-api`). `passalio.com` est réservé au site. Le service worker de la PWA ne répond jamais à la place de `/api`. Mise à jour automatique : le nouveau service worker prend la main dès son installation et la page se recharge sur la nouvelle version (`apps/app/src/lib/service-worker.ts`). Le navigateur vérifie s'il existe une version plus récente au retour sur l'onglet et toutes les 30 minutes. Les modifications faites hors ligne restent dans Dexie, un rechargement ne les perd pas.
- L'application appelle l'API sur la même origine, sous `/api` (proxy Vite en local, route Workers `/api/*` sur le domaine de l'application en staging et production). Les cookies de session restent ainsi `SameSite=Lax` sans CORS. `BETTER_AUTH_URL` vaut donc l'adresse de l'application.
- Écrans : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/mot-de-passe/nouveau`, `/configuration/{entreprise,metiers,documents,equipe}`, `/` (Premiers pas), `/equipe`, `/reglages`, `/invitations/:organizationId/:invitationId`. Ce ne sont pas des écrans terrain : ils demandent le réseau.
- Gardes de route (`apps/app/src/lib/session.ts`) : une personne connectée qui ouvre `/connexion`, `/inscription`, `/mot-de-passe-oublie` ou `/connexion/code` repart vers `retour` ou l'accueil. Un admin plateforme (rôle `superadmin`, `admin` ou `sales`) ne voit jamais la configuration d'entreprise ni les Premiers pas sans entreprise : il est envoyé sur `/admin`. Pendant une impersonation, la session est celle du client, donc ces règles suivent son rôle. Le paramètre `retour` n'accepte qu'un chemin interne (`/…`, jamais `//…`).
- Pages légales publiques : `/conditions` (conditions générales et accord de sous-traitance RGPD), `/confidentialite`, `/mentions-legales`. Textes dans `apps/app/src/legal/`, informations de l'éditeur dans `PUBLISHER` (`legal-fr.ts`). L'inscription envoie `termsVersion` ; l'API refuse une version différente de `TERMS_VERSION` (`packages/shared`) et enregistre `users.terms_version` et `users.terms_accepted_at`. Changer les conditions = incrémenter `TERMS_VERSION`.
- Champ de recherche des listes : composant partagé `apps/app/src/components/search-field.tsx` (48 px sur mobile, 32 px sur ordinateur), à réutiliser sur toutes les listes.
- Coque de l'application connectée : barre latérale sur ordinateur, barre d'onglets en bas sur mobile (`apps/app/src/components/app-shell/`). Les entrées pas encore construites sont affichées grisées avec « Bientôt ».
- Emails : en local (`EMAIL_DELIVERY=log`), le lien est écrit dans le terminal sans l'adresse. En staging et en production (`EMAIL_DELIVERY=resend`), l'API envoie par Resend depuis `ne-pas-repondre@passalio.com` avec le secret `RESEND_API_KEY` ; sans ce secret, l'envoi est refusé. L'invitation affiche le nom de la personne qui invite. Gabarits dans `packages/emails`, images dans `apps/app/public/email/` (ADR 0016).
- Les informations légales de l'entreprise (SIRET, adresse, assurance, qualification) arriveront avec les attestations.

### Clients, lieux, équipements (contexte `customers`)

- Tables : `customers` (particulier ou entreprise, `search_name` normalisé), `sites` (adresse d'intervention, occupant facultatif), `equipments`, `equipment_photos`. Toutes synchronisées : identifiant UUIDv7 que le téléphone peut choisir hors ligne, `updated_at`, `deleted_at`.
- Type d'appareil : catalogue `EQUIPMENT_CATALOG` de `packages/trades`. Les métiers d'un appareil se déduisent de son type (un insert relève du ramonage et de l'entretien de poêle) : pas de `trade_id` sur `equipments`. L'API refuse un type qu'aucun métier de l'entreprise ne couvre.
- Champs propres à un métier (conduit, type de chaudière, fluide frigorigène d'une PAC) : colonne JSON `details`, validée par le schéma de la famille d'appareil (`detailsSchemaOf`).
- Installation et remplacement : `is_installed_by_us`, `commissioned_on`, ou `installation_year` pour un appareil déjà en place (migration 0005). Ajouter un appareil avec `replacesEquipmentId` passe l'ancien en `removed` (`removed_on`, `replaced_by_equipment_id`) dans le même lot. Un appareil retiré reste visible dans l'historique.
- `last_sweeping_on` et `last_service_on` gardent le dernier passage fait avant Passalio. `next_due_date` reste vide tant que les périodicités par métier ne sont pas configurées.
- Photos : fichiers dans R2 sous `organizations/{organization_id}/equipment-photos/{photo_id}`, 5 Mo maximum, JPEG, PNG ou WebP. La clé R2 n'est jamais renvoyée au navigateur.
- Archivage (permission `customers:archive`) : suppression logique du client, de ses lieux, appareils et photos. Un client n'est jamais supprimé définitivement s'il a une attestation signée.
- Routes : `POST /api/sync/push` et `GET /api/sync/pull` (voir plus bas), `GET` et `POST /api/customers` (recherche par préfixe `q`, curseur), `GET`, `PATCH` et `DELETE /api/customers/:customerId`, `POST /api/customers/:customerId/sites`, `PATCH /api/sites/:siteId`, `POST /api/sites/:siteId/equipments`, `PATCH /api/equipments/:equipmentId`, `POST /api/equipments/:equipmentId/removal`, `POST /api/equipments/:equipmentId/photos?kind=plate|overview`, `GET /api/photos/:photoId`, `POST /api/plate-readings`.
- Lecture de plaque (ADR 0022) : photo envoyée au modèle choisi par `PLATE_READER_MODEL`, réponse revalidée par `sanitizePlateReading`, quota de 200 lectures par entreprise et par jour dans `plate_readings` (sans aucune valeur lue). Activation, coûts et incidents : `docs/ai-plate-reading.md`.

- Écrans (terrain, hors ligne) : `/clients` (liste, recherche par nom, ville ou téléphone, filtres d'échéance), `/clients/nouveau`, `/clients/:customerId` (fiche), `/clients/:customerId/modifier`, `/clients/:customerId/lieux/nouveau`, `/clients/:customerId/appareils/nouveau?lieu=&remplace=`. Ils lisent et écrivent uniquement dans Dexie. Les types d'appareil proposés suivent les métiers de l'entreprise. Photos et lecture de plaque : téléphone seulement. La lecture ne remplit que les champs vides et marque « Lu sur la plaque » ; type et combustible se choisissent dans des listes déroulantes. L'adresse est complétée par la Base Adresse Nationale (`data.geopf.fr`), saisie manuelle possible hors ligne.

### Passages et certificats (contextes `scheduling` et `compliance`, ADR 0021)

- Tables : `interventions` (client, lieu, technicien principal `technician_user_id` et tous les techniciens `technician_user_ids` (JSON), date et heure prévues, durée, appareils prévus `equipment_ids`, métiers `visit_types` (JSON), prestations choisies `service_lines` (JSON, copie figée : id, nom, durée, prix), prix annoncé, statut `planned`, `completed` ou `cancelled`, date d'achèvement, moyen de paiement et montant payé), `documents` (certificat signé : passage, appareil, métier, modèle et version, numéro et préfixe, téléphone, signataire, `signed_at`, `completed_on`, `cancels_document_id`, contenu `data` en JSON), `document_number_blocks` (blocs de 20 numéros réservés par une personne pour un téléphone).
- Synchronisation seulement : modifications `create_intervention`, `update_intervention`, `cancel_intervention`, `complete_intervention` (`packages/shared/src/scheduling.ts`) et `sign_document` (`packages/shared/src/compliance.ts`). `/sync/pull` renvoie aussi `interventions` et `documents`.
- Permissions : `schedule:write` (propriétaire, administrateur, secrétariat) pour tous les passages, `interventions:write-own` pour ceux du technicien lui-même ; `documents:sign` pour réserver des numéros et signer (jamais pendant une impersonation, jamais le secrétariat) ; `documents:read-all` ou `documents:read-own` (le technicien ne reçoit que ses certificats).
- Certificat de ramonage : schéma `chimneySweepingCertificate` (version 1) et règles `checkCertificate` dans `packages/trades/src/chimney-sweeping/`. Bloquent la signature : au moins un conduit identifié, vacuité sur toute la longueur ou ramonage partiel avec la partie non ramonée, aucune vacuité pour un appareil gaz étanche (conduit concentrique), conseils d'utilisation pour un appareil à combustible solide hors chaudière, capital social d'une SARL ou société par actions, signature du client ou « client absent ». À la signature, l'appareil reçoit `last_sweeping_on` et `next_due_date` (+12 mois).
- Route : `POST /api/document-number-blocks` (`{ deviceId }` → `{ id, deviceId, numberPrefix, firstNumber, lastNumber }`).
- Prestations (ADR 0025) : table `services` (nom, durée de 15 min à 8 h ou de 1 à 10 jours, prix TTC ou vide « sur devis », document remis, métier facultatif, `archived_at`). Routes : `GET /api/services` (`schedule:read`) → `{ services }` ; `POST /api/services`, `PATCH /api/services/:serviceId`, `POST /api/services/:serviceId/archive` (`organization:update`). Un passage garde la copie des prestations choisies ; modifier ou retirer une prestation ne change pas les passages déjà prévus. Un technicien gère un passage dès qu'il fait partie de ses techniciens.
- Écrans (terrain, hors ligne, `apps/app/src/contexts/scheduling/`) : `/planning?jour=&vue=jour|semaine&agendas=&passage=`, `/planning/nouveau?jour=&client=&technicien=`, `/passages/:interventionId`, `/reglages/prestations` (liste des prestations, modifiable par propriétaire et administrateur). Ils lisent et écrivent dans Dexie (tables locales `interventions`, `documents`, `members`, `services`). Le technicien ne voit que son planning ; avec `schedule:write`, on voit l'équipe, on choisit les agendas affichés (séparés par « . » dans l'URL) et on crée des passages. Une couleur par technicien, la personne connectée en premier et en bleu. Les passages qui se chevauchent sont placés côte à côte ; au-delà de 2 (semaine), 3 (mobile) ou 4 (jour), un « +N » ouvre la vue jour. Heure actuelle : trait rouge horizontal. Nouveau passage : « Prestations » (plusieurs choix, présélectionnées d'après les appareils cochés) remplissent « Durée » (somme, plafonnée à 8 h) et « Prix annoncé » (somme des prix connus), modifiables pour ce passage ; sans prestation connue sur le téléphone, 1 h. « Techniciens » : un ou plusieurs, le premier est le technicien principal ; le passage apparaît dans l'agenda de chacun.

### Prospection (contexte `sales`, ADR 0017)

- Tables : `prospect_companies` (entreprise, adresse, département, coordonnées, outil actuel `current_tool`, étape, suivi par `owner_user_id`), `prospect_contacts` (un seul contact principal par entreprise), `prospect_events` (notes et changements d'étape, jamais modifiés). Pas d'`organization_id` : ce sont les données de Passalio.
- Permissions `prospects:read` et `prospects:write` (rôles `superadmin`, `admin`, `sales`).
- Routes sous `/api/admin/prospects` : `GET /filters` (départements, personnes de l'équipe), `GET /map?department=&stage=`, `GET` et `POST /companies` (`stage`, `department`, `owner`, `q`, `cursor`), `GET`, `PATCH` et `DELETE /companies/:companyId`, `POST /companies/:companyId/stage`, `/notes`, `/contacts`, `GET /contacts` (`filter=all|leaders|no_phone`, `department`, `q`, `cursor`), `GET`, `PATCH` et `DELETE /contacts/:contactId`. Réponses décrites par `packages/shared/src/prospect-responses.ts`.
- Appels et rappels (ADR 0024) : tables `prospect_calls` (appels, jamais modifiés), `prospect_follow_ups` (dernier appel et qualification, une ligne par entreprise), `prospect_tasks` (rappels et démos, notification calculée en heure de Paris). Routes `POST /companies/:companyId/calls`, `PATCH /companies/:companyId/qualification`, `GET /companies/:companyId/follow-up`, `GET /my-day`, `GET /call-series?target=never_called|not_reached&department=&cursor=`, `PATCH /tasks/:taskId`. Réponses décrites par `packages/shared/src/prospect-call-responses.ts`.
- Écrans (espace admin, `apps/app/src/contexts/sales/`) : `/admin/entreprises?etape=&departement=&suivi=&recherche=`, `/admin/entreprises/:companyId`, `/admin/contacts?onglet=&departement=&recherche=`, `/admin/contacts/:contactId`. Onglets par étape, filtres actifs à gauche, recherche et menu « Filtres » à droite. Le menu « Filtres » est en cascade : sur ordinateur, un sous-menu par filtre, ouvert à gauche avec sa flèche vers la gauche ; sur mobile, un panneau du bas à deux niveaux. Au-delà de 7 choix, une recherche filtre la liste (taper « 94 » ou « marne »). Dans tous les menus et listes déroulantes, la coche du choix actif est à droite. Le rôle `sales`, sans `platform:read`, ne voit que Commercial : les pages Plateforme le renvoient vers `/admin/entreprises`.
- Prospection (`/admin/prospection?etape=&departement=&recherche=&entreprise=`) : onglets À qualifier, Qualifiées, Pas intéressées ; liste à gauche, carte Leaflet (dépendance `leaflet`) sur le fond Plan IGN v2 servi par `data.geopf.fr` (WMTS, sans clé, attribution « © IGN »), points colorés par étape, fiche flottante pour qualifier sans quitter la carte. Sur mobile, carte plein écran, recherche flottante et feuille en bas. La fiche entreprise montre une mini-carte et un lien « Voir sur la carte » (tuile « Carte » sur mobile).
- Import : `pnpm prospects:import --env <local|staging|production> --file <csv>` (géocodage IGN, relançable sans perdre étapes et notes).

### Serveur MCP admin (contexte `mcp`, ADR 0019)

- `/mcp` (Streamable HTTP, jeton Bearer), OAuth sur `/oauth/register`, `/oauth/token`, `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource/mcp`. Ces chemins passent par le Worker avant les fichiers statiques (`run_worker_first`).
- Consentement : écran `/admin/mcp/autoriser` (`apps/app/src/contexts/backoffice/components/mcp/`), API `GET`, `POST /api/admin/mcp/authorization` et `POST /denial`. Permission `mcp:connect` (super admin, admin).
- Outils lecture : `get_overview`, `list_accounts`, `get_account`, `list_journal`, `get_prospect_filters`, `list_prospect_companies`, `get_prospect_company`, `list_prospect_contacts`, `get_prospect_contact`. Outils écriture (accès « Lecture et écriture ») : `create_prospect_company`, `update_prospect_company`, `change_prospect_stage`, `add_prospect_note`, `add_prospect_contact`, `update_prospect_contact`.
- Retrait : `pnpm mcp:revoke --env <local|staging|production> --email <email>`. Activé par `MCP_ENABLED` et le KV `OAUTH_KV`.

### Hors ligne et synchronisation (ADR 0003 et 0014)

- Passages et certificats passent par la même synchronisation (ADR 0021) ; leurs écrans arrivent avec la maquette validée le 2026-10-23.
- Base locale Dexie par entreprise (`passalio-{organization_id}`, `apps/app/src/lib/db/`) : `customers`, `sites`, `equipments`, `photos`, plus `outbox` (modifications en attente), `pendingPhotos` (photos à envoyer), `rejections` (modifications refusées) et `syncState` (curseur, dernière synchronisation). Supprimée à la déconnexion.
- Les écrans écrivent dans Dexie et ajoutent la modification à `outbox` dans la même transaction (`apps/app/src/contexts/customers/`). Types de modification et schémas zod communs dans `packages/shared` (`customer-mutations.ts`, `customer-schemas.ts`).
- Cycle (`apps/app/src/lib/sync/`) : envoi de `outbox` par lots de 50 (`POST /api/sync/push`), envoi des photos une fois leur appareil connu du serveur, puis chargement (`GET /api/sync/pull?cursor=`) par pages de 200 lignes par table, suppressions comprises (`deletedAt`). Le curseur est opaque : un couple (`updated_at`, `id`) par table. Déclenché à l'ouverture, au retour du réseau, toutes les minutes et une seconde après chaque modification.
- `useSyncStatus` donne l'état (`idle`, `syncing`, `offline`, `error`), le nombre de modifications en attente, de refus et l'heure de la dernière synchronisation, pour l'indicateur des écrans terrain.
- Démarrage sans réseau : la dernière session (id, nom, email, entreprise active) est gardée dans `localStorage` et sert quand l'API est injoignable. Effacée à la déconnexion.

## 6. Impersonation (« voir comme l'utilisateur »)

- Réservée à `superadmin` et `admin`, via le plugin admin de Better Auth.
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

| Table                    | Index                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `customers`              | `(organization_id, updated_at)`, `(organization_id, search_name)`                                                                                                        |
| `sites`                  | `(organization_id, customer_id)`, `(organization_id, updated_at)`                                                                                                        |
| `equipments`             | `(organization_id, site_id)`, `(organization_id, next_due_date)`, `(organization_id, updated_at)`                                                                        |
| `equipment_photos`       | `(organization_id, equipment_id)`, `(organization_id, updated_at)`                                                                                                       |
| `plate_readings`         | `(organization_id, day)` pour le quota du jour                                                                                                                           |
| `interventions`          | `(organization_id, updated_at)`                                                                                                                                          |
| `services`               | `(organization_id, created_at)` pour la liste des prestations                                                                                                            |
| `documents`              | `(organization_id, number)` unique, `(organization_id, cancels_document_id)` unique, `(organization_id, updated_at)`, `(organization_id, signed_by_user_id, updated_at)` |
| `document_number_blocks` | `(organization_id, user_id, last_number)` pour vérifier qu'un numéro est réservé                                                                                         |
| `reminders`              | `(status, due_at)` pour le cron, `(organization_id, equipment_id)`                                                                                                       |
| `notifications`          | `(organization_id, created_at)`                                                                                                                                          |
| `audit_logs`             | `(organization_id, created_at)`                                                                                                                                          |
| `members`                | `(user_id)`, `(organization_id, user_id)` unique                                                                                                                         |
| `invitations`            | `(organization_id, status)`, `(email)`                                                                                                                                   |
| `sessions`               | `(token)` unique, `(user_id)`                                                                                                                                            |
| `accounts`               | `(user_id)`                                                                                                                                                              |
| `verifications`          | `(identifier)`                                                                                                                                                           |
| `rate_limits`            | `(key)` unique, `(last_request)` pour la purge des compteurs expirés                                                                                                     |
| `prospect_companies`     | `(source_ref)` unique, `(department, stage, search_name)`, `(department, search_name)`, `(stage, search_name)`, `(search_name)`                                          |
| `prospect_contacts`      | `(company_id)`, `(search_name)`                                                                                                                                          |
| `prospect_events`        | `(company_id, created_at)`, `(contact_id, created_at)`                                                                                                                   |
| `prospect_calls`         | `(company_id, called_at)`, `(author_user_id, called_at)` pour les appels du jour, `(contact_id)`                                                                         |
| `prospect_tasks`         | `(owner_user_id, status, due_at)` pour Ma journée, `(company_id, status)`, `(contact_id)`                                                                                |
| `users`                  | `(email)` unique, `(role)` pour lister l'équipe Passalio                                                                                                                 |
| `platform_invitations`   | `(status, created_at)` pour les invitations en attente, `(email, status)`                                                                                                |

Règles :

- Toute table synchronisée a un index `(organization_id, updated_at)` : c'est la requête de synchronisation, la plus fréquente.
- `search_name` : nom normalisé (minuscules, sans accents) pour une recherche par préfixe qui utilise l'index.
- Le contenu d'une attestation est stocké en JSON dans `documents.data`. Les fichiers vont dans R2, jamais dans D1.
- Pagination par curseur (`updated_at`, `id`). Pas de `COUNT(*)` sur les grosses tables : compteurs dénormalisés si besoin.
- Listes à l'écran : une page tient sans défiler. `useFittingRows` (`apps/app/src/lib/`) calcule le nombre de lignes selon la hauteur de la fenêtre (5 à 50), envoyé en `limit` aux routes de liste ; `useCursorPages` garde la pile des curseurs pour revenir en arrière ; le composant `Pagination` affiche « 1–10 sur 34 », la page et les boutons précédent et suivant. Les clients, lus dans Dexie, sont découpés côté app (`usePageNumber`).
- Vérifier chaque nouvelle requête avec `EXPLAIN QUERY PLAN`.
- Suppression logique (`deleted_at`) pour la synchronisation, purge définitive par un job mensuel.
- Une seule base D1 multi-entreprises au départ. Si une base approche ses limites, découper par groupes d'entreprises (ADR à écrire à ce moment-là).

## 9. Environnements et déploiement

- Environnements : `local` (wrangler dev + D1 local), `staging`, `production`. Chacun a sa base D1, son bucket R2, ses clés Stripe/Resend/Sentry/PostHog.
- Pas de pipeline CI pour l'instant. Déploiement depuis le poste :
  - `pnpm release:staging` : `pnpm check` → migrations D1 staging → déploiement de l'app et de l'API → build et déploiement du site (`apps/web`, Worker d'assets statiques `passalio-web-staging` sur staging.passalio.com, non indexé, liens vers app.staging.passalio.com) → upload des sourcemaps Sentry (pas encore branché, Sentry n'est pas installé).
  - `pnpm release:prod` : même chose avec confirmation manuelle, et uniquement depuis `main` propre. Le site part sur `passalio-web` (passalio.com).
- Lefthook : `oxfmt` et `oxlint` sur les fichiers modifiés au commit, `typecheck` et tests au push.
- Données de démonstration : `pnpm db:seed:local` (données fictives uniquement).

## 10. Roadmap

Voir `docs/ROADMAP.md` (périmètre des versions, todo et calendrier).
