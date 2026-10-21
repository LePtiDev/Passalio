# Sécurité, données et reprise après incident

Objectif : qu'une fuite, une erreur ou un piratage ne fasse jamais perdre les données des clients, et qu'on puisse tout restaurer.

## 1. Menaces prises en compte
1. Vol de session ou de compte utilisateur.
2. Accès d'une entreprise aux données d'une autre.
3. Vol du jeton Cloudflare sur le poste de développement, qui permettrait de supprimer la base et les fichiers.
4. Compromission d'un compte fournisseur (Cloudflare, Stripe, GitHub, email).
5. Dépendance npm malveillante.
6. Erreur humaine (migration ratée, suppression en masse).

## 2. Sauvegardes (règle 3-2-1)
- **D1 Time Travel** : restauration à un instant précis sur les 30 derniers jours (offre payante). Première ligne de défense contre les erreurs.
- **Export quotidien hors Cloudflare** : un cron exporte les tables en NDJSON, chiffre l'archive avec une clé publique `age`, et l'envoie vers un stockage objet externe (par exemple Scaleway ou Backblaze) avec **verrouillage d'objet (object lock)** sur 30 jours. Même avec un accès complet au compte Cloudflare, ces sauvegardes ne peuvent ni être lues ni être supprimées.
- **Fichiers R2** : réplication hebdomadaire vers le même stockage externe verrouillé.
- La clé privée de déchiffrement est conservée hors ligne (gestionnaire de mots de passe + copie papier), jamais sur un serveur.
- **Test de restauration mensuel** sur l'environnement staging, noté dans `docs/restore-log.md`.

## 3. Comptes et accès
- Clé de sécurité physique (ou passkey) sur Cloudflare, Stripe, GitHub, Resend, Sentry, PostHog, registrar du domaine, boîte email admin.
- Email administrateur dédié, différent de l'email personnel.
- Jetons API Cloudflare à droits minimaux, un par usage, avec expiration. Jamais la clé API globale.
- Le jeton de déploiement local ne donne pas le droit de supprimer les bases D1 ni les buckets R2. Les opérations destructives se font à la main dans le tableau de bord.
- Secrets en production via `wrangler secret`, en local dans `.dev.vars` (ignoré par git).

## 4. Isolation entre entreprises
- Toute table métier a `organization_id`. Les repositories l'exigent dans leur signature.
- Tests automatiques d'isolation : un utilisateur de l'entreprise A ne lit, ne modifie, ne synchronise rien de l'entreprise B, pour chaque route.
- Les identifiants sont des UUIDv7 non devinables, mais la sécurité ne repose jamais sur cela.

## 5. Application
- Sessions Better Auth en cookie `HttpOnly`, `Secure`, `SameSite=Lax`, durée limitée, révocables.
- Rate limiting sur la connexion, l'inscription, les liens publics et l'IA (binding de rate limiting Workers ou règles Cloudflare).
- Cloudflare Turnstile sur l'inscription et les formulaires publics.
- En-têtes de sécurité : CSP stricte, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- Liens publics (PDF, suivi) : jetons longs aléatoires, expiration, accès en lecture seule.
- Webhooks Stripe vérifiés par signature.
- Fichiers envoyés : type et taille vérifiés, stockés dans R2 hors du domaine de l'application.
- `audit_logs` : connexions, changements de rôle, exports, suppressions, impersonations.

## 6. Dépendances
- Versions exactes et lockfile commité.
- `pnpm audit` avant chaque mise en production.
- Pas de nouvelle dépendance sans vérifier : maintenue, populaire, compatible Workers ou hors ligne, utile.

## 7. Données personnelles (RGPD)
- L'artisan est responsable du traitement pour ses clients, l'éditeur est sous-traitant : contrat de sous-traitance dans les CGV.
- Données minimales : ce que demande l'attestation et la relance, rien de plus.
- Hébergement UE (R2 juridiction UE, D1 localisation Europe, PostHog UE, Sentry UE).
- Aucune donnée personnelle dans les logs, Sentry, PostHog. Session replay avec masquage des champs.
- Export complet et suppression du compte disponibles en libre-service.
- Conservation : attestations conservées selon les durées réglementaires ; comptes résiliés purgés après le délai prévu aux CGV.

## 8. Si un incident arrive
1. Révoquer les jetons et sessions concernés, changer les secrets.
2. Mettre l'application en maintenance si nécessaire (variable d'environnement).
3. Restaurer : Time Travel si l'incident a moins de 30 jours et que le compte Cloudflare est sain, sinon sauvegarde externe.
4. Si des données personnelles ont fuité : notification à la CNIL sous 72 h et information des entreprises clientes.
5. Rédiger un compte rendu et un ADR si une décision change.
