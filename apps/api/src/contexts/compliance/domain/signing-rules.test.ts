import { describe, expect, it } from "vitest";
import type { SigningEquipment, SigningIntervention } from "./compliance-ports";
import type { SignedDocument } from "./document-models";
import { checkCancelledDocument, checkSigningTarget, sweepingDates } from "./signing-rules";

const insert: SigningEquipment = {
  kind: "insert",
  flueType: "lined_masonry",
  lastSweepingOn: null,
};

const interventionWith = (
  status: SigningIntervention["status"],
  equipmentIds: readonly string[] = ["equipment-1"],
): SigningIntervention => ({ status, equipmentIds });

const signedOn = (equipmentId: string): SignedDocument => ({
  id: "document-1",
  organizationId: "organization-a",
  interventionId: "intervention-1",
  equipmentId,
  trade: "chimney_sweeping",
  kind: "chimney_sweeping_certificate",
  templateVersion: 1,
  number: 1,
  numberPrefix: "DUP-",
  deviceId: "device-1",
  signedByUserId: "user-technician",
  signedAt: new Date("2026-10-23T09:00:00Z"),
  completedOn: "2026-10-23",
  cancelsDocumentId: null,
  data: {},
  createdAt: new Date("2026-10-23T09:00:00Z"),
  updatedAt: new Date("2026-10-23T09:00:00Z"),
});

describe("checkSigningTarget", () => {
  it("accepts an equipment of a completed intervention", () => {
    expect(checkSigningTarget(interventionWith("completed"), insert, "equipment-1")).toEqual({
      isOk: true,
      value: insert,
    });
  });

  it("refuses an unknown intervention", () => {
    expect(checkSigningTarget(undefined, insert, "equipment-1")).toEqual({
      isOk: false,
      error: "intervention_not_found",
    });
  });

  it("refuses a cancelled intervention", () => {
    expect(checkSigningTarget(interventionWith("cancelled"), insert, "equipment-1")).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
  });

  it("refuses an unknown equipment", () => {
    expect(checkSigningTarget(interventionWith("completed"), undefined, "equipment-1")).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
  });

  it("refuses an equipment that is not part of the intervention", () => {
    expect(checkSigningTarget(interventionWith("completed"), insert, "equipment-2")).toEqual({
      isOk: false,
      error: "equipment_not_in_intervention",
    });
  });
});

describe("checkCancelledDocument", () => {
  it("accepts the correction of a document of the same equipment", () => {
    expect(checkCancelledDocument(signedOn("equipment-1"), "equipment-1", false)).toEqual({
      isOk: true,
      value: undefined,
    });
  });

  it("refuses to cancel an unknown document", () => {
    expect(checkCancelledDocument(undefined, "equipment-1", false)).toEqual({
      isOk: false,
      error: "cancelled_document_not_found",
    });
  });

  it("refuses to cancel a document of another equipment", () => {
    expect(checkCancelledDocument(signedOn("equipment-2"), "equipment-1", false)).toEqual({
      isOk: false,
      error: "cancelled_document_not_found",
    });
  });

  it("refuses to cancel a document twice", () => {
    expect(checkCancelledDocument(signedOn("equipment-1"), "equipment-1", true)).toEqual({
      isOk: false,
      error: "document_already_cancelled",
    });
  });
});

describe("sweepingDates", () => {
  it("dates the sweeping on the completion day and the next one twelve months later", () => {
    expect(sweepingDates(null, "2026-10-23")).toEqual({
      lastSweepingOn: "2026-10-23",
      nextDueDate: "2027-10-23",
    });
  });

  it("replaces an earlier sweeping by the new one", () => {
    expect(sweepingDates("2025-09-01", "2026-10-23")).toEqual({
      lastSweepingOn: "2026-10-23",
      nextDueDate: "2027-10-23",
    });
  });

  it("keeps a later sweeping already known for the equipment", () => {
    expect(sweepingDates("2026-11-02", "2026-10-23")).toEqual({
      lastSweepingOn: "2026-11-02",
      nextDueDate: "2027-11-02",
    });
  });
});
