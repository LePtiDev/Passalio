import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import {
  certificateBody,
  insertEquipment,
  numberBlock,
  sampleIssuer,
} from "@/test-support/certificate-records";
import { saveIssuer } from "./issuer-store";
import { signCertificates } from "./sign-certificate";

const requested = vi.hoisted(() => ({ databases: new Set<unknown>() }));

vi.mock("@/lib/sync/sync-scheduler", () => ({
  requestSync: (database: unknown) => requested.databases.add(database),
}));

const EQUIPMENT_ID = "0190f3a0-0000-7000-8000-00000000e001";
const SIGNED_AT = new Date("2026-10-23T09:30:00.000Z");

let database: LocalDatabase;

const signVisit = () =>
  signCertificates(database, {
    organizationId: "organization-1",
    userId: "user-1",
    interventionId: "0190f3a0-0000-7000-8000-00000000a001",
    signedAt: SIGNED_AT,
    certificates: [
      {
        documentId: "0190f3a0-0000-7000-8000-000000000001",
        equipment: insertEquipment(EQUIPMENT_ID),
        body: certificateBody(),
      },
    ],
  });

beforeEach(async () => {
  requested.databases.clear();
  database = createTestDatabase();
  await database.equipments.put(insertEquipment(EQUIPMENT_ID));
  await database.numberBlocks.put(numberBlock());
});

describe("signCertificates", () => {
  it("asks for a sync once the certificates are signed, so they reach the server at once", async () => {
    await saveIssuer(database, sampleIssuer(), SIGNED_AT);
    expect((await signVisit()).isOk).toBe(true);
    expect(requested.databases.has(database)).toBe(true);
  });

  it("asks for nothing when the signature is refused", async () => {
    expect(await signVisit()).toMatchObject({ isOk: false, error: "issuer_missing" });
    expect(requested.databases.size).toBe(0);
  });
});
