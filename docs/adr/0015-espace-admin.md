# 0015 — Espace admin : rôles plateforme, double authentification, accès invisible

- Date : 2026-10-23
- Statut : accepté

## Contexte

L'équipe Passalio (Quentin, puis Antho) doit voir les comptes clients, leur créer des accès, gérer leurs abonnements et se connecter à leur place. Un compte admin compromis donnerait accès à toutes les entreprises : c'est le compte le plus sensible du produit.

## Décision

- Deux rôles plateforme, portés par `users.role` : `superadmin` (tout) et `support` (tout sauf bloquer un compte). Les permissions plateforme (`platform:read`, `accounts:create`, `accounts:block`, `access:manage`, `accounts:impersonate`, `billing:gift`) sont dans `packages/shared` et vérifiées dans chaque use case avec `assertPlatformCan`.
- Un rôle plateforme ne se donne que par la commande `pnpm platform:grant` (et se retire par `pnpm platform:revoke`), lancée par un développeur qui a accès à Cloudflare. Aucune route HTTP ne change un rôle plateforme : les routes `/api/auth/admin/*` de Better Auth restent fermées (ADR 0011). Chaque changement est écrit dans `audit_logs`, et un retrait coupe toutes les sessions de la personne.
- Aucun email, mot de passe ou secret d'admin dans le dépôt : la personne crée son compte normalement, puis on lui donne le rôle.
- Double authentification TOTP (plugin `twoFactor` de Better Auth) obligatoire pour entrer dans l'espace admin, avec 10 codes de secours. Vérification limitée à 5 essais par minute.
- Les routes `/api/admin/*` passent par `requirePlatformActor` : pas de rôle plateforme, compte bloqué ou session d'impersonation → 404, pour ne pas révéler l'espace ; rôle sans double authentification → 403 `two_factor_required` ; session qui n'a pas passé le code, ou l'a passé il y a plus de 12 heures → 401 `two_factor_unverified`, il faut saisir le code. La preuve est portée par la session (`sessions.two_factor_verified_at`), posée seulement par `verify-totp` ou `verify-backup-code` : une connexion par lien magique, qui ne demande pas le code dans Better Auth, n'ouvre donc pas l'admin.
- « Se connecter à la place » d'un client reste en lecture seule, 30 minutes, avec motif, et visible par le propriétaire du compte (section 6 de `docs/ARCHITECTURE.md`).

- Utilisation d'un compte client : la table `activity_days` garde une ligne par personne et par jour d'utilisation (heure de Paris), écrite à la connexion et au renouvellement quotidien de la session, jamais pendant une impersonation. Aucun détail des actions. « Connexions » dans l'admin = jours d'utilisation. Une entreprise est « en baisse » si ses 30 derniers jours comptent au moins 20 % de jours d'utilisation de moins que les 30 précédents, avec au moins 5 jours avant.
- Tant que Stripe n'est pas branché, une entreprise est « en essai » pendant 14 jours après sa création.
- Les requêtes de l'admin parcourent la table `organizations` sans index de tri ni de recherche : elles sont rares et la table reste petite (une ligne par entreprise cliente). `activity_days` est indexée par personne et par jour, `audit_logs` par action et date.

## Conséquences

Il faut accès à Cloudflare pour nommer un admin : c'est voulu. Antho devra activer sa double authentification avant d'entrer. L'écran d'activation demande le mot de passe en plus du code, parce que Better Auth l'exige pour activer la double authentification.
