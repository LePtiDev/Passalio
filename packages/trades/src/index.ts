export { defineTrade, type TradeDefinition } from "./define-trade";
export { TRADES } from "./registry";
export { TRADE_IDS, type TradeId } from "./trade-ids";
export {
  ENERGIES,
  EQUIPMENT_CATALOG,
  EQUIPMENT_FAMILIES,
  EQUIPMENT_KINDS,
  isKindOffered,
  offeredKinds,
  tradesOfKind,
  type Energy,
  type EquipmentFamily,
  type EquipmentKind,
} from "./equipment-catalog";
export {
  BOILER_TYPES,
  detailsSchemaOf,
  FLUE_TYPES,
  type BoilerDetails,
  type EquipmentDetails,
  type FlueApplianceDetails,
  type HeatPumpDetails,
} from "./equipment-details";
