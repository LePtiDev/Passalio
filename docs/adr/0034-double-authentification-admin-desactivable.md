# 0034 — Double authentification de l'espace admin désactivable

- Date : 2026-10-26
- Statut : accepté
- Modifie : ADR 0015

## Contexte

L'ADR 0015 impose la double authentification (TOTP) pour entrer dans l'espace admin, avec un code de moins de 12 heures. Le 2026-10-26, Quentin demande de l'enlever « pour le moment ». Elle doit pouvoir revenir sans réécrire le code ni ses tests.

## Décision

- Variable d'environnement `ADMIN_TWO_FACTOR_REQUIRED`. Seule la valeur `"false"` retire l'exigence ; absente ou toute autre valeur, la double authentification reste obligatoire.
- `evaluateAdminAccess` reçoit une politique `AdminAccessPolicy` (`isTwoFactorRequired`), lue par `adminAccessPolicyOf(env)` dans `requirePlatformActor`. Sans exigence, `/api/admin/*` ne répond plus ni 403 `two_factor_required` ni 401 `two_factor_unverified`.
- Ce qui ne change pas : 404 pour qui n'a pas de rôle plateforme, pour un compte bloqué et pendant une impersonation ; permissions par rôle (`assertCan`) ; consentement MCP réservé aux admins.
- Staging et production : `"false"` dans `apps/api/wrangler.json`. En local, la variable est absente : les parcours de double authentification (tests d'API et E2E) restent vérifiés tels quels.
- Les écrans d'activation et de saisie du code restent en place. Better Auth demande toujours le code à la connexion par mot de passe d'un compte qui a activé la double authentification : c'est une protection du compte, pas de l'espace admin.

## Conséquences

- Un admin, un super admin ou un commercial entre dans `/admin` avec son seul mot de passe ou un lien de connexion. Le compte admin ne tient plus qu'à son mot de passe et à sa boîte mail : risque accepté par Quentin le temps du lancement.
- Pour remettre la double authentification : retirer la variable des deux environnements et déployer. Les sessions ouvertes devront alors saisir le code.
- Un test vérifie la valeur de chaque environnement dans `wrangler.json`, pour qu'un changement soit visible en revue.
