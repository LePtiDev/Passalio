export type CheckoutError = "billing_unavailable" | "already_subscribed" | "price_not_found";

export type PortalError = "billing_unavailable" | "no_subscription";

export type StripeEventOutcome = "processed" | "duplicate" | "ignored";
