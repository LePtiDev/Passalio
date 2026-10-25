# 0031 — Signature du certificat sur le téléphone, hors ligne

- Date : 2026-10-25
- Statut : accepté

## Contexte

Le technicien signe le certificat chez le client, souvent sans réseau (ADR 0021). Le PDF doit sortir sur le téléphone, avec la mise en forme de l'entreprise (ADR 0027), et ne jamais changer ensuite, même si les réglages changent. Le numéro du certificat doit être unique et sans trou visible, alors que plusieurs téléphones signent en même temps.

## Décision

- Le certificat signé passe en version 2 (`brandedChimneySweepingCertificate`, `packages/trades`) : les données de la version 1 plus un bloc `branding` figé (modèle, couleur, logo, coordonnées, message, pied de page). L'identité légale (`company`) y était déjà. Le serveur accepte les versions 1 et 2 et applique les mêmes règles ; le PDF se refait à partir de ces seules données (`signedCertificatePdfInput`).
- Le logo gardé dans le certificat tient en 1 Mo encodé (PNG de 600 px de côté au plus, sinon JPEG sur fond blanc), pour que la ligne du certificat reste sous la limite de D1.
- Le téléphone garde une copie des réglages (`localSettings`, clé `issuer`) et ses blocs de numéros (`numberBlocks`) dans Dexie (version 5). La copie se met à jour à chaque ouverture en ligne ; un bloc de 20 numéros est réservé dès qu'il en reste moins de 5, à l'ouverture ou au retour du réseau. Seules les personnes qui ont `documents:sign` préparent leur téléphone.
- Le téléphone a un identifiant fixe par entreprise (`localSettings`, clé `device`), envoyé avec chaque réservation et chaque signature.
- La signature locale (`signCertificate`) se fait dans une seule transaction Dexie : copie des réglages, règles du certificat, premier numéro libre de la personne, certificat, dates de ramonage de l'appareil et modification `sign_document` dans la file d'envoi. Elle refuse sans copie des réglages, avec des mentions légales manquantes ou sans numéro libre.

## Conséquences

- Changer la couleur, le logo ou l'adresse ne modifie jamais un certificat déjà signé.
- Un téléphone resté hors ligne depuis son installation ne peut pas signer : il lui faut une première ouverture en ligne.
- Un téléphone signe avec les réglages de sa dernière ouverture en ligne ; c'est cette copie, montrée au client, qui fait foi.
