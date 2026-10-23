import { ForbiddenError, type Actor, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemoryComplianceState } from "../infrastructure/in-memory-compliance-dependencies";
import { sealedBoilerCertificateData, validCertificateData } from "./certificate-data.fixture";
import {
  actorOf,
  complianceDependenciesOf,
  documentIdOf,
  EQUIPMENT_ID,
  ORGANIZATION_A,
  ORGANIZATION_B,
  OTHER_EQUIPMENT_ID,
  OTHER_INTERVENTION_ID,
  PREFIX_A,
  reserveFor,
  SEALED_BOILER_ID,
  seededComplianceState,
  signInput,
  UNPLANNED_EQUIPMENT_ID,
} from "./compliance.fixture";
import { signDocument, type SignDocumentInput } from "./sign-document";

let state: InMemoryComplianceState;
let dependencies: ReturnType<typeof complianceDependenciesOf>;

const technician = actorOf("technician");

const sign = (actor: Actor, overrides: Partial<SignDocumentInput> = {}) =>
  signDocument(dependencies)(actor, signInput(overrides));

const expectNothingSigned = () => {
  expect(state.documents).toHaveLength(0);
  expect(state.equipmentUpdates).toHaveLength(0);
};

beforeEach(() => {
  state = seededComplianceState();
  dependencies = complianceDependenciesOf(state);
});

describe("signDocument", () => {
  it("stores the signed certificate with the prefix of the reserved block", async () => {
    await reserveFor(dependencies, technician);
    const signed = await sign(technician);
    expect(signed).toMatchObject({
      isOk: true,
      value: {
        id: documentIdOf(1),
        organizationId: ORGANIZATION_A,
        equipmentId: EQUIPMENT_ID,
        number: 1,
        numberPrefix: PREFIX_A,
        signedByUserId: "user-technician",
        signedAt: new Date("2026-10-23T09:30:00.000Z"),
        completedOn: "2026-10-23",
        cancelsDocumentId: null,
        data: validCertificateData(),
      },
    });
    expect(state.documents).toHaveLength(1);
  });

  it("dates the equipment sweeping and its next due date twelve months later", async () => {
    await reserveFor(dependencies, technician);
    await sign(technician);
    expect(state.equipmentUpdates).toMatchObject([
      { equipmentId: EQUIPMENT_ID, lastSweepingOn: "2026-10-23", nextDueDate: "2027-10-23" },
    ]);
  });

  it("keeps a later sweeping already known for the equipment", async () => {
    state.equipments.set(EQUIPMENT_ID, {
      organizationId: ORGANIZATION_A,
      kind: "insert",
      flueType: "lined_masonry",
      lastSweepingOn: "2026-11-02",
    });
    await reserveFor(dependencies, technician);
    await sign(technician);
    expect(state.equipmentUpdates).toMatchObject([
      { equipmentId: EQUIPMENT_ID, lastSweepingOn: "2026-11-02", nextDueDate: "2027-11-02" },
    ]);
  });

  it.each<OrganizationRole>(["owner", "admin"])("lets the %s sign a certificate", async (role) => {
    await reserveFor(dependencies, actorOf(role));
    expect(await sign(actorOf(role))).toMatchObject({
      isOk: true,
      value: { signedByUserId: `user-${role}` },
    });
  });

  it("forbids the secretary to sign", async () => {
    await reserveFor(dependencies, technician);
    await expect(sign(actorOf("secretary", { userId: "user-technician" }))).rejects.toThrow(
      ForbiddenError,
    );
    expectNothingSigned();
  });

  it.each<OrganizationRole>(["owner", "technician"])(
    "refuses the signature to an impersonated %s",
    async (role) => {
      await reserveFor(dependencies, actorOf(role));
      await expect(sign(actorOf(role, { isImpersonating: true }))).rejects.toThrow(ForbiddenError);
      expectNothingSigned();
    },
  );

  it("refuses an unknown template version", async () => {
    await reserveFor(dependencies, technician);
    expect(await sign(technician, { templateVersion: 99 })).toEqual({
      isOk: false,
      error: "unknown_template",
    });
    expectNothingSigned();
  });

  it("refuses an unknown intervention", async () => {
    await reserveFor(dependencies, technician);
    expect(
      await sign(technician, { interventionId: "0190f3a0-0000-7000-8000-0000000000ff" }),
    ).toEqual({ isOk: false, error: "intervention_not_found" });
    expectNothingSigned();
  });

  it("refuses an intervention of another organization", async () => {
    const foreignTechnician = actorOf("technician", { organizationId: ORGANIZATION_B });
    await reserveFor(dependencies, foreignTechnician);
    expect(await sign(foreignTechnician)).toEqual({ isOk: false, error: "intervention_not_found" });
    expectNothingSigned();
  });

  it("refuses a cancelled intervention", async () => {
    await reserveFor(dependencies, technician);
    expect(await sign(technician, { interventionId: OTHER_INTERVENTION_ID })).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
    expectNothingSigned();
  });

  it("refuses an equipment that is not part of the intervention", async () => {
    await reserveFor(dependencies, technician);
    expect(await sign(technician, { equipmentId: UNPLANNED_EQUIPMENT_ID })).toEqual({
      isOk: false,
      error: "equipment_not_in_intervention",
    });
    expectNothingSigned();
  });

  it("refuses a number outside the blocks reserved by the signer", async () => {
    await reserveFor(dependencies, technician);
    expect(await sign(technician, { number: 21 })).toEqual({
      isOk: false,
      error: "number_not_reserved",
    });
    expectNothingSigned();
  });

  it("refuses a number reserved by another user", async () => {
    await reserveFor(dependencies, technician);
    await reserveFor(dependencies, actorOf("admin"));
    expect(await sign(technician, { number: 25 })).toEqual({
      isOk: false,
      error: "number_not_reserved",
    });
    expectNothingSigned();
  });

  it("refuses a number reserved in another organization", async () => {
    await reserveFor(dependencies, actorOf("technician", { organizationId: ORGANIZATION_B }));
    expect(await sign(technician, { number: 1 })).toEqual({
      isOk: false,
      error: "number_not_reserved",
    });
    expectNothingSigned();
  });

  it("refuses a number already used by another document", async () => {
    await reserveFor(dependencies, technician);
    await sign(technician);
    expect(
      await sign(technician, { documentId: documentIdOf(2), equipmentId: OTHER_EQUIPMENT_ID }),
    ).toEqual({ isOk: false, error: "number_taken" });
    expect(state.documents).toHaveLength(1);
  });

  it("refuses a document id already used", async () => {
    await reserveFor(dependencies, technician);
    await sign(technician);
    expect(await sign(technician, { number: 2 })).toEqual({
      isOk: false,
      error: "already_exists",
    });
    expect(state.documents).toHaveLength(1);
  });

  it("refuses data that is not a certificate", async () => {
    await reserveFor(dependencies, technician);
    expect(await sign(technician, { data: { flues: [] } })).toEqual({
      isOk: false,
      error: "invalid_certificate",
    });
    expectNothingSigned();
  });

  it("requires the unswept part of a partial sweeping", async () => {
    await reserveFor(dependencies, technician);
    expect(
      await sign(technician, { data: validCertificateData({ sweepingExtent: "partial" }) }),
    ).toEqual({ isOk: false, error: "unswept_part_required" });
    expectNothingSigned();
  });

  it("requires the usage advice for an insert", async () => {
    await reserveFor(dependencies, technician);
    expect(
      await sign(technician, { data: validCertificateData({ isAdviceAttached: false }) }),
    ).toEqual({ isOk: false, error: "advice_required" });
    expectNothingSigned();
  });

  it("refuses a full length sweeping of a sealed boiler", async () => {
    await reserveFor(dependencies, technician);
    expect(
      await sign(technician, {
        equipmentId: SEALED_BOILER_ID,
        data: sealedBoilerCertificateData({ sweepingExtent: "full_length" }),
      }),
    ).toEqual({ isOk: false, error: "sweeping_extent_mismatch" });
    expectNothingSigned();
  });

  it("accepts the sealed appliance wording for a sealed boiler", async () => {
    await reserveFor(dependencies, technician);
    expect(
      (
        await sign(technician, {
          equipmentId: SEALED_BOILER_ID,
          data: sealedBoilerCertificateData(),
        })
      ).isOk,
    ).toBe(true);
  });

  describe("correction", () => {
    beforeEach(async () => {
      await reserveFor(dependencies, technician);
    });

    it("signs a new document that cancels a document of the same equipment", async () => {
      await sign(technician);
      expect(
        await sign(technician, {
          documentId: documentIdOf(2),
          number: 2,
          cancelsDocumentId: documentIdOf(1),
        }),
      ).toMatchObject({ isOk: true, value: { cancelsDocumentId: documentIdOf(1) } });
      expect(state.documents).toHaveLength(2);
    });

    it("refuses to cancel a document of another equipment", async () => {
      await sign(technician, { equipmentId: OTHER_EQUIPMENT_ID });
      expect(
        await sign(technician, {
          documentId: documentIdOf(2),
          number: 2,
          cancelsDocumentId: documentIdOf(1),
        }),
      ).toEqual({ isOk: false, error: "cancelled_document_not_found" });
      expect(state.documents).toHaveLength(1);
    });

    it("refuses to cancel an unknown document", async () => {
      expect(await sign(technician, { cancelsDocumentId: documentIdOf(77) })).toEqual({
        isOk: false,
        error: "cancelled_document_not_found",
      });
      expectNothingSigned();
    });

    it("refuses to cancel a document already cancelled", async () => {
      await sign(technician);
      await sign(technician, {
        documentId: documentIdOf(2),
        number: 2,
        cancelsDocumentId: documentIdOf(1),
      });
      expect(
        await sign(technician, {
          documentId: documentIdOf(3),
          number: 3,
          cancelsDocumentId: documentIdOf(1),
        }),
      ).toEqual({ isOk: false, error: "document_already_cancelled" });
      expect(state.documents).toHaveLength(2);
    });
  });
});
