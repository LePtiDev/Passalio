import { subscriptionResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signedStripeEvent } from "./fake-stripe";
import { createChimneySweepingOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let owner: string;
let organizationId: string;

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const subscriptionBody = z.object({ subscription: subscriptionResponse });

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-sans-stripe@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Sans Stripe");
  await platform.env.DB.prepare("UPDATE organizations SET created_at = ? WHERE id = ?")
    .bind(Date.now() - 30 * 24 * 60 * 60 * 1000, organizationId)
    .run();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("billing before a real Stripe account", () => {
  it("never blocks a workspace, even long after the trial", async () => {
    const response = await platform.request(
      "/api/customers",
      jsonBody({
        customer: { kind: "individual", lastName: "Production" },
        site: {
          address: "1 rue Libre",
          postalCode: "94100",
          city: "Saint-Maur",
          buildingType: "house",
        },
      }),
      owner,
    );
    expect(response.status).toBe(201);
  });

  it("tells the application that online payment is not available", async () => {
    const response = await platform.request("/api/billing/subscription", {}, owner);
    expect(response.status).toBe(200);
    expect(subscriptionBody.parse(await response.json()).subscription).toMatchObject({
      isBillingEnabled: false,
      workspaceState: "blocked",
      blockedReason: "trial_ended",
    });
  });

  it.each([
    ["/api/billing/checkout", jsonBody({ plan: "team", interval: "month" })],
    ["/api/billing/portal", { method: "POST" }],
  ])("answers %s with 503 billing_unavailable", async (path, init) => {
    const response = await platform.request(path, init, owner);
    expect(response.status).toBe(503);
    expect(errorResponse.parse(await response.json()).error).toBe("billing_unavailable");
  });

  it("refuses the Stripe webhook with 503", async () => {
    const response = await platform.request(
      "/api/billing/stripe-webhook",
      await signedStripeEvent({ id: "evt_1", type: "invoice.paid", object: {} }),
    );
    expect(response.status).toBe(503);
  });
});
