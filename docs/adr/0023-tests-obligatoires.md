# 0023 — Tests obligatoires : aucun changement de code sans ses tests

- Date : 2026-10-24
- Statut : accepté

## Contexte

L'ADR 0020 fixe la stratégie de tests et protège les tests existants : on ne les change pas sans l'accord de Quentin. Elle ne dit pas assez nettement qu'un nouveau code doit arriver avec ses tests. La campagne de tests de l'application (PR #55) a trouvé 43 bugs dans du code déjà fusionné sans tests suffisants. Le 2026-10-24, Quentin demande que l'écriture des tests soit obligatoire.

## Décision

1. **Pas de code sans tests.** Toute PR qui ajoute ou change un comportement du code de production (`apps/*/src`, `packages/*/src`, migrations) contient les tests de ce comportement. Un code sans test n'est pas terminé et ne se fusionne pas.
2. **Ce qui doit être testé** :
   - une fonction ou un use case : chaque cas de succès et chaque erreur métier de son `Result` ;
   - une route : les familles 5 à 8 de `docs/TESTING.md` (401, 400, 403, 404, succès, isolation entre entreprises, impersonation) ;
   - une permission : qui l'a, qui ne l'a pas ;
   - une requête fréquente : son index ;
   - un écran : ses états vide, chargement, erreur et succès en composant, puis son parcours Playwright sur mobile et ordinateur avec contrôle d'accessibilité ;
   - un écran terrain : en plus, son fonctionnement hors ligne ;
   - un bug : le test qui le reproduit, dans un commit `test: reproduce …` avant le correctif (ADR 0020).
3. **Les tests s'écrivent avec le code**, dans la même PR, pas dans une PR « tests » plus tard. Chaque nouvelle ligne de test est ajoutée à l'inventaire `docs/TESTING.md`.
4. **Seules exceptions** : documentation, configuration sans effet sur le comportement, formatage, et refactorisation sans changement de comportement déjà couverte par les tests existants. Le commit le dit avec la ligne `Tests-Not-Needed: <raison>`.
5. **Garde-fou automatique** : `pnpm test:guard` refuse une branche qui change du code de production sans ajouter ni compléter de fichier de test, sauf si un commit porte `Tests-Not-Needed`.
6. **Relecture** : l'agent `test-reviewer` relit chaque PR et signale tout comportement ajouté ou changé sans test. Une PR avec un tel signalement ne se fusionne pas.

## Conséquences

- Chaque fonctionnalité coûte plus de temps à écrire, en échange de moins de bugs en production et de corrections plus sûres.
- Le garde-fou ne voit que la présence de tests, pas leur qualité : la relecture par `test-reviewer` et la règle 2 restent nécessaires.
- La ligne `Tests-Not-Needed` doit rester rare. Son usage se vérifie à la relecture.
- Complète l'ADR 0020 sans la remplacer.
