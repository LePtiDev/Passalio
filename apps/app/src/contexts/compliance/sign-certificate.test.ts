import { complianceMutation } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { LocalDatabase } from "@/lib/db/local-database";
import { pendingEntityIds } from "@/lib/db/outbox";
import { createTestDatabase } from "@/lib/db/test-database";
import {
  certificateBody,
  insertEquipment,
  numberBlock,
  sampleIssuer,
} from "@/test-support/certificate-records";
import { saveIssuer } from "./issuer-store";
import { signCertificate, sweptEquipmentOf, type SignCertificateInput } from "./sign-certificate";
import { signingDeviceIdOf } from "./signing-device";

const EQUIPMENT_ID = "0190f3a0-0000-7000-8000-00000000e001";
const INTERVENTION_ID = "0190f3a0-0000-7000-8000-00000000a001";
const documentId = (index: number) => `0190f3a0-0000-7000-8000-${String(index).padStart(12, "0")}`;
const SIGNED_AT = new Date("2026-10-23T09:30:00.000Z");

let database: LocalDatabase;

const input = (overrides: Partial<SignCertificateInput> = {}): SignCertificateInput => ({
  documentId: documentId(1),
  organizationId: "organization-1",
  userId: "user-1",
  interventionId: INTERVENTION_ID,
  equipment: insertEquipment(EQUIPMENT_ID),
  body: certificateBody(),
  signedAt: SIGNED_AT,
  ...overrides,
});

const sign = (overrides: Partial<SignCertificateInput> = {}) =>
  signCertificate(database, input(overrides));

const expectNothingSigned = async () => {
  expect(await database.documents.count()).toBe(0);
  expect(await database.outbox.count()).toBe(0);
};

beforeEach(async () => {
  database = createTestDatabase();
  await database.equipments.put(insertEquipment(EQUIPMENT_ID));
  await database.numberBlocks.put(numberBlock({ firstNumber: 41, lastNumber: 60 }));
  await saveIssuer(database, sampleIssuer(), SIGNED_AT);
});

describe("signCertificate", () => {
  it("stores the certificate with the frozen company and branding", async () => {
    const signed = await sign();
    expect(signed).toMatchObject({
      isOk: true,
      value: {
        id: documentId(1),
        interventionId: INTERVENTION_ID,
        equipmentId: EQUIPMENT_ID,
        templateVersion: 2,
        number: 41,
        numberPrefix: "RD-",
        signedByUserId: "user-1",
        signedAt: "2026-10-23T09:30:00.000Z",
        completedOn: "2026-10-23",
        data: {
          ...certificateBody(),
          company: sampleIssuer().company,
          branding: sampleIssuer().branding,
        },
      },
    });
    expect(await database.documents.get(documentId(1))).toEqual(signed.isOk && signed.value);
  });

  it("queues the signature for the server with this device id", async () => {
    await sign();
    const [entry] = await database.outbox.toArray();
    expect(complianceMutation.parse(entry?.mutation)).toMatchObject({
      type: "sign_document",
      documentId: documentId(1),
      deviceId: await signingDeviceIdOf(database),
      templateVersion: 2,
      number: 41,
      signedAt: "2026-10-23T09:30:00.000Z",
    });
    expect(await pendingEntityIds(database)).toEqual(
      new Set([documentId(1), INTERVENTION_ID, EQUIPMENT_ID]),
    );
  });

  it("dates the sweeping of the equipment on the device", async () => {
    await sign();
    expect(await database.equipments.get(EQUIPMENT_ID)).toMatchObject({
      lastSweepingOn: "2026-10-23",
      nextDueDate: "2027-10-23",
    });
  });

  it("takes the next free number for each certificate", async () => {
    await sign();
    const second = await sign({ documentId: documentId(2) });
    expect(second).toMatchObject({ isOk: true, value: { number: 42 } });
  });

  it("refuses to sign before the company settings reached the device", async () => {
    await database.localSettings.delete("issuer");
    expect(await sign()).toEqual({ isOk: false, error: "issuer_missing" });
    await expectNothingSigned();
  });

  it("refuses to sign while legal mentions are missing", async () => {
    await saveIssuer(
      database,
      sampleIssuer({ company: null, missingLegalMentions: ["siret"] }),
      SIGNED_AT,
    );
    expect(await sign()).toEqual({ isOk: false, error: "legal_mentions_missing" });
    await expectNothingSigned();
  });

  it("refuses to sign without a reserved number left", async () => {
    await database.numberBlocks.clear();
    expect(await sign()).toEqual({ isOk: false, error: "no_number_available" });
    await expectNothingSigned();
  });

  it("applies the certificate rules before signing", async () => {
    expect(await sign({ body: certificateBody({ sweepingExtent: "partial" }) })).toEqual({
      isOk: false,
      error: "unswept_part_required",
    });
    expect(
      await sign({ body: certificateBody({ customerSignature: null, isCustomerAbsent: false }) }),
    ).toEqual({ isOk: false, error: "customer_signature_required" });
    await expectNothingSigned();
  });
});

describe("sweptEquipmentOf", () => {
  it("reads the flue type from the equipment details", () => {
    expect(sweptEquipmentOf(insertEquipment(EQUIPMENT_ID))).toEqual({
      kind: "insert",
      flueType: "lined_masonry",
    });
  });

  it("gives no flue type when the details have none or an unknown one", () => {
    expect(sweptEquipmentOf(insertEquipment(EQUIPMENT_ID, { details: {} })).flueType).toBeNull();
    expect(
      sweptEquipmentOf(insertEquipment(EQUIPMENT_ID, { details: { flueType: "chimney" } }))
        .flueType,
    ).toBeNull();
  });
});
