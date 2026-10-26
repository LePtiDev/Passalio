# Roadmap et todo

Source de vérité de l'avancement. Mise à jour dans la même PR que le travail qu'elle décrit (voir `CLAUDE.md`, « Définition de terminé »).

Dernière mise à jour : 2026-10-26.

## Fait

| Quoi                                                                                                                                                                                                                                                                                                                                        | Où                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Décisions, architecture, sécurité, 10 ADR, skills Claude Code                                                                                                                                                                                                                                                                               | `CLAUDE.md`, `docs/`                                |
| Monorepo : Astro, React PWA, API Hono sur Workers, paquets `shared`, `db`, `trades`, `pdf`                                                                                                                                                                                                                                                  | PR #1                                               |
| Logger JSON avec `trace_id`, rôles et `assertCan`, erreurs 403/500, scripts `release:*`                                                                                                                                                                                                                                                     | PR #2                                               |
| Cloudflare : D1 et R2 staging et production en UE, jeton de déploiement                                                                                                                                                                                                                                                                     | hors dépôt                                          |
| Parité concurrents, essai de Ramonia (attestations, facture, captures)                                                                                                                                                                                                                                                                      | `docs/competitor-parity.md`                         |
| Parité concurrents, essai de Ramio (certificat, facture, équipe, SMS)                                                                                                                                                                                                                                                                       | `docs/competitor-parity.md`                         |
| Hook de session cloud : Node 24, pnpm, dépendances, pour développer et déployer sans poste                                                                                                                                                                                                                                                  | PR #5                                               |
| Mentions obligatoires par document et par métier, vérifiées sur les textes officiels                                                                                                                                                                                                                                                        | `docs/regulatory/`                                  |
| Règle : maquette validée par Quentin avant de coder un écran, captures avant fusion                                                                                                                                                                                                                                                         | `CLAUDE.md`, skill `new-screen`                     |
| Maquette des écrans comptes validée, ADR mot de passe (0012) et espace particulier (0013)                                                                                                                                                                                                                                                   | `docs/adr/`                                         |
| Connexion email et mot de passe, inscription, mot de passe oublié, limitation de débit en base                                                                                                                                                                                                                                              | PR #13                                              |
| Onboarding : entreprise (recherche Sirene), métiers, documents (logo, couleur, numéros), équipe                                                                                                                                                                                                                                             | PR #14                                              |
| Barre latérale, navigation mobile, Équipe pleine largeur, invitations en attente, Premiers pas                                                                                                                                                                                                                                              | PR #15                                              |
| Application et API servies par un Worker, sur app.staging.passalio.com et app.passalio.com                                                                                                                                                                                                                                                  | PR #16                                              |
| Conditions générales, accord de sous-traitance, confidentialité, mentions légales, preuve d'acceptation                                                                                                                                                                                                                                     | PR #18                                              |
| Clients, lieux, appareils, photos : tables, API, remplacement d'appareil, archivage, tests d'isolation                                                                                                                                                                                                                                      | PR #19                                              |
| Hors ligne : base Dexie, file de modifications, `/sync/push` et `/sync/pull`, démarrage sans réseau                                                                                                                                                                                                                                         | PR #20                                              |
| Anti-robot Cloudflare Turnstile sur l'inscription, la connexion et le mot de passe oublié                                                                                                                                                                                                                                                   | PR #17                                              |
| Landing page passalio.com (première version) selon la maquette validée le 2026-10-23                                                                                                                                                                                                                                                        | `apps/web`                                          |
| Écrans clients : liste, fiche, nouveau client, lieu, appareil, remplacement, indicateur de synchro                                                                                                                                                                                                                                          | PR #21                                              |
| Statut juridique : SAS à deux associés 50/50, TVA, comptabilité, étapes de création                                                                                                                                                                                                                                                         | ADR 0014, `docs/company.md`                         |
| Champ de recherche partagé (`components/search-field.tsx`), 32 px de haut sur ordinateur                                                                                                                                                                                                                                                    | PR #24                                              |
| Espace admin, socle : rôles plateforme, commande `platform:grant`, double authentification, `/api/admin`                                                                                                                                                                                                                                    | ADR 0015                                            |
| Espace admin, données : vue d'ensemble, comptes clients, personnel, utilisation par mois, journaux                                                                                                                                                                                                                                          | ADR 0015                                            |
| Espace admin, écrans : vue d'ensemble, comptes clients, fiche (personnel, utilisation, journal), journal, double authentification                                                                                                                                                                                                           | ADR 0015                                            |
| E-mails par Resend : lien de connexion, mot de passe oublié, invitation, selon la maquette validée                                                                                                                                                                                                                                          | ADR 0016                                            |
| Mise à jour automatique de l'app, admin sans entreprise envoyé vers l'admin, motif des refus dans les logs                                                                                                                                                                                                                                  | `auth-routes.ts`                                    |
| Gardes de route : pas de connexion ni d'inscription une fois connecté, admin plateforme toujours vers `/admin`                                                                                                                                                                                                                              | `lib/session.ts`                                    |
| Prospection, données : rôle `sales`, entreprises, contacts, étapes, historique, carte, import des fiches avec géocodage                                                                                                                                                                                                                     | ADR 0017                                            |
| Commercial, écrans : entreprises, contacts, fiches, formulaires, historique, rôle `sales` limité à Commercial, « Outil actuel »                                                                                                                                                                                                             | `contexts/sales` (app)                              |
| Changement d'onglet instantané : session vérifiée une fois, puis revérifiée en arrière-plan chaque minute                                                                                                                                                                                                                                   | PR #36                                              |
| Commercial, Prospection : carte IGN (Leaflet), qualifier depuis la carte, mini-carte et tuile « Carte » sur la fiche                                                                                                                                                                                                                        | `components/prospection` (app)                      |
| Pagination de toutes les listes : autant de lignes que l'écran en affiche, pages précédente et suivante, sans défilement                                                                                                                                                                                                                    | `components/pagination.tsx`                         |
| Équipe Passalio : inviter un membre (Super admin, Admin, Commercial), changer son rôle, le retirer, rejoindre par e-mail                                                                                                                                                                                                                    | ADR 0018                                            |
| Serveur MCP admin : OAuth, écran d'autorisation, outils lecture et prospection pour Claude, journal, `mcp:revoke`                                                                                                                                                                                                                           | ADR 0019                                            |
| Serveur MCP : page d'autorisation jamais servie depuis un ancien cache, nom et icône Passalio dans Claude, `favicon.ico`                                                                                                                                                                                                                    | `service-worker-routes.ts`                          |
| Stratégie de tests : règles de Quentin, garde-fou `test:guard`, lint des tests, agents `test-writer` et `test-reviewer`, skill `fix-bug`                                                                                                                                                                                                    | ADR 0020, `docs/TESTING.md`                         |
| Filtres en cascade avec recherche (sous-menus sur ordinateur, panneau du bas sur mobile), coche à droite dans tous les menus                                                                                                                                                                                                                | `components/list` (app)                             |
| Règle d'interface : astérisque rouge sur les champs obligatoires, plus de mention « facultatif »                                                                                                                                                                                                                                            | `CLAUDE.md`                                         |
| Passages et certificats, données : tables, synchronisation, numérotation par blocs, certificat de ramonage immuable, échéance à 12 mois                                                                                                                                                                                                     | ADR 0021                                            |
| Lecture de plaque, API : modèle interchangeable (OpenAI, Google, Anthropic, Mistral) avec secours, format imposé, quota, outil de mesure                                                                                                                                                                                                    | ADR 0022                                            |
| Planning : jour, semaine, équipe, choix des agendas, nouveau passage, fiche passage, annulation, hors ligne                                                                                                                                                                                                                                 | `contexts/scheduling` (app)                         |
| Types de passage : durée par défaut par métier dans Réglages, type et durée modifiable sur le nouveau passage                                                                                                                                                                                                                               | `contexts/scheduling`                               |
| Prestations : liste par entreprise (durée, prix, document remis), plusieurs prestations et plusieurs techniciens par passage, prix annoncé prérempli                                                                                                                                                                                        | ADR 0026                                            |
| Lecture de plaque, écran : photo de la plaque qui remplit les champs vides, listes déroulantes type et combustible, unité collée à la valeur                                                                                                                                                                                                | `components/equipment` (app)                        |
| Lecture de plaque, tests : réduction de la photo, bandeau, marques des champs, listes déroulantes, remplissage du formulaire, parcours illisible, PAC, panne, hors ligne                                                                                                                                                                    | `docs/TESTING.md`                                   |
| Lecture de plaque, note d'exploitation de l'IA : fonctionnement, coût estimé, choix du modèle, activation, incidents                                                                                                                                                                                                                        | `docs/ai-plate-reading.md`                          |
| Code de double authentification en 6 cases (Input OTP) ; barre latérale admin : badge « Admin », titres de section plus petits ; encart des rôles retiré de l'Équipe Passalio                                                                                                                                                               | `two-factor/totp-code-input.tsx`                    |
| Tests de l'application : 585 tests Vitest, 403 parcours Playwright (mobile et ordinateur, accessibilité), 43 bugs reproduits puis corrigés                                                                                                                                                                                                  | [#55](https://github.com/LePtiDev/Passalio/pull/55) |
| ADR 0023 : tests obligatoires, `test:guard` refuse du code de production sans test                                                                                                                                                                                                                                                          | ADR 0023, `packages/test-guard`                     |
| Configuration : « Continuer » reste bloqué jusqu'à l'étape suivante (cause d'un test instable)                                                                                                                                                                                                                                              | `onboarding-step-transition.spec.ts`                |
| Prospection, appels : résultat et prochaine action, rappels et démos avec notification, qualification, Ma journée, séries d'appels (API)                                                                                                                                                                                                    | ADR 0024                                            |
| Grille de prix (Solo 29 € HT, Équipe 49 € HT) et fonctionnement du paiement Stripe                                                                                                                                                                                                                                                          | ADR 0025                                            |
| Stripe en mode test : produits, prix, carte et SEPA, portail client, webhook staging                                                                                                                                                                                                                                                        | `docs/stripe.md`                                    |
| Interrupteur des inscriptions (super admin) : fermer en production sans bloquer la connexion ni les invités                                                                                                                                                                                                                                 | ADR 0029                                            |
| Abonnement, données et Stripe (API) : état de l'espace, Checkout, portail, webhook signé et idempotent, blocage des écritures (inactif sans clé Stripe), certificat signé hors ligne accepté                                                                                                                                                | ADR 0031                                            |
| Abonnement, écrans : Réglages › Abonnement (essai, abonné, SEPA, impayé, résilié, membre), factures Stripe, bandeaux, espace bloqué                                                                                                                                                                                                         | `contexts/billing` (app)                            |
| Site : accueil enrichi (hero, fonctions, activités, rappel), navigation commune, pages Activité, Produit, Histoires, Sans réseau, 404, SEO (images de partage, données structurées, plan du site), Lighthouse 100                                                                                                                           | [#64](https://github.com/LePtiDev/Passalio/pull/64) |
| Prospection, écrans d'appel : Ma journée, Appels, série d'appels, « Noter un appel » sur la fiche, ordinateur et mobile                                                                                                                                                                                                                     | `contexts/sales/components/calls`                   |
| Boutons uniformes : un seul composant `Button` (primaire, secondaire, danger), 48 px sur mobile, 32 px sur ordinateur ; champs de saisie alignés sur 32 px                                                                                                                                                                                  | PR #62                                              |
| PDF du certificat de ramonage : modèles Bandeau et Sobre, cinq couleurs, page de conseils, mentions obligatoires, rendu déterministe et empreinte                                                                                                                                                                                           | ADR 0027, `packages/pdf`                            |
| Réglages › Entreprise (mentions légales du certificat) et Réglages › Documents (modèle, couleur, logo, coordonnées, textes, numérotation, aperçu du PDF) ; le prochain numéro ne redescend plus sous les numéros réservés                                                                                                                   | `contexts/identity/components/settings`             |
| Certificat signé hors ligne, sans écran : réglages figés dans le certificat (version 2), copie des réglages et numéros réservés sur le téléphone, signature dans la file d'envoi, PDF refait sur le téléphone                                                                                                                               | ADR 0032, `contexts/compliance` (app)               |
| Écrans du certificat sur le terrain : formulaire par appareil (brouillon dans Dexie), récapitulatif et signatures au doigt, tous les appareils du passage signés d'un coup, feuille « Avant votre premier certificat », certificat signé (voir, télécharger, partager le PDF, passage suivant), bouton « Remplir le certificat » du passage | `contexts/compliance/components` (app)              |
| Prospection, boîte mail de chaque membre (API) : réglages SMTP, mot de passe chiffré, test d'envoi, journal et e-mail récapitulatif                                                                                                                                                                                                         | ADR 0028                                            |
| Prospection, rappels par e-mail : cron toutes les 5 minutes, gabarit selon la maquette v2, envoi par Resend                                                                                                                                                                                                                                 | ADR 0028                                            |
| Site : demande de rappel (API publique, Turnstile, limite par IP, CORS, code postal) et « On vous appelle » à la place du prénom                                                                                                                                                                                                            | ADR 0030                                            |
| Prospection, écran Configuration : Profil, Boîte mail (test de connexion), Rappels, Signature, admin pour un autre membre                                                                                                                                                                                                                   | ADR 0028                                            |
| Menu « Mon compte » en bas des barres latérales : Mon profil, Configuration ou Réglages, Se déconnecter                                                                                                                                                                                                                                     | `account-menu.tsx`                                  |
| Règle : chaque maquette vérifiée uniforme avec le reste de l'application avant d'être montrée                                                                                                                                                                                                                                               | ADR 0033, skill `new-screen`                        |
| Abonnement, formule Solo : un seul technicien (refus serveur), fenêtre « Passer à la formule Équipe ? » avec le prorata Stripe, retour vers Solo annulé s'il reste plusieurs techniciens                                                                                                                                                    | ADR 0034                                            |

## Hors code (Quentin)

- [ ] Relire les contrats de travail de Quentin et d'Antho (exclusivité, non-concurrence, propriété intellectuelle) avant de créer la SAS
- [ ] Créer la SAS : statuts, pacte d'associés, compte bancaire, annonce légale, immatriculation (`docs/company.md`)
- [ ] Créer le compte Resend, vérifier le domaine `passalio.com` (région Irlande), créer la clé « envoi seul » et l'ajouter à l'environnement cloud
- [ ] Céder le code à la SAS, déposer la marque Passalio à l'INPI au nom de la SAS, transférer domaines, Cloudflare, Stripe et Resend
- [ ] Choisir l'outil de comptabilité relié à Stripe et compatible avec la facture électronique (devis à comparer)
- [ ] Récupérer un vrai certificat de ramonage et une vraie attestation d'entretien d'appareil remplis, pour les comparer à `docs/regulatory/`
- [ ] Trancher les points ouverts des fiches `docs/regulatory/` (lectures « Non vérifié sur texte officiel »), au besoin avec un juriste ou une fédération
- [x] Tableau de parité des fonctionnalités : Ramio, Ramonia, OpenFire
- [x] Créer le compte d'essai Ramio (case anti-robot à cocher soi-même), puis le faire explorer
- [x] Rédiger les conditions d'utilisation et la politique de confidentialité (liens à ajouter sur l'inscription et en pied de page)
- [ ] Donner les informations de l'éditeur (raison sociale, SIREN, adresse, TVA, prix HT ou TTC, email, téléphone, directeur de la publication, ville du tribunal) et la date de mise en ligne, à reporter dans `apps/app/src/legal/legal-fr.ts`
- [ ] Faire relire les conditions et la politique de confidentialité par un juriste avant le premier client payant (responsabilité, tribunal, sous-traitance, durées)
- [ ] Désigner un médiateur de la consommation avant l'ouverture de l'espace particulier
- [ ] Vérifier la marque Passalio (INPI, EUIPO), dépôt au nom de la SAS, réserver passalio.fr et passalio.com
- [ ] Choisir l'hébergement du site et de l'application
- [ ] Lister 10 à 15 ramoneurs indépendants à interroger

## V1, dans l'ordre

- [ ] Comptes et entreprises : Better Auth (lien magique, organisations, rôles), `Actor` dans l'API, lecture seule pendant l'impersonation
- [ ] Écrans comptes selon la maquette validée (https://claude.ai/artifact/NpYPYv6fWoK39vvtGBtfs9) :
  - [x] Connexion email et mot de passe, création de compte avec le nom, mot de passe oublié (ADR 0012)
  - [x] Onboarding : entreprise (recherche Sirene), métiers, documents (logo, couleur, numérotation), équipe
  - [x] Barre latérale, Équipe en pleine largeur avec invitations en attente, écran « Premiers pas »
- [ ] Équipe : « Dernière activité » de chaque membre (prévue dans la maquette, il faut d'abord stocker la dernière session)
- [ ] Premiers pas : QR code d'installation de l'app sur le téléphone, une fois l'app installable publiée
- [x] Réglages entreprise : modifier après l'onboarding les informations, logo et numérotation ; le prochain numéro ne redescend plus sous les numéros réservés
- [ ] Réglages : modifier les métiers après l'onboarding
- [x] Clients, lieux, équipements : tables D1 avec index, use cases, routes, tests d'isolation
- [x] Hors ligne : Dexie, outbox, `/sync/push` et `/sync/pull` (clients, lieux, appareils, photos en attente d'envoi), ADR 0014
- [x] Indicateur de synchronisation dans les écrans clients
- [ ] Liste des modifications refusées par le serveur, consultable depuis l'indicateur de synchronisation
- [ ] Tester le démarrage sans réseau sur l'application installée (staging), service worker compris
- [x] Écrans clients selon la maquette validée le 2026-10-22 (https://claude.ai/artifact/Tha55S1NCL2MsWPN3TxquD) : liste, fiche, nouveau client, nouvel appareil, remplacement
- [ ] Champs obligatoires : remplacer « facultatif » par l'astérisque rouge sur les écrans existants (clients, onboarding, Commercial)
- [ ] Import d'un fichier de clients (bouton « Importer un fichier » affiché « Bientôt »)
- [ ] Modifier un lieu et un appareil depuis la fiche (le menu propose seulement Remplacer et Retirer)
- [x] Lecture de plaque, API : route, modèle interchangeable, format imposé, quota de 200 par jour, outil de mesure (ADR 0022)
- [ ] Lecture de plaque, mesure : comparer 4 ou 5 modèles sur le jeu de photos (clés de test OpenAI et Google à fournir), choisir le modèle, l'ajouter aux sous-traitants
- [x] Lecture de plaque, écran en ligne selon la maquette validée le 2026-10-23 (https://claude.ai/artifact/47mxtXeueVzaQiqhSdCmwv) : listes déroulantes type et combustible, champs vides remplis, « Lu sur la plaque », lue en partie, illisible, limite, erreur
- [ ] Lecture de plaque hors ligne : photo gardée dans Dexie, lue au retour du réseau, seuls les champs vides remplis, « Plaque lue · à vérifier » et « C'est vérifié » sur la fiche (`equipments.plate_check_pending_since`)
- [ ] Astérisque rouge sur « Type d'appareil » (obligatoire, sans astérisque aujourd'hui) dans le formulaire d'appareil
- [ ] Retirer la mention « · facultatif » de `FormField` (formulaires client et appareil), contraire à la règle des formulaires
- [ ] Calcul de `next_due_date` selon la périodicité de chaque métier (fait pour le ramonage : 12 mois ; appareils collectifs à 6 mois et règles locales à faire)
- [x] Métier ramonage dans `packages/trades` : schéma du certificat version 1 et règles bloquantes tirées de `docs/regulatory/`
- [ ] Métier entretien d'appareil dans `packages/trades` (bloqué par les documents réels)
- [x] Passages et certificats, données : tables, synchronisation, numérotation par blocs de 20, certificat immuable (ADR 0021)
- [x] Planning, écrans selon la maquette validée le 2026-10-23 (https://claude.ai/artifact/EwJHEip57EberjMUzBVmpL) : planning jour, semaine et équipe, nouveau passage, fiche passage
- [x] Certificat, écrans selon la même maquette : formulaire, récapitulatif et signatures, certificat signé
- [ ] Certificat : historique sur la fiche client et page du certificat (`/certificats/:id`, maquette 16 et 17)
- [ ] Certificat : bloc Paiement du récapitulatif (montant, moyen de paiement), à livrer avec la facture (décision de Quentin du 2026-10-25)
- [ ] Rappel un mois avant l'échéance annoncé sur l'écran « Certificat signé » une fois les relances codées
- [x] Types de passage : durée par défaut par métier (Réglages › Types de passage), type et durée modifiable sur le nouveau passage (maquette validée le 2026-10-23)
- [ ] Planning : modifier un passage (date, heure, techniciens, prestations, durée), le marquer terminé sans certificat
- [x] Liste de prestations avec prix présélectionnés (demande de Quentin du 2026-10-23) : le prix annoncé se remplit depuis la prestation choisie, modifiable ; plusieurs prestations et plusieurs techniciens par passage (maquette validée le 2026-10-24, ADR 0026)
- [ ] Chantiers sur plusieurs jours : un jour par passage, techniciens différents par jour, bloc « Chantier · jour 1 sur 3 » au planning, fiche chantier (maquette validée le 2026-10-24)
- [x] Informations légales de l'entreprise (forme, capital, RCS ou RNE, qualification) demandées avant le premier certificat
- [x] PDF du certificat : mise en page selon la maquette validée, conseils, empreinte (ADR 0027)
- [x] Réglages › Entreprise et Réglages › Documents (modèle, couleur, logo, coordonnées, message)
- [x] Copier les réglages Documents dans le certificat signé (schéma version 2) et bloquer la signature tant que des mentions légales manquent (ADR 0032)
- [x] Réglages hors ligne pour le certificat sur le terrain (copie dans Dexie, ADR 0032)
- [ ] Aperçu des réglages Documents hors ligne (lire la copie de Dexie dans Réglages › Documents)
- [ ] PDF du certificat sur le téléphone après signature, envoi sur R2 avec son empreinte, partage au client (table `document_deliveries`, permission `documents:send`)
- [ ] Relances : échéances, envoi du PDF et relance par email (Resend), cron, SPF/DKIM/DMARC
- [ ] Espace particulier commun à tous les prestataires (ADR 0013), après clients et attestations, avec ses conditions et sa partie de la politique de confidentialité (brouillon validé le 2026-10-22)
- [x] Grille de prix et fonctionnement du paiement décidés (ADR 0025, choix de Quentin du 2026-10-24)
- [x] Abonnement, maquettes : Réglages › Abonnement, choix de la formule, bandeaux d'essai et d'impayé, espace bloqué, e-mails (fin d'essai J-2, paiement refusé, espace bloqué), validées le 2026-10-24
- [x] Fermer les inscriptions depuis l'admin (Plateforme › Réglages, super admin), connexion et invitations toujours possibles (ADR 0029)
- [ ] Offre des 20 premiers clients : 19 € HT par mois à vie, quelle que soit la formule (choix de Quentin du 2026-10-24, à consigner dans l'ADR 0025 et à coder avec l'abonnement)
- [x] Abonnement, code (PR 1) : contexte `billing`, Stripe Checkout et portail client, carte et SEPA, webhooks signés, refus des écritures d'un espace bloqué (ADR 0031)
- [x] Abonnement, écrans (PR 2) : Réglages › Abonnement dans tous ses états, factures, bandeaux d'essai et d'impayé, espace bloqué, nom de la formule dans la barre latérale
- [x] Abonnement, formule Solo : passage à Équipe à l'invitation d'un deuxième technicien (fenêtre avec prorata), refus côté serveur d'un deuxième technicien en Solo, refus d'Équipe vers Solo avec plusieurs techniciens (ADR 0034)
- [ ] Abonnement : bouton « Exporter mes données » de l'espace bloqué et ligne « Export de vos données » des formules, à remettre avec l'export
- [ ] Abonnement, e-mails et offre fondateurs (PR 3) : fin d'essai J-2, paiement refusé J0, J3, J7, J12, espace bloqué (cron quotidien) ; prix `founder_monthly` à 19 € HT pour les 20 premiers payeurs
- [ ] Stripe : régler les relances pour garder l'abonnement `past_due` ou `unpaid` au moins 15 jours, poser `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` et `STRIPE_PAYMENT_METHOD_CONFIGURATION` en staging (sur demande de déploiement)
- [ ] Ouvrir le compte Stripe de production au nom de la micro-entreprise de Quentin (ADR 0025), mentions de la facture Stripe validées par la vérification réglementaire
- [x] Abonnement : écran bloquant en fin d'essai (7 jours), avec souscription et déconnexion (export à venir)
- [ ] Espace admin : revoir « essais qui finissent cette semaine », qui couvre désormais tous les essais (7 jours)
- [x] Envoi réel des emails (lien de connexion, mot de passe oublié, invitation) avec Resend
- [ ] Poser le secret `RESEND_API_KEY` en staging et en production, puis tester un envoi sur chaque environnement
- [x] Turnstile sur l'inscription, la connexion et le mot de passe oublié
- [ ] Vérification des mots de passe divulgués (ADR 0012)
- [ ] Observabilité : Sentry navigateur et API, PostHog UE avec accord préalable de l'utilisateur (bannière), sourcemaps dans `release`
- [ ] Import CSV et export des données (export CSV et PDF promis par les conditions, article 11), suppression des données 90 jours après la fin de l'abonnement
- [x] Espace admin, socle de sécurité : rôles plateforme, double authentification, accès réservé (ADR 0015)
- [x] Espace admin, écrans selon la maquette validée le 2026-10-23 : vue d'ensemble, comptes clients, utilisation, personnel, journal, activation de la double authentification
- [x] Commercial, données : tables, API `/api/admin/prospects`, rôle `sales`, commande `prospects:import` (ADR 0017)
- [x] Commercial, écrans selon la maquette validée le 2026-10-23 (https://claude.ai/artifact/9s2qiEWDn6mQw2nS74eUyv) : Entreprises, Contacts, fiches, ordinateur et mobile ; espace admin réduit à Commercial pour le rôle `sales`
- [x] Commercial, écran Prospection : carte Leaflet (fond IGN), qualifier depuis la carte ; mini-carte et bouton « Carte » sur la fiche entreprise
- [ ] Importer les fiches en staging et en production (sur demande de Quentin)
- [x] Espace admin : équipe Passalio, inviter un membre, changer son rôle, le retirer (maquette validée le 2026-10-23, ADR 0018)
- [ ] Inviter Antho comme Commercial depuis la page Équipe, une fois l'équipe déployée (sur demande de Quentin)
- [x] Serveur MCP admin : Claude lit l'admin et écrit dans la prospection, écran d'autorisation selon la maquette validée le 2026-10-23 (ADR 0019)
- [x] Serveur MCP : KV `passalio-oauth-staging` et `passalio-oauth-production`, `MCP_ENABLED` activé en staging et en production
- [ ] Serveur MCP : outil d'import en lot de fiches prospects (100 lignes, simulation d'abord)
- [x] Prospection, appels, données et API : appels, rappels, qualification, Ma journée, séries (ADR 0024)
- [x] Prospection, écrans selon la maquette v2 validée le 2026-10-24 (https://claude.ai/artifact/Mga3znKvY8Zx8UAtg9PNTA) : Ma journée, Appels, Série d'appels, fiche, ordinateur et mobile
- [ ] Prospection, écrans : tuiles Mails, Campagnes, Ma semaine et conseils de Ma journée ; onglets Prioritaires et Faits aujourd'hui des Appels ; nombre d'entreprises qui correspondent à une série (avec les PR mails, campagnes, statistiques)
- [ ] Tests de composants : la synchronisation de fond de `renderScreen` appelle parfois `/api/sync/pull` hors du faux serveur (ECONNREFUSED dans la sortie, sans échec)
- [x] Prospection, boîte mail : données et API (réglages, mot de passe chiffré, test d'envoi SMTP, journal, e-mail récapitulatif) (ADR 0028)
- [x] Prospection, rappels par e-mail : cron toutes les 5 minutes sur `notify_at`, index partiel, envoi par Resend (ADR 0028)
- [x] Prospection, écran Configuration selon la maquette v2 : Profil, Boîte mail, Rappels, Signature (admin pour un autre membre)
- [ ] Créer le secret `MAIL_SECRET_KEY` en staging et en production avant le déploiement de la boîte mail (sur demande de Quentin)
- [ ] Prospection, boîte mail : récapitulatif quotidien, vérification nocturne du domaine (SPF, DKIM, DMARC), historique des changements à l'écran
- [ ] Prospection, réception des réponses (Email Routing), écran Mails, désinscription et liste d'exclusion
- [ ] Prospection, campagnes : envoi programmé, montée progressive de 5 à 25 par jour, créneau 8 h à 11 h
- [ ] Prospection, statistiques : réponses, rendez-vous, taux de décroché par heure
- [ ] Espace admin : créer un compte client, créer un accès, se connecter à la place (lecture seule)
- [ ] Espace admin : abonnement et mois offerts (avec Stripe Billing)
- [ ] Sauvegardes externes chiffrées (ADR 0008)
- [ ] Purge automatique après 12 mois : `activity_days`, journaux de connexion et d'actions (politique de confidentialité)

## Tests (ADR 0020, inventaire dans `docs/TESTING.md`)

- [x] Règles, garde-fou `test:guard`, lint des tests, agents, skill `fix-bug`
- [x] Tests obligatoires (ADR 0023) : aucun code de production sans test, sauf `Tests-Not-Needed`
- [ ] Synchronisation : rejouer une modification ou un retrait après archivage, doublons dans un même lot (comportement à décider)
- [x] Matrices API générées : complétude des routes, permissions par rôle, isolation entre entreprises, impersonation
- [ ] Matrices API, suite : réponses conformes aux schémas zod et `trace_id` sur les succès, cas 400 par route, isolation vue par chaque rôle
- [ ] À confirmer par Quentin : `members:read` pour les 4 rôles, « Membres et rôles » = `members:manage`, fin de l'onboarding = `organization:update`
- [x] Use cases sans tests unitaires : backoffice, équipe Passalio, prospection, clients, identité
- [x] Base de données : migrations depuis zéro, schéma Drizzle conforme, index réellement utilisés, catalogue de toutes les requêtes
- [ ] Compteurs de la prospection (onglets d'étape, départements, contacts) : lecture complète acceptée tant que la liste reste de quelques milliers de lignes, compteurs à prévoir au-delà
- [ ] À décider : `updated_at` sur `document_number_blocks` (table écrite une seule fois)
- [x] Sécurité transverse (cookies, limites de débit, Turnstile, fichiers envoyés, lien de mot de passe, sessions) et aucune donnée personnelle dans les logs
- [ ] En-têtes de sécurité (CSP stricte, HSTS, `X-Content-Type-Options`, `Referrer-Policy`) promis par `SECURITY.md` mais pas encore posés, puis leurs tests
- [ ] Vérifier le type d'un fichier envoyé sur son contenu, pas seulement sur l'en-tête déclaré
- [ ] À décider : limite des codes de double authentification par compte (aujourd'hui par adresse IP) ; `retour` qui accepte `/\…`
- [x] Synchronisation : tests de propriétés (fast-check), envoi rejoué, curseur, refus, photos
- [x] Composants : états vide, chargement, erreur, succès de chaque écran (Vitest, happy-dom)
- [x] Parcours Comptes, Équipe, Réglages (mobile et ordinateur, accessibilité)
- [x] Parcours Clients et hors ligne réel
- [x] Parcours Admin, Équipe Passalio, Commercial
- [ ] Parcours restants : démarrer sans réseau avec la dernière session, nouvelle version sans perte des modifications hors ligne
- [ ] Une personne retirée d'une entreprise garde une session qui pointe encore sur cette entreprise (comportement à décider)
- [ ] Listes paginées à la hauteur de l'écran : si la hauteur change pendant le chargement, la requête repart de zéro avec ses nouvelles tentatives
- [ ] Erreurs définitives (403, 404) : ne pas refaire 3 tentatives avant d'afficher l'erreur
- [ ] Modifications refusées : dire laquelle a été refusée et pourquoi, pas seulement combien
- [ ] Photos d'appareil : réduire la photo sur le téléphone avant l'envoi plutôt que refuser au-delà de 5 Mo
- [ ] Régression visuelle : captures de référence de chaque état
- [ ] Test instable : `offline-field-changes` « synchronisation en échec » sur mobile, l'inscription dépasse 5 s quand toute la suite tourne (vu le 2026-10-25)
- [ ] Couverture avec seuils, tests de mutation, `test:all` obligatoire dans `release:*`, tests de fumée après déploiement

## Site passalio.com

- [x] Landing page, première version (maquette : https://claude.ai/artifact/VXkqPLKM7fxAL5f6rYrvVK)
- [x] Landing page plus fine, selon la maquette v3 validée le 2026-10-23
- [x] Déployer le site sur staging.passalio.com et passalio.com, avec `release:*`
- [ ] Rediriger www.passalio.com vers passalio.com
- [ ] Landing : section prix en hors taxes, Solo et Équipe (ADR 0014, ADR 0025)
- [ ] Landing : réponse « client sans email » et section « Qui est derrière Passalio » avec Quentin et Antho
- [ ] Adresse de contact publique (contact@passalio.com) à créer, puis l'ajouter au pied de page
- [x] Barre de navigation commune, pages par activité, pages fonction, histoires de terrain, page Sans réseau, SEO complet (maquette : https://claude.ai/artifact/6LZhtqB84KkzXpjxumRoqt)
- [x] API publique « Être rappelé » (rappel dans « Ma journée », Turnstile, limite par IP, CORS depuis passalio.com, ADR 0030)
- [ ] Comptage des visites par page et par jour, sans donnée personnelle
- [ ] Ajouter passalio.com et staging.passalio.com au widget Turnstile avant de déployer le site
- [ ] Publier les pages Certificat, Attestation d’entretien, Relances, Lecture de plaque, Changer de logiciel et leurs histoires quand la fonction est en production (`isPublished`)
- [ ] Remplacer les histoires inventées par de vrais témoignages dès les premiers clients
- [ ] Pages comparatives (Ramio, Ramonia), prix datés, sans dénigrement

Avant le premier client payant : informations de l'éditeur dans les pages légales, relecture juridique, SPF/DKIM/DMARC.

## Après la V1

- **V1.1** : confirmation J-1, demande d'avis Google après l'intervention, suivi d'arrivée sans GPS, IA (plaque signalétique, carnet papier, dictée), QR code équipement.
- **V2** : devis et factures, facture électronique (obligatoire pour les TPE en septembre 2027), option SMS, prise de rendez-vous en ligne, nouveaux métiers (vidange ANC, PAC et climatisation, portes automatiques, hottes).

## Calendrier

| Période                    | Objectif                                    |
| -------------------------- | ------------------------------------------- |
| Octobre à mi-novembre 2026 | V1 et entretiens avec des ramoneurs         |
| Novembre à décembre 2026   | Premiers clients pilotes, vendre la relance |
| Hiver et printemps 2027    | V1.1 avec les pilotes, SEO, métier suivant  |
| Fin de l'été 2027          | Grosse vague d'acquisition avant la saison  |
