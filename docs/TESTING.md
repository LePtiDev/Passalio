# Tests

Règles dans l'ADR 0020 et dans `CLAUDE.md`. Ce fichier est l'inventaire : chaque nouvelle route, permission, requête fréquente ou écran y ajoute ses lignes dans la même PR.

## Règles en bref

- Un test existant ne se modifie ni ne se supprime sans l'accord de Quentin, sauf si l'exigence a changé à sa demande. Le commit porte `Test-Change-Approved: <lien vers son message>`. `pnpm test:guard` bloque sinon.
- On ne change jamais un test pour le faire passer.
- Un bug : commit `test: reproduce …` (rouge), puis commit `fix: …`. Skill `fix-bug`.
- Interdits par le lint : `.only`, `.skip`, `.todo`, `fixme`, `expect` conditionnel, test sans assertion.

## Commandes

| Commande          | Ce qui tourne                                                                 | Quand                                            |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| `pnpm test`       | Vitest de tous les paquets (familles 2 à 12)                                  | Chaque push (hook), `pnpm check`                 |
| `pnpm test:guard` | Aucun test existant changé sans accord                                        | Chaque push (hook), `pnpm check`                 |
| `pnpm test:e2e`   | Playwright : parcours, hors ligne, accessibilité, captures (familles 13 à 17) | Avant chaque fusion d'une PR qui touche l'app    |
| `pnpm check`      | Format, lint, types, `test:guard`, `test`                                     | Chaque push, avant chaque fusion, dans `release` |

Lancer avec Node 24 (`.nvmrc`). Playwright : `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:e2e` dans une session cloud.

## Où vont les tests

| Ce qu'on teste                                   | Fichier                                               | Outil                                       |
| ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------- |
| Règle pure, value object                         | à côté du fichier : `xxx.test.ts`                     | Vitest                                      |
| Use case                                         | `apps/api/src/contexts/<ctx>/application/xxx.test.ts` | Vitest, repositories en mémoire             |
| Route API                                        | `apps/api/test/<ctx>-routes.test.ts`                  | Vitest, D1 locale (`test/test-platform.ts`) |
| Matrices (permissions, isolation, impersonation) | `apps/api/test/matrices/`                             | Vitest, générées depuis les routes Hono     |
| Fonction, hook, store de l'app                   | à côté du fichier                                     | Vitest, `fake-indexeddb`                    |
| Composant, état d'écran                          | à côté du composant : `xxx.test.tsx`                  | Vitest en mode navigateur                   |
| Parcours                                         | `apps/app/e2e/<espace>.spec.ts`                       | Playwright                                  |

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

## Parcours de bout en bout

| Espace          | Parcours                                                                                | Test                      |
| --------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| Comptes         | Créer un compte, refusé sans accepter les conditions                                    | à écrire                  |
| Comptes         | Créer un compte puis l'entreprise en 5 étapes jusqu'aux Premiers pas                    | `team-onboarding.spec.ts` |
| Comptes         | Se connecter ; mauvais mot de passe ; trop d'essais                                     | à écrire                  |
| Comptes         | Mot de passe oublié, nouveau mot de passe, connexion                                    | `team-onboarding.spec.ts` |
| Comptes         | Lien de réinitialisation déjà utilisé ou expiré                                         | à écrire                  |
| Comptes         | Se déconnecter : base locale effacée, retour à la connexion                             | à écrire                  |
| Comptes         | Connecté, `/connexion` renvoie à l'accueil ; `retour` vers un site externe refusé       | à écrire                  |
| Comptes         | Changer d'onglet sans attendre le serveur                                               | `customers.spec.ts`       |
| Pages légales   | Liens du pied de page, conditions depuis l'inscription, sommaire mobile                 | `legal-pages.spec.ts`     |
| Équipe          | Inviter un technicien qui rejoint l'équipe                                              | `team-onboarding.spec.ts` |
| Équipe          | Invitation acceptée avec une autre adresse : refusée                                    | à écrire                  |
| Équipe          | Renvoyer, annuler une invitation                                                        | à écrire                  |
| Équipe          | Changer le rôle d'un membre ; le retirer                                                | à écrire                  |
| Équipe          | Transférer la propriété à un administrateur                                             | à écrire                  |
| Équipe          | Un technicien ne voit ni inviter, ni changer de rôle                                    | à écrire                  |
| Équipe          | Une personne dans deux entreprises passe de l'une à l'autre                             | à écrire                  |
| Réglages        | Modifier les informations de l'entreprise et le logo                                    | à écrire                  |
| Clients         | Liste vide, créer un client particulier ; créer une entreprise cliente                  | à écrire                  |
| Clients         | Erreurs du formulaire nouveau client                                                    | à écrire                  |
| Clients         | Rechercher par nom, ville, téléphone ; filtres d'échéance ; pagination                  | à écrire                  |
| Clients         | Modifier un client ; ajouter un lieu                                                    | à écrire                  |
| Clients         | Ajouter un appareil de chaque famille avec ses champs propres                           | à écrire                  |
| Clients         | Ajouter une chaudière puis la remplacer par une PAC                                     | `customers.spec.ts`       |
| Clients         | Retirer un appareil, il reste dans l'historique                                         | à écrire                  |
| Clients         | Ajouter une photo ; refus d'un fichier trop gros ou d'un mauvais type                   | à écrire                  |
| Clients         | Archiver un client (secrétariat oui, technicien non)                                    | à écrire                  |
| Hors ligne      | Créer un client sans réseau, recharger, rétablir le réseau, client sur le serveur       | à écrire                  |
| Hors ligne      | Indicateur : modifications en attente, puis synchronisé                                 | à écrire                  |
| Hors ligne      | Modification refusée par le serveur, visible pour l'utilisateur                         | à écrire                  |
| Hors ligne      | Démarrer l'app sans réseau avec la dernière session                                     | à écrire                  |
| Hors ligne      | Deux appareils modifient le même client                                                 | à écrire                  |
| Admin           | Activer la double authentification : mot de passe, QR code, codes de secours            | à écrire                  |
| Admin           | Se connecter avec le code ; avec un code de secours ; mauvais code                      | à écrire                  |
| Admin           | Session admin de plus de 12 heures : code redemandé                                     | à écrire                  |
| Admin           | Un client qui tape `/admin` arrive sur l'accueil                                        | à écrire                  |
| Admin           | Vue d'ensemble ; comptes clients, filtres, recherche ; fiche et ses 3 onglets ; journal | à écrire                  |
| Admin           | Le rôle Commercial ne voit que Commercial                                               | à écrire                  |
| Équipe Passalio | Inviter un membre, il rejoint par e-mail puis active la double authentification         | à écrire                  |
| Équipe Passalio | Changer un rôle, retirer un membre ; un super admin ne change pas son propre rôle       | à écrire                  |
| Commercial      | Entreprises : onglets d'étape, filtres en cascade (taper « 94 »), recherche, pagination | à écrire                  |
| Commercial      | Créer, modifier, supprimer une entreprise prospectée                                    | à écrire                  |
| Commercial      | Changer l'étape, ajouter une note, historique                                           | à écrire                  |
| Commercial      | Contacts : onglets, recherche, fiche, contact principal unique                          | à écrire                  |
| Commercial      | Prospection : qualifier depuis la carte, sur ordinateur et sur mobile                   | à écrire                  |
| Site            | Liens de la landing, environnement staging ou production                                | `apps/web` (unitaire)     |
| Mises à jour    | Nouvelle version : l'app se recharge sans perdre les modifications hors ligne           | à écrire                  |

À ajouter avec leurs écrans : lecture de plaque, attestation (signature, PDF, numérotation, immuable), planning, relances, abonnement, export, impersonation, espace particulier, serveur MCP admin.
