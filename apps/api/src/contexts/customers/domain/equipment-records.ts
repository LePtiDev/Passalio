import { ok, type Result } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import type { CustomerError } from "./customer-error";
import type { Equipment } from "./customer-models";
import type { RecordContext } from "./customer-records";
import type { Changes } from "./record-changes";
import type { EquipmentChanges, EquipmentFields } from "./customer-schemas";
import { checkKindOffered, parseDetails } from "./equipment-rules";

export const newEquipment = (
  fields: EquipmentFields,
  context: RecordContext & {
    readonly siteId: string;
    readonly organizationTrades: readonly TradeId[];
  },
): Result<Equipment, CustomerError> => {
  const kind = checkKindOffered(fields.kind, context.organizationTrades);
  if (!kind.isOk) {
    return kind;
  }
  const details = parseDetails(fields.kind, fields.details);
  if (!details.isOk) {
    return details;
  }
  return ok({
    id: context.id,
    organizationId: context.organizationId,
    siteId: context.siteId,
    kind: kind.value,
    energy: fields.energy ?? null,
    brand: fields.brand ?? null,
    model: fields.model ?? null,
    serialNumber: fields.serialNumber ?? null,
    powerKw: fields.powerKw ?? null,
    room: fields.room ?? null,
    details: details.value,
    status: "active",
    isInstalledByUs: fields.isInstalledByUs ?? false,
    commissionedOn: fields.commissionedOn ?? null,
    removedOn: null,
    replacedByEquipmentId: null,
    lastSweepingOn: fields.lastSweepingOn ?? null,
    lastServiceOn: fields.lastServiceOn ?? null,
    nextDueDate: null,
    notes: fields.notes ?? null,
    createdAt: context.at,
    updatedAt: context.at,
  });
};

export const equipmentUpdates = (
  current: Equipment,
  changes: EquipmentChanges,
  context: { readonly at: Date; readonly organizationTrades: readonly TradeId[] },
): Result<Changes<Equipment>, CustomerError> => {
  const { details: detailChanges, ...fields } = changes;
  const kind = fields.kind ?? current.kind;
  if (fields.kind !== undefined && fields.kind !== current.kind) {
    const offered = checkKindOffered(kind, context.organizationTrades);
    if (!offered.isOk) {
      return offered;
    }
  }
  const details = parseDetails(kind, detailChanges ?? current.details);
  if (!details.isOk) {
    return details;
  }
  return ok({ ...fields, details: details.value, updatedAt: context.at });
};
