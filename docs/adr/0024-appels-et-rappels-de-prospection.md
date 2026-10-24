# 0024 — Appels, rappels et qualification de la prospection

- Date : 2026-10-24
- Statut : accepté

## Contexte

La maquette v2 de la prospection, validée par Quentin le 2026-10-24, part des besoins produit (document « Besoins produit : prospection commerciale ») : après chaque appel, le commercial note le résultat, la prochaine action, une date et une heure de rappel avec une notification, et qualifie l'entreprise. Il retrouve ses rappels dans « Ma journée » et enchaîne les appels en série. Les tables de l'ADR 0017 ne gardent que les notes et les étapes.

## Décision

- Trois tables Passalio, sans `organization_id` (ADR 0017) :
  - `prospect_calls` : un appel, jamais modifié. Résultat `outcome` (`answered`, `no_answer`, `voicemail`, `wrong_number`), prochaine action `next_action` (`demo`, `callback`, `email`, `not_interested`), notes, contact, auteur, `called_at`.
  - `prospect_follow_ups` : une ligne par entreprise (clé `company_id`). Dernier appel (`last_call_at`, `last_call_outcome`, `last_call_by_user_id`) pour bâtir les séries sans relire tous les appels, et qualification : intérêt (`hot`, `warm`, `cold`), effectif (`solo`, `two_to_three`, `four_plus`), outil (`paper`, `spreadsheet`, `software`), certificats par an (`under_300`, `from_300_to_800`, `over_800`), décideur (`manager`, `partner`, `other`).
  - `prospect_tasks` : un rappel ou une démo à une date (`due_at`), pour une personne de l'équipe (`owner_user_id`), statut `open`, `done` ou `cancelled`. Notification `notify` (`minutes_15`, `day_before` à 18 h la veille, heure de Paris, `at_time`, `none`) et son instant `notify_at`, calculé par le serveur ; `notified_at` sera rempli par l'envoi des rappels par e-mail (PR suivante).
- Une table à part plutôt que de nouvelles colonnes sur `prospect_events` et `prospect_companies` : l'historique et la fiche entreprise restent inchangés, et la ligne de suivi se met à jour sans toucher à l'entreprise.
- Un appel et sa tâche s'écrivent en un seul `batch` D1 avec la mise à jour du suivi. Une démo ou un rappel exige une date ; une date sans démo ni rappel est refusée (400).
- L'étape suit l'appel (`stageAfterCall`) : une démo passe en `demo_planned`, « Pas intéressé » en `not_interested`, un premier appel décroché fait passer `to_qualify` en `qualified`. Une entreprise cliente ne bouge jamais. Chaque changement d'étape s'écrit dans `prospect_events` comme aujourd'hui.
- Routes sous `/api/admin/prospects` (`prospects:read` en lecture, `prospects:write` en écriture) : `POST /companies/:companyId/calls`, `PATCH /companies/:companyId/qualification`, `GET /companies/:companyId/follow-up`, `GET /my-day`, `GET /call-series?target=never_called|not_reached&department=&cursor=`, `PATCH /tasks/:taskId`.
- « Ma journée » : mes tâches ouvertes jusqu'à minuit (heure de Paris), en retard d'abord, et mes appels depuis minuit.
- Série d'appels : entreprises à qualifier, qualifiées ou intéressées, avec un téléphone, jamais appelées (`never_called`) ou sans réponse ni messagerie au dernier appel (`not_reached`), par nom, paginées par curseur.

## Conséquences

Les écrans Ma journée, Appels, Série d'appels et la fiche lisent ces routes (PR suivante). L'envoi des notifications de rappel par e-mail lira `notify_at` et `notified_at` ; son index sera ajouté avec la requête. Les e-mails de prospection (boîte de l'équipe, campagnes) restent des décisions à part.
