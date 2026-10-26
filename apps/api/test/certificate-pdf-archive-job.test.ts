import { numberBlockResponse } from "@passalio/shared";
import { pdfFingerprint } from "@passalio/pdf";
import type { BrandedChimneySweepingCertificate } from "@passalio/trades";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { archiveSignedCertificatePdfs } from "../src/jobs/archive-certificate-pdfs";
import { createChimneySweepingOrganization, jsonBody, userIdOf } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const DEVICE_ID = "0190f3a0-0000-7000-8000-0000000d0042";
const VISITED_ON = "2026-10-20";
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const pushResponse = z.object({ results: z.array(z.object({ status: z.string() })) });
const documentRow = z.object({ id: z.string(), pdfSha256: z.string().nullable() }).loose();
const pullResponse = z.object({ changes: z.object({ documents: z.array(documentRow) }) });

let platform: TestPlatform;

const certificate = (): BrandedChimneySweepingCertificate => ({
  company: {
    name: "Ramonage Archives",
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
  technicianSignature: PIXEL,
  customerSignature: PIXEL,
  isCustomerAbsent: false,
  branding: {
    template: "banner",
    brandColor: "#0F2A44",
    logo: null,
    contact: { phone: "01 45 00 00 00", email: null, website: null },
    customerMessage: null,
    footerText: null,
  },
});

const push = async (cookie: string, mutations: readonly unknown[]) => {
  const response = await platform.request(
    "/api/sync/push",
    jsonBody({ mutations: mutations.map((mutation) => ({ id: crypto.randomUUID(), mutation })) }),
    cookie,
  );
  expect(response.status).toBe(200);
  return pushResponse.parse(await response.json()).results.map(({ status }) => status);
};

const signedDocuments = async (cookie: string) => {
  const response = await platform.request("/api/sync/pull", {}, cookie);
  expect(response.status).toBe(200);
  return pullResponse.parse(await response.json()).changes.documents;
};

const signCertificate = async (cookie: string) => {
  const userId = await userIdOf(platform, cookie);
  const reserved = await platform.request(
    "/api/document-number-blocks",
    jsonBody({ deviceId: DEVICE_ID }),
    cookie,
  );
  expect(reserved.status).toBe(201);
  const block = numberBlockResponse.parse(await reserved.json());
  const [customerId, siteId, equipmentId, interventionId, documentId] = Array.from(
    { length: 5 },
    () => crypto.randomUUID(),
  );
  const results = await push(cookie, [
    { type: "create_customer", customerId, customer: { kind: "individual", lastName: "Garnier" } },
    {
      type: "add_site",
      siteId,
      customerId,
      site: {
        address: "9 rue de la Mare",
        postalCode: "94170",
        city: "Le Perreux-sur-Marne",
        buildingType: "house",
      },
    },
    {
      type: "add_equipment",
      equipmentId,
      siteId,
      equipment: { kind: "insert", details: { flueType: "lined_masonry" } },
    },
    {
      type: "create_intervention",
      interventionId,
      intervention: {
        customerId,
        siteId,
        technicianUserId: userId,
        scheduledDate: VISITED_ON,
        startTime: "09:00",
        durationMinutes: 60,
        equipmentIds: [equipmentId],
      },
    },
    {
      type: "sign_document",
      documentId,
      interventionId,
      equipmentId,
      deviceId: DEVICE_ID,
      kind: "chimney_sweeping_certificate",
      templateVersion: 2,
      number: block.firstNumber,
      signedAt: "2026-10-20T10:30:00.000Z",
      data: certificate(),
    },
  ]);
  expect(results).toEqual(["applied", "applied", "applied", "applied", "applied"]);
  return documentId ?? "";
};

const organizationIdOf = async (documentId: string) =>
  z
    .object({ organization_id: z.string() })
    .parse(
      await platform.env.DB.prepare("SELECT organization_id FROM documents WHERE id = ?")
        .bind(documentId)
        .first(),
    ).organization_id;

let owner: string;
let documentId: string;

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-archives@example.fr");
  await createChimneySweepingOrganization(platform, owner, "Ramonage Archives");
  documentId = await signCertificate(owner);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("archiving the PDF of signed certificates", () => {
  it("stores the PDF on R2 under the organization and sends its fingerprint to the phones", async () => {
    expect((await signedDocuments(owner)).find(({ id }) => id === documentId)?.pdfSha256).toBe(
      null,
    );

    const run = await archiveSignedCertificatePdfs(platform.env);

    const key = `organizations/${await organizationIdOf(documentId)}/documents/${documentId}.pdf`;
    const stored = await platform.env.FILES.get(key);
    const bytes = new Uint8Array((await stored?.arrayBuffer()) ?? new ArrayBuffer(0));
    const fingerprint = await pdfFingerprint(bytes);
    expect(run.archivedIds).toContain(documentId);
    expect(stored?.httpMetadata?.contentType).toBe("application/pdf");
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect((await signedDocuments(owner)).find(({ id }) => id === documentId)?.pdfSha256).toBe(
      fingerprint,
    );
  });

  it("does not archive a certificate twice, and logs each run without personal data", async () => {
    const run = await archiveSignedCertificatePdfs(platform.env);

    const lines = platform
      .loggedLines()
      .filter((line) => line.includes('"event":"certificate_pdfs_archived"'));
    expect(run.archivedIds).not.toContain(documentId);
    expect(JSON.parse(lines.at(-1) ?? "{}")).toMatchObject({
      level: "info",
      trace_id: expect.any(String),
      archived: 0,
      failures: [],
    });
    expect(lines.join("\n")).not.toContain("Garnier");
  });
});
