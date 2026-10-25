# 0030 — Contexte billing et blocage de l'espace

- Date : 2026-10-25
- Statut : accepté

## Contexte

L'ADR 0025 fixe les prix et le fonctionnement de l'abonnement. Quentin a validé le plan de développement le 2026-10-25 : trois PR (données et Stripe, écrans, e-mails et offre fondateurs), aucun blocage en production tant que le compte Stripe réel n'existe pas, accès complet pendant un prélèvement SEPA en attente. Cet ADR décrit la première PR : le contexte `billing`, sans écran.

## Décision

- Contexte `billing` (`apps/api/src/contexts/billing`). Table `subscriptions`, une ligne par entreprise (index unique `organization_id`) : formule, période, offre fondateurs, statut Stripe, identifiants Stripe du client et de l'abonnement, fin de la période payée, résiliation prévue, date de fin, premier paiement refusé, type et 4 derniers chiffres du moyen de paiement. Table `stripe_events` : identifiant de chaque événement déjà traité.
- L'état de l'espace se calcule à chaque lecture, à partir de la date de création de l'entreprise, de l'abonnement et de l'heure : `trial` (7 jours), `active`, `payment_pending` (SEPA en attente, accès complet), `payment_failed` (15 jours après le premier paiement refusé, accès complet), `blocked` avec un motif (`trial_ended`, `unpaid`, `canceled`) et une date de blocage. Rien n'est stocké, aucun cron n'est nécessaire pour bloquer.
- Routes : `GET /api/billing/subscription` (tout membre, `organization:read` ; moyen de paiement montré au seul patron), `POST /api/billing/checkout` et `POST /api/billing/portal` (`billing:manage`, patron seulement), `POST /api/billing/stripe-webhook` (public, signé).
- Checkout : prix retrouvé par `lookup_key`, entreprise portée par `client_reference_id` et `subscription_data.metadata.organization_id`, client Stripe réutilisé après une résiliation, configuration des moyens de paiement `STRIPE_PAYMENT_METHOD_CONFIGURATION`, langue française. Un abonnement vivant refuse un deuxième Checkout (`already_subscribed`) : le changement de formule passe par le portail.
- Webhook : signature HMAC-SHA256 vérifiée (5 minutes de tolérance, plusieurs signatures acceptées pendant une rotation du secret), chaque événement traité une seule fois. Le serveur ne se fie pas au contenu de l'événement : il relit l'abonnement chez Stripe et enregistre ce qu'il trouve. L'ordre d'arrivée des événements n'a donc pas d'importance. La fin d'un ancien abonnement n'écrase pas un abonnement plus récent. Chaque changement visible va dans le journal de l'entreprise (`billing.subscription_updated`).
- Blocage : un middleware, après celui de l'impersonation, refuse toute écriture d'un espace bloqué avec 403 `workspace_blocked`. Restent ouverts : la lecture, l'authentification et la déconnexion, l'abonnement, l'espace admin, les invitations de l'équipe Passalio, la création d'une autre entreprise. À la synchronisation, seul un certificat signé avant la date de blocage passe ; les autres changements sont refusés un par un avec `workspace_blocked`.
- Tant que `STRIPE_SECRET_KEY` n'est pas posé, le paiement en ligne est indisponible (`isBillingEnabled: false`, 503 `billing_unavailable`) et aucun espace n'est bloqué. La production n'aura cette clé qu'avec le compte Stripe réel de la micro-entreprise de Quentin (ADR 0025).
- Le prix `founder_monthly` est déjà reconnu comme la formule Équipe mensuelle avec l'offre fondateurs ; son attribution aux 20 premiers payeurs arrive dans la troisième PR.

## Conséquences

- Un middleware plutôt qu'un contrôle dans chaque cas d'usage : comme pour l'impersonation, aucune route d'écriture ne peut l'oublier, et chaque nouvelle route est couverte d'office. Un test de bout en bout vérifie le refus sur une écriture réelle.
- Un certificat signé hors ligne juste avant le blocage est accepté ; une fiche client créée hors ligne en même temps ne l'est pas. Si le certificat dépend de cette fiche, il est refusé aussi. Limite acceptée : le cas demande une fin d'essai pendant une tournée sans réseau.
- Stripe doit garder l'abonnement `past_due` ou `unpaid` au moins 15 jours après un paiement refusé (réglage des relances du tableau de bord), sinon la résiliation automatique bloquerait l'espace plus tôt (`docs/stripe.md`).
- Refuser Équipe vers Solo quand il reste plusieurs techniciens, les écrans et les e-mails viennent dans les PR suivantes.
