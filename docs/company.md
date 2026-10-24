# Société éditrice de Passalio

Décision : une SAS à deux associés (voir `docs/adr/0014-sas-a-deux-associes.md`). Chiffres vérifiés le 2026-10-22. Ce document n'est pas un conseil d'expert-comptable ou d'avocat.

Analyse complète : document « Passalio : quel statut juridique ? » (https://claude.ai/artifact/G1TeZnGGP2S9wGAw3hkLPT).

## Associés

| Associé | Rôle dans Passalio      | Situation          | Actions | Mandat            | Rémunération la 1re année |
| ------- | ----------------------- | ------------------ | ------- | ----------------- | ------------------------- |
| Quentin | Produit, développement  | Salarié, freelance | 50 %    | Président         | Aucune                    |
| Antho   | Commercial, prospection | Salarié (vendeur)  | 50 %    | Directeur général | Aucune                    |

## Options comparées

| Critère                          | Deux micros qui se refacturent      | SAS à deux                                        | SARL à deux                       |
| -------------------------------- | ----------------------------------- | ------------------------------------------------- | --------------------------------- |
| Propriétaire du code et marque   | Quentin seul                        | La société                                        | La société                        |
| Plafond                          | 83 600 €, partagé avec le freelance | Aucun                                             | Aucun                             |
| Impôt                            | Sur le chiffre d'affaires           | IS : 15 % jusqu'à 42 500 € de bénéfice, puis 25 % | Pareil                            |
| Cotisations sans salaire         | 21 à 26 % du chiffre d'affaires     | Aucune                                            | Aucune                            |
| Cotisations sur un salaire       | Sans objet                          | Environ 75 à 80 % du net                          | Gérant majoritaire : environ 45 % |
| Souplesse, entrée d'investisseur | Aucune                              | Très grande                                       | Faible                            |

## TVA

- Franchise de TVA tant que le chiffre d'affaires reste sous 37 500 € par an (41 250 € en seuil majoré) pour des services. La baisse à 25 000 € prévue en 2025 a été abandonnée.
- Factures en franchise : mention « TVA non applicable, art. 293 B du CGI ».
- Prix affichés hors taxes dès le départ (Solo 29 € HT par mois, Équipe 49 € HT par mois, ADR 0025), pour ne pas changer le prix le jour où la TVA s'applique. Environ 105 abonnements mensuels atteignent le seuil.
- Option à voir avec le comptable : facturer la TVA dès la création pour récupérer celle des dépenses.

## Comptabilité

- Une SAS n'est pas obligée d'avoir un expert-comptable, mais doit établir des comptes annuels et une liasse fiscale.
- Logiciel seul (par exemple Indy, Tiime) : quelques centaines d'euros par an, erreurs à notre charge.
- Expert-comptable en ligne relié à Stripe et à la banque (par exemple Pennylane avec un cabinet, Dougs, L-Expert-comptable.com) : environ 60 à 120 € HT par mois. Ordres de grandeur, devis à demander.
- La connexion à Stripe sépare le chiffre d'affaires brut des frais Stripe, sans rapprochement à la main.
- Facture électronique : à partir de septembre 2027, les factures aux clients professionnels devront passer par une plateforme agréée. L'outil choisi doit l'être ou y être relié.

## Aides

- ACRE : réservée depuis 2026 à certains publics (demandeurs d'emploi, RSA, jeunes, quartiers prioritaires), exonération réduite. Ne nous concerne pas : salariés et pas de rémunération.
- JEI : demande une part importante de dépenses de recherche. A priori non éligible.
- Prêts d'honneur (Initiative France, Réseau Entreprendre) : possibles pour financer l'acquisition de l'été 2027.

## Étapes de création

1. Relire les deux contrats de travail : exclusivité, non-concurrence, propriété intellectuelle. Un logiciel créé dans le cadre de ses fonctions appartient à l'employeur (article L113-9 du Code de la propriété intellectuelle).
2. Rédiger les statuts et le pacte d'associés (avocat conseillé pour le pacte).
3. Ouvrir un compte bancaire professionnel et déposer le capital.
4. Publier l'annonce légale (environ 150 à 200 €) et immatriculer la SAS sur le guichet unique (environ 40 € de greffe).
5. Céder le code à la SAS par un acte de cession de droits d'auteur.
6. Déposer la marque Passalio à l'INPI au nom de la SAS, classes 9 et 42 (environ 190 € pour une classe, 40 € par classe en plus, à vérifier).
7. Transférer à la SAS les domaines, Cloudflare, Stripe et Resend.
8. Choisir l'outil de comptabilité et le relier à la banque et à Stripe.
9. Renseigner l'éditeur (raison sociale, SIREN, adresse, TVA, prix HT) dans les conditions et la politique de confidentialité.

## Sources

- Plafonds du régime micro 2026 : https://entreprendre.service-public.gouv.fr/vosdroits/F32353
- Taux de cotisations micro 2026 : https://www.economie.gouv.fr/entreprises/micro-entreprise-auto-entreprise-charges-sociales
- Seuils de franchise de TVA maintenus : https://www.legifiscal.fr/actualites-fiscales/4289-adoption-definitive-texte-seuils-franchise-base-tva.html
- Réforme de l'ACRE 2026 : https://www.entreprises.cci-paris-idf.fr/actualites/acre-durcissement-du-dispositif-au-1er-janvier-2026
- Taux d'IS 2026 : https://hayot-expertise.fr/blog/is-2026-taux-normal-taux-reduit-15-seuils
