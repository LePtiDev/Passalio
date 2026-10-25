import { billingRedirectResponse, subscriptionResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createFakeStripe,
  signedStripeEvent,
  STRIPE_TEST_BINDINGS,
  stripeSubscription,
  type FakeStripe,
} from "./fake-stripe";
import {
  createChimneySweepingOrganization,
  impersonate,
  joinOrganization,
  jsonBody,
} from "./team-session";
import { APP_URL, startTestPlatform, type TestPlatform } from "./test-platform";

const OWNER_EMAIL = "patron-abonnement@example.fr";

let platform: TestPlatform;
let stripe: FakeStripe;
let owner: string;
let technician: string;
let organizationId: string;

const subscriptionBody = z.object({ subscription: subscriptionResponse });
const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const readSubscription = async (cookie = owner) => {
  const response = await platform.request("/api/billing/subscription", {}, cookie);
  expect(response.status).toBe(200);
  return subscriptionBody.parse(await response.json()).subscription;
};

const checkout = (body: unknown = { plan: "team", interval: "month" }, cookie = owner) =>
  platform.request("/api/billing/checkout", jsonBody(body), cookie);

const openPortal = (cookie = owner) =>
  platform.request("/api/billing/portal", { method: "POST" }, cookie);

const sendEvent = async (id: string, type: string, object: Record<string, unknown>) =>
  platform.request("/api/billing/stripe-webhook", await signedStripeEvent({ id, type, object }));

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

beforeAll(async () => {
  stripe = createFakeStripe();
  platform = await startTestPlatform({
    bindings: STRIPE_TEST_BINDINGS,
    externalService: stripe.service,
  });
  owner = await platform.signIn(OWNER_EMAIL);
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Abonné");
  technician = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "technicien-abonnement@example.fr",
    role: "technician",
  });
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("subscription of a new company", () => {
  it("shows the owner a 7-day trial that can be paid online", async () => {
    const subscription = await readSubscription();
    expect(subscription).toMatchObject({
      workspaceState: "trial",
      blockedReason: null,
      isBillingEnabled: true,
      canManage: true,
      subscription: null,
    });
    const trialDays = (Date.parse(subscription.trialEndsAt) - Date.now()) / (24 * 60 * 60 * 1000);
    expect(trialDays).toBeGreaterThan(6.9);
    expect(trialDays).toBeLessThanOrEqual(7);
  });

  it("shows a technician the state without letting them manage it", async () => {
    expect(await readSubscription(technician)).toMatchObject({
      workspaceState: "trial",
      canManage: false,
    });
  });

  it("has no portal before the first subscription", async () => {
    const response = await openPortal();
    expect(response.status).toBe(404);
    expect(await errorOf(response)).toBe("no_subscription");
  });
});

describe("checkout", () => {
  it("sends the owner to Stripe Checkout, tied to the company", async () => {
    const response = await checkout();
    expect(response.status).toBe(200);
    expect(billingRedirectResponse.parse(await response.json()).url).toMatch(
      /^https:\/\/checkout\.stripe\.com\//,
    );
    expect(stripe.calls.find(({ path }) => path === "/v1/checkout/sessions")?.form).toMatchObject({
      mode: "subscription",
      "line_items[0][price]": "price_team_monthly",
      "subscription_data[metadata][organization_id]": organizationId,
      customer_email: OWNER_EMAIL,
      success_url: `${APP_URL}/reglages/abonnement?paiement=ok`,
      payment_method_configuration: STRIPE_TEST_BINDINGS.STRIPE_PAYMENT_METHOD_CONFIGURATION,
    });
  });

  it.each([{ plan: "founder", interval: "month" }, { plan: "team" }, "texte"])(
    "refuses the body %o with 400",
    async (body) => {
      const response = await checkout(body);
      expect(response.status).toBe(400);
    },
  );

  it("refuses a technician with 403", async () => {
    const response = await checkout(undefined, technician);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("forbidden");
  });

  it("refuses an impersonating superadmin, who only reads", async () => {
    const impersonated = await platform.signIn("patron-abonnement-support@example.fr");
    await createChimneySweepingOrganization(platform, impersonated, "Ramonage Support");
    await impersonate(platform, impersonated, "support-abonnement@passalio.com");
    const response = await checkout(undefined, impersonated);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("impersonation_read_only");
  });
});

describe("Stripe webhook", () => {
  it.each([
    ["without signature", {}],
    ["with a wrong signature", { "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=00` }],
  ])("refuses an event %s with 400", async (_case, headers) => {
    const response = await platform.request("/api/billing/stripe-webhook", {
      method: "POST",
      body: JSON.stringify({ id: "evt_forged", type: "invoice.paid", data: { object: {} } }),
      headers,
    });
    expect(response.status).toBe(400);
    expect(await errorOf(response)).toBe("invalid_signature");
  });

  it("refuses an event signed with another secret", async () => {
    const response = await platform.request(
      "/api/billing/stripe-webhook",
      await signedStripeEvent(
        { id: "evt_other", type: "invoice.paid", object: {} },
        "whsec_attaquant",
      ),
    );
    expect(response.status).toBe(400);
  });

  it("activates the subscription once Stripe confirms the checkout", async () => {
    stripe.subscriptions.set(`sub_${organizationId}`, stripeSubscription(organizationId));
    const response = await sendEvent("evt_checkout", "checkout.session.completed", {
      id: "cs_1",
      object: "checkout.session",
      subscription: `sub_${organizationId}`,
    });
    expect(response.status).toBe(200);
    expect(await readSubscription()).toMatchObject({
      workspaceState: "active",
      subscription: {
        plan: "team",
        interval: "month",
        isFounder: false,
        currentPeriodEndsAt: "2027-01-01T00:00:00.000Z",
        isCancelScheduled: false,
        paymentMethod: { type: "card", last4: "4242" },
      },
    });
  });

  it("handles a replayed event only once", async () => {
    stripe.subscriptions.set(
      `sub_${organizationId}`,
      stripeSubscription(organizationId, { status: "canceled" }),
    );
    const response = await sendEvent("evt_checkout", "checkout.session.completed", {
      id: "cs_1",
      subscription: `sub_${organizationId}`,
    });
    expect(response.status).toBe(200);
    expect((await readSubscription()).workspaceState).toBe("active");
    stripe.subscriptions.set(`sub_${organizationId}`, stripeSubscription(organizationId));
  });

  it("acknowledges an event about something else without changing anything", async () => {
    const response = await sendEvent("evt_customer", "customer.updated", { id: "cus_1" });
    expect(response.status).toBe(200);
    expect((await readSubscription()).workspaceState).toBe("active");
  });

  it("refuses a second checkout and opens the portal instead", async () => {
    const second = await checkout({ plan: "solo", interval: "year" });
    expect(second.status).toBe(409);
    expect(await errorOf(second)).toBe("already_subscribed");
    const portal = await openPortal();
    expect(portal.status).toBe(200);
    expect(billingRedirectResponse.parse(await portal.json()).url).toMatch(
      /^https:\/\/billing\.stripe\.com\//,
    );
    expect(stripe.calls.at(-1)?.form).toMatchObject({
      customer: `cus_${organizationId}`,
      return_url: `${APP_URL}/reglages/abonnement`,
    });
  });
});
