# 0002 — Astro pour le site, SPA React pour l'application

- Date : 2026-10-21
- Statut : accepté

## Contexte

Le site doit être rapide et bien référencé (pages métiers, comparatifs, blog). L'application est derrière une connexion et doit fonctionner hors ligne.

## Décision

Astro statique pour le site. React + Vite en SPA (PWA) pour l'application. Tailwind partagé.

## Conséquences

Deux applications à maintenir, mais chacune fait une seule chose bien. Pas de rendu serveur à gérer pour l'application.
