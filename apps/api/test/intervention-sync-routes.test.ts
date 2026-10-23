import { MAX_DOCUMENT_NUMBER, numberBlockResponse } from "@passalio/shared";
import { chimneySweepingCertificate, type ChimneySweepingCertificate } from "@passalio/trades";
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

const pushResponse = z.object({
  results: z.array(z.object({ id: z.string(), status: z.string(), error: z.string().optional() })),
});
const interventionRow = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    technicianUserId: z.string(),
    status: z.string(),
    completedOn: z.string().nullable(),
  })
  .loose();
const documentRow = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    number: z.number(),
    numberPrefix: z.string(),
    signedByUserId: z.string(),
    data: z.record(z.string(), z.unknown()),
  })
  .loose();
const equipmentRow = z
  .object({
    id: z.string(),
    lastSweepingOn: z.string().nullable(),
    nextDueDate: z.string().nullable(),
  })
  .loose();
const pullResponse = z.object({
  changes: z.object({
    equipments: z.array(equipmentRow),
    interventions: z.array(interventionRow),
    documents: z.array(documentRow),
  }),
  cursor: z.string(),
  hasMore: z.boolean(),
});

type Place = {
  readonly customerId: string;
  readonly siteId: string;
  readonly equipmentId: string;
};

type Signature = {
  readonly documentId: string;
  readonly interventionId: string;
  readonly equipmentId: string;
  readonly number: number;
  readonly data: ChimneySweepingCertificate;
};

const NUMBER_PREFIX = "RAM-";
const DEVICE_ID = "0190f3a0-0000-7000-8000-0000000d0002";
const SIGNATURE_IMAGE = "data:image/png;base64,iVBORw0KGgo=";
const VISITED_ON = "2026-10-20";
const NEXT_DUE_DATE = "2027-10-20";

let platform: TestPlatform;
let ownerA: string;
let ownerAUserId: string;
let technicianA: string;
let technicianAUserId: string;
let secretaryA: string;
let ownerB: string;
let ownerBUserId: string;

const certificate = (
  overrides: Partial<ChimneySweepingCertificate> = {},
): ChimneySweepingCertificate => ({
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
  customer: { name: "Hélène Garnier", address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne" },
  site: { address: "9 rue de la Mare, 94170 Le Perreux-sur-Marne", room: "Salon" },
  equipment: {
    kind: "insert",
    energy: "wood_logs",
    brand: "Invicta",
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
  visitedOn: VISITED_ON,
  completedOn: VISITED_ON,
  lastSweepingOn: null,
  lastServiceOn: null,
  isAdviceAttached: true,
  technicianSignature: SIGNATURE_IMAGE,
  customerSignature: SIGNATURE_IMAGE,
  isCustomerAbsent: false,
  ...overrides,
});

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

const pull = async (cookie: string, cursor?: string) => {
  const query = cursor === undefined ? "" : `?cursor=${cursor}`;
  const response = await platform.request(`/api/sync/pull${query}`, {}, cookie);
  expect(response.status).toBe(200);
  return pullResponse.parse(await response.json());
};

const reserveBlock = async (cookie: string) => {
  const response = await platform.request(
    "/api/document-number-blocks",
    jsonBody({ deviceId: DEVICE_ID }),
    cookie,
  );
  expect(response.status).toBe(201);
  return numberBlockResponse.parse(await response.json());
};

const createPlace = async (cookie: string): Promise<Place> => {
  const place = {
    customerId: crypto.randomUUID(),
    siteId: crypto.randomUUID(),
    equipmentId: crypto.randomUUID(),
  };
  const results = await push(cookie, [
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
    {
      type: "add_equipment",
      equipmentId: place.equipmentId,
      siteId: place.siteId,
      equipment: { kind: "insert", details: { flueType: "lined_masonry" } },
    },
  ]);
  expect(results).toEqual(["applied", "applied", "applied"]);
  return place;
};

const planning = (interventionId: string, place: Place, technicianUserId: string) => ({
  type: "create_intervention",
  interventionId,
  intervention: {
    customerId: place.customerId,
    siteId: place.siteId,
    technicianUserId,
    scheduledDate: VISITED_ON,
    startTime: "09:00",
    durationMinutes: 60,
    equipmentIds: [place.equipmentId],
  },
});

const planIntervention = async (cookie: string, place: Place, technicianUserId: string) => {
  const interventionId = crypto.randomUUID();
  expect(await push(cookie, [planning(interventionId, place, technicianUserId)])).toEqual([
    "applied",
  ]);
  return interventionId;
};

const signing = ({ documentId, interventionId, equipmentId, number, data }: Signature) => ({
  type: "sign_document",
  documentId,
  interventionId,
  equipmentId,
  deviceId: DEVICE_ID,
  kind: "chimney_sweeping_certificate",
  templateVersion: 1,
  number,
  signedAt: "2026-10-20T10:30:00.000Z",
  data,
});

const plannedVisit = async (cookie: string, technicianUserId: string) => {
  const place = await createPlace(cookie);
  const interventionId = await planIntervention(cookie, place, technicianUserId);
  return { place, interventionId };
};

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-interventions@example.fr");
  const organizationA = await createChimneySweepingOrganization(
    platform,
    ownerA,
    "Ramonage Interventions",
  );
  await platform.env.DB.prepare("UPDATE organizations SET document_number_prefix = ? WHERE id = ?")
    .bind(NUMBER_PREFIX, organizationA)
    .run();
  technicianA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "technicien-interventions@example.fr",
    role: "technician",
  });
  secretaryA = await joinOrganization(platform, {
    ownerCookie: ownerA,
    organizationId: organizationA,
    email: "secretariat-interventions@example.fr",
    role: "secretary",
  });
  ownerB = await platform.signIn("patron-concurrent@example.fr");
  await createChimneySweepingOrganization(platform, ownerB, "Ramonage Concurrent");
  ownerAUserId = await userIdOf(platform, ownerA);
  technicianAUserId = await userIdOf(platform, technicianA);
  ownerBUserId = await userIdOf(platform, ownerB);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("offline intervention and certificate", () => {
  it("signs a certificate pushed offline and pulls the intervention, the document and the next due date", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const documentId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        signing({
          documentId,
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate(),
        }),
        {
          type: "complete_intervention",
          interventionId,
          completion: { completedOn: VISITED_ON, paymentMethod: "check", paidAmountCents: 9000 },
        },
      ]),
    ).toEqual(["applied", "applied"]);

    const { changes } = await pull(ownerA);
    expect(changes.interventions.find(({ id }) => id === interventionId)).toMatchObject({
      status: "completed",
      completedOn: VISITED_ON,
      technicianUserId: ownerAUserId,
    });
    expect(changes.documents.find(({ id }) => id === documentId)).toMatchObject({
      number: block.firstNumber,
      numberPrefix: NUMBER_PREFIX,
      signedByUserId: ownerAUserId,
      data: certificate(),
    });
    expect(changes.equipments.find(({ id }) => id === place.equipmentId)).toMatchObject({
      lastSweepingOn: VISITED_ON,
      nextDueDate: NEXT_DUE_DATE,
    });
  });

  it("refuses pushes during an impersonation", async () => {
    const impersonated = await platform.signIn("patron-usurpe-sync@example.fr");
    await createChimneySweepingOrganization(platform, impersonated, "Ramonage Usurpé");
    const place = await createPlace(impersonated);
    await impersonate(platform, impersonated, "support-sync@example.fr");
    const response = await platform.request(
      "/api/sync/push",
      jsonBody({
        mutations: [
          {
            id: crypto.randomUUID(),
            mutation: planning(crypto.randomUUID(), place, crypto.randomUUID()),
          },
        ],
      }),
      impersonated,
    );
    expect(response.status).toBe(403);
    const interventions = await platform.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM interventions WHERE site_id = ?",
    )
      .bind(place.siteId)
      .first();
    expect(interventions).toEqual({ total: 0 });
  });
});

describe("signed documents", () => {
  it("accepts the same signature again without changing the signed document", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const signature = {
      documentId: crypto.randomUUID(),
      interventionId,
      equipmentId: place.equipmentId,
      number: block.firstNumber,
      data: certificate(),
    };
    expect(await push(ownerA, [signing(signature)])).toEqual(["applied"]);
    expect(
      await push(ownerA, [
        signing({
          ...signature,
          data: certificate({ technician: { name: "Faussaire" }, anomalies: "Ajout tardif" }),
        }),
      ]),
    ).toEqual(["applied"]);

    const pulled = (await pull(ownerA)).changes.documents.find(
      ({ id }) => id === signature.documentId,
    );
    expect(chimneySweepingCertificate.parse(pulled?.data)).toEqual(certificate());
  });

  it("refuses another document with a number already used", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const signature = {
      interventionId,
      equipmentId: place.equipmentId,
      number: block.firstNumber,
      data: certificate(),
    };
    expect(
      await push(ownerA, [
        signing({ ...signature, documentId: crypto.randomUUID() }),
        signing({ ...signature, documentId: crypto.randomUUID() }),
      ]),
    ).toEqual(["applied", "rejected:number_taken"]);
  });

  it("refuses a number that was never reserved", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    await reserveBlock(ownerA);
    expect(
      await push(ownerA, [
        signing({
          documentId: crypto.randomUUID(),
          interventionId,
          equipmentId: place.equipmentId,
          number: MAX_DOCUMENT_NUMBER,
          data: certificate(),
        }),
      ]),
    ).toEqual(["rejected:number_not_reserved"]);
  });
});

describe("certificate rules through sync", () => {
  it("refuses a partial sweeping without the unswept part and keeps the number free", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const signature = {
      interventionId,
      equipmentId: place.equipmentId,
      number: block.firstNumber,
    };
    expect(
      await push(ownerA, [
        signing({
          ...signature,
          documentId: crypto.randomUUID(),
          data: certificate({ sweepingExtent: "partial", unsweptPart: null }),
        }),
        signing({ ...signature, documentId: crypto.randomUUID(), data: certificate() }),
      ]),
    ).toEqual(["rejected:unswept_part_required", "applied"]);
  });

  it("refuses a certificate for an insert without the usage advice", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    expect(
      await push(ownerA, [
        signing({
          documentId: crypto.randomUUID(),
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate({ isAdviceAttached: false }),
        }),
      ]),
    ).toEqual(["rejected:advice_required"]);
  });
});

describe("isolation between organizations", () => {
  it("never lets another organization change an intervention", async () => {
    const { interventionId } = await plannedVisit(ownerA, ownerAUserId);
    expect(
      await push(ownerB, [
        {
          type: "update_intervention",
          interventionId,
          changes: { notes: "Pirate", technicianUserId: ownerBUserId },
        },
        { type: "cancel_intervention", interventionId },
        {
          type: "complete_intervention",
          interventionId,
          completion: { completedOn: VISITED_ON },
        },
      ]),
    ).toEqual([
      "rejected:intervention_not_found",
      "rejected:intervention_not_found",
      "rejected:intervention_not_found",
    ]);
    const intervention = (await pull(ownerA)).changes.interventions.find(
      ({ id }) => id === interventionId,
    );
    expect(intervention).toMatchObject({ status: "planned", technicianUserId: ownerAUserId });
    expect(intervention?.["notes"]).toBeNull();
  });

  it("never lets another organization sign on its intervention and equipment", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerB);
    expect(
      await push(ownerB, [
        signing({
          documentId: crypto.randomUUID(),
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["rejected:intervention_not_found"]);
    const equipment = (await pull(ownerA)).changes.equipments.find(
      ({ id }) => id === place.equipmentId,
    );
    expect(equipment).toMatchObject({ lastSweepingOn: null, nextDueDate: null });
  });

  it("never lets another organization use its reserved numbers", async () => {
    const blockOfA = await reserveBlock(ownerA);
    const { place, interventionId } = await plannedVisit(ownerB, ownerBUserId);
    await reserveBlock(ownerB);
    expect(
      await push(ownerB, [
        signing({
          documentId: crypto.randomUUID(),
          interventionId,
          equipmentId: place.equipmentId,
          number: blockOfA.lastNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["rejected:number_not_reserved"]);
  });

  it("pulls none of the interventions and documents of another organization", async () => {
    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const documentId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        signing({
          documentId,
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["applied"]);
    const ownA = await pull(ownerA);
    const organizationA = ownA.changes.interventions[0]?.organizationId;
    expect(organizationA).toBeDefined();

    const { changes } = await pull(ownerB);
    const idsOfA = new Set([
      ...ownA.changes.interventions.map(({ id }) => id),
      ...ownA.changes.documents.map(({ id }) => id),
    ]);
    expect(changes.interventions.filter(({ id }) => idsOfA.has(id))).toEqual([]);
    expect(changes.documents.filter(({ id }) => idsOfA.has(id))).toEqual([]);
    expect(
      [...changes.interventions, ...changes.documents].filter(
        (row) => row.organizationId === organizationA,
      ),
    ).toEqual([]);
  });
});

describe("roles", () => {
  it("lets a technician plan only his own interventions", async () => {
    const place = await createPlace(ownerA);
    const forOwner = crypto.randomUUID();
    const forHimself = crypto.randomUUID();
    expect(
      await push(technicianA, [
        planning(forOwner, place, ownerAUserId),
        planning(forHimself, place, technicianAUserId),
      ]),
    ).toEqual(["rejected:forbidden", "applied"]);
    const ids = (await pull(ownerA)).changes.interventions.map(({ id }) => id);
    expect(ids).toContain(forHimself);
    expect(ids).not.toContain(forOwner);
  });

  it("refuses that a technician cancels or completes the intervention of someone else", async () => {
    const { interventionId } = await plannedVisit(ownerA, ownerAUserId);
    expect(
      await push(technicianA, [
        { type: "cancel_intervention", interventionId },
        {
          type: "complete_intervention",
          interventionId,
          completion: { completedOn: VISITED_ON },
        },
      ]),
    ).toEqual(["rejected:forbidden", "rejected:forbidden"]);
  });

  it("lets the secretary plan for a technician but never sign", async () => {
    const place = await createPlace(secretaryA);
    const interventionId = crypto.randomUUID();
    expect(await push(secretaryA, [planning(interventionId, place, technicianAUserId)])).toEqual([
      "applied",
    ]);
    const block = await reserveBlock(ownerA);
    expect(
      await push(secretaryA, [
        signing({
          documentId: crypto.randomUUID(),
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["rejected:forbidden"]);
  });

  it("pulls only the documents the technician signed, while the owner pulls them all", async () => {
    const technicianVisit = await plannedVisit(technicianA, technicianAUserId);
    const technicianBlock = await reserveBlock(technicianA);
    const technicianDocument = crypto.randomUUID();
    expect(
      await push(technicianA, [
        signing({
          documentId: technicianDocument,
          interventionId: technicianVisit.interventionId,
          equipmentId: technicianVisit.place.equipmentId,
          number: technicianBlock.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["applied"]);
    const ownerVisit = await plannedVisit(ownerA, ownerAUserId);
    const ownerBlock = await reserveBlock(ownerA);
    const ownerDocument = crypto.randomUUID();
    expect(
      await push(ownerA, [
        signing({
          documentId: ownerDocument,
          interventionId: ownerVisit.interventionId,
          equipmentId: ownerVisit.place.equipmentId,
          number: ownerBlock.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["applied"]);

    const technicianDocuments = (await pull(technicianA)).changes.documents;
    expect(technicianDocuments.map(({ id }) => id)).toEqual([technicianDocument]);
    const ownerDocuments = (await pull(ownerA)).changes.documents.map(({ id }) => id);
    expect(ownerDocuments).toEqual(expect.arrayContaining([technicianDocument, ownerDocument]));
  });
});

describe("pull cursor", () => {
  it("returns only the interventions and documents changed after the cursor", async () => {
    const first = await pull(ownerA);
    expect(first.changes.interventions.length).toBeGreaterThan(0);
    expect(first.changes.documents.length).toBeGreaterThan(0);
    const unchanged = await pull(ownerA, first.cursor);
    expect(unchanged.changes.interventions).toEqual([]);
    expect(unchanged.changes.documents).toEqual([]);

    const { place, interventionId } = await plannedVisit(ownerA, ownerAUserId);
    const block = await reserveBlock(ownerA);
    const documentId = crypto.randomUUID();
    expect(
      await push(ownerA, [
        signing({
          documentId,
          interventionId,
          equipmentId: place.equipmentId,
          number: block.firstNumber,
          data: certificate(),
        }),
      ]),
    ).toEqual(["applied"]);
    const next = await pull(ownerA, first.cursor);
    expect(next.changes.interventions.map(({ id }) => id)).toEqual([interventionId]);
    expect(next.changes.documents.map(({ id }) => id)).toEqual([documentId]);
  });
});
