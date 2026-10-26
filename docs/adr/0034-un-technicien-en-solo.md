# 0034 — Un technicien en Solo, passage à Équipe au prorata

- Date : 2026-10-26
- Statut : accepté

## Contexte

L'ADR 0025 fixe la formule Solo à un technicien, bureau et secrétariat illimités, et Équipe à des techniciens illimités. Les maquettes validées le 2026-10-24 (planche « Passer à la formule Équipe ? ») montrent ce qui se passe quand un patron en Solo invite un deuxième technicien. Quentin a validé le plan le 2026-10-26 : refus côté serveur, passage immédiat à Équipe au prorata, retour vers Solo refusé tant qu'il reste plusieurs techniciens.

## Décision

- Un poste de technicien est pris par chaque membre dont le rôle signe les certificats (`TECHNICIAN_ROLES` : propriétaire, administrateur, technicien) et par chaque invitation en attente à l'un de ces rôles. Le secrétariat ne prend pas de poste.
- La limite ne s'applique qu'à un abonnement Solo payé et non terminé. Pendant l'essai, sans abonnement ou en Équipe, rien n'est limité.
- Inviter un technicien ou un administrateur, ou changer un rôle vers l'un d'eux, est refusé en 409 `team_plan_required` quand le poste de Solo est pris. Le contrôle est dans les cas d'usage d'`identity`. La règle vit dans `billing` et arrive dans `identity` par `platform/request-services.ts` (variable `technicianSeats`) : `identity` n'importe pas `billing`, qui l'importe déjà.
- `POST /api/billing/team-upgrade/preview` (`billing:manage`) demande à Stripe la facture du jour pour le prix Équipe de la même période (`invoices/create_preview`, `always_invoice`) et renvoie le montant, la fin de période et la date de calcul.
- `POST /api/billing/team-upgrade` (`billing:manage`) change le prix de l'abonnement à cette date de calcul (`always_invoice`, `error_if_incomplete`) : le montant payé est celui affiché. Une date de calcul de plus de 30 minutes, ou dans le futur, est refusée (`preview_expired`). Une carte refusée garde Solo (402 `payment_failed`). Équipe est enregistré tout de suite, sans attendre le webhook, pour que l'invitation suive. Le passage va dans le journal (`billing.plan_upgraded`).
- Écran : quand l'invitation est refusée avec `team_plan_required`, le patron voit la fenêtre de la maquette. « Passer à Équipe et inviter » paie puis envoie l'invitation ; « Annuler » revient à l'invitation, adresse gardée, pour choisir le secrétariat. Un administrateur, qui ne gère pas l'abonnement, reçoit un message. La fenêtre est dans `billing` et passe à l'écran Équipe par la route `/equipe`, pour la même raison qu'à l'API.
- Retour vers Solo : sur `customer.subscription.updated`, si l'abonnement passe d'Équipe à Solo alors qu'il reste plus d'un poste pris, le serveur remet chez Stripe le prix précédent (le prix fondateurs pour un fondateur), avec un prorata sur la prochaine facture (`create_prorations`), garde Équipe et l'écrit au journal (`billing.downgrade_reverted`).

## Conséquences

- Le portail Stripe propose toujours Solo : le choix est annulé après coup. Le prorata symétrique compense l'avoir éventuel. Une descente programmée par le portail à la fin de la période est annulée au moment où elle s'applique.
- Le texte de la fenêtre nomme l'adresse e-mail invitée, la seule connue à ce moment, là où la maquette montre un nom.
- Un nouvel abonnement Solo pris par Checkout après une résiliation, avec déjà plusieurs techniciens, n'est pas remis en Équipe. Les techniciens restent, seules les nouvelles invitations sont refusées.
