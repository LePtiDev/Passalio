import * as z from "zod";
import { EQUIPMENT_CATALOG, type EquipmentFamily, type EquipmentKind } from "./equipment-catalog";

export const FLUE_TYPES = ["masonry", "lined_masonry", "metal", "sealed_concentric"] as const;

export const BOILER_TYPES = ["condensing", "low_temperature", "standard"] as const;

const LOCATION_MAX_LENGTH = 120;

const location = z.string().trim().max(LOCATION_MAX_LENGTH);

const flueDetails = {
  flueType: z.enum(FLUE_TYPES).optional(),
  flueLocation: location.optional(),
};

export const flueApplianceDetails = z.strictObject(flueDetails);

export const boilerDetails = z.strictObject({
  ...flueDetails,
  boilerType: z.enum(BOILER_TYPES).optional(),
});

export const heatPumpDetails = z.strictObject({
  refrigerant: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^R-?\d{2,4}[A-Z]{0,2}$/)
    .optional(),
  refrigerantChargeKg: z.number().positive().max(1000).optional(),
  outdoorUnitLocation: location.optional(),
  indoorUnitLocation: location.optional(),
});

export type FlueApplianceDetails = z.infer<typeof flueApplianceDetails>;
export type BoilerDetails = z.infer<typeof boilerDetails>;
export type HeatPumpDetails = z.infer<typeof heatPumpDetails>;
export type EquipmentDetails = FlueApplianceDetails | BoilerDetails | HeatPumpDetails;

const DETAILS_BY_FAMILY: Readonly<Record<EquipmentFamily, z.ZodType<EquipmentDetails>>> = {
  flue_appliance: flueApplianceDetails,
  boiler: boilerDetails,
  heat_pump: heatPumpDetails,
};

export const detailsSchemaOf = (kind: EquipmentKind): z.ZodType<EquipmentDetails> =>
  DETAILS_BY_FAMILY[EQUIPMENT_CATALOG[kind].family];
