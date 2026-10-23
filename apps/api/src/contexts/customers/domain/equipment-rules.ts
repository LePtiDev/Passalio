import { err, ok, type Result } from "@passalio/shared";
import {
  detailsSchemaOf,
  isKindOffered,
  type EquipmentDetails,
  type EquipmentKind,
  type TradeId,
} from "@passalio/trades";
import type { CustomerError } from "./customer-error";
import type { Equipment } from "./customer-models";

export const checkKindOffered = (
  kind: EquipmentKind,
  organizationTrades: readonly TradeId[],
): Result<EquipmentKind, CustomerError> =>
  isKindOffered(kind, organizationTrades) ? ok(kind) : err("equipment_kind_not_offered");

export const parseDetails = (
  kind: EquipmentKind,
  details: unknown,
): Result<EquipmentDetails, CustomerError> => {
  const parsed = detailsSchemaOf(kind).safeParse(details ?? {});
  return parsed.success ? ok(parsed.data) : err("invalid_equipment_details");
};

export const checkReplaceable = (
  equipment: Equipment | undefined,
): Result<Equipment, CustomerError> => {
  if (equipment === undefined) {
    return err("equipment_not_found");
  }
  return equipment.status === "removed" ? err("equipment_already_removed") : ok(equipment);
};
