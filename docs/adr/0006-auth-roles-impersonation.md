# 0006 — Authentification, rôles et impersonation avec Better Auth

- Date : 2026-10-21
- Statut : accepté

## Contexte
Besoin de connexion sans mot de passe, d'entreprises avec plusieurs membres, de rôles, et d'un mode support pour voir ce que voit l'utilisateur.

## Décision
Better Auth avec lien magique, plugin organization (rôles propriétaire, administrateur, secrétariat, technicien) et plugin admin (rôles plateforme `superadmin`, `support`, impersonation). Permissions sous forme de chaînes vérifiées dans les use cases. Impersonation en lecture seule imposée côté serveur, 30 minutes, motif obligatoire, journalisée.

## Conséquences
Pas de système d'auth maison. Dépendance à Better Auth et à son adaptateur D1.
