import { subscriptionResponse, teamUpgradePreviewResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createFakeStripe,
  itemsWithPrice,
  signedStripeEvent,
  STRIPE_TEST_BINDINGS,
  stripeSubscription,
  type FakeStripe,
} from "./fake-stripe";
import { createChimneySweepingOrganization, joinOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const previewBody = z.object({ preview: teamUpgradePreviewResponse });
const subscriptionBody = z.object({ subscription: subscriptionResponse });

let platform: TestPlatform;
let stripe: FakeStripe;
let owner: string;
let secretary: string;
let organizationId: string;
let refusedOwner: string;
let refusedOrganizationId: string;

const sendSubscriptionEvent = async (organization: string, eventId: string, type: string) => {
  const response = await platform.request(
    "/api/billing/stripe-webhook",
    await signedStripeEvent({
      id: eventId,
      type,
      object: { id: `sub_${organization}`, object: "subscription" },
    }),
  );
  expect(response.status).toBe(200);
};

const subscribeToSolo = async (organization: string) => {
  stripe.subscriptions.set(
    `sub_${organization}`,
    stripeSubscription(organization, { items: itemsWithPrice("solo_monthly") }),
  );
  await sendSubscriptionEvent(
    organization,
    `evt_solo_${organization}`,
    "customer.subscription.created",
  );
};

const preview = (cookie: string) =>
  platform.request("/api/billing/team-upgrade/preview", { method: "POST" }, cookie);

const previewOf = async (cookie: string) => {
  const response = await preview(cookie);
  expect(response.status).toBe(200);
  return previewBody.parse(await response.json()).preview;
};

const upgrade = (cookie: string, prorationDate: number) =>
  platform.request("/api/billing/team-upgrade", jsonBody({ prorationDate }), cookie);

const inviteTechnician = (cookie: string, email: string) =>
  platform.request("/api/invitations", jsonBody({ email, role: "technician" }), cookie);

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

const planOf = async (cookie: string) => {
  const response = await platform.request("/api/billing/subscription", {}, cookie);
  return subscriptionBody.parse(await response.json()).subscription.subscription?.plan;
};

beforeAll(async () => {
  stripe = createFakeStripe();
  platform = await startTestPlatform({
    bindings: STRIPE_TEST_BINDINGS,
    externalService: stripe.service,
  });
  owner = await platform.signIn("jean-equipe@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Prorata");
  secretary = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "lea-equipe@example.fr",
    role: "secretary",
  });
  await platform.setActiveOrganization(owner, organizationId);
  await subscribeToSolo(organizationId);
  stripe.previewAmounts.set(`sub_${organizationId}`, 1000);
  refusedOwner = await platform.signIn("paul-carte@example.fr");
  refusedOrganizationId = await createChimneySweepingOrganization(
    platform,
    refusedOwner,
    "Ramonage Carte Refusée",
  );
  await subscribeToSolo(refusedOrganizationId);
  stripe.refusedPayments.add(`sub_${refusedOrganizationId}`);
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("the Équipe prorata", () => {
  it("shows the owner what Stripe charges today for the rest of the month", async () => {
    const shown = await previewOf(owner);
    expect(shown).toMatchObject({
      amountDueCents: 1000,
      interval: "month",
      currentPeriodEndsAt: new Date(1_798_761_600 * 1000).toISOString(),
    });
    expect(stripe.calls.at(-1)).toMatchObject({
      method: "POST",
      path: "/v1/invoices/create_preview",
      form: {
        subscription: `sub_${organizationId}`,
        "subscription_details[items][0][price]": "price_team_monthly",
        "subscription_details[proration_behavior]": "always_invoice",
        "subscription_details[proration_date]": String(shown.prorationDate),
      },
    });
  });

  it("is kept from the secretary, who does not manage the subscription", async () => {
    expect((await preview(secretary)).status).toBe(403);
  });
});

describe("the upgrade to Équipe", () => {
  it("refuses the secretary", async () => {
    const { prorationDate } = await previewOf(owner);
    expect((await upgrade(secretary, prorationDate)).status).toBe(403);
    expect(await planOf(owner)).toBe("solo");
  });

  it("refuses a preview made more than thirty minutes ago", async () => {
    const { prorationDate } = await previewOf(owner);
    const response = await upgrade(owner, prorationDate - 31 * 60);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("preview_expired");
  });

  it("keeps Solo when the card is refused", async () => {
    const { prorationDate } = await previewOf(refusedOwner);
    const response = await upgrade(refusedOwner, prorationDate);
    expect(response.status).toBe(402);
    expect(await errorOf(response)).toBe("payment_failed");
    expect(await planOf(refusedOwner)).toBe("solo");
  });

  it("charges the prorata now and switches the company to Équipe at once", async () => {
    const { prorationDate } = await previewOf(owner);
    expect((await upgrade(owner, prorationDate)).status).toBe(204);
    expect(stripe.calls.at(-1)).toMatchObject({
      method: "POST",
      path: `/v1/subscriptions/sub_${organizationId}`,
      form: {
        "items[0][price]": "price_team_monthly",
        proration_behavior: "always_invoice",
        proration_date: String(prorationDate),
        payment_behavior: "error_if_incomplete",
      },
    });
    expect(await planOf(owner)).toBe("team");
  });

  it("then lets the owner invite the second technician", async () => {
    expect((await inviteTechnician(owner, "marc-equipe@example.fr")).status).toBe(201);
  });

  it("refuses a second upgrade of a company already on Équipe", async () => {
    const response = await preview(owner);
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("not_on_solo");
  });
});

describe("a switch back to Solo from the Stripe portal", () => {
  it("puts Équipe back while two technicians remain", async () => {
    stripe.subscriptions.set(
      `sub_${organizationId}`,
      stripeSubscription(organizationId, { items: itemsWithPrice("solo_monthly") }),
    );
    await sendSubscriptionEvent(organizationId, "evt_portal_solo", "customer.subscription.updated");
    expect(stripe.calls.at(-1)).toMatchObject({
      method: "POST",
      path: `/v1/subscriptions/sub_${organizationId}`,
      form: { "items[0][price]": "price_team_monthly", proration_behavior: "create_prorations" },
    });
    expect(await planOf(owner)).toBe("team");
  });
});
