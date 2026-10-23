import * as z from "zod";
import { ENERGIES, EQUIPMENT_KINDS, type EquipmentKind } from "./customers";

export const PLATE_READING_DAILY_LIMIT = 200;

export const PLATE_READING_STATUSES = ["read", "partial", "unreadable", "failed"] as const;

export type PlateReadingStatus = (typeof PLATE_READING_STATUSES)[number];

export const PLATE_READING_FIELDS = [
  "kind",
  "energy",
  "brand",
  "model",
  "serialNumber",
  "powerKw",
  "refrigerant",
  "refrigerantChargeKg",
] as const;

export type PlateReadingField = (typeof PLATE_READING_FIELDS)[number];

const IDENTITY_FIELDS: readonly PlateReadingField[] = ["brand", "model", "serialNumber"];

const REFRIGERANT_KINDS: ReadonlySet<EquipmentKind> = new Set([
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
]);

const TEXT_MAX_LENGTH = 120;
const MAX_POWER_KW = 2000;
const MAX_REFRIGERANT_CHARGE_KG = 1000;
const REFRIGERANT_PATTERN = /^R\d{2,4}[A-Z]{0,2}$/;

export const plateReaderAnswer = z.object({
  kind: z
    .enum(EQUIPMENT_KINDS)
    .nullable()
    .describe("Kind of appliance, only if the plate makes it certain. Otherwise null."),
  energy: z
    .enum(ENERGIES)
    .nullable()
    .describe("Fuel or energy written on the plate. Otherwise null."),
  brand: z
    .string()
    .nullable()
    .describe("Manufacturer name printed on the plate, exactly as written. Otherwise null."),
  model: z
    .string()
    .nullable()
    .describe("Model name or reference printed on the plate. Otherwise null."),
  serialNumber: z
    .string()
    .nullable()
    .describe("Serial number (N° de série, S/N, Serial No.) as printed. Otherwise null."),
  powerKw: z
    .number()
    .nullable()
    .describe(
      "Nominal heating output in kW. Never the electrical input power. For a range, the maximum. Otherwise null.",
    ),
  refrigerant: z
    .string()
    .nullable()
    .describe(
      "Refrigerant of a heat pump or air conditioner, such as R32 or R410A. Otherwise null.",
    ),
  refrigerantChargeKg: z
    .number()
    .nullable()
    .describe("Refrigerant charge in kg printed on the plate. Otherwise null."),
});

export type PlateReaderAnswer = z.infer<typeof plateReaderAnswer>;

export const plateReadingFields = z.object({
  kind: z.enum(EQUIPMENT_KINDS).optional(),
  energy: z.enum(ENERGIES).optional(),
  brand: z.string().max(TEXT_MAX_LENGTH).optional(),
  model: z.string().max(TEXT_MAX_LENGTH).optional(),
  serialNumber: z.string().max(TEXT_MAX_LENGTH).optional(),
  powerKw: z.number().positive().max(MAX_POWER_KW).optional(),
  refrigerant: z.string().regex(REFRIGERANT_PATTERN).optional(),
  refrigerantChargeKg: z.number().positive().max(MAX_REFRIGERANT_CHARGE_KG).optional(),
});

export type PlateReadingFields = z.infer<typeof plateReadingFields>;

export const plateReadingResponse = z.object({
  status: z.enum(["read", "partial", "unreadable"]),
  fields: plateReadingFields,
  fieldCount: z.int().min(0).max(PLATE_READING_FIELDS.length),
});

export type PlateReadingResponse = z.infer<typeof plateReadingResponse>;

const cleanText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value.replaceAll(/\s+/g, " ").trim();
  return text.length > 0 && text.length <= TEXT_MAX_LENGTH && /[\p{L}\p{N}]/u.test(text)
    ? text
    : undefined;
};

const roundToHundredths = (value: number): number => Math.round(value * 100) / 100;

const cleanNumber = (value: unknown, max: number): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  const rounded = roundToHundredths(value);
  return rounded > 0 && rounded <= max ? rounded : undefined;
};

const cleanRefrigerant = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const refrigerant = value.replaceAll(/[\s-]/g, "").toUpperCase();
  return REFRIGERANT_PATTERN.test(refrigerant) ? refrigerant : undefined;
};

const enumValue = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  values.find((candidate) => candidate === value);

const fieldOf = (answer: unknown, field: PlateReadingField): unknown =>
  typeof answer === "object" && answer !== null && field in answer
    ? Object.getOwnPropertyDescriptor(answer, field)?.value
    : undefined;

export const sanitizePlateReading = (answer: unknown): PlateReadingFields => {
  const kind = enumValue(EQUIPMENT_KINDS, fieldOf(answer, "kind"));
  const canHoldRefrigerant = kind === undefined || REFRIGERANT_KINDS.has(kind);
  const energy = enumValue(ENERGIES, fieldOf(answer, "energy"));
  const brand = cleanText(fieldOf(answer, "brand"));
  const model = cleanText(fieldOf(answer, "model"));
  const serialNumber = cleanText(fieldOf(answer, "serialNumber"));
  const powerKw = cleanNumber(fieldOf(answer, "powerKw"), MAX_POWER_KW);
  const refrigerant = canHoldRefrigerant
    ? cleanRefrigerant(fieldOf(answer, "refrigerant"))
    : undefined;
  const refrigerantChargeKg = canHoldRefrigerant
    ? cleanNumber(fieldOf(answer, "refrigerantChargeKg"), MAX_REFRIGERANT_CHARGE_KG)
    : undefined;
  return {
    ...(kind === undefined ? {} : { kind }),
    ...(energy === undefined ? {} : { energy }),
    ...(brand === undefined ? {} : { brand }),
    ...(model === undefined ? {} : { model }),
    ...(serialNumber === undefined ? {} : { serialNumber }),
    ...(powerKw === undefined ? {} : { powerKw }),
    ...(refrigerant === undefined ? {} : { refrigerant }),
    ...(refrigerantChargeKg === undefined ? {} : { refrigerantChargeKg }),
  };
};

export const plateReadingFieldCount = (fields: PlateReadingFields): number =>
  PLATE_READING_FIELDS.filter((field) => fields[field] !== undefined).length;

export const plateReadingStatusOf = (
  fields: PlateReadingFields,
): PlateReadingResponse["status"] => {
  if (plateReadingFieldCount(fields) === 0) {
    return "unreadable";
  }
  return IDENTITY_FIELDS.every((field) => fields[field] !== undefined) ? "read" : "partial";
};
