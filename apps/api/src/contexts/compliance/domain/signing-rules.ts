import { err, ok, type Result } from "@passalio/shared";
import { nextSweepingDueDate } from "@passalio/trades";
import type { ComplianceError } from "./compliance-error";
import type { SignedDocument } from "./document-models";
import type { SigningEquipment, SigningIntervention } from "./compliance-ports";

export const checkSigningTarget = (
  intervention: SigningIntervention | undefined,
  equipment: SigningEquipment | undefined,
  equipmentId: string,
): Result<SigningEquipment, ComplianceError> => {
  if (intervention === undefined) {
    return err("intervention_not_found");
  }
  if (intervention.status === "cancelled") {
    return err("intervention_closed");
  }
  if (equipment === undefined) {
    return err("equipment_not_found");
  }
  return intervention.equipmentIds.includes(equipmentId)
    ? ok(equipment)
    : err("equipment_not_in_intervention");
};

export const checkCancelledDocument = (
  cancelled: SignedDocument | undefined,
  equipmentId: string,
  isAlreadyCancelled: boolean,
): Result<void, ComplianceError> => {
  if (cancelled === undefined || cancelled.equipmentId !== equipmentId) {
    return err("cancelled_document_not_found");
  }
  return isAlreadyCancelled ? err("document_already_cancelled") : ok(undefined);
};

export const sweepingDates = (lastSweepingOn: string | null, completedOn: string) => {
  const latest =
    lastSweepingOn !== null && lastSweepingOn > completedOn ? lastSweepingOn : completedOn;
  return { lastSweepingOn: latest, nextDueDate: nextSweepingDueDate(latest) };
};
