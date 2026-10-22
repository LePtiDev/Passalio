import type { TradeId } from "./trade-ids";

export const EQUIPMENT_KINDS = [
  "open_fireplace",
  "insert",
  "log_stove",
  "pellet_stove",
  "boiler",
  "solid_fuel_cooker",
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
] as const;

export type EquipmentKind = (typeof EQUIPMENT_KINDS)[number];

export const ENERGIES = ["wood_logs", "pellets", "gas", "oil", "coal", "electricity"] as const;

export type Energy = (typeof ENERGIES)[number];

export const EQUIPMENT_FAMILIES = ["flue_appliance", "boiler", "heat_pump"] as const;

export type EquipmentFamily = (typeof EQUIPMENT_FAMILIES)[number];

type KindDefinition = {
  readonly family: EquipmentFamily;
  readonly trades: readonly TradeId[];
};

export const EQUIPMENT_CATALOG: Readonly<Record<EquipmentKind, KindDefinition>> = {
  open_fireplace: { family: "flue_appliance", trades: ["chimney_sweeping"] },
  insert: { family: "flue_appliance", trades: ["chimney_sweeping", "stove_maintenance"] },
  log_stove: { family: "flue_appliance", trades: ["chimney_sweeping", "stove_maintenance"] },
  pellet_stove: { family: "flue_appliance", trades: ["chimney_sweeping", "stove_maintenance"] },
  solid_fuel_cooker: { family: "flue_appliance", trades: ["chimney_sweeping"] },
  boiler: { family: "boiler", trades: ["boiler_maintenance", "chimney_sweeping"] },
  air_to_water_heat_pump: { family: "heat_pump", trades: ["heat_pump_maintenance"] },
  air_to_air_heat_pump: { family: "heat_pump", trades: ["heat_pump_maintenance"] },
  air_conditioner: { family: "heat_pump", trades: ["heat_pump_maintenance"] },
};

export const tradesOfKind = (kind: EquipmentKind): readonly TradeId[] =>
  EQUIPMENT_CATALOG[kind].trades;

export const isKindOffered = (kind: EquipmentKind, organizationTrades: readonly TradeId[]) =>
  tradesOfKind(kind).some((trade) => organizationTrades.includes(trade));

export const offeredKinds = (organizationTrades: readonly TradeId[]): readonly EquipmentKind[] =>
  EQUIPMENT_KINDS.filter((kind) => isKindOffered(kind, organizationTrades));
