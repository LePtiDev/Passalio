export const TRADE_IDS = [
  "chimney_sweeping",
  "stove_maintenance",
  "boiler_maintenance",
  "heat_pump_maintenance",
  "septic_tank_emptying",
] as const;

export type TradeId = (typeof TRADE_IDS)[number];
