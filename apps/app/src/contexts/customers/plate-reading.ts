import type { Energy, EquipmentKind, PlateReadingFields } from "@passalio/shared";
import { EQUIPMENT_CATALOG } from "@passalio/trades";
import type { EquipmentFormValues } from "./components/equipment/equipment-form-schema";

export const PLATE_FORM_FIELDS = [
  "kind",
  "energy",
  "brand",
  "model",
  "serialNumber",
  "powerKw",
  "refrigerant",
  "refrigerantCharge",
] as const;

export type PlateFormField = (typeof PLATE_FORM_FIELDS)[number];

export const PLATE_IDENTITY_FIELDS = ["brand", "model", "serialNumber"] as const;

export type PlateIdentityField = (typeof PLATE_IDENTITY_FIELDS)[number];

export type PlateFormValues = Partial<Pick<EquipmentFormValues, PlateFormField>>;

export type PlateMerge = {
  readonly values: PlateFormValues;
  readonly defaults: PlateFormValues;
  readonly missingIdentity: readonly PlateIdentityField[];
};

export const DEFAULT_ENERGY: Partial<Readonly<Record<EquipmentKind, Energy>>> = {
  open_fireplace: "wood_logs",
  insert: "wood_logs",
  log_stove: "wood_logs",
  pellet_stove: "pellets",
  solid_fuel_cooker: "wood_logs",
};

const isHeatPump = (kind: EquipmentKind | null) =>
  kind !== null && EQUIPMENT_CATALOG[kind].family === "heat_pump";

const decimalText = (value: number, fractionDigits: number) =>
  value.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

const filled = (current: string, read: string | undefined) =>
  current.trim() === "" ? read : undefined;

const numberText = (value: number | undefined, fractionDigits: number) =>
  value === undefined ? undefined : decimalText(value, fractionDigits);

export const mergePlateReading = (
  current: EquipmentFormValues,
  reading: PlateReadingFields,
  offeredKinds: readonly EquipmentKind[],
): PlateMerge => {
  const readKind =
    current.kind === null && reading.kind !== undefined && offeredKinds.includes(reading.kind)
      ? reading.kind
      : undefined;
  const kind = current.kind ?? readKind ?? null;
  const readEnergy = current.energy === null && !isHeatPump(kind) ? reading.energy : undefined;
  const heatPumpReading: PlateReadingFields = isHeatPump(kind) ? reading : {};
  const defaultEnergy =
    readKind !== undefined && readEnergy === undefined ? DEFAULT_ENERGY[readKind] : undefined;
  const brand = filled(current.brand, reading.brand);
  const model = filled(current.model, reading.model);
  const serialNumber = filled(current.serialNumber, reading.serialNumber);
  const powerKw = filled(current.powerKw, numberText(reading.powerKw, 0));
  const refrigerant = filled(current.refrigerant, heatPumpReading.refrigerant);
  const refrigerantCharge = filled(
    current.refrigerantCharge,
    numberText(heatPumpReading.refrigerantChargeKg, 2),
  );
  return {
    values: {
      ...(readKind === undefined ? {} : { kind: readKind }),
      ...(readEnergy === undefined ? {} : { energy: readEnergy }),
      ...(brand === undefined ? {} : { brand }),
      ...(model === undefined ? {} : { model }),
      ...(serialNumber === undefined ? {} : { serialNumber }),
      ...(powerKw === undefined ? {} : { powerKw }),
      ...(refrigerant === undefined ? {} : { refrigerant }),
      ...(refrigerantCharge === undefined ? {} : { refrigerantCharge }),
    },
    defaults: defaultEnergy === undefined ? {} : { energy: defaultEnergy },
    missingIdentity: PLATE_IDENTITY_FIELDS.filter(
      (field) => reading[field] === undefined && current[field].trim() === "",
    ),
  };
};
