# 0019 — Serveur MCP admin : Claude branché sur les données de Passalio

- Date : 2026-10-23
- Statut : accepté

## Contexte

Quentin veut brancher Claude sur les données de production pour les consulter et pousser de la prospection sans passer par les écrans. L'accès doit rester réservé à l'équipe Passalio, reprendre la double authentification de l'espace admin et laisser une trace de chaque écriture.

## Décision

- Un serveur MCP distant, servi par le Worker de l'API sur `/mcp` (Streamable HTTP, sans état, réponses JSON), contexte `apps/api/src/contexts/mcp/`.
- Connexion par OAuth 2.1 avec `@cloudflare/workers-oauth-provider` : enregistrement dynamique des clients (`/oauth/register`), jeton (`/oauth/token`), métadonnées (`/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource/mcp`). PKCE `S256` obligatoire. Grants et jetons hachés dans un KV `OAUTH_KV`.
- Le consentement se fait sur l'écran `/admin/mcp/autoriser`, derrière le garde de l'espace admin : session, rôle plateforme, double authentification vérifiée depuis moins de 12 heures. La permission `mcp:connect` (super admin et admin, pas commercial) est vérifiée dans le use case.
- Redirections acceptées seulement vers `https://claude.ai`, `https://claude.com` (et leurs sous-domaines) ou une adresse locale, à l'enregistrement comme au consentement.
- Deux niveaux : `passalio:read` (vue d'ensemble, comptes clients, journal, prospection) et `passalio:write` (en plus : créer et modifier des entreprises prospectées et des contacts, changer d'étape, ajouter une note). Aucune suppression, aucune écriture dans les données des entreprises clientes.
- À chaque appel, l'API relit la personne : rôle retiré, compte bloqué ou permission perdue → 403, même avec un jeton valide. Les outils passent par les use cases existants, qui vérifient leurs permissions.
- Jeton d'accès 1 heure, accès complet 7 jours (jeton de renouvellement), puis nouveau consentement.
- 60 appels par minute et par personne (table `rate_limits`), 429 au-delà.
- Journal : `mcp.authorized` à chaque consentement, `mcp.<outil>` à chaque écriture, `mcp.revoked` à chaque retrait. Les logs gardent le nom de l'outil, la durée et l'erreur, jamais les arguments.
- Retrait : `pnpm mcp:revoke --env <local|staging|production> --email <email>` supprime grants et jetons de la personne. Retirer le rôle plateforme suffit aussi à bloquer les appels.
- Interrupteur `MCP_ENABLED` par environnement (activé partout depuis le 2026-10-23, KV `passalio-oauth-staging` et `passalio-oauth-production`) : sans lui, toutes les routes MCP répondent 404.

## Conséquences

Le jeton Cloudflare de déploiement a besoin du droit « Workers KV Storage : Modifier ». L'import en lot de fiches par Claude fera l'objet d'un outil à part, avec simulation préalable. Le drapeau de compatibilité `global_fetch_strictly_public` est activé pour lire les documents de métadonnées des clients OAuth.
