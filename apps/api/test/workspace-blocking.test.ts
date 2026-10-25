import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createFakeStripe,
  signedStripeEvent,
  STRIPE_TEST_BINDINGS,
  stripeSubscription,
  type FakeStripe,
} from "./fake-stripe";
import { createChimneySweepingOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

let platform: TestPlatform;
let stripe: FakeStripe;
let owner: string;
let organizationId: string;

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const pushResponse = z.object({
  results: z.array(z.object({ id: z.string(), status: z.string(), error: z.string().optional() })),
});

const createCustomer = (lastName: string) =>
  platform.request(
    "/api/customers",
    jsonBody({
      customer: { kind: "individual", lastName },
      site: {
        address: "8 rue du Blocage",
        postalCode: "94000",
        city: "Créteil",
        buildingType: "house",
      },
    }),
    owner,
  );

const ageOrganization = (days: number) =>
  platform.env.DB.prepare("UPDATE organizations SET created_at = ? WHERE id = ?")
    .bind(Date.now() - days * DAY_IN_MS, organizationId)
    .run();

const datePaymentFailure = (daysAgo: number) =>
  platform.env.DB.prepare(
    "UPDATE subscriptions SET payment_failed_at = ? WHERE organization_id = ?",
  )
    .bind(Date.now() - daysAgo * DAY_IN_MS, organizationId)
    .run();

const syncSubscription = async (eventId: string, changes: Record<string, unknown>) => {
  stripe.subscriptions.set(`sub_${organizationId}`, stripeSubscription(organizationId, changes));
  const response = await platform.request(
    "/api/billing/stripe-webhook",
    await signedStripeEvent({
      id: eventId,
      type: "customer.subscription.updated",
      object: { id: `sub_${organizationId}`, object: "subscription" },
    }),
  );
  expect(response.status).toBe(200);
};

const pushOffline = async (mutation: Record<string, unknown>) => {
  const response = await platform.request(
    "/api/sync/push",
    jsonBody({ mutations: [{ id: crypto.randomUUID(), mutation }] }),
    owner,
  );
  expect(response.status).toBe(200);
  return pushResponse.parse(await response.json()).results.at(0);
};

const certificateSignedAt = (signedAt: Date) => ({
  type: "sign_document",
  documentId: crypto.randomUUID(),
  interventionId: crypto.randomUUID(),
  equipmentId: crypto.randomUUID(),
  deviceId: crypto.randomUUID(),
  kind: "chimney_sweeping_certificate",
  templateVersion: 1,
  number: 1,
  signedAt: signedAt.toISOString(),
  data: {},
});

const refusalOf = async (response: Response) => ({
  status: response.status,
  error: errorResponse.parse(await response.json()).error,
});

const BLOCKED = { status: 403, error: "workspace_blocked" };

beforeAll(async () => {
  stripe = createFakeStripe();
  platform = await startTestPlatform({
    bindings: STRIPE_TEST_BINDINGS,
    externalService: stripe.service,
  });
  owner = await platform.signIn("patron-blocage@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Bloqué");
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("workspace at the end of the trial", () => {
  it("accepts writes during the trial", async () => {
    expect((await createCustomer("Pendant")).status).toBe(201);
  });

  it("refuses writes once the 7 days are over, with workspace_blocked", async () => {
    await ageOrganization(8);
    expect(await refusalOf(await createCustomer("Après"))).toEqual(BLOCKED);
  });

  it("keeps reading, subscribing and signing out possible", async () => {
    expect((await platform.request("/api/customers", {}, owner)).status).toBe(200);
    expect(
      (
        await platform.request(
          "/api/billing/checkout",
          jsonBody({ plan: "solo", interval: "month" }),
          owner,
        )
      ).status,
    ).toBe(200);
    expect(
      (await platform.request("/api/auth/sign-out", { method: "POST" }, owner)).status,
    ).not.toBe(403);
    owner = await platform.signIn("patron-blocage@example.fr");
    expect((await platform.setActiveOrganization(owner, organizationId)).status).toBe(200);
  });

  it("leaves the public website routes to their own rules", async () => {
    const response = await platform.request(
      "/api/public/callback-requests",
      jsonBody({ firstName: "Claire" }),
      owner,
    );
    expect(await response.text()).not.toContain("workspace_blocked");
  });

  it("lets the owner create another company", async () => {
    const response = await platform.request(
      "/api/organizations",
      jsonBody({ name: "Ramonage Nouveau Départ" }),
      owner,
    );
    expect(response.status).toBe(201);
    expect((await platform.setActiveOrganization(owner, organizationId)).status).toBe(200);
  });

  it("refuses offline changes, except a certificate signed before the block", async () => {
    expect(
      await pushOffline({ type: "archive_customer", customerId: crypto.randomUUID() }),
    ).toMatchObject({
      status: "rejected",
      error: "workspace_blocked",
    });
    expect(await pushOffline(certificateSignedAt(new Date()))).toMatchObject({
      status: "rejected",
      error: "workspace_blocked",
    });
    const beforeBlock = await pushOffline(
      certificateSignedAt(new Date(Date.now() - 2 * DAY_IN_MS)),
    );
    expect(beforeBlock?.error).not.toBe("workspace_blocked");
  });
});

describe("workspace of a subscribed company", () => {
  it("reopens as soon as Stripe confirms the subscription", async () => {
    await syncSubscription("evt_active", { status: "active" });
    expect((await createCustomer("Abonné")).status).toBe(201);
  });

  it("keeps the whole application for 15 days after a refused payment", async () => {
    await syncSubscription("evt_past_due", { status: "past_due" });
    await datePaymentFailure(14);
    expect((await createCustomer("Relancé")).status).toBe(201);
  });

  it("blocks writes once the 15 days are over", async () => {
    await datePaymentFailure(16);
    expect(await refusalOf(await createCustomer("Impayé"))).toEqual(BLOCKED);
  });

  it("reopens as soon as the payment goes through", async () => {
    await syncSubscription("evt_paid", { status: "active" });
    expect((await createCustomer("Payé")).status).toBe(201);
  });

  it("blocks writes after the cancellation at the end of the paid period", async () => {
    await syncSubscription("evt_canceled", {
      status: "canceled",
      ended_at: Math.floor((Date.now() - DAY_IN_MS) / 1000),
    });
    expect(await refusalOf(await createCustomer("Résilié"))).toEqual(BLOCKED);
  });
});
