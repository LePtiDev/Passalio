# 0012 — Connexion par email et mot de passe, lien magique en option

- Date : 2026-10-22
- Statut : accepté (remplace la partie « lien magique » de 0006)

## Contexte

Quentin préfère une connexion par email et mot de passe, plus familière pour les artisans et leurs clients. Le lien magique seul oblige à ouvrir sa boîte mail à chaque connexion, ce qui est pénible sur le terrain.

## Décision

- Better Auth avec `emailAndPassword` : création de compte (prénom, nom, email, mot de passe), connexion, mot de passe oublié.
- Mot de passe de 12 caractères minimum, 128 au maximum, haché par Better Auth (scrypt). Aucune règle de composition imposée, une jauge de solidité guide la saisie.
- Mot de passe oublié : lien de réinitialisation valable 1 heure, à usage unique. La réponse est la même que l'adresse existe ou non. Toutes les sessions sont révoquées après le changement.
- Le lien magique reste disponible en option secondaire (« Recevoir un lien de connexion »). Il connecte un compte existant mais n'en crée pas : le compte se crée par l'inscription, avec le prénom et le nom.
- L'adresse n'est pas vérifiée avant la première connexion en V1. Une invitation et le lien magique prouvent déjà l'accès à la boîte.
- Rate limiting de Better Auth sur la connexion, l'inscription et le mot de passe oublié.

## Conséquences

- Nouvelles routes Better Auth ouvertes dans `auth-routes.ts` : inscription, connexion par mot de passe, demande et réinitialisation du mot de passe.
- Le nom de la personne est saisi à l'inscription : la liste de l'équipe affiche des noms et plus seulement des emails.
- Les mots de passe sont un nouveau risque (réutilisation, fuite). Turnstile protège l'inscription, la connexion et le mot de passe oublié (voir `docs/SECURITY.md`). À ajouter plus tard : vérification contre les mots de passe divulgués.
