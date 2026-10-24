# Tests

Règles dans les ADR 0020 et 0023 et dans `CLAUDE.md`. Ce fichier est l'inventaire : chaque nouvelle route, permission, requête fréquente ou écran y ajoute ses lignes dans la même PR.

## Règles en bref

- Un test existant ne se modifie ni ne se supprime sans l'accord de Quentin, sauf si l'exigence a changé à sa demande. Le commit porte `Test-Change-Approved: <lien vers son message>`. `pnpm test:guard` bloque sinon.
- On ne change jamais un test pour le faire passer.
- Pas de code sans tests : tout comportement ajouté ou changé arrive avec ses tests dans la même PR. Sinon le commit porte `Tests-Not-Needed: <raison>`, et `pnpm test:guard` bloque sans elle (ADR 0023).
- Un bug : commit `test: reproduce …` (rouge), puis commit `fix: …`. Skill `fix-bug`.
- Interdits par le lint : `.only`, `.skip`, `.todo`, `fixme`, `expect` conditionnel, test sans assertion.

## Commandes

| Commande          | Ce qui tourne                                                                 | Quand                                            |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| `pnpm test`       | Vitest de tous les paquets (familles 2 à 12)                                  | Chaque push (hook), `pnpm check`                 |
| `pnpm test:guard` | Aucun test existant changé sans accord, aucun code de production sans test    | Chaque push (hook), `pnpm check`                 |
| `pnpm test:e2e`   | Playwright : parcours, hors ligne, accessibilité, captures (familles 13 à 17) | Avant chaque fusion d'une PR qui touche l'app    |
| `pnpm check`      | Format, lint, types, `test:guard`, `test`                                     | Chaque push, avant chaque fusion, dans `release` |

Lancer avec Node 24 (`.nvmrc`). Playwright : `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:e2e` dans une session cloud. Pour lancer deux suites en même temps, changer les ports avec `E2E_API_PORT`, `E2E_APP_PORT` et `E2E_INSPECTOR_PORT`.

Dans `apps/app`, Vitest a deux projets : `unit` (fonctions, hooks, stores, Node) et `components` (écrans, happy-dom).

## Où vont les tests

| Ce qu'on teste                                   | Fichier                                               | Outil                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------- |
| Règle pure, value object                         | à côté du fichier : `xxx.test.ts`                     | Vitest                                      |
| Use case                                         | `apps/api/src/contexts/<ctx>/application/xxx.test.ts` | Vitest, repositories en mémoire             |
| Route API                                        | `apps/api/test/<ctx>-routes.test.ts`                  | Vitest, D1 locale (`test/test-platform.ts`) |
| Matrices (permissions, isolation, impersonation) | `apps/api/test/matrices/`                             | Vitest, générées depuis les routes Hono     |
| Fonction, hook, store de l'app                   | à côté du fichier                                     | Vitest, `fake-indexeddb`                    |
| Composant, état d'écran                          | à côté du composant : `xxx.test.tsx`                  | Vitest, projet `components` (happy-dom)     |
| Parcours                                         | `apps/app/e2e/<espace>.spec.ts`                       | Playwright                                  |

Aides partagées :

- `apps/app/src/test-support/` : `renderScreen` (routeur, client de requêtes, base locale), `installFakeApi` avec `jsonReply`, `errorReply`, `heldReply` (réponse retenue pour voir l'état de chargement), graines de la base locale, `showMobileViewport`.
- `apps/app/e2e/support/` : comptes et entreprise prête (`signUpAndOnboardOwner`), liens des e-mails envoyés, adresse IP propre à chaque test (limite d'inscription), contrôle axe-core (`expectNoSeriousAccessibilityViolations`), zones tactiles de 48 px, tailles d'écran, réseau coupé ou rétabli, second appareil.

Titres de test en anglais, qui décrivent le comportement attendu (`a technician cannot archive a customer`). Un test vérifie un comportement observable, pas un détail d'implémentation.

## Les 18 familles

| #   | Famille                       | Ce qu'on vérifie                                                                                                    | Règle de complétude                                  |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Statique                      | Types stricts, lint (dont lint des tests), format                                                                   | `pnpm check`                                         |
| 2   | Règles métier                 | Fonctions pures de `domain/` et `packages/*` : cas nominal, limites, refus                                          | Chaque règle exportée                                |
| 3   | Matrice des permissions       | Rôles entreprise et plateforme × permissions, comparés au tableau de `ARCHITECTURE.md`                              | Une permission sans ligne fait échouer le test       |
| 4   | Use cases                     | Succès, refus `assertCan` par rôle, erreurs `Result`                                                                | Un fichier de test par use case                      |
| 5   | Routes API                    | 401, 400, 403, 404, succès, réponse conforme au schéma zod, `trace_id`                                              | Une route absente des matrices fait échouer la suite |
| 6   | Isolation entre entreprises   | Un membre de A ne lit, ne modifie, ne synchronise, ne télécharge rien de B                                          | Toute route qui prend un identifiant                 |
| 7   | Impersonation et espace admin | Écritures refusées pendant une impersonation ; `/api/admin` en 404, 403, 401 selon rôle et double authentification  | Toutes les routes                                    |
| 8   | Base de données               | Migrations depuis zéro, schéma Drizzle conforme, index utilisés (`EXPLAIN QUERY PLAN`)                              | Chaque requête fréquente listée                      |
| 9   | Sécurité transverse           | En-têtes, cookies, limites de débit, Turnstile, fichiers envoyés, `retour`, jetons à usage unique, sessions fermées | Une ligne par point de `SECURITY.md`                 |
| 10  | Données personnelles          | Aucun e-mail, nom ou téléphone de test dans les logs pendant toute la suite API                                     | Global                                               |
| 11  | Synchronisation               | File d'attente, envoi rejoué sans doublon, curseur, suppressions, refus, conflits (tests de propriétés)             | Chaque type de modification                          |
| 12  | E-mails et PDF                | Contenu, liens, version texte ; mentions obligatoires de `docs/regulatory/` ; attestation signée immuable           | Chaque gabarit, chaque mention                       |
| 13  | Composants                    | États vide, chargement, erreur (`trace_id`), succès ; actions masquées selon le rôle                                | Chaque écran                                         |
| 14  | Parcours                      | Chaque ligne de l'inventaire ci-dessous, mobile 360 px et ordinateur 1440 px                                        | Chaque ligne                                         |
| 15  | Hors ligne réel               | Réseau coupé, modification, rechargement, réseau rétabli, donnée sur le serveur                                     | Chaque écran terrain                                 |
| 16  | Accessibilité                 | Aucune violation grave (axe-core), zones tactiles de 48 px sur mobile                                               | Chaque écran                                         |
| 17  | Régression visuelle           | Chaque état de chaque écran comparé à sa capture de référence                                                       | Chaque état ; mise à jour = accord de Quentin        |
| 18  | Efficacité                    | Couverture (seuils qui ne baissent jamais), tests de mutation 80 % sur `packages/shared` et `domain/`               | Chaque semaine                                       |

## Passages et certificats (ADR 0021)

| Famille      | Ce qui est vérifié                                                                                                | Test                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2            | Règles du certificat de ramonage (vacuité, ramonage partiel, gaz étanche, conseils, capital, signature), échéance | `packages/trades/src/chimney-sweeping/*.test.ts`                       |
| 2            | Qui gère quel passage, équipements du lieu, passage clos ; cible de signature, annulation, dates de ramonage      | `scheduling/domain/*.test.ts`, `compliance/domain/*.test.ts`           |
| 4            | Créer, modifier, terminer, annuler un passage ; réserver des numéros ; signer ; corriger ; synchroniser           | `scheduling/application/*.test.ts`, `compliance/application/*.test.ts` |
| 5, 6, 7, 11  | `POST /api/document-number-blocks` : 401, 400, 201, blocs sans chevauchement, secrétariat 403, impersonation      | `apps/api/test/number-block-routes.test.ts`                            |
| 6, 7, 11, 12 | Parcours hors ligne jusqu'au certificat signé, immuable, numéros, isolation, rôles, curseur                       | `apps/api/test/intervention-sync-routes.test.ts`                       |

## Types de passage

| Famille     | Ce qui est vérifié                                                                                                                                                                                                                                                                                          | Test                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2           | Durées par défaut des 5 métiers, bornes de 15 min à 8 h par pas de 15 min, durée de l'entreprise ou par défaut, total des types d'un passage, types reconnus                                                                                                                                                | `packages/trades/src/visit-durations.test.ts`                                                                             |
| 2           | Types d'un passage : type inconnu refusé, doublons retirés dans l'ordre donné, aucun type par défaut                                                                                                                                                                                                        | `scheduling/domain/intervention-rules.test.ts`                                                                            |
| 4           | Lire les types : un par métier, tous les rôles, impersonation en lecture, entreprise du membre ; changer les durées : propriétaire et administrateur, fusion, refus, impersonation, autre entreprise                                                                                                        | `scheduling/application/get-visit-types.test.ts`, `update-visit-durations.test.ts`                                        |
| 4           | Créer et modifier un passage avec `visitTypes` : gardés, `[]` sans types, doublons retirés, type inconnu refusé, passage clos, autre entreprise, impersonation                                                                                                                                              | `scheduling/application/create-intervention.test.ts`, `update-intervention.test.ts`                                       |
| 5, 6, 7, 11 | `GET /api/visit-types` et `PATCH /api/visit-types/durations` : 401, rôles, 403, 422, 400, bornes, fusion relue, isolation, impersonation, passages prévus inchangés ; push et pull avec `visitTypes`                                                                                                        | `apps/api/test/visit-type-routes.test.ts`, `test/matrices`                                                                |
| 2           | App : choix de durée de 15 min à 8 h, pas de 15 min, ordre des métiers, type proposé par appareil coché, type unique, cumul des durées, cocher et décocher                                                                                                                                                  | `scheduling/visit-types.test.ts`                                                                                          |
| 2           | App : textes (durées, libellés des types, aide de durée simple, détaillée ou modifiée, « Remettre », réglages) ; lien « Types de passage » des réglages                                                                                                                                                     | `scheduling/visit-type-texts.test.ts`, `app-shell/navigation-visit-types.test.ts`                                         |
| 2           | Formulaire : type obligatoire si l'entreprise a des types, absent hors ligne, type inconnu refusé, durée bornée, 1 h sans type, accepté par le serveur                                                                                                                                                      | `scheduling/visit-form-schema-visit-types.test.ts`                                                                        |
| 11          | Types gardés dans Dexie (remplacés, vidés, gardés si le serveur échoue) ; passage local et `create_intervention` avec `visitTypes` ; Dexie version 3 : `visitTypes: []` sur les anciens passages                                                                                                            | `scheduling/visit-types-store.test.ts`, `intervention-store-visit-types.test.ts`, `lib/db/local-database-upgrade.test.ts` |
| 3, 13       | Choix du type : préremplissage par appareils, durée de l'entreprise, plafond de 8 h, choix à la main qui arrête le préremplissage, durée changée gardée, type obligatoire, sans types connus ; réglages : propriétaire et administrateur seuls, impersonation en lecture, chargement, enregistrement, échec | `scheduling/hooks/use-visit-type-choice.test.tsx`, `use-visit-type-settings.test.tsx`                                     |
| 13          | Champ Durée : obligatoire, aide d'un type, de plusieurs, durée modifiée et « Remettre », plafond de 8 h                                                                                                                                                                                                     | `scheduling/components/passage/duration-field.test.tsx`                                                                   |

## Planning et passages dans l'app

| Famille | Ce qui est vérifié                                                                                                                                                                                              | Test                                                                          |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2       | Techniciens : utilisateur courant en premier et en bleu, autres triés par nom, 8 couleurs qui bouclent, agendas choisis                                                                                         | `scheduling/technicians.test.ts`, `scheduling/technician-colors.test.ts`      |
| 2       | Dates : semaine du lundi au dimanche, jours en UTC, aujourd'hui et heure courante à Paris, changements d'heure                                                                                                  | `scheduling/planning-dates.test.ts`                                           |
| 2       | Grille : 8 h à 19 h élargie, couloirs pour les chevauchements, « +N » au-delà du maximum, heures et positions                                                                                                   | `scheduling/planning-layout.test.ts`                                          |
| 2       | Passages : annulés masqués, « fait » si terminé ou tout signé, tri par heure, total en centimes, prochain passage                                                                                               | `scheduling/planning-visits.test.ts`                                          |
| 2       | Paramètres d'URL tolérants (jour, vue, agendas séparés par « . », passage, nouveau passage)                                                                                                                     | `scheduling/planning-search.test.ts`                                          |
| 2       | Formulaire nouveau passage : champs obligatoires, prix en euros vers centimes, durée de 60 min, accepté par le serveur                                                                                          | `scheduling/visit-form-schema.test.ts`                                        |
| 2       | Statut affiché d'un passage ; montants en euros                                                                                                                                                                 | `scheduling/components/passage/visit-status.test.ts`, `scheduling/fr.test.ts` |
| 3, 13   | Technicien : son seul planning, même avec `agendas` ; propriétaire, administrateur, secrétariat : équipe, filtres, création ; impersonation : pas de création ; rôle en cache hors ligne ; vues jour et semaine | `scheduling/hooks/use-planning.test.tsx`                                      |
| 11      | Créer, annuler un passage hors ligne : Dexie et outbox ; membres récupérés par pages de 50, cache remplacé                                                                                                      | `scheduling/intervention-store.test.ts`, `scheduling/members-store.test.ts`   |
| 11      | Pull des passages et documents, suppressions, modification locale en attente gardée ; refus de `create_intervention` et `sign_document`                                                                         | `lib/sync/planning-sync.test.ts`                                              |

## Lecture de plaque (ADR 0022)

| Famille | Ce qui est vérifié                                                                                                                                     | Test                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 2       | Nettoyage de la réponse du modèle : liste fermée, bornes, fluide, propriété « jamais hors formulaire »                                                 | `packages/shared/src/plate-reading.test.ts`                                       |
| 4       | Statut, quota par jour de Paris, photo refusée, échec du modèle, rôles, impersonation, logs sans valeur                                                | `customers/application/read-equipment-plate.test.ts`                              |
| 4       | Format JSON imposé, consignes, `trace_id`, modèle de secours, réponse hors schéma                                                                      | `customers/infrastructure/ai-plate-reader.test.ts`, `plate-reader-models.test.ts` |
| 5–8, 10 | `POST /api/plate-readings` : 401, 422, 403, 429, isolation du quota, index, logs sans valeur lue                                                       | `apps/api/test/plate-reading-routes.test.ts`, `test/matrices`                     |
| 2       | Fusion de la lecture : champs vides seulement, type proposé par l'entreprise, combustible par défaut, nombres à la française                           | `apps/app/src/contexts/customers/plate-reading.test.ts`, `plate-fr.test.ts`       |
| 13      | Lecture côté téléphone : envoi, lue, illisible, limite sans erreur, erreur avec code, lecteur absent, hors ligne, photo retirée pendant la lecture     | `apps/app/src/contexts/customers/hooks/use-plate-reading.test.tsx`                |
| 2       | Photo envoyée : JPEG, PNG, WebP de 1,5 Mo au plus telle quelle ; sinon redessinée en JPEG 2048 px, qualité 0,85 ; photo d'origine si non décodable     | `apps/app/src/contexts/customers/plate-image.test.ts`                             |
| 13      | Bandeau mobile (lecture, lue, lue en partie, illisible avec « Reprendre la photo », limite) et badge de la vignette                                    | `customers/components/equipment/plate-reading-status.test.tsx`                    |
| 13      | Marques des champs : skeleton pendant la lecture, « Lu sur la plaque » retiré à la modification, « Illisible » et bordure orange jusqu'à la saisie     | `customers/components/equipment/plate-marks.test.tsx`                             |
| 13      | Photos et lecture : formulaire rempli, saisie, état modifié, touché et erreurs gardés, photo retirée, reprise, autre photo sans nouvelle lecture       | `apps/app/src/contexts/customers/hooks/use-plate-photos.test.tsx`                 |
| 13      | Type groupé par métier, types proposés seulement, combustible par défaut, combustible caché pour une PAC, type lu marqué                               | `customers/components/equipment/equipment-kind-field.test.tsx`                    |
| 14      | Photo de plaque : champs vides remplis sans écraser la saisie ; limite du jour, photo gardée                                                           | `apps/app/e2e/customers.spec.ts`                                                  |
| 14      | Photo de plaque : illisible puis nouvelle photo, PAC (fluide, charge, combustible caché), panne avec code puis saisie à la main, hors ligne sans envoi | `apps/app/e2e/customers.spec.ts`                                                  |
| Mesure  | Précision par modèle sur le jeu de photos annoté, valeurs inventées, jetons (hors `pnpm check`)                                                        | `apps/api/eval/`, `pnpm --filter @passalio/api plate-reading:eval`                |

## Appels et rappels de prospection (ADR 0024)

| Famille | Ce qui est vérifié                                                                                                                                    | Test                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2       | Étape après l'appel (démo, pas intéressé, premier décroché, cliente figée) ; notification 15 min avant, à l'heure, la veille à 18 h en heure de Paris | `sales/domain/call-rules.test.ts`, `packages/shared/src/paris-time.test.ts`   |
| 4       | Noter un appel, qualifier, fiche de suivi, Ma journée, série d'appels, déplacer ou clore un rappel : rôles, erreurs, rien d'écrit en cas de refus     | `sales/application/*call*.test.ts`, `get-my-day`, `get-follow-up`, `update-*` |
| 5, 6    | Routes : 201, 204, 400, 404, 409, 422, réponses conformes aux schémas zod, rappel dans Ma journée, suppression en cascade avec l'entreprise           | `apps/api/test/prospect-call-routes.test.ts`                                  |
| 7, 8, 9 | Matrices des rôles, double authentification, impersonation ; plans de requêtes et index des nouvelles requêtes                                        | `apps/api/test/matrices`, `apps/api/test/database`                            |

## Parcours de bout en bout

Chaque parcours tourne sur mobile (360 px) et ordinateur (1440 px). Les écrans ont aussi leur contrôle d'accessibilité et de zones tactiles : `user-screens-*.spec.ts`, `admin-screens-accessibility.spec.ts`, `field-*-accessibility.spec.ts`, `customer-*-accessibility.spec.ts`.

| Espace          | Parcours                                                                                                                     | Test                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Comptes         | Créer un compte, refusé sans accepter les conditions                                                                         | `user-accounts.spec.ts`                                                 |
| Comptes         | Créer un compte puis l'entreprise en 5 étapes jusqu'aux Premiers pas                                                         | `team-onboarding.spec.ts`                                               |
| Comptes         | Se connecter ; mauvais mot de passe ; trop d'essais                                                                          | `user-accounts.spec.ts`, `user-accounts-errors.spec.ts`                 |
| Comptes         | Mot de passe oublié, nouveau mot de passe, connexion                                                                         | `team-onboarding.spec.ts`                                               |
| Comptes         | Lien de réinitialisation déjà utilisé ou expiré                                                                              | `user-accounts.spec.ts`                                                 |
| Comptes         | Se déconnecter : base locale effacée, retour à la connexion                                                                  | `user-accounts.spec.ts`, `settings.spec.ts`                             |
| Comptes         | Connecté, `/connexion` renvoie à l'accueil ; `retour` vers un site externe refusé                                            | `user-accounts.spec.ts`                                                 |
| Comptes         | Erreurs du serveur avec leur code, connexion en cours, retour à la page protégée                                             | `user-accounts-errors.spec.ts`                                          |
| Comptes         | Changer d'onglet sans attendre le serveur                                                                                    | `customers.spec.ts`                                                     |
| Pages légales   | Liens du pied de page, conditions depuis l'inscription, sommaire mobile                                                      | `legal-pages.spec.ts`                                                   |
| Équipe          | Inviter un technicien qui rejoint l'équipe                                                                                   | `team-onboarding.spec.ts`                                               |
| Équipe          | Invitation acceptée avec une autre adresse : refusée                                                                         | `team.spec.ts`                                                          |
| Équipe          | Renvoyer, annuler une invitation                                                                                             | `team.spec.ts`                                                          |
| Équipe          | Changer le rôle d'un membre ; le retirer                                                                                     | `team.spec.ts`, `user-team-roles.spec.ts`                               |
| Équipe          | Transférer la propriété à un administrateur                                                                                  | `team.spec.ts`                                                          |
| Équipe          | Un technicien ne voit ni inviter, ni changer de rôle                                                                         | `team.spec.ts`, `user-team-roles.spec.ts`                               |
| Équipe          | Une personne dans deux entreprises passe de l'une à l'autre                                                                  | `team.spec.ts`                                                          |
| Réglages        | Adresse connectée, lien vers l'équipe, déconnexion                                                                           | `settings.spec.ts`                                                      |
| Réglages        | Modifier les informations de l'entreprise et le logo                                                                         | à écrire (écran à venir)                                                |
| Clients         | Liste vide, créer un client particulier ; créer une entreprise cliente                                                       | `customers-create.spec.ts`                                              |
| Clients         | Erreurs du formulaire nouveau client ; du formulaire de modification                                                         | `customers-create.spec.ts`, `customers-edit-errors.spec.ts`             |
| Clients         | Rechercher par nom, ville, téléphone ; filtres d'échéance ; pagination ; filtre vide                                         | `customers-search.spec.ts`, `customers-filter-empty.spec.ts`            |
| Clients         | Modifier un client ; ajouter un lieu                                                                                         | `customers-edit.spec.ts`                                                |
| Clients         | Ajouter un appareil de chaque famille avec ses champs propres                                                                | `customers-equipment.spec.ts`                                           |
| Clients         | Ajouter une chaudière puis la remplacer par une PAC                                                                          | `customers.spec.ts`                                                     |
| Clients         | Retirer un appareil, il reste dans l'historique                                                                              | `customers-equipment.spec.ts`                                           |
| Clients         | Ajouter une photo ; refus d'un fichier trop gros ou d'un mauvais type                                                        | `offline-equipment-photo.spec.ts`, `customers-photo-refusal.spec.ts`    |
| Clients         | Archiver un client (secrétariat oui, technicien non)                                                                         | `technician-secretary-archive.spec.ts`, `technician-field-work.spec.ts` |
| Planning        | Planning vide, erreurs du formulaire, ajouter un passage, l'ouvrir, l'annuler                                                | `planning.spec.ts`                                                      |
| Planning        | Un technicien ne voit que son planning ; filtrer les agendas de l'équipe                                                     | à écrire                                                                |
| Réglages        | Changer la durée du ramonage sur ordinateur, nouveau passage prérempli, durée changée puis remise, type sur le passage       | `visit-types.spec.ts`                                                   |
| Réglages        | Changer une durée sur mobile (feuille), technicien en lecture seule, échec d'enregistrement                                  | à écrire                                                                |
| Planning        | Plusieurs types sur mobile (feuille), type obligatoire, passage sans type hors ligne                                         | à écrire                                                                |
| Hors ligne      | Créer un client sans réseau, recharger, rétablir le réseau, client sur le serveur                                            | `offline-sync.spec.ts`                                                  |
| Hors ligne      | Indicateur : modifications en attente, puis synchronisé ; échec avec son code                                                | `offline-field-changes.spec.ts`, `sync-failure-trace-id.spec.ts`        |
| Hors ligne      | Modification refusée par le serveur, visible pour l'utilisateur                                                              | `offline-rejection.spec.ts`                                             |
| Hors ligne      | Première synchronisation en échec sur un nouvel appareil                                                                     | `customers-first-sync.spec.ts`                                          |
| Hors ligne      | Démarrer l'app sans réseau avec la dernière session                                                                          | à écrire                                                                |
| Hors ligne      | Deux appareils modifient le même client (même champ, champs différents)                                                      | `offline-sync.spec.ts`, `offline-two-devices.spec.ts`                   |
| Admin           | Activer la double authentification : mot de passe, QR code, codes de secours                                                 | `admin-two-factor.spec.ts`                                              |
| Admin           | Se connecter avec le code ; avec un code de secours ; mauvais code ; trop d'essais                                           | `admin-two-factor.spec.ts`, `admin-two-factor-limits.spec.ts`           |
| Admin           | Session admin de plus de 12 heures : code redemandé                                                                          | `admin-two-factor.spec.ts`, `admin-guards.spec.ts`                      |
| Admin           | Un client qui tape `/admin` arrive sur l'accueil                                                                             | `admin-access.spec.ts`                                                  |
| Admin           | Vue d'ensemble ; comptes clients, filtres, recherche ; fiche et ses 3 onglets ; journal                                      | `admin-accounts.spec.ts`, `admin-empty-states.spec.ts`                  |
| Admin           | Chargement, erreur avec son code et bouton réessayer sur chaque écran                                                        | `admin-screen-states.spec.ts`, `admin-action-errors.spec.ts`            |
| Admin           | Le rôle Commercial ne voit que Commercial                                                                                    | `admin-access.spec.ts`, `admin-guards.spec.ts`                          |
| Équipe Passalio | Inviter un membre, il rejoint par e-mail puis active la double authentification                                              | `platform-team.spec.ts`                                                 |
| Équipe Passalio | Changer un rôle, retirer un membre (ses sessions sont fermées) ; pas son propre rôle                                         | `platform-team.spec.ts`, `platform-team-sessions.spec.ts`               |
| Commercial      | Entreprises : onglets d'étape, filtres en cascade (taper « 94 »), recherche, pagination                                      | `commercial-companies.spec.ts`                                          |
| Commercial      | Créer, modifier, supprimer une entreprise prospectée                                                                         | `commercial-companies.spec.ts`                                          |
| Commercial      | Changer l'étape, ajouter une note, historique                                                                                | `commercial-companies.spec.ts`                                          |
| Commercial      | Contacts : onglets, recherche, fiche, contact principal unique                                                               | `commercial-contacts.spec.ts`                                           |
| Commercial      | Prospection : qualifier depuis la carte, sur ordinateur et sur mobile                                                        | `commercial-prospection.spec.ts`                                        |
| Site            | Liens de la landing et de l’API publique, environnement staging ou production                                                | `apps/web` (unitaire)                                                   |
| Site            | Contenus : slugs uniques, aucun texte entre crochets publié, pages non en production exclues, titres et descriptions uniques | `apps/web/src/content/catalog.test.ts`                                  |
| Site            | SEO : URL absolues, image de partage par page, fil d’Ariane, FAQ, article, plan du site et robots.txt                        | `seo.test.ts`, `sitemap.test.ts`                                        |
| Site            | Chaque page publiée : 200, un seul h1, canonical, Open Graph, données structurées valides, axe sans violation                | `apps/web/e2e/pages.spec.ts`                                            |
| Site            | Barre de navigation : menus au clic, au survol, Échap, clic ailleurs ; menu mobile ; zones tactiles de 48 px                 | `apps/web/e2e/navigation.spec.ts`                                       |
| Site            | « Être rappelé » : champs invalides, envoi, confirmation, erreur avec code, réseau coupé                                     | `callback-form.test.ts`, `apps/web/e2e/callback-form.spec.ts`           |
| Site            | Histoires : filtre par activité, mention « personnes inventées » ; page 404                                                  | `apps/web/e2e/stories.spec.ts`, `pages.spec.ts`                         |
| Mises à jour    | Nouvelle version : l'app se recharge sans perdre les modifications hors ligne                                                | à écrire                                                                |

À ajouter avec leurs écrans : lecture de plaque (écran), attestation (signature, PDF, numérotation, immuable), planning, relances, abonnement, export, impersonation, espace particulier, serveur MCP admin.
