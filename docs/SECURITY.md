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
- Secrets en production via `wrangler secret`, en local dans `.dev.vars` (ignoré par git). Les clés des fournisseurs de modèles (`OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`, `MISTRAL_API_KEY`) suivent la même règle.
- Mots de passe d'application des boîtes mail des commerciaux (ADR 0028) : chiffrés en AES-GCM 256 avec le secret `MAIL_SECRET_KEY` (32 octets en base64, un par environnement), jamais renvoyés par l'API, jamais journalisés, seulement remplaçables. Le journal `mail_settings.updated` ne garde que les noms des champs changés. Perdre la clé oblige chaque membre à ressaisir son mot de passe.

## 4. Isolation entre entreprises

- Toute table métier a `organization_id`. Les repositories l'exigent dans leur signature.
- Tests automatiques d'isolation : un utilisateur de l'entreprise A ne lit, ne modifie, ne synchronise rien de l'entreprise B, pour chaque route.
- Les identifiants sont des UUIDv7 non devinables, mais la sécurité ne repose jamais sur cela.

## 5. Application

- Sessions Better Auth en cookie `HttpOnly`, `Secure`, `SameSite=Lax`, durée limitée, révocables.
- Invitations en attente : la liste demande `members:read` (lisible pendant une impersonation), le renvoi et l'annulation demandent `members:manage`. Une invitation acceptée, annulée ou d'une autre entreprise répond « introuvable ». Chaque renvoi et chaque annulation est écrit dans `audit_logs`.
- Logo d'entreprise : PNG, JPEG, WebP ou SVG, 2 Mo au plus, stocké dans R2 sous `organizations/{id}/logo`. Servi uniquement aux membres connectés, avec `Content-Security-Policy: default-src 'none'` et `X-Content-Type-Options: nosniff`, pour qu'un SVG piégé ne puisse pas exécuter de script.
- Recherche d'entreprise : l'API proxifie l'API publique « Recherche d'entreprises » (données Sirene) pour les seuls utilisateurs connectés. Seul le texte recherché est transmis.
- Rate limiting sur la connexion, l'inscription, les liens publics et l'IA (lecture de plaque : 200 par entreprise et par jour, ADR 0022). Pour l'authentification, Better Auth compte les tentatives par adresse IP (`cf-connecting-ip`) dans la table D1 `rate_limits` : connexion 10 par minute, inscription 5, lien magique 5, mot de passe oublié 3. Le compteur en mémoire ne convient pas, car un Worker ne garde pas d'état entre deux requêtes.
- Cloudflare Turnstile sur l'inscription, la connexion par mot de passe et le mot de passe oublié : le plugin `captcha` de Better Auth exige l'en-tête `x-captcha-response` et le vérifie auprès de Cloudflare (400 s'il manque, 403 s'il est refusé, 500 si Cloudflare ne répond pas). Le widget s'affiche seulement si Cloudflare a un doute. Un seul widget pour app.passalio.com et app.staging.passalio.com ; la clé du site est publique (`apps/app/src/lib/turnstile.ts`), la clé secrète est un secret Worker `TURNSTILE_SECRET_KEY`. En local et dans les tests, clés de test de Cloudflare. Le lien magique n'est pas couvert : il ne crée pas de compte et reste limité à 5 par minute.
- Demande de rappel depuis le site (ADR 0030) : seule route anonyme qui écrit. Turnstile obligatoire, 5 demandes par heure et par adresse IP (adresse hachée en SHA-256 dans `rate_limits`), CORS limité à `SITE_URL`. Les logs ne gardent ni le nom ni le téléphone.
- En-têtes de sécurité : CSP stricte, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- Liens publics (PDF, suivi) : jetons longs aléatoires, expiration, accès en lecture seule.
- Serveur MCP admin (ADR 0019) : OAuth 2.1 avec PKCE `S256`, consentement dans l'espace admin (double authentification de moins de 12 heures, permission `mcp:connect`), redirections limitées à claude.ai, claude.com et aux adresses locales. Portées `passalio:read` et `passalio:write`, jamais de suppression ni d'écriture chez les clients. Jeton 1 heure, accès 7 jours, rôle relu à chaque appel, 60 appels par minute. Chaque consentement et chaque écriture vont dans `audit_logs` ; les logs ne gardent jamais les arguments des outils. Retrait par `pnpm mcp:revoke`.
- Webhooks Stripe (ADR 0031) : signature HMAC-SHA256 vérifiée avec `STRIPE_WEBHOOK_SECRET`, 5 minutes de tolérance, chaque événement traité une seule fois (`stripe_events`). Le serveur relit l'abonnement chez Stripe au lieu de croire le contenu de l'événement. Les logs ne gardent que l'identifiant et le type de l'événement.
- Espace bloqué (ADR 0031) : fin d'essai, impayé depuis 15 jours ou résiliation. Le serveur refuse toute écriture (403 `workspace_blocked`) sauf l'abonnement, l'authentification, l'espace admin et la création d'une autre entreprise ; à la synchronisation, seul un certificat signé avant le blocage passe. Seul le patron (`billing:manage`) ouvre Checkout et le portail, et passe de Solo à Équipe (ADR 0034) ; le moyen de paiement et les factures (`GET /api/billing/invoices`, liste vide pour les autres rôles) ne sont montrés qu'à lui, jamais pendant une impersonation. Sans `STRIPE_SECRET_KEY`, rien n'est bloqué.
- Fichiers envoyés : type et taille vérifiés, stockés dans R2 hors du domaine de l'application.
- `audit_logs` : connexions, changements de rôle, exports, suppressions, impersonations.
- Inscriptions (ADR 0029) : un super admin peut les fermer depuis Plateforme › Réglages (`settings:manage`). Le serveur refuse alors la création de compte (`SIGN_UP_CLOSED`) et d'entreprise (`sign_up_closed`), sauf pour une adresse qui a une invitation en attente non expirée. La connexion des comptes existants n'est jamais bloquée. `GET /api/sign-up-availability` est public et ne renvoie qu'un booléen.
- Espace admin (ADR 0015) : rôles plateforme donnés par un super admin depuis la page Équipe (invitation par e-mail, permission `team:manage`, ADR 0018) ou en urgence par `pnpm platform:grant`. Un super admin ne change pas son propre rôle ; un changement de rôle ou un retrait ferme les sessions de la personne. Double authentification TOTP obligatoire, codes vérifiés 5 fois par minute au plus. `/api/admin/*` répond 404 à qui n'est pas admin (et pendant une impersonation), 403 sans double authentification, 401 si la session n'a pas passé le code depuis moins de 12 heures (une connexion par lien magique doit aussi saisir le code).

## 6. Dépendances

- Versions exactes et lockfile commité.
- `pnpm audit` avant chaque mise en production.
- Pas de nouvelle dépendance sans vérifier : maintenue, populaire, compatible Workers ou hors ligne, utile.

## 7. Données personnelles (RGPD)

- L'artisan est responsable du traitement pour ses clients, l'éditeur est sous-traitant : accord de sous-traitance en annexe des conditions générales (`/conditions`). Politique de confidentialité sur `/confidentialite`, liste des sous-traitants ultérieurs à tenir à jour à chaque nouveau prestataire. Le fournisseur du modèle de lecture de plaque (ADR 0022) y entre avant l'activation en production.
- Preuve d'acceptation des conditions : version et date enregistrées sur `users` à l'inscription, refus côté serveur si la version manque ou n'est pas la courante.
- Données minimales : ce que demande l'attestation et la relance, rien de plus.
- Prospection (ADR 0017) : données publiques d'entreprises et de leurs dirigeants, sur intérêt légitime. Opposition traitée en supprimant la fiche, contacts et historique compris. Le fichier d'import reste hors du dépôt.
- Mesure de l'utilisation : seulement la date des jours où une personne utilise l'application (`activity_days`), 12 mois, mentionnée dans la politique de confidentialité.
- Hébergement UE (R2 juridiction UE, D1 localisation Europe, PostHog UE, Sentry UE).
- Aucune donnée personnelle dans les logs, Sentry, PostHog. Session replay avec masquage des champs.
- Export complet et suppression du compte disponibles en libre-service.
- Conservation : attestations conservées selon les durées réglementaires ; données d'une entreprise exportables 90 jours après la fin de l'abonnement ou de l'essai, puis supprimées (sauvegardes effacées 30 jours plus tard).

## 8. Si un incident arrive

1. Révoquer les jetons et sessions concernés, changer les secrets.
2. Mettre l'application en maintenance si nécessaire (variable d'environnement).
3. Restaurer : Time Travel si l'incident a moins de 30 jours et que le compte Cloudflare est sain, sinon sauvegarde externe.
4. Si des données personnelles ont fuité : notification à la CNIL sous 72 h et information des entreprises clientes.
5. Rédiger un compte rendu et un ADR si une décision change.
