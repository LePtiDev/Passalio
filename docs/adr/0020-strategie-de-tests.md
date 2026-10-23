# 0020 — Stratégie de tests : tout est testé, un test ne se change pas pour passer

- Date : 2026-10-23
- Statut : accepté

## Contexte

Passalio garde des attestations réglementaires, des données de clients de plusieurs entreprises dans une seule base (ADR 0005) et fonctionne hors ligne (ADR 0003). Un bug peut faire fuiter les données d'une entreprise vers une autre, perdre une modification faite sans réseau ou produire une attestation fausse. Le 2026-10-23, le dépôt compte environ 335 tests, surtout sur l'API ; l'interface n'a presque aucun test et seuls 7 parcours sont testés de bout en bout.

Quentin veut une couverture « digne d'une grande entreprise » : tous les parcours, toutes les fonctions. Il pose trois règles : on ne touche jamais à un test sans son accord, sauf si l'exigence change ; on ne change jamais un test pour le faire passer ; un bug se corrige en écrivant d'abord le test qui le reproduit.

Il n'y a pas de CI (ADR 0010, confirmé par Quentin le 2026-10-23) : les tests tournent dans les hooks git et avant chaque mise en production.

## Décision

1. **Un test est une exigence.** Un test existant ne se modifie ni ne se supprime sans l'accord écrit de Quentin. Seule exception : l'exigence qu'il vérifie a changé à la demande de Quentin. Dans les deux cas, le commit porte la ligne `Test-Change-Approved: <lien vers le message de Quentin>`. Ajouter un nouveau test ne demande aucun accord.
2. **On ne change jamais un test pour le faire passer.** Si un test échoue, c'est le code qui est faux, ou l'exigence qui a changé (règle 1).
3. **Un bug se corrige en deux commits** : `test: reproduce …` (le test échoue, la sortie est copiée dans la PR), puis `fix: …`. Skill `fix-bug`.
4. **Garde-fou automatique** : `pnpm test:guard` (paquet `packages/test-guard`), lancé par `pnpm check` et le hook avant push, compare avec `main` et échoue si une ligne d'un fichier de test existant est retirée ou modifiée, ou si une capture de référence change, sans commit portant `Test-Change-Approved`.
5. **Lint des tests** : `.only`, `.skip`, `.todo`, `fixme`, `expect` conditionnel, test sans assertion et titres en double sont interdits.
6. **18 familles de tests**, chacune avec son outil et sa règle de complétude, listées dans `docs/TESTING.md`. Les plus importantes sont générées : une matrice parcourt toutes les routes Hono et échoue si une route n'a pas ses tests d'authentification, de permission, d'isolation entre entreprises et d'impersonation.
7. **Chaque parcours utilisateur a un test Playwright**, sur mobile (360 px) et ordinateur (1440 px), avec contrôle d'accessibilité. L'inventaire des parcours vit dans `docs/TESTING.md` et grandit avec chaque écran.
8. **Les captures de référence sont des tests.** Elles viennent des écrans validés par Quentin ; les mettre à jour suit la règle 1, sauf maquette nouvellement validée.
9. **L'efficacité des tests se mesure** : couverture avec seuils qui ne baissent jamais, tests de mutation sur `packages/shared` et les dossiers `domain/` (80 % minimum).
10. **Quand ça tourne** : `pnpm check` à chaque push ; `pnpm test:all` (composants, parcours, accessibilité, captures) avant chaque fusion d'une PR qui touche l'application et dans `release:*` ; tests de fumée après chaque déploiement ; tests de mutation et `pnpm audit` chaque semaine.
11. **Agents** : `.claude/agents/test-writer.md` écrit les tests sans toucher au code de production ni aux tests existants ; `.claude/agents/test-reviewer.md` relit chaque PR en cherchant le cas oublié et le test qui passerait avec un code faux.
12. **Un test instable est un bug** : on le reproduit et on le corrige, on ne relance pas jusqu'à ce qu'il passe.

## Conséquences

- Plus de temps par fonctionnalité, en échange de régressions détectées avant la mise en production.
- Une nouvelle route ou un nouvel écran sans tests fait échouer `pnpm check`.
- Corriger une exigence demande un message de Quentin à citer dans le commit : le coût est voulu.
- Sans CI, la discipline repose sur les hooks git et sur `release:*`, qui refuse de déployer si un test échoue. À revoir si l'équipe grandit.
- Pas de tests de charge avant les premiers clients, et pas de ferme d'appareils : les vrais téléphones iOS et Android se testent à la main sur staging avant chaque grosse version.
