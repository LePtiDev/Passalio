# 0027 — PDF du certificat de ramonage

- Date : 2026-10-24
- Statut : accepté

## Contexte

Le certificat signé doit être remis au client en PDF, sur le téléphone, même hors ligne (ADR 0021). Quentin a validé la maquette (deux modèles, « Bandeau » et « Sobre », cinq couleurs, page de conseils de l'annexe 2 de l'arrêté du 20 juillet 2023). Un certificat signé ne se modifie jamais : son PDF doit pouvoir être refait à l'identique et vérifié.

## Décision

- Le paquet `@passalio/pdf` produit le PDF avec pdf-lib, sans navigateur ni serveur : `renderCertificate(données, polices)` tourne sur le téléphone comme dans un Worker.
- L'entrée est validée par zod (`certificatePdfInput`) puis par les règles du certificat de `@passalio/trades`. Une entrée fausse renvoie une erreur `Result`, jamais un PDF incomplet. Les appareils gaz étanches sont refusés (attestation d'entretien, hors de ce document).
- Le rendu est déterministe : polices Plus Jakarta Sans embarquées en sous-ensemble avec un nom fixe, dates du document égales à l'heure de signature, aucune donnée aléatoire. Les mêmes données donnent les mêmes octets, donc la même empreinte SHA-256 (`pdfFingerprint`).
- La mise en forme vient des réglages de l'entreprise (modèle, couleur, logo, coordonnées, message, pied de page). Ces réglages et les informations légales de l'entreprise seront copiés dans les données signées (schéma version 2) : changer un réglage plus tard ne change pas un certificat déjà signé.
- Les mentions obligatoires et les conseils sont fixes, dans `fr.ts` et `advice-fr.ts`. Seuls le message de l'entreprise et le pied de page sont libres.
- La page de conseils n'est jointe que pour les appareils à combustible solide autres que les chaudières (article R1331-77).
- Les pages rendues sont comparées à des captures de référence (`packages/pdf/reference-pages/`), régénérées avec `pnpm --filter @passalio/pdf references:update` quand la maquette change avec l'accord de Quentin.

## Conséquences

- Le PDF peut être refait à tout moment depuis les données signées ; seule l'empreinte est à garder avec le fichier sur R2.
- Une police ou une version de pdf-lib changée modifie les octets : l'empreinte d'un ancien certificat se vérifie alors avec la version qui l'a produit, ou sur le fichier gardé.
- La carte « règles locales » (plan de protection de l'atmosphère) et les textes de conseils modifiables ne sont pas en V1.
