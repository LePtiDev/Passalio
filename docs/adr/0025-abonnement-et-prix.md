# 0025 — Abonnement Stripe et grille de prix

- Date : 2026-10-24
- Statut : accepté

## Contexte

Le prix prévu était unique : 29,99 € par mois ou 299,90 € par an, utilisateurs illimités. Une entreprise de cinq techniciens tire cinq fois plus de valeur de Passalio qu'un artisan seul, et payait le même prix. Pour cinq techniciens, Ramio coûte 115 € HT par mois et OpenFire 175 € HT (`docs/competitor-parity.md`). Quentin a choisi la grille ci-dessous le 2026-10-24 (document « Passalio : paiement et prix »).

## Décision

- Deux formules, prix hors taxes (ADR 0014) :
  - Solo : 29 € par mois ou 290 € par an, un technicien.
  - Équipe : 49 € par mois ou 490 € par an, techniciens illimités.
- Un technicien est un membre qui réalise les passages et signe les certificats. Les autres membres (bureau, secrétariat) sont illimités dans les deux formules. Aucune fonction n'est réservée à une formule.
- Inviter un deuxième technicien en formule Solo propose le passage à Équipe. Le changement est immédiat, au prorata (Stripe).
- Essai de 7 jours sans moyen de paiement (choix de Quentin du 2026-10-24). Aucun objet Stripe n'existe avant la souscription.
- À la fin de l'essai, que la configuration soit faite ou non, l'espace est bloqué sur un écran de choix de la formule. Seuls la souscription, l'export des données et la déconnexion restent possibles.
- Souscription sur Stripe Checkout, gestion (carte, formule, factures, résiliation) sur le portail client Stripe. Carte et prélèvement SEPA. Seul le patron gère l'abonnement.
- Stripe prévient le serveur par webhooks vérifiés par signature et traités une seule fois. Le contexte `billing` garde l'état de l'abonnement de chaque entreprise ; l'application lit cet état, pas Stripe.
- États d'un espace : essai, bloqué en fin d'essai, abonné, paiement en échec, lecture seule. Un paiement refusé laisse 15 jours avec l'application complète, relances par email (Resend) à J0, J3, J7 et J12, puis lecture seule. La résiliation, à la fin de la période payée, mène aussi à la lecture seule. Un paiement rouvre l'espace aussitôt.
- En lecture seule, le serveur refuse toute écriture, comme pendant une impersonation, dans chaque cas d'usage. Un certificat signé hors ligne avant la bascule est toujours accepté à la synchronisation.
- Les données restent exportables 90 jours sans abonnement, puis sont supprimées, sauf les factures (conditions, article 11).
- Les factures de l'abonnement sont émises par Stripe avec les mentions de l'éditeur et « TVA non applicable, art. 293 B du CGI » tant que la franchise s'applique.

## Conséquences

- Passalio reste le moins cher du marché à toutes les tailles d'entreprise, et gagne 20 € de plus par mois sur les équipes.
- Les conditions (article 7) et les textes de l'inscription et de l'accueil affichent la nouvelle grille.
- Les premiers abonnements sont encaissés par la micro-entreprise de Quentin (choix du 2026-10-24) : compte Stripe de production à son nom, factures à son SIRET, chiffre d'affaires dans le plafond de sa micro. La SAS (ADR 0014) reprendra l'activité plus tard. En attendant le compte, le développement se fait en mode test sur staging.
- Un essai de 7 jours est plus court que celui de Ramio et Ramonia (14 jours) : l'accueil et les emails doivent amener le ramoneur à faire un premier certificat dès le premier jour.
- Avant septembre 2027, les factures de l'abonnement devront passer par une plateforme agréée de facturation électronique, que Stripe n'est pas : l'outil de comptabilité choisi devra l'être.
- Les SMS restent une option payante (V2). L'offre fondateurs et le prix garanti des premiers clients restent à décider.
