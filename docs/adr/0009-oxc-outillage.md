# 0009 — Oxlint et Oxfmt pour le lint et le formatage

- Date : 2026-10-21
- Statut : accepté

## Contexte
Outils rapides souhaités, sur le poste et dans les hooks git.

## Décision
Oxlint (avec règles type-aware) et Oxfmt, écrits en Rust. `tsc --noEmit` pour les types. Lefthook pour les hooks git.

## Conséquences
Très rapide. Oxfmt est encore en bêta : en cas de problème bloquant, repli sur Biome pour le formatage.
