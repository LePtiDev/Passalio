# 0026 — Prestations et plusieurs techniciens par passage

- Date : 2026-10-24
- Statut : accepté

## Contexte

Les types de passage (un par métier, avec une durée par entreprise) ne suffisent plus. Quentin veut plusieurs prestations sur un passage (installation de chaudière et ramonage), avec un prix présélectionné, et un passage fait par un ou plusieurs techniciens. Les chantiers sur plusieurs jours viennent ensuite et s'appuient sur ce modèle.

## Décision

- Chaque entreprise tient sa liste de prestations (table `services`) : nom, durée (15 min à 8 h par pas de 15 min, ou 1 à 10 jours), prix TTC en centimes ou « sur devis » (vide), document remis (certificat de ramonage, attestation d'entretien, aucun), métier d'origine facultatif. Une prestation n'est jamais supprimée, seulement retirée (`archived_at`). Un passage pris hors ligne avec une prestation retirée entre-temps reste accepté : il en garde la copie.
- Un passage garde une copie des prestations choisies (`interventions.service_lines` : id, nom, durée, prix au moment du rendez-vous). Modifier ou retirer une prestation ne change pas les passages déjà pris.
- Un passage a une liste de techniciens (`interventions.technician_user_ids`, JSON). `technician_user_id` reste le technicien principal, le premier de la liste. Un technicien gère un passage dès qu'il est dans la liste.
- Le planning lit déjà tous les passages de l'entreprise dans Dexie et filtre sur le téléphone : pas de table de liaison ni d'index par technicien côté serveur tant qu'aucune requête serveur ne filtre par technicien.
- `organizations.visit_durations` et les routes `/api/visit-types` disparaissent. `interventions.visit_types` reste : il porte les métiers des prestations choisies, utiles pour savoir quel certificat remplir.
- Une entreprise sans prestation peut ajouter en un clic une prestation par métier (nom du métier, durée habituelle, sans prix).

## Conséquences

- Le prix annoncé se remplit tout seul et reste modifiable sur le passage.
- Un passage à deux apparaît dans l'agenda de chaque technicien.
- Une prestation de plusieurs jours compte pour une journée (8 h) sur un passage simple. Les chantiers (plusieurs jours, techniciens différents par jour) feront l'objet d'un ADR à part.
- Si un écran serveur doit un jour lister les passages d'un technicien, il faudra une table de liaison indexée.
