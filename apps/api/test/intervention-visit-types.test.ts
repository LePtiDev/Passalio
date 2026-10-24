import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { createChimneySweepingOrganization, jsonBody, userIdOf } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

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

let platform: TestPlatform;
let ownerA: string;
let ownerAUserId: string;
let ownerB: string;

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
  await createChimneySweepingOrganization(platform, ownerA, "Ramonage Types");
  await platform.request(
    "/api/organization",
    jsonBody({ trades: ["chimney_sweeping", "stove_maintenance"] }, "PATCH"),
    ownerA,
  );
  ownerB = await platform.signIn("patron-types-concurrent@example.fr");
  await createChimneySweepingOrganization(platform, ownerB, "Ramonage Types Concurrent");
  ownerAUserId = await userIdOf(platform, ownerA);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
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
