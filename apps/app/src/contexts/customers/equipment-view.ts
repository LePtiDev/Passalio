import { EQUIPMENT_CATALOG, flueApplianceDetails, heatPumpDetails } from "@passalio/trades";
import type { EquipmentKind } from "@passalio/shared";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { formatCalendarDate } from "./customer-view";
import { customersFr, FLUE_TYPE_LABELS } from "./fr";

const text = customersFr.file;

const KILOGRAMS = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const flueParts = (details: EquipmentRecord["details"]) => {
  const parsed = flueApplianceDetails.safeParse(details);
  if (!parsed.success) {
    return [];
  }
  const { flueType, flueLocation } = parsed.data;
  return [
    flueType === undefined ? null : `conduit ${FLUE_TYPE_LABELS[flueType].toLowerCase()}`,
    flueLocation ?? null,
  ];
};

const heatPumpParts = (details: EquipmentRecord["details"]) => {
  const parsed = heatPumpDetails.safeParse(details);
  if (!parsed.success) {
    return [];
  }
  const { refrigerant, refrigerantChargeKg } = parsed.data;
  const fluid = [
    refrigerant ?? null,
    refrigerantChargeKg === undefined ? null : `${KILOGRAMS.format(refrigerantChargeKg)} kg`,
  ].filter((part) => part !== null);
  return [fluid.length === 0 ? null : fluid.join(", ")];
};

const installationPart = (equipment: EquipmentRecord) =>
  equipment.isInstalledByUs && equipment.commissionedOn !== null
    ? text.installedByUsOn(equipment.kind, formatCalendarDate(equipment.commissionedOn))
    : null;

const removalPart = (equipment: EquipmentRecord, replacementKind: EquipmentKind | null) =>
  [
    equipment.removedOn === null
      ? null
      : text.removedOn(equipment.kind, formatCalendarDate(equipment.removedOn)),
    replacementKind === null ? null : text.replacedBy(equipment.kind, replacementKind),
  ]
    .filter((part) => part !== null)
    .join(", ");

const joinParts = (parts: readonly (string | null)[]) =>
  parts.filter((part) => part !== null && part !== "").join(" · ");

export const equipmentDetailLine = (
  equipment: EquipmentRecord,
  replacementKind: EquipmentKind | null,
) => {
  if (equipment.status === "removed") {
    return joinParts([equipment.room, removalPart(equipment, replacementKind)]);
  }
  const family = EQUIPMENT_CATALOG[equipment.kind].family;
  const technical =
    family === "heat_pump" ? heatPumpParts(equipment.details) : flueParts(equipment.details);
  return joinParts([
    equipment.room,
    installationPart(equipment),
    ...technical,
    equipment.serialNumber === null ? null : text.serial(equipment.serialNumber),
  ]);
};
