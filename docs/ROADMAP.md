# Roadmap et todo

Source de vérité de l'avancement. Mise à jour dans la même PR que le travail qu'elle décrit (voir `CLAUDE.md`, « Définition de terminé »).

Dernière mise à jour : 2026-10-23.

## Fait

| Quoi                                                                                                    | Où                              |
| ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Décisions, architecture, sécurité, 10 ADR, skills Claude Code                                           | `CLAUDE.md`, `docs/`            |
| Monorepo : Astro, React PWA, API Hono sur Workers, paquets `shared`, `db`, `trades`, `pdf`              | PR #1                           |
| Logger JSON avec `trace_id`, rôles et `assertCan`, erreurs 403/500, scripts `release:*`                 | PR #2                           |
| Cloudflare : D1 et R2 staging et production en UE, jeton de déploiement                                 | hors dépôt                      |
| Parité concurrents, essai de Ramonia (attestations, facture, captures)                                  | `docs/competitor-parity.md`     |
| Parité concurrents, essai de Ramio (certificat, facture, équipe, SMS)                                   | `docs/competitor-parity.md`     |
| Hook de session cloud : Node 24, pnpm, dépendances, pour développer et déployer sans poste              | PR #5                           |
| Mentions obligatoires par document et par métier, vérifiées sur les textes officiels                    | `docs/regulatory/`              |
| Règle : maquette validée par Quentin avant de coder un écran, captures avant fusion                     | `CLAUDE.md`, skill `new-screen` |
| Maquette des écrans comptes validée, ADR mot de passe (0012) et espace particulier (0013)               | `docs/adr/`                     |
| Connexion email et mot de passe, inscription, mot de passe oublié, limitation de débit en base          | PR #13                          |
| Onboarding : entreprise (recherche Sirene), métiers, documents (logo, couleur, numéros), équipe         | PR #14                          |
| Barre latérale, navigation mobile, Équipe pleine largeur, invitations en attente, Premiers pas          | PR #15                          |
| Application et API servies par un Worker, sur app.staging.passalio.com et app.passalio.com              | PR #16                          |
| Conditions générales, accord de sous-traitance, confidentialité, mentions légales, preuve d'acceptation | PR #18                          |
| Clients, lieux, appareils, photos : tables, API, remplacement d'appareil, archivage, tests d'isolation  | PR #19                          |
| Hors ligne : base Dexie, file de modifications, `/sync/push` et `/sync/pull`, démarrage sans réseau     | PR #20                          |
| Anti-robot Cloudflare Turnstile sur l'inscription, la connexion et le mot de passe oublié               | PR #17                          |
| Landing page passalio.com (première version) selon la maquette validée le 2026-10-23                    | `apps/web`                      |
| Écrans clients : liste, fiche, nouveau client, lieu, appareil, remplacement, indicateur de synchro      | PR #21                          |
| Statut juridique : SAS à deux associés 50/50, TVA, comptabilité, étapes de création                     | ADR 0014, `docs/company.md`     |
| Champ de recherche partagé (`components/search-field.tsx`), 32 px de haut sur ordinateur                | PR #24                          |

## Hors code (Quentin)

- [ ] Relire les contrats de travail de Quentin et d'Antho (exclusivité, non-concurrence, propriété intellectuelle) avant de créer la SAS
- [ ] Créer la SAS : statuts, pacte d'associés, compte bancaire, annonce légale, immatriculation (`docs/company.md`)
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
- [ ] Réglages entreprise : modifier après l'onboarding les informations, métiers, logo et numérotation ; bloquer le changement du premier numéro dès la première attestation signée
- [x] Clients, lieux, équipements : tables D1 avec index, use cases, routes, tests d'isolation
- [x] Hors ligne : Dexie, outbox, `/sync/push` et `/sync/pull` (clients, lieux, appareils, photos en attente d'envoi), ADR 0014
- [x] Indicateur de synchronisation dans les écrans clients
- [ ] Liste des modifications refusées par le serveur, consultable depuis l'indicateur de synchronisation
- [ ] Tester le démarrage sans réseau sur l'application installée (staging), service worker compris
- [x] Écrans clients selon la maquette validée le 2026-10-22 (https://claude.ai/artifact/Tha55S1NCL2MsWPN3TxquD) : liste, fiche, nouveau client, nouvel appareil, remplacement
- [ ] Import d'un fichier de clients (bouton « Importer un fichier » affiché « Bientôt »)
- [ ] Modifier un lieu et un appareil depuis la fiche (le menu propose seulement Remplacer et Retirer)
- [ ] Lecture de la plaque signalétique d'un appareil par photo (API Claude), champs à confirmer par le technicien, téléphone seulement
- [ ] Calcul de `next_due_date` selon la périodicité de chaque métier (configuration dans `packages/trades`)
- [ ] Métier ramonage et entretien d'appareil dans `packages/trades` (bloqué par les documents réels)
- [ ] Attestation : formulaire, photos sur R2, signature, PDF sur le téléphone, numérotation, immuable une fois signée
- [ ] Planning simple : interventions par technicien et par jour
- [ ] Relances : échéances, envoi du PDF et relance par email (Resend), cron, SPF/DKIM/DMARC
- [ ] Espace particulier commun à tous les prestataires (ADR 0013), après clients et attestations, avec ses conditions et sa partie de la politique de confidentialité (brouillon validé le 2026-10-22)
- [ ] Abonnement : Stripe Billing, 29,99 € HT/mois et 299,90 € HT/an, essai gratuit de 14 jours sans carte, lecture seule en fin d'essai ou après 15 jours d'impayé (conditions, articles 6 et 8)
- [ ] Envoi réel des emails (lien de connexion, mot de passe oublié, invitation) avec Resend
- [x] Turnstile sur l'inscription, la connexion et le mot de passe oublié
- [ ] Vérification des mots de passe divulgués (ADR 0012)
- [ ] Observabilité : Sentry navigateur et API, PostHog UE avec accord préalable de l'utilisateur (bannière), sourcemaps dans `release`
- [ ] Import CSV et export des données (export CSV et PDF promis par les conditions, article 11), suppression des données 90 jours après la fin de l'abonnement
- [ ] Backoffice minimal avec impersonation, sauvegardes externes chiffrées (ADR 0008)

## Site passalio.com

- [x] Landing page, première version (maquette : https://claude.ai/artifact/VXkqPLKM7fxAL5f6rYrvVK)
- [ ] Déployer le site sur passalio.com (Cloudflare), sur demande de Quentin
- [ ] Landing : section prix, une fois le prix tranché, en hors taxes (ADR 0014)
- [ ] Landing : réponse « client sans email » et section « Qui est derrière Passalio » avec Quentin et Antho
- [ ] Adresse de contact publique (contact@passalio.com) à créer, puis l'ajouter au pied de page
- [ ] Pages par métier et pages comparatives (Ramio, Ramonia), prix datés, sans dénigrement

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
