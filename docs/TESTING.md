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

## Lecture de plaque (ADR 0022)

| Famille | Ce qui est vérifié                                                                                                                                 | Test                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2       | Nettoyage de la réponse du modèle : liste fermée, bornes, fluide, propriété « jamais hors formulaire »                                             | `packages/shared/src/plate-reading.test.ts`                                       |
| 4       | Statut, quota par jour de Paris, photo refusée, échec du modèle, rôles, impersonation, logs sans valeur                                            | `customers/application/read-equipment-plate.test.ts`                              |
| 4       | Format JSON imposé, consignes, `trace_id`, modèle de secours, réponse hors schéma                                                                  | `customers/infrastructure/ai-plate-reader.test.ts`, `plate-reader-models.test.ts` |
| 5–8, 10 | `POST /api/plate-readings` : 401, 422, 403, 429, isolation du quota, index, logs sans valeur lue                                                   | `apps/api/test/plate-reading-routes.test.ts`, `test/matrices`                     |
| 2       | Fusion de la lecture : champs vides seulement, type proposé par l'entreprise, combustible par défaut, nombres à la française                       | `apps/app/src/contexts/customers/plate-reading.test.ts`, `plate-fr.test.ts`       |
| 13      | Lecture côté téléphone : envoi, lue, illisible, limite sans erreur, erreur avec code, lecteur absent, hors ligne, photo retirée pendant la lecture | `apps/app/src/contexts/customers/hooks/use-plate-reading.test.tsx`                |
| 14      | Photo de plaque : champs vides remplis sans écraser la saisie ; limite du jour, photo gardée                                                       | `apps/app/e2e/customers.spec.ts`                                                  |
| Mesure  | Précision par modèle sur le jeu de photos annoté, valeurs inventées, jetons (hors `pnpm check`)                                                    | `apps/api/eval/`, `pnpm --filter @passalio/api plate-reading:eval`                |

## Parcours de bout en bout

Chaque parcours tourne sur mobile (360 px) et ordinateur (1440 px). Les écrans ont aussi leur contrôle d'accessibilité et de zones tactiles : `user-screens-*.spec.ts`, `admin-screens-accessibility.spec.ts`, `field-*-accessibility.spec.ts`, `customer-*-accessibility.spec.ts`.

| Espace          | Parcours                                                                                | Test                                                                    |
| --------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Comptes         | Créer un compte, refusé sans accepter les conditions                                    | `user-accounts.spec.ts`                                                 |
| Comptes         | Créer un compte puis l'entreprise en 5 étapes jusqu'aux Premiers pas                    | `team-onboarding.spec.ts`                                               |
| Comptes         | Se connecter ; mauvais mot de passe ; trop d'essais                                     | `user-accounts.spec.ts`, `user-accounts-errors.spec.ts`                 |
| Comptes         | Mot de passe oublié, nouveau mot de passe, connexion                                    | `team-onboarding.spec.ts`                                               |
| Comptes         | Lien de réinitialisation déjà utilisé ou expiré                                         | `user-accounts.spec.ts`                                                 |
| Comptes         | Se déconnecter : base locale effacée, retour à la connexion                             | `user-accounts.spec.ts`, `settings.spec.ts`                             |
| Comptes         | Connecté, `/connexion` renvoie à l'accueil ; `retour` vers un site externe refusé       | `user-accounts.spec.ts`                                                 |
| Comptes         | Erreurs du serveur avec leur code, connexion en cours, retour à la page protégée        | `user-accounts-errors.spec.ts`                                          |
| Comptes         | Changer d'onglet sans attendre le serveur                                               | `customers.spec.ts`                                                     |
| Pages légales   | Liens du pied de page, conditions depuis l'inscription, sommaire mobile                 | `legal-pages.spec.ts`                                                   |
| Équipe          | Inviter un technicien qui rejoint l'équipe                                              | `team-onboarding.spec.ts`                                               |
| Équipe          | Invitation acceptée avec une autre adresse : refusée                                    | `team.spec.ts`                                                          |
| Équipe          | Renvoyer, annuler une invitation                                                        | `team.spec.ts`                                                          |
| Équipe          | Changer le rôle d'un membre ; le retirer                                                | `team.spec.ts`, `user-team-roles.spec.ts`                               |
| Équipe          | Transférer la propriété à un administrateur                                             | `team.spec.ts`                                                          |
| Équipe          | Un technicien ne voit ni inviter, ni changer de rôle                                    | `team.spec.ts`, `user-team-roles.spec.ts`                               |
| Équipe          | Une personne dans deux entreprises passe de l'une à l'autre                             | `team.spec.ts`                                                          |
| Réglages        | Adresse connectée, lien vers l'équipe, déconnexion                                      | `settings.spec.ts`                                                      |
| Réglages        | Modifier les informations de l'entreprise et le logo                                    | à écrire (écran à venir)                                                |
| Clients         | Liste vide, créer un client particulier ; créer une entreprise cliente                  | `customers-create.spec.ts`                                              |
| Clients         | Erreurs du formulaire nouveau client ; du formulaire de modification                    | `customers-create.spec.ts`, `customers-edit-errors.spec.ts`             |
| Clients         | Rechercher par nom, ville, téléphone ; filtres d'échéance ; pagination ; filtre vide    | `customers-search.spec.ts`, `customers-filter-empty.spec.ts`            |
| Clients         | Modifier un client ; ajouter un lieu                                                    | `customers-edit.spec.ts`                                                |
| Clients         | Ajouter un appareil de chaque famille avec ses champs propres                           | `customers-equipment.spec.ts`                                           |
| Clients         | Ajouter une chaudière puis la remplacer par une PAC                                     | `customers.spec.ts`                                                     |
| Clients         | Retirer un appareil, il reste dans l'historique                                         | `customers-equipment.spec.ts`                                           |
| Clients         | Ajouter une photo ; refus d'un fichier trop gros ou d'un mauvais type                   | `offline-equipment-photo.spec.ts`, `customers-photo-refusal.spec.ts`    |
| Clients         | Archiver un client (secrétariat oui, technicien non)                                    | `technician-secretary-archive.spec.ts`, `technician-field-work.spec.ts` |
| Hors ligne      | Créer un client sans réseau, recharger, rétablir le réseau, client sur le serveur       | `offline-sync.spec.ts`                                                  |
| Hors ligne      | Indicateur : modifications en attente, puis synchronisé ; échec avec son code           | `offline-field-changes.spec.ts`, `sync-failure-trace-id.spec.ts`        |
| Hors ligne      | Modification refusée par le serveur, visible pour l'utilisateur                         | `offline-rejection.spec.ts`                                             |
| Hors ligne      | Première synchronisation en échec sur un nouvel appareil                                | `customers-first-sync.spec.ts`                                          |
| Hors ligne      | Démarrer l'app sans réseau avec la dernière session                                     | à écrire                                                                |
| Hors ligne      | Deux appareils modifient le même client (même champ, champs différents)                 | `offline-sync.spec.ts`, `offline-two-devices.spec.ts`                   |
| Admin           | Activer la double authentification : mot de passe, QR code, codes de secours            | `admin-two-factor.spec.ts`                                              |
| Admin           | Se connecter avec le code ; avec un code de secours ; mauvais code ; trop d'essais      | `admin-two-factor.spec.ts`, `admin-two-factor-limits.spec.ts`           |
| Admin           | Session admin de plus de 12 heures : code redemandé                                     | `admin-two-factor.spec.ts`, `admin-guards.spec.ts`                      |
| Admin           | Un client qui tape `/admin` arrive sur l'accueil                                        | `admin-access.spec.ts`                                                  |
| Admin           | Vue d'ensemble ; comptes clients, filtres, recherche ; fiche et ses 3 onglets ; journal | `admin-accounts.spec.ts`, `admin-empty-states.spec.ts`                  |
| Admin           | Chargement, erreur avec son code et bouton réessayer sur chaque écran                   | `admin-screen-states.spec.ts`, `admin-action-errors.spec.ts`            |
| Admin           | Le rôle Commercial ne voit que Commercial                                               | `admin-access.spec.ts`, `admin-guards.spec.ts`                          |
| Équipe Passalio | Inviter un membre, il rejoint par e-mail puis active la double authentification         | `platform-team.spec.ts`                                                 |
| Équipe Passalio | Changer un rôle, retirer un membre (ses sessions sont fermées) ; pas son propre rôle    | `platform-team.spec.ts`, `platform-team-sessions.spec.ts`               |
| Commercial      | Entreprises : onglets d'étape, filtres en cascade (taper « 94 »), recherche, pagination | `commercial-companies.spec.ts`                                          |
| Commercial      | Créer, modifier, supprimer une entreprise prospectée                                    | `commercial-companies.spec.ts`                                          |
| Commercial      | Changer l'étape, ajouter une note, historique                                           | `commercial-companies.spec.ts`                                          |
| Commercial      | Contacts : onglets, recherche, fiche, contact principal unique                          | `commercial-contacts.spec.ts`                                           |
| Commercial      | Prospection : qualifier depuis la carte, sur ordinateur et sur mobile                   | `commercial-prospection.spec.ts`                                        |
| Site            | Liens de la landing, environnement staging ou production                                | `apps/web` (unitaire)                                                   |
| Mises à jour    | Nouvelle version : l'app se recharge sans perdre les modifications hors ligne           | à écrire                                                                |

À ajouter avec leurs écrans : lecture de plaque (écran), attestation (signature, PDF, numérotation, immuable), planning, relances, abonnement, export, impersonation, espace particulier, serveur MCP admin.
