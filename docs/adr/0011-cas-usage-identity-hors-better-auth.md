# 0011 — Les membres et invitations passent par nos cas d'usage, pas par les routes Better Auth

- Date : 2026-10-21
- Statut : accepté

## Contexte

Le plugin organization de Better Auth expose ses propres routes (créer une entreprise, inviter, changer un rôle). Elles ne connaissent pas nos rôles, ne passent pas par `assertCan`, n'écrivent pas dans `audit_logs` et permettraient plusieurs propriétaires.

## Décision

Better Auth garde la connexion par lien magique, les sessions, l'entreprise active et l'impersonation. Seules les routes listées dans `apps/api/src/platform/auth-routes.ts` sont ouvertes, les autres répondent 404. La création d'entreprise, les invitations, les rôles, le retrait d'un membre et le transfert de propriété sont des cas d'usage du contexte `identity`, qui écrivent dans les tables du plugin via nos repositories.

## Conséquences

Une seule source pour les permissions et l'audit. Un seul propriétaire par entreprise, transférable à un administrateur. En contrepartie, une nouvelle route Better Auth utile doit être ajoutée explicitement à la liste, et le format des tables doit rester compatible avec le plugin lors des mises à jour de Better Auth.
