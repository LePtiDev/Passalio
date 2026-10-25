import { FLUE_TYPES, isSealedAppliance, type SweptEquipment } from "@passalio/trades";
import * as z from "zod";
import type { EquipmentRecord } from "@/lib/db/local-records";

const flueType = z.enum(FLUE_TYPES);

export const sweptEquipmentOf = ({
  kind,
  details,
}: Pick<EquipmentRecord, "kind" | "details">): SweptEquipment => {
  const parsed = flueType.safeParse(details["flueType"]);
  return { kind, flueType: parsed.success ? parsed.data : null };
};

export const isSealedEquipment = (equipment: Pick<EquipmentRecord, "kind" | "details">) =>
  isSealedAppliance(sweptEquipmentOf(equipment));
