# 0008 — Sauvegardes chiffrées hors Cloudflare avec verrouillage

- Date : 2026-10-21
- Statut : accepté

## Contexte

Un compte ou un jeton compromis peut supprimer la base et les fichiers. Time Travel ne protège pas contre la perte du compte.

## Décision

Export quotidien chiffré (`age`) vers un stockage objet externe avec object lock 30 jours. Réplication hebdomadaire de R2. Test de restauration mensuel.

## Conséquences

Petit coût de stockage externe et un job à maintenir. Récupération possible même en cas de perte totale du compte Cloudflare.
