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
- Les routes `/api/admin/*` passent par `requirePlatformActor` : pas de rôle plateforme, compte bloqué ou session d'impersonation → 404, pour ne pas révéler l'espace ; rôle sans double authentification → 403 `two_factor_required` ; session de plus de 12 heures → 401 `admin_session_expired`, il faut se reconnecter.
- « Se connecter à la place » d'un client reste en lecture seule, 30 minutes, avec motif, et visible par le propriétaire du compte (section 6 de `docs/ARCHITECTURE.md`).

## Conséquences

Il faut accès à Cloudflare pour nommer un admin : c'est voulu. Antho devra activer sa double authentification avant d'entrer. L'écran d'activation demande le mot de passe en plus du code, parce que Better Auth l'exige pour activer la double authentification.
