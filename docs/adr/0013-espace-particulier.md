# 0013 — Un espace particulier unique, commun à tous les prestataires

- Date : 2026-10-22
- Statut : proposé (à construire après les clients, équipements et attestations)

## Contexte

Un particulier a souvent plusieurs prestataires : un ramoneur pour sa cheminée, un chauffagiste pour sa pompe à chaleur, un vidangeur pour sa fosse. Un portail par entreprise l'obligerait à avoir autant de comptes que de prestataires. Quentin veut un espace Passalio unique qui regroupe tout son logement.

## Décision

- Un « espace particulier » Passalio : un compte utilisateur sans entreprise, avec email et mot de passe (voir 0012).
- Chaque entreprise garde sa propre fiche client (`Customer`), dont elle reste responsable. Aucune entreprise ne voit les données d'une autre.
- Le lien entre un compte particulier et une fiche client se fait avec le consentement des deux côtés : l'entreprise envoie une invitation à l'adresse du client (par exemple avec l'attestation), le particulier l'accepte. Une table de liaison garde `(user_id, organization_id, customer_id)`, révocable par chacun.
- L'espace particulier lit, en lecture seule, les équipements, interventions et attestations des fiches liées, entreprise par entreprise. Une demande de rendez-vous est envoyée à l'entreprise concernée.
- Le particulier peut ajouter un équipement sans prestataire, pour être rappelé ou trouver un professionnel plus tard.

## Conséquences

- Nouveau type d'utilisateur : `users` sans ligne dans `members`. Les routes de l'espace particulier ont leurs propres permissions et ne passent jamais par l'entreprise active.
- Tests d'isolation à étendre : un particulier ne voit que les fiches liées à son compte, une entreprise ne voit jamais les liens d'une autre.
- RGPD : l'artisan reste responsable du traitement de sa fiche client. Passalio devient responsable du traitement du compte particulier lui-même : politique de confidentialité et CGU dédiées.
- Le glossaire gagne « Espace particulier » (`CustomerAccount`) et « Lien client » (`CustomerLink`).
