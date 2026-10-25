export const stripeSubscriptionJson = (changes: Record<string, unknown> = {}) => ({
  id: "sub_1Q",
  object: "subscription",
  customer: "cus_Q1",
  status: "active",
  metadata: { organization_id: "organization-a" },
  cancel_at_period_end: false,
  cancel_at: null,
  ended_at: null,
  default_payment_method: {
    id: "pm_1",
    object: "payment_method",
    type: "card",
    card: { brand: "visa", last4: "4242" },
  },
  items: {
    object: "list",
    data: [
      {
        id: "si_1",
        current_period_start: 1_763_640_000,
        current_period_end: 1_766_232_000,
        price: { id: "price_team", lookup_key: "team_monthly" },
      },
    ],
  },
  ...changes,
});
