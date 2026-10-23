# 0018 — Équipe Passalio : invitations et rôles depuis l'espace admin

- Date : 2026-10-23
- Statut : accepté

## Contexte

L'ADR 0015 ne donnait un rôle plateforme qu'avec la commande `pnpm platform:grant`, lancée par un développeur qui a accès à Cloudflare. Quentin veut inviter lui-même d'autres membres de l'équipe (admin, commercial) depuis l'espace admin, sans passer par un développeur. Il veut trois rôles, pas plus pour l'instant.

## Décision

- Trois rôles plateforme : `superadmin` (tout, y compris l'équipe), `admin` (tout sauf l'équipe, il remplace `support`) et `sales` (Commercial seulement, ADR 0017). La migration `0011_platform_team` passe les comptes `support` en `admin`.
- Nouvelle permission `team:manage`, donnée seulement à `superadmin`. La page « Équipe Passalio » (`/admin/equipe`) et les routes `/api/admin/team/*` la vérifient dans chaque use case.
- Invitation par e-mail (Resend), valable 7 jours, dans la table `platform_invitations`. Une nouvelle invitation à la même adresse remplace celle en attente. La personne ouvre `/equipe-passalio/invitations/:id`, crée son compte ou se connecte avec la même adresse, puis rejoint l'équipe (`POST /api/team-invitations/:id/accept`). Elle active ensuite la double authentification, toujours obligatoire pour entrer.
- Un super admin ne peut pas changer son propre rôle ni se retirer : il reste donc toujours au moins un super admin.
- Changer un rôle ou retirer quelqu'un ferme toutes ses sessions. Retirer remet le compte au rôle `user` sans le supprimer.
- Chaque invitation, renvoi, annulation, acceptation, changement de rôle et retrait est écrit dans `audit_logs` et visible dans le journal de l'espace admin.
- La commande `pnpm platform:grant` reste pour les urgences (premier super admin d'un environnement, perte d'accès).
- Les écritures pendant une impersonation restent refusées par le middleware global.

## Conséquences

Un compte super admin compromis peut maintenant nommer d'autres admins : la double authentification obligatoire et le journal sont les garde-fous. Antho peut être invité comme Commercial sans accès à Cloudflare. Les routes `/api/auth/admin/*` de Better Auth restent fermées (ADR 0011).
