import {
  calendarDateOf,
  ENERGIES,
  EQUIPMENT_KINDS,
  equipmentFields,
  type EquipmentFields,
  type EquipmentKind,
} from "@passalio/shared";
import {
  detailsSchemaOf,
  EQUIPMENT_CATALOG,
  FLUE_TYPES,
  heatPumpDetails,
  tradesOfKind,
} from "@passalio/trades";
import * as z from "zod";
import { customersFr } from "../../fr";

const errors = customersFr.form.errors;

const text = (maxLength: number) => z.string().trim().max(maxLength);

const DECIMAL_PATTERN = /^\d+([.,]\d+)?$/;

const decimal = text(10).refine((value) => value === "" || DECIMAL_PATTERN.test(value), {
  error: errors.number,
});

const dateInput = z
  .string()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), { error: errors.date });

const yearInput = text(4).refine(
  (value) =>
    value === "" || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100),
  { error: errors.year },
);

export const NO_REPLACEMENT = "none";

export const equipmentFormSchema = z
  .object({
    kind: z.enum(EQUIPMENT_KINDS).nullable(),
    energy: z.enum(ENERGIES).nullable(),
    brand: text(120),
    model: text(120),
    serialNumber: text(120),
    room: text(120),
    powerKw: decimal,
    flueType: z.enum(FLUE_TYPES).nullable(),
    flueLocation: text(120),
    refrigerant: text(10),
    refrigerantCharge: decimal,
    outdoorUnitLocation: text(120),
    indoorUnitLocation: text(120),
    isInstalledByUs: z.boolean(),
    installationYear: yearInput,
    commissionedOn: dateInput,
    replacesEquipmentId: z.string(),
    lastSweepingOn: dateInput,
    lastServiceOn: dateInput,
  })
  .superRefine((values, context) => {
    if (values.kind === null) {
      context.addIssue({ code: "custom", path: ["kind"], message: errors.kind });
    }
    if (
      values.refrigerant !== "" &&
      !heatPumpDetails.shape.refrigerant.safeParse(values.refrigerant).success
    ) {
      context.addIssue({ code: "custom", path: ["refrigerant"], message: errors.refrigerant });
    }
  });

export type EquipmentFormValues = z.output<typeof equipmentFormSchema>;

export const emptyEquipmentForm = (
  replacesEquipmentId: string | undefined,
): EquipmentFormValues => ({
  kind: null,
  energy: null,
  brand: "",
  model: "",
  serialNumber: "",
  room: "",
  powerKw: "",
  flueType: null,
  flueLocation: "",
  refrigerant: "",
  refrigerantCharge: "",
  outdoorUnitLocation: "",
  indoorUnitLocation: "",
  isInstalledByUs: replacesEquipmentId !== undefined,
  installationYear: "",
  commissionedOn: calendarDateOf(new Date()),
  replacesEquipmentId: replacesEquipmentId ?? NO_REPLACEMENT,
  lastSweepingOn: "",
  lastServiceOn: "",
});

export const isHeatPumpKind = (kind: EquipmentKind | null) =>
  kind !== null && EQUIPMENT_CATALOG[kind].family === "heat_pump";

export const visitFieldsOf = (kind: EquipmentKind | null) => {
  const trades = kind === null ? [] : tradesOfKind(kind);
  return {
    hasSweeping: trades.includes("chimney_sweeping"),
    hasService: trades.some((trade) => trade !== "chimney_sweeping"),
  };
};

const numberOf = (value: string) => (value === "" ? null : Number(value.replace(",", ".")));

const optional = (value: string) => (value === "" ? undefined : value);

const detailsOf = (values: EquipmentFormValues) => {
  if (isHeatPumpKind(values.kind)) {
    return {
      refrigerant: optional(values.refrigerant),
      refrigerantChargeKg: numberOf(values.refrigerantCharge) ?? undefined,
      outdoorUnitLocation: optional(values.outdoorUnitLocation),
      indoorUnitLocation: optional(values.indoorUnitLocation),
    };
  }
  return {
    flueType: values.flueType ?? undefined,
    flueLocation: optional(values.flueLocation),
  };
};

const withoutUndefined = (record: Readonly<Record<string, unknown>>) =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));

export const toEquipmentFields = (values: EquipmentFormValues): EquipmentFields => {
  const { hasSweeping, hasService } = visitFieldsOf(values.kind);
  const details =
    values.kind === null
      ? {}
      : detailsSchemaOf(values.kind).parse(withoutUndefined(detailsOf(values)));
  return equipmentFields.parse({
    kind: values.kind,
    energy: isHeatPumpKind(values.kind) ? null : values.energy,
    brand: values.brand,
    model: values.model,
    serialNumber: values.serialNumber,
    room: values.room,
    powerKw: numberOf(values.powerKw),
    details,
    isInstalledByUs: values.isInstalledByUs,
    commissionedOn: values.isInstalledByUs ? (optional(values.commissionedOn) ?? null) : null,
    installationYear: values.isInstalledByUs ? null : numberOf(values.installationYear),
    lastSweepingOn: hasSweeping ? (optional(values.lastSweepingOn) ?? null) : null,
    lastServiceOn: hasService ? (optional(values.lastServiceOn) ?? null) : null,
  });
};

export const replacedEquipmentIdOf = (values: EquipmentFormValues) =>
  values.isInstalledByUs && values.replacesEquipmentId !== NO_REPLACEMENT
    ? values.replacesEquipmentId
    : undefined;
