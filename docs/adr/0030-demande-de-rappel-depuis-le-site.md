# 0030 — Demande de rappel depuis le site

- Date : 2026-10-24
- Statut : accepté

## Contexte

Le site passalio.com propose « Être rappelé pour une démo ». La demande doit arriver dans l'outil de prospection (ADR 0024), là où Antho et Quentin travaillent, sans compte et sans session. Le site est statique (Astro) et vit sur un autre domaine que l'API.

## Décision

- Route anonyme `POST /api/public/callback-requests`, montée hors de `/api` pour ne pas passer par les sessions et la garde d'impersonation. Pas d'`assertCan` : personne n'est connecté. C'est la seule exception, et la matrice des routes la déclare à part (`access: "website"`).
- Corps validé par `publicCallbackRequest` (`@passalio/shared`) : prénom, entreprise (facultative), téléphone français à 10 chiffres, code postal, créneau (matin, midi, après-midi, soir), message (facultatif, 1 000 caractères), page d'origine, jeton Turnstile.
- Protections, dans cet ordre : limite de 5 demandes par heure et par adresse IP (table `rate_limits`, clé `website-callback:` suivie du SHA-256 de l'adresse, jamais l'adresse en clair), puis Turnstile vérifié auprès de Cloudflare (403 si refusé). 429 au-delà de la limite.
- CORS : seule l'origine `SITE_URL` du Worker (passalio.com, staging.passalio.com, localhost:4321) peut lire la réponse ; l'en-tête `x-trace-id` est exposé pour afficher le code d'erreur court.
- L'entreprise est retrouvée par son téléphone, ou par le fixe ou le mobile d'un de ses contacts (index sur ces trois colonnes). Sinon elle est créée avec le nom donné (ou le prénom), le téléphone et le département déduit du code postal (Corse 2A/2B, outre-mer sur 3 chiffres).
- Un rappel (`prospect_tasks`, `kind = callback`, `source = website`) est créé pour le lendemain au début du créneau, heure de Paris, notifié à l'heure, et confié au propriétaire de l'entreprise s'il y en a un. Sans propriétaire, il apparaît dans « Ma journée » de toute l'équipe commerciale jusqu'à ce que quelqu'un le prenne.
- Tout ce que la personne a écrit va dans une note (`prospect_events`), sans auteur. Les logs ne gardent que l'identifiant du rappel ou la raison du refus.

## Conséquences

Le formulaire du site demande un code postal obligatoire. Le comptage des visites par page est reporté à une PR suivante. Les domaines du site doivent être ajoutés au widget Turnstile avant la mise en ligne.
