import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createFakeStripe,
  signedStripeEvent,
  STRIPE_TEST_BINDINGS,
  stripeSubscription,
  type FakeStripe,
} from "./fake-stripe";
import { createChimneySweepingOrganization, joinOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const membersResponse = z.object({
  members: z.array(z.object({ id: z.string(), email: z.string(), role: z.string() })),
});

let platform: TestPlatform;
let stripe: FakeStripe;
let soloOwner: string;
let soloOrganizationId: string;
let trialOwner: string;

const subscribeToSolo = async (organizationId: string) => {
  stripe.subscriptions.set(
    `sub_${organizationId}`,
    stripeSubscription(organizationId, {
      items: {
        data: [{ current_period_end: 1_798_761_600, price: { lookup_key: "solo_monthly" } }],
      },
    }),
  );
  const response = await platform.request(
    "/api/billing/stripe-webhook",
    await signedStripeEvent({
      id: `evt_solo_${organizationId}`,
      type: "customer.subscription.created",
      object: { id: `sub_${organizationId}`, object: "subscription" },
    }),
  );
  expect(response.status).toBe(200);
};

const invite = (cookie: string, email: string, role: string) =>
  platform.request("/api/invitations", jsonBody({ email, role }), cookie);

const memberIdOf = async (cookie: string, email: string) => {
  const response = await platform.request("/api/members", {}, cookie);
  const { members } = membersResponse.parse(await response.json());
  return members.find((member) => member.email === email)?.id ?? "";
};

const refusalOf = async (response: Response) => ({
  status: response.status,
  error: errorResponse.parse(await response.json()).error,
});

const TEAM_PLAN_REQUIRED = { status: 409, error: "team_plan_required" };

beforeAll(async () => {
  stripe = createFakeStripe();
  platform = await startTestPlatform({
    bindings: STRIPE_TEST_BINDINGS,
    externalService: stripe.service,
  });
  soloOwner = await platform.signIn("jean-solo@example.fr");
  soloOrganizationId = await createChimneySweepingOrganization(
    platform,
    soloOwner,
    "Ramonage Solo",
  );
  await joinOrganization(platform, {
    ownerCookie: soloOwner,
    organizationId: soloOrganizationId,
    email: "lea-solo@example.fr",
    role: "secretary",
  });
  await platform.setActiveOrganization(soloOwner, soloOrganizationId);
  await subscribeToSolo(soloOrganizationId);
  trialOwner = await platform.signIn("paul-essai@example.fr");
  await createChimneySweepingOrganization(platform, trialOwner, "Ramonage Essai");
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("the single technician seat of Solo", () => {
  it("refuses to invite a second technician and says Équipe is needed", async () => {
    expect(await refusalOf(await invite(soloOwner, "marc-solo@example.fr", "technician"))).toEqual(
      TEAM_PLAN_REQUIRED,
    );
  });

  it("refuses an admin too, who can sign certificates", async () => {
    expect(await refusalOf(await invite(soloOwner, "anne-solo@example.fr", "admin"))).toEqual(
      TEAM_PLAN_REQUIRED,
    );
  });

  it("still invites a secretary", async () => {
    expect((await invite(soloOwner, "sophie-solo@example.fr", "secretary")).status).toBe(201);
  });

  it("refuses to turn the secretary into a technician", async () => {
    const memberId = await memberIdOf(soloOwner, "lea-solo@example.fr");
    const response = await platform.request(
      `/api/members/${memberId}`,
      jsonBody({ role: "technician" }, "PATCH"),
      soloOwner,
    );
    expect(await refusalOf(response)).toEqual(TEAM_PLAN_REQUIRED);
  });

  it("leaves a company in trial free to invite technicians", async () => {
    expect((await invite(trialOwner, "marc-essai@example.fr", "technician")).status).toBe(201);
  });
});
