# 0035 — Archive du PDF du certificat sur R2

- Date : 2026-10-25
- Statut : accepté

## Contexte

Le certificat est signé sur le téléphone, souvent sans réseau (ADR 0032). Le PDF montré au client est refait sur le téléphone à partir des données signées. Il faut garder une copie du PDF hors du téléphone, prouver qu'elle n'a pas changé, et l'avoir sous la main pour l'envoi par e-mail. Le rendu est déterministe (ADR 0027) : les mêmes données donnent le même fichier, à l'octet près.

## Décision

- Le serveur fabrique lui-même le PDF à partir des données signées, avec le même paquet `@passalio/pdf` et les mêmes polices que le téléphone. Le téléphone n'envoie pas son PDF : il n'y a aucun fichier à faire passer sur un réseau faible.
- Une tâche planifiée (cron toutes les 5 minutes) archive les certificats signés pas encore archivés, 5 au plus par passage, l'un après l'autre pour borner le temps de calcul. Le PDF est rangé sur R2 sous `organizations/<organization_id>/documents/<document_id>.pdf`, avec son empreinte SHA-256 vérifiée par R2 à l'écriture.
- La table `documents` garde `pdf_key`, `pdf_sha256`, `pdf_archived_at` et `pdf_archive_attempts`. Un index partiel `(pdf_archive_attempts, signed_at)` limité aux certificats pas encore archivés sert la tâche. Après 3 échecs, un certificat n'est plus repris : l'erreur est dans les logs (`certificate_pdfs_archived`, sans donnée personnelle).
- L'archivage met à jour `updated_at` : l'empreinte part vers les téléphones par la synchronisation. La page du certificat calcule l'empreinte du PDF qu'elle affiche et la compare à celle de l'archive : « intégrité vérifiée » si elles sont égales, une alerte sinon.
- Un certificat de version 1, sans réglages figés, n'est pas archivé.

## Conséquences

- Rendre un certificat demande environ 0,4 s de calcul. Cela suppose le forfait payant de Cloudflare Workers (30 s de calcul par exécution). Avec le forfait gratuit, l'archivage échoue sans bloquer la signature ni l'affichage sur le téléphone.
- Le Worker embarque les quatre polices (250 Ko) et pdf-lib : le paquet compressé passe d'environ 1,1 Mo à 1,8 Mo.
- L'envoi par e-mail (PR suivante) joindra le fichier archivé, identique à celui montré au client.
- Une différence d'empreinte signale un rendu qui n'est plus déterministe entre le téléphone et le serveur : c'est un bug à corriger, le certificat signé reste valable.
