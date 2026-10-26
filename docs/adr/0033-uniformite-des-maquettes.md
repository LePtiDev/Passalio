# 0033 — Uniformité des maquettes avec l'application

- Date : 2026-10-26
- Statut : accepté

## Contexte

La maquette v2 des « Demandes du site » avait des onglets dessinés à la main : sur mobile, ils passaient sur plusieurs lignes, alors que les onglets de l'application tiennent toujours sur une ligne. Quentin l'a vu en relisant la maquette. Une maquette validée devient la référence de l'écran codé (CLAUDE.md, « Façon de travailler ») : un écart non repéré à la maquette finit en production ou en reprise.

## Décision

Avant de montrer une maquette à Quentin, on la compare au reste de l'application ou du site, et on corrige chaque écart. La maquette part des composants existants, pas d'un dessin libre.

Points vérifiés, sur ordinateur (1440 px) et mobile (360 px) :

- Coque : barre latérale, fil d'Ariane, barre du bas sur mobile, titre et sous-titre de page, contenu en pleine largeur.
- Composants partagés repris tels quels : `Button` (primaire, secondaire, danger ; 32 px sur ordinateur, 48 px sur mobile), onglets (`ListTabs` : soulignés avec compteur sur ordinateur, segments de 48 px sur une seule ligne sur mobile, sans défilement horizontal), recherche (`SearchField`), pagination (`Pagination`), cartes, badges, champs et astérisque rouge, skeletons (`PageSkeleton`), état vide, erreur (`ErrorState`).
- Couleurs, tailles de texte, arrondis et espacements identiques à un écran existant du même type.
- Aucun texte coupé ni passé à la ligne par manque de place à 360 px ; zones tactiles de 48 px.
- Vocabulaire du glossaire (`docs/ARCHITECTURE.md`) et des écrans voisins.

La maquette est envoyée avec une capture d'un écran existant comparable, et la liste des écarts restants avec leur raison. Sans écart, on l'écrit.

## Conséquences

- Les écarts se voient avant validation, pas au code ni après fusion.
- Une maquette prend un peu plus de temps : il faut ouvrir les composants et un écran voisin.
- Un nouveau composant reste possible, mais il est nommé comme écart et justifié dans le message à Quentin.
- La skill `new-screen` et `CLAUDE.md` portent cette étape.
