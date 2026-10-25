# Stripe

Configuration du compte Stripe de Passalio pour l'abonnement (ADR 0025). Seul le mode test existe pour l'instant : environnement de test « Passalio » (`acct_1UUDV6PVz1KfroPf`), utilisé par staging et en local. Configuré par l'API le 2026-10-24.

## Clés

- `STRIPE_SECRET_KEY` : clé secrète de test, dans les secrets de l'environnement cloud. Pour le Worker : `wrangler secret`, en local `.dev.vars` (`docs/SECURITY.md`).
- `STRIPE_WEBHOOK_SECRET` : secret de signature du webhook staging, visible dans le tableau de bord Stripe (Développeurs › Webhooks › Passalio staging › Révéler). Secret du Worker, lu par `POST /api/billing/stripe-webhook`.
- `STRIPE_PAYMENT_METHOD_CONFIGURATION` : `pmc_1UUDgZPVz1KfroPfb9DmbHvp` en mode test (voir plus bas). Variable du Worker, pas un secret.
- Sans `STRIPE_SECRET_KEY`, le paiement en ligne est indisponible et aucun espace n'est bloqué (ADR 0030). C'est l'état voulu de la production jusqu'au compte réel.
- Aucune clé dans le dépôt. Jamais de clé de production avant le compte réel (ADR 0025).

## Produits et prix

Prix hors taxes, en euros, sans TVA (franchise en base, « TVA non applicable, art. 293 B du CGI »). `tax_behavior` vaut `exclusive` : si la TVA s'applique un jour, les montants restent hors taxes. Code fiscal `txcd_10103001` (SaaS, usage professionnel).

Le code retrouve un prix par sa `lookup_key`, jamais par son identifiant, pour passer du mode test au mode réel sans changer le code.

| Formule | Produit               | Période | Montant HT | `lookup_key`   | Prix (test)                      |
| ------- | --------------------- | ------- | ---------- | -------------- | -------------------------------- |
| Solo    | `prod_VVE8a5Yrlx55JJ` | mois    | 29 €       | `solo_monthly` | `price_1UUDgPPVz1KfroPfGQlomDto` |
| Solo    | `prod_VVE8a5Yrlx55JJ` | an      | 290 €      | `solo_yearly`  | `price_1UUDgPPVz1KfroPfRsiVW9WQ` |
| Équipe  | `prod_VVE8NtPvGBdFDX` | mois    | 49 €       | `team_monthly` | `price_1UUDgQPVz1KfroPfy7LcCKKN` |
| Équipe  | `prod_VVE8NtPvGBdFDX` | an      | 490 €      | `team_yearly`  | `price_1UUDgQPVz1KfroPf73XNvxy6` |

Chaque produit et chaque prix porte `metadata.plan` (`solo` ou `team`).

## Moyens de paiement

Configuration `pmc_1UUDgZPVz1KfroPfb9DmbHvp` (« Passalio abonnement ») : carte (avec Apple Pay et Google Pay) et prélèvement SEPA, tout le reste désactivé. Checkout la reçoit dans `payment_method_configuration`. La configuration par défaut du compte n'est pas modifiée.

## Portail client

Configuration `bpc_1UUDh0PVz1KfroPftj0xGe8M` (« Passalio staging », par défaut) :

- Changer de carte ou de moyen de paiement, modifier e-mail, nom, adresse et numéro de TVA.
- Historique des factures.
- Changer de formule ou de période entre les quatre prix. Une montée (Solo vers Équipe, mois vers an) est immédiate et facturée au prorata (`always_invoice`). Une descente (Équipe vers Solo, an vers mois) prend effet à la fin de la période payée.
- Résiliation à la fin de la période payée, sans remboursement, avec motif demandé.
- Retour vers `https://app.staging.passalio.com/reglages/abonnement`. Liens vers `/conditions` et `/confidentialite`.

Le portail ne connaît pas le nombre de techniciens : le contexte `billing` refuse Équipe vers Solo s'il reste plus d'un technicien, sur l'événement `customer.subscription.updated`.

## Webhook

Endpoint `we_1UUDiCPVz1KfroPfOwfs9U2w` vers `https://app.staging.passalio.com/api/billing/stripe-webhook`, version d'API `2025-09-30.clover`, la même que celle envoyée par le code (`stripe-gateway.ts`). La route vérifie la signature, traite chaque événement une seule fois et relit l'abonnement chez Stripe (ADR 0030). L'entreprise est retrouvée par `metadata.organization_id` de l'abonnement, posé par Checkout.

Événements :

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` (SEPA confirmé plus tard)
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`

## Reste à faire

- Relances des paiements (Réglages › Facturation › Abonnements et e-mails) : garder l'abonnement `past_due` ou `unpaid` au moins 15 jours après le premier échec, sans résiliation automatique avant (ADR 0025, ADR 0030).
- Prix `founder_monthly` (19 € HT par mois, produit Équipe) à créer avec l'offre fondateurs.
- Mention « TVA non applicable, art. 293 B du CGI » et coordonnées de l'éditeur sur les factures : pied de facture par défaut dans le tableau de bord (Réglages › Facturation › Factures), ou `invoice_settings.footer` à la création du client.
- Compte réel : recréer produits, prix (mêmes `lookup_key`), configuration des moyens de paiement, portail et webhook vers `app.passalio.com`, puis compléter ce document.
