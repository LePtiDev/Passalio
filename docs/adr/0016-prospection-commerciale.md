# 0016 — Prospection commerciale dans l'espace admin

- Date : 2026-10-23
- Statut : accepté

## Contexte

Antho prospecte les ramoneurs (647 fiches repérées, Île-de-France d'abord). Il lui faut un carnet simple dans Passalio : entreprises, contacts, étape de qualification, historique des notes, carte. Ces données appartiennent à Passalio, pas à une entreprise cliente. Antho ne doit pas voir les comptes clients.

## Décision

- Nouveau contexte `sales`, routes sous `/api/admin/prospects`, protégées par `requirePlatformActor` (double authentification obligatoire, 404 pour qui n'est pas de l'équipe).
- Tables `prospect_companies`, `prospect_contacts`, `prospect_events`, sans `organization_id` : ce ne sont pas des données d'un client.
- Troisième rôle plateforme `sales` : permissions `prospects:read` et `prospects:write` seulement. `superadmin` et `support` les ont aussi. Il se donne avec `pnpm platform:grant --role sales`.
- Étapes : `to_qualify`, `qualified`, `interested`, `demo_planned`, `customer`, `not_interested`. Chaque changement d'étape et chaque note ajoutent une ligne à `prospect_events`, jamais modifiée.
- Recherche : `search_text` normalisé (nom, ville, code postal, SIREN), en `LIKE '%…%'`. Les tables restent petites (quelques milliers de lignes) ; les listes passent par les index (département, étape, nom).
- Import : `pnpm prospects:import --env <local|staging|production> --file <csv>`. Les coordonnées viennent du géocodeur de l'IGN (`data.geopf.fr`). L'identifiant d'une fiche est dérivé de son SIREN (ou nom + code postal) : relancer l'import met à jour les données du registre sans toucher à l'étape, au suivi ni aux notes. Les entreprises fermées et les liquidateurs ne sont pas importés. Le fichier reste hors du dépôt.
- RGPD : prospection B2B sur intérêt légitime, données publiques (registre, annuaires). Une demande d'opposition se traite en supprimant la fiche (`DELETE /companies/:id`, contacts et historique compris), tracée dans `audit_logs`.
- Carte : Leaflet et le fond de carte de l'IGN (Géoplateforme), sans clé ni compte.

## Conséquences

Antho travaille dans l'application, sans outil externe. Les écrans demandent le réseau, comme le reste de l'admin. La recherche par sous-chaîne lit toute la table : à revoir si elle dépasse quelques dizaines de milliers de lignes.
