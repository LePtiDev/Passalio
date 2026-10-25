# 0028 — Boîte mail des commerciaux et rappels par e-mail

- Date : 2026-10-24
- Statut : accepté

## Contexte

La maquette v2 de la prospection, validée par Quentin le 2026-10-24, a un écran « Configuration » : chaque membre de l'équipe Passalio branche sa boîte mail professionnelle (par exemple antho@passalio.fr), choisit comment être prévenu de ses rappels et écrit sa signature. Les mails de prospection partent de cette boîte, un par un, comme envoyés à la main. Les routeurs d'e-mails (Resend, Brevo, SES) refusent la prospection à froid. Les rappels programmés après un appel (ADR 0024) doivent arriver par e-mail.

## Décision

- Table `platform_mail_settings`, une ligne par membre (clé `user_id`) : nom affiché, adresse d'envoi, adresse de réponse, fournisseur, serveur SMTP, port (la sécurité s'en déduit : TLS direct sur 465, STARTTLS sur 587, jamais stockée à part), identifiant, mot de passe d'application chiffré, date du dernier test réussi, signature, notification par défaut des rappels (`NOTIFY_MODES`), adresse des rappels, auteur et date du dernier changement.
- Fournisseurs proposés, qui remplissent serveur et port : Zoho Mail (`smtp.zoho.eu`, 465), OVH Email Pro (`pro1.mail.ovh.net`, 587), OVH MX Plan (`ssl0.ovh.net`, 465), Google Workspace (`smtp.gmail.com`, 465), Autre.
- Le mot de passe d'application est chiffré en AES-GCM 256 (WebCrypto) avec la clé `MAIL_SECRET_KEY`, un secret Wrangler par environnement. Un vecteur aléatoire par chiffrement, stocké avec le texte chiffré. Le mot de passe n'est jamais renvoyé par l'API, jamais journalisé ; on peut seulement le remplacer.
- Envoi SMTP depuis le Worker avec la librairie `worker-mailer` (MIT, sans dépendance, sockets TCP de Cloudflare), version figée. Le port 25 étant bloqué par Cloudflare, seuls 465 et 587 sont acceptés.
- Routes sous `/api/admin/mail-settings/:userId` : `GET`, `PUT` (le mot de passe est facultatif : absent, l'ancien est gardé), `POST /test` (envoie un mail de test au membre depuis sa boîte). Sa propre configuration demande `prospects:write` ; celle d'un autre membre demande `team:manage`. Quand un autre membre change la configuration, le changement est inscrit au journal (`mail_settings.updated`, sans valeurs sensibles) et le membre reçoit un e-mail qui le résume.
- Rappels par e-mail : un cron Cloudflare toutes les 5 minutes cherche les tâches ouvertes dont `notify_at` est passé et `notified_at` vide, envoie le rappel par Resend (adresse transactionnelle de Passalio, pas la boîte du commercial) à l'adresse des rappels du responsable de la tâche, ou à son adresse de connexion, puis remplit `notified_at`. Chaque exécution porte un `trace_id`. Index partiel sur `notify_at` des tâches ouvertes non notifiées.

## Conséquences

L'écran Configuration et l'envoi des campagnes (limite par jour, plage horaire) s'appuient sur cette table ; les réglages de campagne arrivent avec les campagnes. Le secret `MAIL_SECRET_KEY` doit être créé en staging et en production avant le déploiement ; le perdre oblige chaque membre à ressaisir son mot de passe. Le récapitulatif quotidien et la vérification nocturne du domaine (SPF, DKIM, DMARC) sont des tâches à part.
