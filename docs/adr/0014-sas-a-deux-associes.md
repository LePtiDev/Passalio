# 0014 — Une SAS à deux associés pour porter Passalio

- Date : 2026-10-23
- Statut : accepté (société à créer)

## Contexte

Quentin (produit, développement) et Antho (commercial) lancent Passalio ensemble. Tous les deux sont salariés ailleurs. Quentin a déjà une micro-entreprise de freelance. Les conditions d'utilisation attendent un éditeur (raison sociale, SIREN, TVA). L'idée de départ était deux micro-entreprises qui se refacturent.

## Décision

- Créer une SAS : Quentin et Antho associés à 50/50, Quentin président, Antho directeur général.
- Pas de rémunération des dirigeants la première année : aucune cotisation sociale, tous deux restent couverts par leur emploi salarié.
- Un pacte d'associés dès la création : règle de départage (indispensable à 50/50), acquisition des actions dans le temps, clauses de bon et de mauvais partant, non-concurrence, préemption.
- Le code écrit par Quentin et la marque Passalio appartiennent à la SAS : cession de droits d'auteur (ou apport en nature), dépôt INPI au nom de la SAS, comptes Stripe, Cloudflare, Resend et domaines transférés à la SAS.
- Prix affichés hors taxes dès le départ. La SAS reste en franchise de TVA tant que son chiffre d'affaires reste sous le seuil (37 500 € pour des services en 2026).
- Comptabilité avec un outil en ligne relié à Stripe et à la banque, et compatible avec la facture électronique.

Le détail, les chiffres et les étapes sont dans `docs/company.md`.

## Conséquences

- Écartées : deux micro-entreprises (pas de société commune propriétaire du code, plafond partagé avec le freelance de Quentin, risque de requalification, cotisations payées deux fois), SARL (moins souple, utile seulement pour se verser un salaire tôt), holding (inutile tant que les dividendes restent faibles).
- Coût : environ 250 à 400 € de création, plus la comptabilité (environ 700 à 1 400 € par an en ligne) et éventuellement un avocat pour le pacte.
- Les conditions d'utilisation et la politique de confidentialité ne peuvent nommer l'éditeur qu'une fois la SAS immatriculée.
- Ce choix n'a pas été validé par un expert-comptable ou un avocat.
