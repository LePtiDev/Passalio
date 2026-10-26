export type CheckoutError = "billing_unavailable" | "already_subscribed" | "price_not_found";

export type PortalError = "billing_unavailable" | "no_subscription";

export type TeamUpgradeError =
  | "billing_unavailable"
  | "no_subscription"
  | "not_on_solo"
  | "price_not_found"
  | "preview_expired"
  | "payment_failed";

export type StripeEventOutcome = "processed" | "duplicate" | "ignored";
