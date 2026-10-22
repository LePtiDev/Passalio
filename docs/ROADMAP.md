# Roadmap et todo

Source de vérité de l'avancement. Mise à jour dans la même PR que le travail qu'elle décrit (voir `CLAUDE.md`, « Définition de terminé »).

Dernière mise à jour : 2026-10-22.

## Fait

| Quoi                                                                                           | Où                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------- |
| Décisions, architecture, sécurité, 10 ADR, skills Claude Code                                  | `CLAUDE.md`, `docs/`            |
| Monorepo : Astro, React PWA, API Hono sur Workers, paquets `shared`, `db`, `trades`, `pdf`     | PR #1                           |
| Logger JSON avec `trace_id`, rôles et `assertCan`, erreurs 403/500, scripts `release:*`        | PR #2                           |
| Cloudflare : D1 et R2 staging et production en UE, jeton de déploiement                        | hors dépôt                      |
| Parité concurrents, essai de Ramonia (attestations, facture, captures)                         | `docs/competitor-parity.md`     |
| Parité concurrents, essai de Ramio (certificat, facture, équipe, SMS)                          | `docs/competitor-parity.md`     |
| Hook de session cloud : Node 24, pnpm, dépendances, pour développer et déployer sans poste     | PR #5                           |
| Mentions obligatoires par document et par métier, vérifiées sur les textes officiels           | `docs/regulatory/`              |
| Règle : maquette validée par Quentin avant de coder un écran, captures avant fusion            | `CLAUDE.md`, skill `new-screen` |
| Maquette des écrans comptes validée, ADR mot de passe (0012) et espace particulier (0013)      | `docs/adr/`                     |
| Connexion email et mot de passe, inscription, mot de passe oublié, limitation de débit en base | PR #13                          |

## Hors code (Quentin)

- [ ] Récupérer un vrai certificat de ramonage et une vraie attestation d'entretien d'appareil remplis, pour les comparer à `docs/regulatory/`
- [ ] Trancher les points ouverts des fiches `docs/regulatory/` (lectures « Non vérifié sur texte officiel »), au besoin avec un juriste ou une fédération
- [x] Tableau de parité des fonctionnalités : Ramio, Ramonia, OpenFire
- [x] Créer le compte d'essai Ramio (case anti-robot à cocher soi-même), puis le faire explorer
- [ ] Rédiger les conditions d'utilisation et la politique de confidentialité (liens à ajouter sur l'inscription et en pied de page)
- [ ] Vérifier la marque Passalio (INPI, EUIPO), réserver passalio.fr et passalio.com
- [ ] Choisir l'hébergement du site et de l'application
- [ ] Lister 10 à 15 ramoneurs indépendants à interroger

## V1, dans l'ordre

- [ ] Comptes et entreprises : Better Auth (lien magique, organisations, rôles), `Actor` dans l'API, lecture seule pendant l'impersonation
- [ ] Écrans comptes selon la maquette validée (https://claude.ai/artifact/NpYPYv6fWoK39vvtGBtfs9) :
  - [x] Connexion email et mot de passe, création de compte avec le nom, mot de passe oublié (ADR 0012)
  - [ ] Onboarding : entreprise (recherche Sirene), métiers, documents (logo, couleur, numérotation), équipe
  - [ ] Barre latérale, Équipe en pleine largeur avec invitations en attente, écran « Premiers pas »
- [ ] Clients, lieux, équipements : tables D1 avec index, use cases, routes, tests d'isolation
- [ ] Hors ligne : Dexie, outbox, `/sync/push` et `/sync/pull`, indicateur de synchronisation
- [ ] Écrans clients : liste, fiche, lieux, équipements
- [ ] Métier ramonage et entretien d'appareil dans `packages/trades` (bloqué par les documents réels)
- [ ] Attestation : formulaire, photos sur R2, signature, PDF sur le téléphone, numérotation, immuable une fois signée
- [ ] Planning simple : interventions par technicien et par jour
- [ ] Relances : échéances, envoi du PDF et relance par email (Resend), cron, SPF/DKIM/DMARC
- [ ] Espace particulier commun à tous les prestataires (ADR 0013), après clients et attestations
- [ ] Abonnement : Stripe Billing, 29,99 €/mois et 299,90 €/an, essai gratuit
- [ ] Envoi réel des emails (lien de connexion, mot de passe oublié, invitation) avec Resend
- [ ] Vérification des mots de passe divulgués et Turnstile sur l'inscription (ADR 0012)
- [ ] Observabilité : Sentry navigateur et API, PostHog UE, sourcemaps dans `release`
- [ ] Import CSV et export des données
- [ ] Backoffice minimal avec impersonation, sauvegardes externes chiffrées (ADR 0008)

Avant le premier client payant : CGV, politique de confidentialité, contrat de sous-traitance RGPD, SPF/DKIM/DMARC.

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
