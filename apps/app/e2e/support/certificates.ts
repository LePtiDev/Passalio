import { numberBlockResponse } from "@passalio/shared";
import type { ChimneySweepingCertificate } from "@passalio/trades";
import { expect, type APIRequestContext } from "@playwright/test";
import * as z from "zod";

const SIGNATURE_IMAGE = "data:image/png;base64,iVBORw0KGgo=";

const sessionResponse = z.object({ user: z.object({ id: z.string() }) });

const pushResponse = z.object({
  results: z.array(z.object({ status: z.string(), error: z.string().optional() })),
});

const signedInUserId = async (request: APIRequestContext) => {
  const response = await request.get("/api/auth/get-session");
  expect(response.status()).toBe(200);
  return sessionResponse.parse(await response.json()).user.id;
};

const push = async (request: APIRequestContext, mutations: readonly unknown[]) => {
  const response = await request.post("/api/sync/push", {
    data: { mutations: mutations.map((mutation) => ({ id: crypto.randomUUID(), mutation })) },
  });
  expect(response.status()).toBe(200);
  return pushResponse
    .parse(await response.json())
    .results.map(({ status, error }) => (error === undefined ? status : `${status}:${error}`));
};

const certificateOf = (visitedOn: string): ChimneySweepingCertificate => ({
  company: {
    name: "Ramonage Dupont",
    legalForm: "sarl",
    shareCapitalEuros: 5000,
    siren: "123456789",
    registry: { kind: "rcs", city: "Créteil" },
    address: "1 rue des Ramoneurs, 94100 Saint-Maur-des-Fossés",
    phone: null,
    qualification: null,
  },
  customer: { name: "Client", address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne" },
  site: { address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne", room: "Salon" },
  equipment: {
    kind: "insert",
    energy: "wood_logs",
    brand: null,
    model: null,
    serialNumber: null,
    flueType: "lined_masonry",
  },
  technician: { name: "Jean Dupont" },
  flues: [{ designation: "Conduit du salon" }],
  sweepingExtent: "full_length",
  unsweptPart: null,
  isConnectionPipeSwept: true,
  chimneyStacks: "good",
  anomalies: null,
  isDoNotUse: false,
  visitedOn,
  completedOn: visitedOn,
  lastSweepingOn: null,
  lastServiceOn: null,
  isAdviceAttached: true,
  technicianSignature: SIGNATURE_IMAGE,
  customerSignature: SIGNATURE_IMAGE,
  isCustomerAbsent: false,
});

export type SweptCustomer = {
  readonly lastName: string;
  readonly city: string;
  readonly sweptOn: string;
};

export const seedSweptCustomer = async (
  request: APIRequestContext,
  { lastName, city, sweptOn }: SweptCustomer,
) => {
  const customerId = crypto.randomUUID();
  const siteId = crypto.randomUUID();
  const equipmentId = crypto.randomUUID();
  const interventionId = crypto.randomUUID();
  const deviceId = crypto.randomUUID();
  const technicianUserId = await signedInUserId(request);
  expect(
    await push(request, [
      { type: "create_customer", customerId, customer: { kind: "individual", lastName } },
      {
        type: "add_site",
        siteId,
        customerId,
        site: { address: "9 rue de la Mare", postalCode: "94170", city, buildingType: "house" },
      },
      {
        type: "add_equipment",
        equipmentId,
        siteId,
        equipment: { kind: "insert", energy: "wood_logs", details: { flueType: "lined_masonry" } },
      },
      {
        type: "create_intervention",
        interventionId,
        intervention: {
          customerId,
          siteId,
          technicianUserId,
          scheduledDate: sweptOn,
          startTime: "09:00",
          durationMinutes: 60,
          equipmentIds: [equipmentId],
        },
      },
    ]),
  ).toEqual(["applied", "applied", "applied", "applied"]);
  const blockResponse = await request.post("/api/document-number-blocks", { data: { deviceId } });
  expect(blockResponse.status()).toBe(201);
  const block = numberBlockResponse.parse(await blockResponse.json());
  expect(
    await push(request, [
      {
        type: "sign_document",
        documentId: crypto.randomUUID(),
        interventionId,
        equipmentId,
        deviceId,
        kind: "chimney_sweeping_certificate",
        templateVersion: 1,
        number: block.firstNumber,
        signedAt: `${sweptOn}T10:30:00.000Z`,
        data: certificateOf(sweptOn),
      },
      {
        type: "complete_intervention",
        interventionId,
        completion: { completedOn: sweptOn, paymentMethod: "check", paidAmountCents: 9000 },
      },
    ]),
  ).toEqual(["applied", "applied"]);
  return customerId;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const calendarDateFromToday = ({ months = 0, days = 0 }) => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + months);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
};
