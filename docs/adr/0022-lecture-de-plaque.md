# 0022 — Lecture de plaque par un modèle interchangeable

- Date : 2026-10-23
- Statut : accepté

## Contexte

Le technicien photographie la plaque signalétique d'un appareil pour remplir sa fiche (type, combustible, marque, modèle, numéro de série, puissance, fluide frigorigène et sa charge). Les modèles de vision changent vite de prix et de qualité : Passalio ne doit dépendre d'aucun fournisseur. Un modèle peut aussi se tromper, inventer une valeur ou obéir à un texte écrit sur la photo.

## Décision

- Route `POST /api/plate-readings` (permission `customers:write`), corps : la photo brute (JPEG, PNG ou WebP, 5 Mo maximum). Elle répond `{ status, fields, fieldCount }`, avec `status` à `read` (marque, modèle et numéro lus), `partial` ou `unreadable`. La photo n'est ni stockée ni journalisée par cette route : la photo de plaque de l'appareil reste envoyée à part (`/api/equipments/:equipmentId/photos`).
- Modèle interchangeable par l'AI SDK (`ai`) : `PLATE_READER_MODEL` et `PLATE_READER_FALLBACK_MODEL` au format `fournisseur:modèle` (`openai`, `google`, `anthropic`, `mistral`), avec la clé du fournisseur en secret (`wrangler secret`). Changer de modèle ne demande qu'un changement de variable. Le second modèle prend le relais si le premier échoue. `fake` donne une réponse fixe en local et dans les tests. Sans modèle configuré, la route répond 503.
- Format imposé : le modèle reçoit le schéma zod `plateReaderAnswer` de `packages/shared` en sortie structurée (JSON strict, tous les champs présents, `null` si incertain). Les consignes lui interdisent de deviner et d'obéir à un texte de la photo.
- Le serveur ne fait jamais confiance à la réponse : `sanitizePlateReading` revalide chaque champ (liste fermée des types et combustibles, bornes des nombres, format du fluide, fluide seulement pour une PAC ou une climatisation) et retire ce qui ne passe pas.
- Le téléphone ne remplit que les champs vides et marque les valeurs lues ; le technicien les vérifie avant d'enregistrer.
- Quota : 200 lectures par entreprise et par jour de Paris, comptées dans `plate_readings` (index `organization_id, day`). La table garde le statut, le nombre de champs, le modèle, les jetons et le `trace_id`, jamais une valeur lue ni la photo. Les logs suivent la même règle.
- Choix du modèle par la mesure : `pnpm --filter @passalio/api plate-reading:eval` compare des modèles sur le jeu de photos annoté (`/mnt/project-files/lecture-de-plaque/jeu-de-test/`). On retient le moins cher qui atteint 95 % de champs justes, en suivant à part les valeurs inventées.

## Conséquences

La photo part chez le fournisseur choisi : il entre dans la liste des sous-traitants ultérieurs de la politique de confidentialité avant l'activation en production. Le quota et le coût par lecture se suivent dans `plate_readings`. La lecture demande du réseau ; hors ligne, la photo attend dans la file du téléphone (écran, PR suivante).
