# 0005 — Une base D1 partagée, isolée par organization_id

- Date : 2026-10-21
- Statut : accepté

## Contexte
Des milliers de petites entreprises avec peu de données chacune.

## Décision
Une seule base D1. Chaque table métier porte `organization_id`, imposé par les repositories et vérifié par des tests d'isolation.

## Conséquences
Simple à opérer et peu coûteux. Une erreur d'isolation serait grave, d'où les tests obligatoires. Découpage en plusieurs bases à étudier si la taille approche les limites de D1.
