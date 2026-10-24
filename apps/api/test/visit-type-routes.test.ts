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

const visitTypesResponse = z.strictObject({
  visitTypes: z.array(z.strictObject({ type: z.string(), minutes: z.number() })),
});
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
              durationMinutes: z.number(),
              visitTypes: z.array(z.string()),
            })
            .loose(),
        ),
      })
      .loose(),
  })
  .loose();

type Place = { readonly customerId: string; readonly siteId: string };

const DEFAULT_VISIT_TYPES = [
  { type: "chimney_sweeping", minutes: 60 },
  { type: "stove_maintenance", minutes: 90 },
];

let platform: TestPlatform;
let ownerA: string;
let ownerAUserId: string;
let adminA: string;
let secretaryA: string;
let technicianA: string;
let ownerB: string;

const visitTypesOf = async (cookie: string) => {
  const response = await platform.request("/api/visit-types", {}, cookie);
  expect(response.status).toBe(200);
  return visitTypesResponse.parse(await response.json()).visitTypes;
};

const changeDurations = (cookie: string, body: unknown) =>
  platform.request("/api/visit-types/durations", jsonBody(body, "PATCH"), cookie);

const storedDurationsOf = async (cookie: string) => {
  const response = await platform.request("/api/organization", {}, cookie);
  const { organization } = z
    .object({ organization: z.object({ id: z.string() }) })
    .parse(await response.json());
  const row = await platform.env.DB.prepare(
    "SELECT visit_durations FROM organizations WHERE id = ?",
  )
    .bind(organization.id)
    .first();
  return z.object({ visit_durations: z.string() }).parse(row).visit_durations;
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

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-types-passage@example.fr");
  const organizationA = await createChimneySweepingOrganization(platform, ownerA, "Ramonage Types");
  await platform.request(
    "/api/organization",
    jsonBody({ trades: ["chimney_sweeping", "stove_maintenance"] }, "PATCH"),
    ownerA,
  );
  adminA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "admin-types-passage@example.fr",
    role: "admin",
  });
  secretaryA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "secretariat-types-passage@example.fr",
    role: "secretary",
  });
  technicianA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "technicien-types-passage@example.fr",
    role: "technician",
  });
  ownerB = await platform.signIn("patron-types-concurrent@example.fr");
  await createChimneySweepingOrganization(platform, ownerB, "Ramonage Types Concurrent");
  ownerAUserId = await userIdOf(platform, ownerA);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("GET /api/visit-types", () => {
  it("refuses an anonymous visitor", async () => {
    expect((await platform.request("/api/visit-types")).status).toBe(401);
  });

  it("lists one visit type per trade of a new company, with the default durations", async () => {
    const owner = await platform.signIn("patron-types-neuf@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Neuf");
    expect(await visitTypesOf(owner)).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
  });

  it("returns no visit type to a company without trade", async () => {
    const owner = await platform.signIn("patron-types-sans-metier@example.fr");
    const created = await platform.request(
      "/api/organizations",
      jsonBody({ name: "Entreprise Sans Métier" }),
      owner,
    );
    const { organization } = z
      .object({ organization: z.object({ id: z.string() }) })
      .parse(await created.json());
    await platform.setActiveOrganization(owner, organization.id);
    expect(await visitTypesOf(owner)).toEqual([]);
  });

  it("lets every member of the company read the same visit types", async () => {
    const expected = await visitTypesOf(ownerA);
    expect(expected.map(({ type }) => type)).toEqual(["chimney_sweeping", "stove_maintenance"]);
    expect(
      await Promise.all([adminA, secretaryA, technicianA].map((cookie) => visitTypesOf(cookie))),
    ).toEqual([expected, expected, expected]);
  });

  it("lets an impersonated member read the visit types", async () => {
    const owner = await platform.signIn("patron-types-usurpe-lecture@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Usurpé Lecture");
    await impersonate(platform, owner, "support-types-lecture@example.fr");
    expect(await visitTypesOf(owner)).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
  });
});

describe("PATCH /api/visit-types/durations", () => {
  it("refuses an anonymous visitor", async () => {
    expect(
      (
        await platform.request(
          "/api/visit-types/durations",
          jsonBody({ chimney_sweeping: 45 }, "PATCH"),
        )
      ).status,
    ).toBe(401);
  });

  it("lets the owner change a duration, merged with the others and kept after reading again", async () => {
    const owner = await platform.signIn("patron-types-fusion@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Fusion");
    expect(
      (
        await platform.request(
          "/api/organization",
          jsonBody({ trades: ["chimney_sweeping", "stove_maintenance"] }, "PATCH"),
          owner,
        )
      ).ok,
    ).toBe(true);
    expect(await visitTypesOf(owner)).toEqual(DEFAULT_VISIT_TYPES);

    const first = await changeDurations(owner, { chimney_sweeping: 45 });
    expect(first.status).toBe(200);
    expect(visitTypesResponse.parse(await first.json()).visitTypes).toEqual([
      { type: "chimney_sweeping", minutes: 45 },
      { type: "stove_maintenance", minutes: 90 },
    ]);

    expect((await changeDurations(owner, { stove_maintenance: 120 })).status).toBe(200);
    expect(await visitTypesOf(owner)).toEqual([
      { type: "chimney_sweeping", minutes: 45 },
      { type: "stove_maintenance", minutes: 120 },
    ]);
    expect(JSON.parse(await storedDurationsOf(owner))).toEqual({
      chimney_sweeping: 45,
      stove_maintenance: 120,
    });
  });

  it("lets the administrator change a duration", async () => {
    expect((await changeDurations(adminA, { stove_maintenance: 105 })).status).toBe(200);
    expect(await visitTypesOf(technicianA)).toContainEqual({
      type: "stove_maintenance",
      minutes: 105,
    });
  });

  it.each([
    ["secretary", () => secretaryA],
    ["technician", () => technicianA],
  ])("forbids the %s to change a duration", async (_role, cookieOf) => {
    const before = await visitTypesOf(ownerA);
    const response = await changeDurations(cookieOf(), { chimney_sweeping: 15 });
    expect(response.status).toBe(403);
    expect(await visitTypesOf(ownerA)).toEqual(before);
  });

  it("refuses a type that is not a trade of the company with 422", async () => {
    const before = await storedDurationsOf(ownerA);
    const response = await changeDurations(ownerA, { boiler_maintenance: 60 });
    expect(response.status).toBe(422);
    expect(errorResponse.parse(await response.json()).error).toBe("invalid_visit_type");
    expect(await storedDurationsOf(ownerA)).toBe(before);
  });

  it("refuses the whole change when one type is not a trade of the company", async () => {
    const before = await storedDurationsOf(ownerA);
    const response = await changeDurations(ownerA, {
      chimney_sweeping: 30,
      septic_tank_emptying: 120,
    });
    expect(response.status).toBe(422);
    expect(await storedDurationsOf(ownerA)).toBe(before);
  });

  it.each([
    ["a type that is not a trade at all", { plumbing: 60 }],
    ["a duration shorter than 15 minutes", { chimney_sweeping: 0 }],
    ["a duration longer than 8 hours", { chimney_sweeping: 495 }],
    ["a duration off the 15-minute step", { chimney_sweeping: 50 }],
    ["a duration that is not a whole number", { chimney_sweeping: 52.5 }],
    ["a duration given as text", { chimney_sweeping: "60" }],
    ["a list instead of an object", [60]],
  ])("refuses %s", async (_case, body) => {
    const before = await storedDurationsOf(ownerA);
    const response = await changeDurations(ownerA, body);
    expect([400, 422]).toContain(response.status);
    expect(await storedDurationsOf(ownerA)).toBe(before);
  });

  it("accepts the bounds of 15 minutes and 8 hours", async () => {
    const owner = await platform.signIn("patron-types-bornes@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Bornes");
    expect((await changeDurations(owner, { chimney_sweeping: 15 })).status).toBe(200);
    expect(await visitTypesOf(owner)).toEqual([{ type: "chimney_sweeping", minutes: 15 }]);
    expect((await changeDurations(owner, { chimney_sweeping: 480 })).status).toBe(200);
    expect(await visitTypesOf(owner)).toEqual([{ type: "chimney_sweeping", minutes: 480 }]);
  });

  it("changes only the durations of the member's company", async () => {
    const before = await visitTypesOf(ownerB);
    expect((await changeDurations(ownerA, { chimney_sweeping: 75 })).status).toBe(200);
    expect(await visitTypesOf(ownerB)).toEqual(before);
    expect(await visitTypesOf(ownerB)).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
    expect(await visitTypesOf(ownerA)).toContainEqual({ type: "chimney_sweeping", minutes: 75 });
  });

  it("judges the types against the trades of the member's company", async () => {
    const response = await changeDurations(ownerB, { stove_maintenance: 60 });
    expect(response.status).toBe(422);
    expect(await visitTypesOf(ownerB)).toEqual([{ type: "chimney_sweeping", minutes: 60 }]);
  });

  it("refuses the change during an impersonation", async () => {
    const owner = await platform.signIn("patron-types-usurpe@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Usurpé Types");
    await impersonate(platform, owner, "support-types@example.fr");
    const response = await changeDurations(owner, { chimney_sweeping: 30 });
    expect(response.status).toBe(403);
    expect(JSON.parse(await storedDurationsOf(owner))).toEqual({});
  });

  it("keeps the duration of the interventions already planned", async () => {
    const owner = await platform.signIn("patron-types-deja-prevu@example.fr");
    await createChimneySweepingOrganization(platform, owner, "Ramonage Déjà Prévu");
    const place = await createPlace(owner);
    const interventionId = crypto.randomUUID();
    expect(
      await push(owner, [
        planning(interventionId, place, await userIdOf(platform, owner), {
          visitTypes: ["chimney_sweeping"],
        }),
      ]),
    ).toEqual(["applied"]);
    expect((await changeDurations(owner, { chimney_sweeping: 120 })).status).toBe(200);
    expect(await pulledIntervention(owner, interventionId)).toMatchObject({
      durationMinutes: 60,
      visitTypes: ["chimney_sweeping"],
    });
  });
});

describe("interventions with visit types through the sync", () => {
  it("pushes an intervention with visit types and pulls them back", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, {
          visitTypes: ["chimney_sweeping", "stove_maintenance"],
          durationMinutes: 150,
        }),
      ]),
    ).toEqual(["applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      durationMinutes: 150,
      visitTypes: ["chimney_sweeping", "stove_maintenance"],
    });
  });

  it("accepts an older mutation without visit types and pulls an empty list", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(await push(ownerA, [planning(interventionId, place, ownerAUserId)])).toEqual([
      "applied",
    ]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({ visitTypes: [] });
  });

  it("keeps a single copy of a visit type pushed twice", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, {
          visitTypes: ["stove_maintenance", "chimney_sweeping", "stove_maintenance"],
        }),
      ]),
    ).toEqual(["applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      visitTypes: ["stove_maintenance", "chimney_sweeping"],
    });
  });

  it("rejects the creation of an intervention with an unknown visit type", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        planning(interventionId, place, ownerAUserId, { visitTypes: ["plumbing"] }),
      ]),
    ).toEqual(["rejected:invalid_visit_type"]);
    expect(await pulledIntervention(ownerA, interventionId)).toBeUndefined();
  });

  it("changes the visit types of an intervention and keeps them when another field changes", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [planning(interventionId, place, ownerAUserId)]);
    expect(
      await push(ownerA, [
        {
          type: "update_intervention",
          interventionId,
          changes: { visitTypes: ["stove_maintenance", "stove_maintenance"] },
        },
        { type: "update_intervention", interventionId, changes: { durationMinutes: 90 } },
      ]),
    ).toEqual(["applied", "applied"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      durationMinutes: 90,
      visitTypes: ["stove_maintenance"],
    });
  });

  it("rejects a change to an unknown visit type and keeps the previous ones", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, ownerAUserId, { visitTypes: ["chimney_sweeping"] }),
    ]);
    expect(
      await push(ownerA, [
        {
          type: "update_intervention",
          interventionId,
          changes: { visitTypes: ["chimney_sweeping", "plumbing"] },
        },
      ]),
    ).toEqual(["rejected:invalid_visit_type"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      visitTypes: ["chimney_sweeping"],
    });
  });

  it("does not show the visit types of an intervention to another company", async () => {
    const place = await createPlace(ownerA);
    const interventionId = crypto.randomUUID();
    await push(ownerA, [
      planning(interventionId, place, ownerAUserId, { visitTypes: ["chimney_sweeping"] }),
    ]);
    expect(await pulledIntervention(ownerB, interventionId)).toBeUndefined();
    expect(
      await push(ownerB, [
        {
          type: "update_intervention",
          interventionId,
          changes: { visitTypes: ["chimney_sweeping", "stove_maintenance"] },
        },
      ]),
    ).toEqual(["rejected:intervention_not_found"]);
    expect(await pulledIntervention(ownerA, interventionId)).toMatchObject({
      visitTypes: ["chimney_sweeping"],
    });
  });
});
