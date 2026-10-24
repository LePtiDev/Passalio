import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createChimneySweepingOrganization,
  impersonate,
  joinOrganization,
  jsonBody,
  userIdOf,
} from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const service = z.strictObject({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  priceCents: z.number().nullable(),
  document: z.string(),
  trade: z.string().nullable(),
});
const servicesResponse = z.strictObject({ services: z.array(service) });
const serviceResponse = z.strictObject({ service });
const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const pushResponse = z.object({
  results: z.array(z.object({ id: z.string(), status: z.string(), error: z.string().optional() })),
});
const pullResponse = z
  .object({
    changes: z
      .object({
        interventions: z.array(
          z
            .object({
              id: z.string(),
              technicianUserId: z.string(),
              technicianUserIds: z.array(z.string()),
              serviceLines: z.array(z.unknown()),
            })
            .loose(),
        ),
      })
      .loose(),
  })
  .loose();

type Place = { readonly customerId: string; readonly siteId: string };

const SWEEPING = {
  name: "Ramonage conduit bois",
  durationMinutes: 60,
  priceCents: 8000,
  document: "chimney_sweeping_certificate",
  trade: "chimney_sweeping",
};

const RELINING = {
  name: "Tubage",
  durationMinutes: 2 * 1440,
  priceCents: null,
  document: "none",
  trade: null,
};

let platform: TestPlatform;
let ownerA: string;
let adminA: string;
let secretaryA: string;
let technicianA: string;
let secondTechnicianA: string;
let ownerAUserId: string;
let technicianAUserId: string;
let secondTechnicianAUserId: string;
let ownerB: string;
let ownerBUserId: string;

const servicesOf = async (cookie: string) => {
  const response = await platform.request("/api/services", {}, cookie);
  expect(response.status).toBe(200);
  return servicesResponse.parse(await response.json()).services;
};

const createServiceFor = async (cookie: string, fields: unknown = SWEEPING) => {
  const response = await platform.request("/api/services", jsonBody(fields), cookie);
  expect(response.status).toBe(201);
  return serviceResponse.parse(await response.json()).service;
};

const patchService = (cookie: string, serviceId: string, changes: unknown) =>
  platform.request(`/api/services/${serviceId}`, jsonBody(changes, "PATCH"), cookie);

const archive = (cookie: string, serviceId: string) =>
  platform.request(`/api/services/${serviceId}/archive`, { method: "POST" }, cookie);

const newOwner = async (email: string, name: string) => {
  const cookie = await platform.signIn(email);
  await createChimneySweepingOrganization(platform, cookie, name);
  return cookie;
};

const push = async (cookie: string, mutations: readonly unknown[]) => {
  const response = await platform.request(
    "/api/sync/push",
    jsonBody({ mutations: mutations.map((mutation) => ({ id: crypto.randomUUID(), mutation })) }),
    cookie,
  );
  expect(response.status).toBe(200);
  return pushResponse
    .parse(await response.json())
    .results.map(({ status, error }) => (error === undefined ? status : `${status}:${error}`));
};

const pulledIntervention = async (cookie: string, interventionId: string) => {
  const response = await platform.request("/api/sync/pull", {}, cookie);
  expect(response.status).toBe(200);
  return pullResponse
    .parse(await response.json())
    .changes.interventions.find(({ id }) => id === interventionId);
};

const createPlace = async (cookie: string): Promise<Place> => {
  const place = { customerId: crypto.randomUUID(), siteId: crypto.randomUUID() };
  expect(
    await push(cookie, [
      {
        type: "create_customer",
        customerId: place.customerId,
        customer: { kind: "individual", lastName: "Garnier" },
      },
      {
        type: "add_site",
        siteId: place.siteId,
        customerId: place.customerId,
        site: {
          address: "9 rue de la Mare",
          postalCode: "94170",
          city: "Le Perreux-sur-Marne",
          buildingType: "house",
        },
      },
    ]),
  ).toEqual(["applied", "applied"]);
  return place;
};

const planning = (
  interventionId: string,
  place: Place,
  technicianUserId: string,
  extra: Record<string, unknown> = {},
) => ({
  type: "create_intervention",
  interventionId,
  intervention: {
    customerId: place.customerId,
    siteId: place.siteId,
    technicianUserId,
    scheduledDate: "2026-11-04",
    startTime: "09:00",
    durationMinutes: 60,
    equipmentIds: [],
    ...extra,
  },
});

const lineOf = ({ id, name, durationMinutes, priceCents }: z.infer<typeof service>) => ({
  serviceId: id,
  name,
  durationMinutes,
  priceCents,
});

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-prestations@example.fr");
  const organizationA = await createChimneySweepingOrganization(
    platform,
    ownerA,
    "Ramonage Prestations",
  );
  adminA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "admin-prestations@example.fr",
    role: "admin",
  });
  secretaryA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "secretariat-prestations@example.fr",
    role: "secretary",
  });
  technicianA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "technicien-prestations@example.fr",
    role: "technician",
  });
  secondTechnicianA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "technicien-deux-prestations@example.fr",
    role: "technician",
  });
  ownerB = await newOwner("patron-prestations-concurrent@example.fr", "Ramonage Concurrent");
  ownerAUserId = await userIdOf(platform, ownerA);
  technicianAUserId = await userIdOf(platform, technicianA);
  secondTechnicianAUserId = await userIdOf(platform, secondTechnicianA);
  ownerBUserId = await userIdOf(platform, ownerB);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("GET /api/services", () => {
  it("refuses an anonymous visitor", async () => {
    expect((await platform.request("/api/services")).status).toBe(401);
  });

  it("returns an empty list to a new company", async () => {
    const owner = await newOwner("patron-prestations-neuf@example.fr", "Ramonage Neuf");
    expect(await servicesOf(owner)).toEqual([]);
  });

  it("lets every member of the company read the same services in creation order", async () => {
    const owner = await newOwner("patron-prestations-ordre@example.fr", "Ramonage Ordre");
    const first = await createServiceFor(owner, SWEEPING);
    const second = await createServiceFor(owner, RELINING);
    expect(await servicesOf(owner)).toEqual([first, second]);
    const listed = await servicesOf(ownerA);
    expect(
      await Promise.all([adminA, secretaryA, technicianA].map((cookie) => servicesOf(cookie))),
    ).toEqual([listed, listed, listed]);
  });

  it("lets an impersonated member read the services", async () => {
    const owner = await newOwner("patron-prestations-usurpe-lecture@example.fr", "Usurpé Lecture");
    const created = await createServiceFor(owner);
    await impersonate(platform, owner, "support-prestations-lecture@example.fr");
    expect(await servicesOf(owner)).toEqual([created]);
  });

  it("never lists the services of another company", async () => {
    const created = await createServiceFor(ownerA, { ...SWEEPING, name: "Service privé de A" });
    expect((await servicesOf(ownerB)).map(({ id }) => id)).not.toContain(created.id);
  });
});

describe("POST /api/services", () => {
  it("refuses an anonymous visitor", async () => {
    expect((await platform.request("/api/services", jsonBody(SWEEPING))).status).toBe(401);
  });

  it.each([
    ["owner", () => ownerA],
    ["admin", () => adminA],
  ])("lets the %s add a service, answering 201 with it", async (_role, cookieOf) => {
    const response = await platform.request("/api/services", jsonBody(RELINING), cookieOf());
    expect(response.status).toBe(201);
    const created = serviceResponse.parse(await response.json()).service;
    expect(created).toEqual({ ...RELINING, id: expect.any(String) });
    expect(await servicesOf(technicianA)).toContainEqual(created);
  });

  it.each([
    ["secretary", () => secretaryA],
    ["technician", () => technicianA],
  ])("forbids the %s to add a service", async (_role, cookieOf) => {
    const before = await servicesOf(ownerA);
    const response = await platform.request(
      "/api/services",
      jsonBody({ ...SWEEPING, name: "Interdit" }),
      cookieOf(),
    );
    expect(response.status).toBe(403);
    expect(await servicesOf(ownerA)).toEqual(before);
  });

  it("refuses the creation during an impersonation", async () => {
    const owner = await newOwner("patron-prestations-usurpe@example.fr", "Usurpé Création");
    await impersonate(platform, owner, "support-prestations@example.fr");
    const response = await platform.request("/api/services", jsonBody(SWEEPING), owner);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("impersonation_read_only");
    expect(await servicesOf(owner)).toEqual([]);
  });

  it.each([
    ["an empty name", { ...SWEEPING, name: "" }],
    ["a blank name", { ...SWEEPING, name: "   " }],
    ["a name of more than 80 characters", { ...SWEEPING, name: "a".repeat(81) }],
    ["a duration of 50 minutes", { ...SWEEPING, durationMinutes: 50 }],
    ["a duration of 1500 minutes", { ...SWEEPING, durationMinutes: 1500 }],
    ["a duration of 10 minutes", { ...SWEEPING, durationMinutes: 10 }],
    ["a duration of 9 hours", { ...SWEEPING, durationMinutes: 540 }],
    ["a duration of 11 days", { ...SWEEPING, durationMinutes: 11 * 1440 }],
    ["a negative price", { ...SWEEPING, priceCents: -100 }],
    ["a price in euros with decimals", { ...SWEEPING, priceCents: 80.5 }],
    ["an unknown document", { ...SWEEPING, document: "invoice" }],
    ["an unknown trade", { ...SWEEPING, trade: "plumbing" }],
    ["a missing document", { ...SWEEPING, document: undefined }],
  ])("refuses %s with 400", async (_case, body) => {
    const owner = await newOwner(
      `patron-prestations-invalide-${crypto.randomUUID()}@example.fr`,
      "Ramonage Invalide",
    );
    const response = await platform.request("/api/services", jsonBody(body), owner);
    expect(response.status).toBe(400);
    expect(await servicesOf(owner)).toEqual([]);
  });

  it("accepts the bounds of 15 minutes, 8 hours, 1 day and 10 days", async () => {
    const owner = await newOwner("patron-prestations-bornes@example.fr", "Ramonage Bornes");
    await createServiceFor(owner, { ...SWEEPING, durationMinutes: 15 });
    await createServiceFor(owner, { ...SWEEPING, durationMinutes: 480 });
    await createServiceFor(owner, { ...SWEEPING, durationMinutes: 1440 });
    await createServiceFor(owner, { ...SWEEPING, durationMinutes: 10 * 1440 });
    expect((await servicesOf(owner)).map(({ durationMinutes }) => durationMinutes)).toEqual([
      15,
      480,
      1440,
      10 * 1440,
    ]);
  });

  it("trims the name of the service", async () => {
    const owner = await newOwner("patron-prestations-espaces@example.fr", "Ramonage Espaces");
    expect((await createServiceFor(owner, { ...SWEEPING, name: "  Ramonage  " })).name).toBe(
      "Ramonage",
    );
  });
});

describe("PATCH /api/services/:serviceId", () => {
  it("refuses an anonymous visitor", async () => {
    const created = await createServiceFor(ownerA);
    expect(
      (await platform.request(`/api/services/${created.id}`, jsonBody({ priceCents: 1 }, "PATCH")))
        .status,
    ).toBe(401);
  });

  it.each([
    ["owner", () => ownerA],
    ["admin", () => adminA],
  ])("lets the %s change the price and returns the whole service", async (_role, cookieOf) => {
    const created = await createServiceFor(ownerA);
    const response = await patchService(cookieOf(), created.id, { priceCents: 9500 });
    expect(response.status).toBe(200);
    expect(serviceResponse.parse(await response.json()).service).toEqual({
      ...created,
      priceCents: 9500,
    });
    expect(await servicesOf(secretaryA)).toContainEqual({ ...created, priceCents: 9500 });
  });

  it("sets a service on quotation and removes its trade", async () => {
    const created = await createServiceFor(ownerA);
    expect((await patchService(ownerA, created.id, { priceCents: null, trade: null })).status).toBe(
      200,
    );
    expect(await servicesOf(ownerA)).toContainEqual({ ...created, priceCents: null, trade: null });
  });

  it.each([
    ["secretary", () => secretaryA],
    ["technician", () => technicianA],
  ])("forbids the %s to change a service", async (_role, cookieOf) => {
    const created = await createServiceFor(ownerA);
    expect((await patchService(cookieOf(), created.id, { priceCents: 1 })).status).toBe(403);
    expect(await servicesOf(ownerA)).toContainEqual(created);
  });

  it("refuses the change during an impersonation", async () => {
    const owner = await newOwner("patron-prestations-usurpe-modif@example.fr", "Usurpé Modif");
    const created = await createServiceFor(owner);
    await impersonate(platform, owner, "support-prestations-modif@example.fr");
    expect((await patchService(owner, created.id, { priceCents: 1 })).status).toBe(403);
    expect(await servicesOf(owner)).toEqual([created]);
  });

  it.each([
    ["an unknown key", { priceCents: 9000, color: "red" }],
    ["a duration of 50 minutes", { durationMinutes: 50 }],
    ["a duration of 1500 minutes", { durationMinutes: 1500 }],
    ["an empty name", { name: "" }],
    ["a price given as text", { priceCents: "90" }],
  ])("refuses %s with 400", async (_case, changes) => {
    const created = await createServiceFor(ownerA);
    expect((await patchService(ownerA, created.id, changes)).status).toBe(400);
    expect(await servicesOf(ownerA)).toContainEqual(created);
  });

  it("refuses an identifier that is not a uuid with 400", async () => {
    expect((await patchService(ownerA, "not-a-uuid", { priceCents: 1 })).status).toBe(400);
  });

  it("answers 404 for an unknown service", async () => {
    const response = await patchService(ownerA, crypto.randomUUID(), { priceCents: 1 });
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("service_not_found");
  });

  it("answers 404 for a service of another company and leaves it unchanged", async () => {
    const created = await createServiceFor(ownerA);
    const response = await patchService(ownerB, created.id, { priceCents: 1 });
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("service_not_found");
    expect(await servicesOf(ownerA)).toContainEqual(created);
  });

  it("answers 404 for an archived service", async () => {
    const created = await createServiceFor(ownerA);
    expect((await archive(ownerA, created.id)).status).toBe(204);
    expect((await patchService(ownerA, created.id, { priceCents: 1 })).status).toBe(404);
  });
});

describe("POST /api/services/:serviceId/archive", () => {
  it("refuses an anonymous visitor", async () => {
    const created = await createServiceFor(ownerA);
    expect(
      (await platform.request(`/api/services/${created.id}/archive`, { method: "POST" })).status,
    ).toBe(401);
  });

  it.each([
    ["owner", () => ownerA],
    ["admin", () => adminA],
  ])("lets the %s archive a service, which leaves the list", async (_role, cookieOf) => {
    const created = await createServiceFor(ownerA);
    const response = await archive(cookieOf(), created.id);
    expect(response.status).toBe(204);
    expect((await servicesOf(ownerA)).map(({ id }) => id)).not.toContain(created.id);
  });

  it.each([
    ["secretary", () => secretaryA],
    ["technician", () => technicianA],
  ])("forbids the %s to archive a service", async (_role, cookieOf) => {
    const created = await createServiceFor(ownerA);
    expect((await archive(cookieOf(), created.id)).status).toBe(403);
    expect(await servicesOf(ownerA)).toContainEqual(created);
  });

  it("refuses to archive during an impersonation", async () => {
    const owner = await newOwner("patron-prestations-usurpe-archive@example.fr", "Usurpé Archive");
    const created = await createServiceFor(owner);
    await impersonate(platform, owner, "support-prestations-archive@example.fr");
    expect((await archive(owner, created.id)).status).toBe(403);
    expect(await servicesOf(owner)).toEqual([created]);
  });

  it("answers 404 for an unknown service", async () => {
    const response = await archive(ownerA, crypto.randomUUID());
    expect(response.status).toBe(404);
    expect(errorResponse.parse(await response.json()).error).toBe("service_not_found");
  });

  it("answers 404 for a service already archived", async () => {
    const created = await createServiceFor(ownerA);
    expect((await archive(ownerA, created.id)).status).toBe(204);
    expect((await archive(ownerA, created.id)).status).toBe(404);
  });

  it("answers 404 for a service of another company and leaves it listed", async () => {
    const created = await createServiceFor(ownerA);
    expect((await archive(ownerB, created.id)).status).toBe(404);
    expect(await servicesOf(ownerA)).toContainEqual(created);
  });
});

describe("visits with services and several technicians through the sync", () => {
  it("pushes a visit with service lines and two technicians and pulls them back", async () => {
    const sweeping = await createServiceFor(ownerA);
    const relining = await createServiceFor(ownerA, RELINING);
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, technicianAUserId, {
          technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
          serviceLines: [lineOf(sweeping), lineOf(relining)],
        }),
      ]),
    ).toEqual(["applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      technicianUserId: technicianAUserId,
      technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
      serviceLines: [lineOf(sweeping), lineOf(relining)],
    });
  });

  it("pulls the lead alone and no service line for a visit pushed without them", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(await push(ownerA, [planning(interventionId, place, ownerAUserId)])).toEqual([
      "applied",
    ]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      technicianUserIds: [ownerAUserId],
      serviceLines: [],
    });
  });

  it("keeps the price of a line as booked when the service price changes later", async () => {
    const sweeping = await createServiceFor(ownerA);
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, ownerAUserId, { serviceLines: [lineOf(sweeping)] }),
    ]);
    expect((await patchService(ownerA, sweeping.id, { priceCents: 12_000 })).status).toBe(200);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      serviceLines: [lineOf(sweeping)],
    });
  });

  it("rejects a visit with an unknown service", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, {
          serviceLines: [
            { ...lineOf(await createServiceFor(ownerA)), serviceId: crypto.randomUUID() },
          ],
        }),
      ]),
    ).toEqual(["rejected:service_not_found"]);
    expect(await pulledIntervention(ownerA, interventionId)).toBeUndefined();
  });

  it("rejects a visit with a service of another company", async () => {
    const foreign = await createServiceFor(ownerB);
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, { serviceLines: [lineOf(foreign)] }),
      ]),
    ).toEqual(["rejected:service_not_found"]);
    expect(await pulledIntervention(ownerA, interventionId)).toBeUndefined();
  });

  it("rejects a visit with a technician of another company", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, {
          technicianUserIds: [ownerAUserId, ownerBUserId],
        }),
      ]),
    ).toEqual(["rejected:technician_not_member"]);
    expect(await pulledIntervention(ownerA, interventionId)).toBeUndefined();
  });

  it("collapses duplicated technicians and service lines", async () => {
    const sweeping = await createServiceFor(ownerA);
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, technicianAUserId, {
          technicianUserIds: [technicianAUserId, secondTechnicianAUserId, secondTechnicianAUserId],
          serviceLines: [lineOf(sweeping), lineOf(sweeping)],
        }),
      ]),
    ).toEqual(["applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
      serviceLines: [lineOf(sweeping)],
    });
  });

  it("lets the second technician update and complete a shared visit", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, technicianAUserId, {
        technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
      }),
    ]);
    expect(
      await push(secondTechnicianA, [
        { type: "update_intervention", interventionId, changes: { durationMinutes: 90 } },
        {
          type: "complete_intervention",
          interventionId,
          completion: { completedOn: "2026-11-04" },
        },
      ]),
    ).toEqual(["applied", "applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      durationMinutes: 90,
      status: "completed",
    });
  });

  it("refuses that the second technician removes himself from a shared visit", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, technicianAUserId, {
        technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
      }),
    ]);
    expect(
      await push(secondTechnicianA, [
        {
          type: "update_intervention",
          interventionId,
          changes: { technicianUserIds: [technicianAUserId] },
        },
      ]),
    ).toEqual(["rejected:forbidden"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
    });
  });

  it("changes the technicians and service lines of a visit", async () => {
    const sweeping = await createServiceFor(ownerA);
    const relining = await createServiceFor(ownerA, RELINING);
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, technicianAUserId, { serviceLines: [lineOf(sweeping)] }),
    ]);
    expect(
      await push(secretaryA, [
        {
          type: "update_intervention",
          interventionId,
          changes: {
            technicianUserIds: [secondTechnicianAUserId, technicianAUserId],
            serviceLines: [lineOf(relining)],
          },
        },
      ]),
    ).toEqual(["applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      technicianUserId: secondTechnicianAUserId,
      technicianUserIds: [secondTechnicianAUserId, technicianAUserId],
      serviceLines: [lineOf(relining)],
    });
  });

  it("does not show a shared visit to another company", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, technicianAUserId, {
        technicianUserIds: [technicianAUserId, secondTechnicianAUserId],
      }),
    ]);
    expect(await pulledIntervention(ownerB, interventionId)).toBeUndefined();
  });
});
