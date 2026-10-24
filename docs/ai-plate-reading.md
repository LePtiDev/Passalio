# Mise en place de l'IA : lecture de plaque

Note d'exploitation. La décision et ses raisons sont dans l'ADR 0022. Cette note dit comment l'IA est branchée, combien elle coûte, comment l'activer et quoi faire en cas de problème.

État au 2026-10-24 : API, écran et tests fusionnés dans `main` (PR #51, #54, #56). Aucun modèle n'est configuré en staging ni en production : la route y répond 503 et l'écran reste silencieux, le technicien remplit à la main.

## Fonctionnement

1. Le technicien photographie la plaque sur le formulaire appareil (téléphone). Une photo de plus de 1,5 Mo, ou d'un format non accepté, est réduite à 2048 px en JPEG.
2. Le téléphone l'envoie à `POST /api/plate-readings` (permission `customers:write`, refusée pendant une impersonation).
3. L'API vérifie le quota (200 lectures par entreprise et par jour de Paris), puis envoie la photo au modèle de `PLATE_READER_MODEL`. Si ce modèle échoue, `PLATE_READER_FALLBACK_MODEL` prend le relais.
4. Le modèle répond dans un format imposé : le schéma `plateReaderAnswer` (`packages/shared/src/plate-reading.ts`), un champ par case du formulaire, `null` s'il n'est pas sûr.
5. `sanitizePlateReading` revalide chaque valeur et retire ce qui ne passe pas. Le téléphone ne remplit que les champs vides et marque « Lu sur la plaque ».
6. Une ligne est écrite dans `plate_readings` : statut, nombre de champs, modèle, jetons, `trace_id`. Jamais la photo ni une valeur lue.

| Variable ou secret                                                                       | Rôle                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `PLATE_READER_MODEL`                                                                     | Modèle principal, `fournisseur:modèle`, ou `fake` en local |
| `PLATE_READER_FALLBACK_MODEL`                                                            | Modèle de secours, facultatif                              |
| `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`, `MISTRAL_API_KEY` | Clé du fournisseur utilisé, en secret Wrangler uniquement  |

Fournisseurs reconnus : `openai`, `google`, `anthropic`, `mistral`. Exemple : `openai:gpt-5.4-nano`.

## Coût estimé

Hypothèses : environ 2 500 jetons envoyés par photo (image, consignes et format) et 500 reçus. Prix publics relevés le 2026-10-24, en dollars par million de jetons (envoyés / reçus).

| Modèle       | Prix        | Par photo     | 110 photos par entreprise et par mois | 100 entreprises par mois |
| ------------ | ----------- | ------------- | ------------------------------------- | ------------------------ |
| GPT-5.4 nano | 0,20 / 1,25 | ~0,1 centime  | ~0,12 €                               | ~12 €                    |
| GPT-5 mini   | 0,25 / 2,00 | ~0,15 centime | ~0,18 €                               | ~18 €                    |
| GPT-5.4 mini | 0,75 / 4,50 | ~0,4 centime  | ~0,45 €                               | ~45 €                    |

Plafond par entreprise : 200 lectures par jour, soit 0,80 € par jour au plus avec le modèle le plus cher ci-dessus. Les jetons réels se lisent dans `plate_readings` et dans le rapport de mesure.

## Choisir le modèle

1. Ajouter les clés de test dans les secrets de l'environnement cloud (5 $ de crédit suffisent : 16 plaques coûtent moins de 10 centimes par modèle).
2. Lancer la mesure sur le jeu de photos annoté (`/mnt/project-files/lecture-de-plaque/jeu-de-test/`, hors dépôt) :

   ```sh
   PLATE_EVAL_MODELS="openai:gpt-5.4-nano,openai:gpt-5.4-mini,google:gemini-2.5-flash" \
     pnpm --filter @passalio/api plate-reading:eval
   ```

3. Retenir le moins cher qui atteint 95 % de champs justes, sans valeur inventée sur les cas difficiles. Garder le second comme secours.

## Activer en staging puis en production

Uniquement sur demande explicite de Quentin (déploiement).

1. Ajouter le fournisseur retenu aux sous-traitants ultérieurs de la politique de confidentialité.
2. Poser la clé : `npx wrangler secret put OPENAI_API_KEY --env staging` (dans `apps/api`).
3. Ajouter `PLATE_READER_MODEL` (et `PLATE_READER_FALLBACK_MODEL`) dans `env.staging.vars` de `apps/api/wrangler.json`, par une PR.
4. `pnpm release:staging`, puis photographier une vraie plaque sur app.staging.passalio.com.
5. Même chose avec `--env production` et `pnpm release:prod`.

## En cas de problème

- Le fournisseur tombe : le modèle de secours prend le relais. Sans secours, le téléphone affiche « La plaque n'a pas pu être lue » avec le code de trace, et le technicien remplit à la main.
- Lectures fausses ou coût trop haut : changer `PLATE_READER_MODEL` (une variable, une PR, un déploiement), après une nouvelle mesure.
- Couper l'IA : retirer `PLATE_READER_MODEL` de l'environnement. La route répond 503 et l'écran ne lit plus, sans erreur affichée.
- Une entreprise atteint la limite : bandeau « Lecture automatique en pause jusqu'à demain », la photo reste jointe.

## Reste à faire

Voir `docs/ROADMAP.md` : mesure des modèles (clés de test à fournir), lecture hors ligne au retour du réseau avec « Plaque lue · à vérifier » sur la fiche.
