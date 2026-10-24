# 0029 — Fermer les inscriptions depuis l'espace admin

- Date : 2026-10-24
- Statut : accepté

## Contexte

Quentin veut pouvoir fermer les inscriptions en production depuis l'espace admin, le temps que l'abonnement soit prêt, sans s'empêcher de se connecter ni bloquer les comptes existants. La maquette (Plateforme › Réglages, écran « Les inscriptions sont fermées pour le moment ») a été validée le 2026-10-24.

## Décision

- Un réglage par environnement, en base : table `platform_settings` à une seule ligne (`id = 'platform'`), colonne `is_sign_up_open`, date et auteur du dernier changement. Sans ligne, les inscriptions sont ouvertes. Staging et production ont chacun leur base, donc leur réglage.
- Nouveau contexte `platform-settings`. Permission plateforme `settings:manage`, réservée au super admin. Routes `GET` et `PUT /api/admin/settings/sign-up`. Chaque changement réel est écrit dans le journal (`platform.sign_up_closed`, `platform.sign_up_opened`) ; renvoyer la même valeur ne change rien.
- Le refus est côté serveur, à deux endroits : création d'un compte (hook Better Auth `user.create.before`, erreur `SIGN_UP_CLOSED`) et création d'une entreprise (`sign_up_closed`, 403). La connexion, le mot de passe oublié et le lien de connexion ne changent pas.
- Une personne qui a une invitation en attente et non expirée (entreprise ou équipe Passalio) peut toujours créer son compte, même fermé. L'adresse est comparée sans espaces ni majuscules.
- La page `/inscription` lit `GET /api/sign-up-availability` (public, sans donnée personnelle) et montre l'écran « fermées ». Une personne qui arrive d'un lien d'invitation voit directement le formulaire. Si la lecture échoue, le formulaire s'affiche : le serveur refuse de toute façon.

## Conséquences

- Fermer les inscriptions ne demande ni déploiement ni variable d'environnement.
- Un paiement ou un export reste possible pour les comptes existants : seuls la création de compte sans invitation et la création d'entreprise sont refusées.
- Le compte superadmin de Quentin existe déjà : il se connecte normalement, fermé ou non.
