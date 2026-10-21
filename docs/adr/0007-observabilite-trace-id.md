# 0007 — Observabilité par trace_id avec Sentry et PostHog

- Date : 2026-10-21
- Statut : accepté

## Contexte

Seul pour le support, il faut retrouver rapidement ce qui s'est passé pour un utilisateur.

## Décision

Trace distribuée Sentry du navigateur jusqu'à l'API, aux queues et aux crons. `trace_id` dans les logs structurés, dans PostHog et dans l'en-tête `x-trace-id`. Code court affiché à l'utilisateur en cas d'erreur. Sentry et PostHog hébergés en UE, sans données personnelles.

## Conséquences

Chaque nouveau point d'entrée (route, job, cron) doit propager le contexte de trace.
