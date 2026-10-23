import { EQUIPMENT_CATALOG, flueApplianceDetails, heatPumpDetails } from "@passalio/trades";
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
    ? text.installedByUsOn(formatCalendarDate(equipment.commissionedOn))
    : null;

export const equipmentDetailLine = (equipment: EquipmentRecord, replacementName: string | null) => {
  const family = EQUIPMENT_CATALOG[equipment.kind].family;
  const technical =
    family === "heat_pump" ? heatPumpParts(equipment.details) : flueParts(equipment.details);
  const removal =
    equipment.status === "removed" && equipment.removedOn !== null
      ? [
          [
            text.removedOn(formatCalendarDate(equipment.removedOn)),
            replacementName === null ? null : text.replacedBy(replacementName),
          ]
            .filter((part) => part !== null)
            .join(", "),
        ]
      : [];
  return [
    equipment.room,
    installationPart(equipment),
    ...technical,
    equipment.serialNumber === null ? null : text.serial(equipment.serialNumber),
    ...removal,
  ]
    .filter((part) => part !== null && part !== "")
    .join(" · ");
};
