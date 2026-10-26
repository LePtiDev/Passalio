import { billingSeatsResponse, invoicesResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createFakeStripe,
  signedStripeEvent,
  STRIPE_TEST_BINDINGS,
  stripeSubscription,
  type FakeStripe,
} from "./fake-stripe";
import { createChimneySweepingOrganization, joinOrganization } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let stripe: FakeStripe;
let owner: string;
let secretary: string;
let organizationId: string;
let otherOwner: string;

const seatsBody = z.object({ seats: billingSeatsResponse });

const readSeats = async (cookie: string) => {
  const response = await platform.request("/api/billing/seats", {}, cookie);
  expect(response.status).toBe(200);
  return seatsBody.parse(await response.json()).seats;
};

const readInvoices = (cookie: string) => platform.request("/api/billing/invoices", {}, cookie);

const subscribe = async (organization: string, eventId: string) => {
  stripe.subscriptions.set(`sub_${organization}`, stripeSubscription(organization));
  const response = await platform.request(
    "/api/billing/stripe-webhook",
    await signedStripeEvent({
      id: eventId,
      type: "customer.subscription.created",
      object: { id: `sub_${organization}`, object: "subscription" },
    }),
  );
  expect(response.status).toBe(200);
};

const invoiceJson = (id: string, status: string) => ({
  id,
  object: "invoice",
  number: `PASSALIO-${id}`,
  created: 1_761_300_000,
  total: 2900,
  status,
  invoice_pdf: `https://pay.stripe.com/invoice/${id}/pdf`,
});

beforeAll(async () => {
  stripe = createFakeStripe();
  platform = await startTestPlatform({
    bindings: STRIPE_TEST_BINDINGS,
    externalService: stripe.service,
  });
  owner = await platform.signIn("jean-ecrans@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Écrans");
  secretary = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "secretariat-ecrans@example.fr",
    role: "secretary",
  });
  otherOwner = await platform.signIn("autre-ecrans@example.fr");
  await createChimneySweepingOrganization(platform, otherOwner, "Ramonage Voisin");
}, 90_000);

afterAll(async () => {
  await platform.dispose();
});

describe("seats of the plan", () => {
  it("counts the owner as the only technician, not the secretary", async () => {
    expect(await readSeats(owner)).toEqual({ technicianCount: 1, ownerName: "jean-ecrans" });
  });

  it("counts a technician who joins", async () => {
    await joinOrganization(platform, {
      ownerCookie: owner,
      organizationId,
      email: "technicien-ecrans@example.fr",
      role: "technician",
    });
    expect((await readSeats(owner)).technicianCount).toBe(2);
  });

  it("shows the secretary the name of the owner who manages the subscription", async () => {
    expect((await readSeats(secretary)).ownerName).toBe("jean-ecrans");
  });

  it("does not count the members of another company", async () => {
    expect(await readSeats(otherOwner)).toEqual({ technicianCount: 1, ownerName: "autre-ecrans" });
  });
});

describe("invoices", () => {
  it("gives an empty list before the first subscription", async () => {
    const response = await readInvoices(owner);
    expect(response.status).toBe(200);
    expect(invoicesResponse.parse(await response.json())).toEqual({ invoices: [] });
  });

  it("lists the invoices of the Stripe customer of the company, without drafts", async () => {
    await subscribe(organizationId, "evt_ecrans_subscribed");
    stripe.invoices.set(`cus_${organizationId}`, [
      invoiceJson("draft", "draft"),
      invoiceJson("0002", "open"),
      invoiceJson("0001", "paid"),
    ]);
    const response = await readInvoices(owner);
    expect(response.status).toBe(200);
    const { invoices } = invoicesResponse.parse(await response.json());
    expect(invoices.map(({ number, status }) => [number, status])).toEqual([
      ["PASSALIO-0002", "open"],
      ["PASSALIO-0001", "paid"],
    ]);
    expect(stripe.calls.at(-1)?.path).toBe("/v1/invoices");
  });

  it("gives the secretary no invoice, since only the owner sees them", async () => {
    const response = await readInvoices(secretary);
    expect(response.status).toBe(200);
    expect(invoicesResponse.parse(await response.json())).toEqual({ invoices: [] });
  });
});
