---
name: new-trade
description: Ajouter un nouveau métier (ramonage, poêle, vidange ANC, PAC…) dans packages/trades.
---

1. Me demander le texte réglementaire et un exemple réel d'attestation remplie. Ne rien inventer sur le contenu réglementaire.
2. Créer `packages/trades/<metier>/` : définition (`defineTrade`), champs avec schémas zod, périodicité, types d'équipements, mise en page PDF.
3. Versionner chaque modèle de document (`version: 1`).
4. Enregistrer le métier dans `registry.ts`.
5. Tests : validation des champs obligatoires, calcul de l'échéance, rendu PDF sans erreur.
6. Générer un PDF d'exemple avec des données fictives pour relecture.
7. Ajouter la page métier du site vitrine (`apps/web`).
